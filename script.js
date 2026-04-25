import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update, runTransaction } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging.js";

const firebaseConfig = {
    apiKey: "AIzaSyDIebUw5V99uD1t99vUBG2P-Nshbd_xrZg",
    authDomain: "zozo-35b75.firebaseapp.com",
    // الاحتياط برابط الداتابيز المعتاد تحسباً لأي مشاكل
    databaseURL: "https://zozo-35b75-default-rtdb.firebaseio.com",
    projectId: "zozo-35b75",
    storageBucket: "zozo-35b75.firebasestorage.app",
    messagingSenderId: "838568074522",
    appId: "1:838568074522:web:e7b2d4a4281db5c92020a3",
    measurementId: "G-L9B7F2291J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messaging = getMessaging(app);

let currentUser = null;
let appInitialized = false;
let latestNotes = [];

// =======================
// Firebase Cloud Messaging (FCM)
// =======================
async function initializeFCM() {
    try {
        if (!('serviceWorker' in navigator)) {
            console.warn('⚠️ Service Workers not supported');
            return;
        }

        // طلب إذن الإخطارات
        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('⚠️ Notification permission denied');
                return;
            }
        }

        // احصل على توكن FCM
        try {
            const token = await getToken(messaging, {
                vapidKey: 'BN5BkZ7wPEEMQNrUhxc3KnLQ6FGt_Q_n6qZrYPRXVg-FvHwRxQI_XwXkZJJbLVzqDwXqOiXNBY-f7Ng5VXxDBD0'
            });

            if (token) {
                console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...');
                localStorage.setItem('fcm-token', token);

                // حفظ التوكن في Firebase
                if (currentUser) {
                    const userRef = ref(db, `fcm-tokens/${currentUser}`);
                    await update(userRef, {
                        token,
                        timestamp: new Date().toISOString()
                    });
                    console.log('✅ FCM Token saved to Firebase');
                }
            } else {
                console.warn('⚠️ No FCM Token returned');
            }
        } catch (error) {
            console.error('❌ Error getting FCM Token:', error);
        }

        // استقبل الرسائل عندما يكون التطبيق مفتوحاً
        onMessage(messaging, (payload) => {
            console.log('📨 Message received in foreground:', payload);

            if (payload.notification) {
                const { title, body } = payload.notification;
                new Notification(title || 'Wateen', {
                    body: body || 'New notification',
                    icon: './assets/icons/icon-192.png',
                    tag: 'wateen-fcm-notification'
                });
            }

            // حدّث البيانات
            if (payload.data?.type === 'new-message' || payload.data?.type === 'new-note') {
                console.log('🔄 Refreshing data due to FCM message');
                // سيتم التحديث من Firebase listeners
            }
        });

    } catch (error) {
        console.error('❌ FCM initialization error:', error);
    }
}

// استقبل الرسائل من Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'REFRESH_UNREAD_COUNT') {
            console.log('📬 Refreshing unread count from push notification');
            // سيتم التحديث من Firebase listeners
        }
    });
}

let latestMessages = [];
let notesHydrated = false;
let messagesHydrated = false;
let lastUnreadSnapshot = { notes: 0, messages: 0, total: 0 };
let unreadStateInitialized = false;

// =======================
// عناصر الـ DOM
// =======================
const themeToggle = document.getElementById('themeToggle');
const loginSection = document.getElementById('loginSection');
const mainApp = document.getElementById('mainApp');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const displayUsername = document.getElementById('displayUsername');
const userAvatar = document.getElementById('userAvatar');

function getAvatar(name) {
    if (!name) return '👤';
    const lowerName = name.toLowerCase();
    if (lowerName === 'ali') return '<img src="assets/wolf.jpg" class="avatar-img" alt="Ali" />';
    if (lowerName === 'zoza') return '<img src="assets/bee.jpg" class="avatar-img" alt="Zoza" />';
    return '👤';
}
const logoutBtn = document.getElementById('logoutBtn');

const noteTextInput = document.getElementById('noteTextInput');
const addNoteBtn = document.getElementById('addNoteBtn');
const myNotesList = document.getElementById('myNotesList');
const partnerNotesList = document.getElementById('partnerNotesList');
const notesFilterButtons = document.querySelectorAll('.notes-filter-btn');

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMsgBtn = document.getElementById('sendMsgBtn');
const rememberMe = document.getElementById('rememberMe');
const noteFilters = {
    mine: 'all',
    partner: 'all'
};

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch((err) => {
            console.error('Service worker registration failed:', err);
        });
    });
}

// =======================
// حفظ واستعادة تسجيل الدخول
// =======================
function loadSavedLogin() {
    const saved = localStorage.getItem('wateen-saved-login');
    if (saved) {
        try {
            const { username, remember } = JSON.parse(saved);
            if (remember && username) {
                usernameInput.value = username;
                rememberMe.checked = true;
                console.log('✅ Loaded saved login:', username);
            }
        } catch (error) {
            console.error('Error loading saved login:', error);
        }
    }
}

function saveLogin(username, shouldRemember) {
    if (shouldRemember) {
        localStorage.setItem('wateen-saved-login', JSON.stringify({
            username,
            remember: true,
            timestamp: new Date().toISOString()
        }));
        console.log('✅ Login saved:', username);
    } else {
        localStorage.removeItem('wateen-saved-login');
        console.log('✅ Login cleared');
    }
}

// تحميل البيانات المحفوظة عند فتح الصفحة
window.addEventListener('load', () => {
    loadSavedLogin();
});


// =======================
// Dark/Light Mode
// =======================
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.textContent = newTheme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
    localStorage.setItem('theme', newTheme);
});

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';

// =======================
// تسجيل الدخول والخروج
// =======================
loginBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        loginError.textContent = 'Please enter name and password';
        return;
    }

    // حماية الدخول لـ Ali و Zoza فقط
    const allowedUsers = ['ali', 'zoza'];
    if (!allowedUsers.includes(username.toLowerCase())) {
        loginError.textContent = 'Sorry, this app (Wateen) is only for Ali and Zoza ❤️';
        return;
    }

    // التحقق من كلمة المرور
    // تم تعيين كلمة مرور بسيطة حالياً (يمكنك تغييرها من هنا لاحقاً)
    const validPassword = '123';
    if (password !== validPassword) {
        loginError.textContent = 'Incorrect password 🔒';
        return;
    }

    // لتوحيد شكل الاسم
    currentUser = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();

    // حفظ تسجيل الدخول إذا كان Remember Me مختار
    saveLogin(username, rememberMe.checked);

    loginError.textContent = '';
    displayUsername.textContent = currentUser;
    userAvatar.innerHTML = getAvatar(currentUser);

    loginSection.classList.add('hidden');
    mainApp.classList.remove('hidden');

    initApp();
    initializeFCM();
});

logoutBtn.addEventListener('click', () => {
    // حذف بيانات تسجيل الدخول المحفوظة عند الخروج
    saveLogin('', false);
    
    currentUser = null;
    mainApp.classList.add('hidden');
    loginSection.classList.remove('hidden');
    usernameInput.value = '';
    passwordInput.value = '';
    rememberMe.checked = false;
});

// =======================
// Helper Functions for Notifications
// =======================

async function setExternalBadge(count) {
    if ('setAppBadge' in navigator && 'clearAppBadge' in navigator) {
        try {
            if (count > 0) {
                await navigator.setAppBadge(count);
            } else {
                await navigator.clearAppBadge();
            }
        } catch (error) {
            console.error('Badge update failed:', error);
        }
    }
}

function getPartnerNotes() {
    return latestNotes.filter((note) => note.owner !== currentUser);
}

function getPartnerMessages() {
    return latestMessages.filter((message) => message.sender !== currentUser);
}

function getSeenStorageKey(type) {
    if (!currentUser) return '';
    return `wateen-last-seen-${currentUser.toLowerCase()}-${type}`;
}

function toTimestamp(value) {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
}

function getLatestTimestamp(items, fieldName) {
    return items.reduce((latest, item) => {
        const next = toTimestamp(item[fieldName]);
        return next > latest ? next : latest;
    }, 0);
}

function getSeenTimestamp(type) {
    const key = getSeenStorageKey(type);
    if (!key) return 0;
    return Number(localStorage.getItem(key) || '0');
}

function setSeenTimestamp(type, value) {
    const key = getSeenStorageKey(type);
    if (!key) return;
    localStorage.setItem(key, String(value));
}

function getUnreadSnapshot() {
    const unreadNotes = getPartnerNotes().filter((note) => toTimestamp(note.createdAt) > getSeenTimestamp('notes')).length;
    const unreadMessages = getPartnerMessages().filter((message) => toTimestamp(message.timestamp) > getSeenTimestamp('messages')).length;

    return {
        notes: unreadNotes,
        messages: unreadMessages,
        total: unreadNotes + unreadMessages
    };
}

function refreshExternalIndicators() {
    if (!currentUser || !notesHydrated || !messagesHydrated) return;

    const unread = getUnreadSnapshot();
    
    console.log('📊 Unread count:', unread);
    setExternalBadge(unread.total);
}

// =======================
// تهيئة التطبيق (Firebase)
// =======================
function initApp() {
    if (appInitialized) return;
    appInitialized = true;

    // الاستماع للملاحظات
    const notesRef = ref(db, 'notes');
    onValue(notesRef, (snapshot) => {
        const data = snapshot.val();
        const notesArray = [];
        if (data) {
            for (let id in data) {
                notesArray.push({ id, ...data[id] });
            }
        }
        latestNotes = notesArray;
        notesHydrated = true;
        renderNotes(notesArray);
        refreshExternalIndicators();
    });

    // الاستماع للرسائل
    const messagesRef = ref(db, 'messages');
    onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        const messagesArray = [];
        if (data) {
            for (let id in data) {
                messagesArray.push({ id, ...data[id] });
            }
        }
        latestMessages = messagesArray;
        messagesHydrated = true;
        renderMessages(messagesArray);
        refreshExternalIndicators();
    });
}

function getLikeCount(likes) {
    if (!likes) return 0;
    return Object.values(likes).filter(Boolean).length;
}

function hasLiked(likes) {
    if (!currentUser || !likes) return false;
    return Boolean(likes[currentUser]);
}

function formatMessageTimestamp(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';

    const day = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    const time = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });

    return `${day} at ${time}`;
}

function toggleLike(path) {
    if (!currentUser) return;

    const likeRef = ref(db, `${path}/likes/${currentUser}`);
    runTransaction(likeRef, (liked) => (liked ? null : true)).catch((err) => {
        alert("Error updating like: " + err.message);
    });
}

function matchesNoteFilter(note, filter) {
    if (filter === 'all') return true;
    if (filter === 'good') return note.category === 'Good';
    if (filter === 'bad') return note.category === 'Bad';
    return true;
}

function updateNotesFilterButtons() {
    notesFilterButtons.forEach((button) => {
        const owner = button.dataset.owner;
        const filter = button.dataset.filter;
        button.classList.toggle('active', noteFilters[owner] === filter);
    });
}

notesFilterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const owner = button.dataset.owner;
        const filter = button.dataset.filter;

        noteFilters[owner] = filter;
        updateNotesFilterButtons();
        renderNotes(latestNotes);
    });
});

// =======================
// نظام الملاحظات
// =======================
addNoteBtn.addEventListener('click', () => {
    const text = noteTextInput.value.trim();
    const category = document.querySelector('input[name="noteCat"]:checked').value;

    if (!text) return;

    const notesRef = ref(db, 'notes');
    push(notesRef, {
        text,
        category,
        owner: currentUser,
        createdAt: new Date().toISOString()
    });

    noteTextInput.value = '';
});

// اجعل دالة الحذف والتعديل متاحة للـ HTML
window.deleteNote = function (id) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    const noteRef = ref(db, 'notes/' + id);
    remove(noteRef).catch(err => alert("Error deleting: " + err.message));
};

window.editNote = function (id) {
    const textElement = document.getElementById(`note-text-${id}`);
    const currentText = textElement.textContent;

    // تحويل النص إلى حقل إدخال
    textElement.innerHTML = `<textarea id="edit-input-${id}" class="edit-textarea">${currentText}</textarea>`;

    // تغيير زر التعديل إلى زر حفظ
    const editBtn = document.getElementById(`edit-btn-${id}`);
    editBtn.innerHTML = '💾 Save';
    editBtn.setAttribute('onclick', `saveNote('${id}')`);
    editBtn.classList.add('save-btn-active');
};

window.saveNote = function (id) {
    const editInput = document.getElementById(`edit-input-${id}`);
    const newText = editInput.value.trim();

    if (!newText) {
        alert("Cannot save an empty note!");
        return;
    }

    const noteRef = ref(db, 'notes/' + id);
    update(noteRef, { text: newText }).catch(err => alert("Error saving: " + err.message));
};

window.toggleNoteLike = function (id) {
    toggleLike(`notes/${id}`);
};

function createNoteCard(note, isMine) {
        const date = new Date(note.createdAt).toLocaleDateString('en-US');
        const likesCount = getLikeCount(note.likes);
        const likedByMe = hasLiked(note.likes);

        const card = document.createElement('div');
        card.className = `note-card ${note.category === 'Good' ? 'good' : 'bad'}`;

        card.innerHTML = `
            <div class="note-header">
                <span>${note.category === 'Good' ? 'Positive' : 'Negative'}</span>
                <span>${date}</span>
            </div>
            <p id="note-text-${note.id}">${note.text}</p>
            <div class="item-footer">
                <button class="like-btn ${likedByMe ? 'liked' : ''}" onclick="toggleNoteLike('${note.id}')">
                    <span class="like-label">${likedByMe ? '&#10084; Liked' : '&#10084; Like'}</span>
                    <span class="like-count">${likesCount}</span>
                </button>
            </div>
            ${isMine ? `
                <div class="note-actions-overlay">
                    <button id="edit-btn-${note.id}" class="note-edit" onclick="editNote('${note.id}')">✏️ Edit</button>
                    <button class="note-delete" onclick="deleteNote('${note.id}')">🗑️ Delete</button>
                </div>
            ` : ''}
        `;

        if (isMine) {
            return card;
        } else {
            const ownerSpan = document.createElement('div');
            ownerSpan.style.fontSize = '11px';
            ownerSpan.style.fontWeight = 'bold';
            ownerSpan.style.marginBottom = '5px';
            ownerSpan.textContent = `By: ${note.owner}`;
            card.insertBefore(ownerSpan, card.firstChild);
            return card;
        }
}

function renderNoteColumn(notes, listElement, emptyText, isMine) {
    listElement.innerHTML = '';

    if (notes.length === 0) {
        listElement.innerHTML = `<p style="color:#94a3b8; font-size:13px">${emptyText}</p>`;
        return;
    }

    notes.forEach((note) => {
        listElement.appendChild(createNoteCard(note, isMine));
    });
}

function renderNotes(notes) {
    notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const myNotes = notes.filter((note) => note.owner === currentUser);
    const partnerNotes = notes.filter((note) => note.owner !== currentUser);

    const filteredMyNotes = myNotes.filter((note) => matchesNoteFilter(note, noteFilters.mine));
    const filteredPartnerNotes = partnerNotes.filter((note) => matchesNoteFilter(note, noteFilters.partner));

    const myEmptyText = noteFilters.mine === 'all' ? 'No notes yet.' : 'No notes match this filter yet.';
    const partnerEmptyText = noteFilters.partner === 'all'
        ? 'No notes from your partner yet.'
        : 'No partner notes match this filter yet.';

    renderNoteColumn(filteredMyNotes, myNotesList, myEmptyText, true);
    renderNoteColumn(filteredPartnerNotes, partnerNotesList, partnerEmptyText, false);
}

updateNotesFilterButtons();

// =======================
// نظام الدردشة
// =======================
sendMsgBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    const messagesRef = ref(db, 'messages');
    push(messagesRef, {
        sender: currentUser,
        text: text,
        timestamp: new Date().toISOString()
    });

    chatInput.value = '';
}

window.toggleMessageLike = function (id) {
    toggleLike(`messages/${id}`);
};

function renderMessages(messages) {
    chatMessages.innerHTML = '';

    // ترتيب الرسائل من الأقدم للأحدث (حسب الإضافة غالباً Firebase بيرجعها مترتبة، لكن زيادة تأكيد)
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    messages.forEach(data => {
        const isMe = data.sender === currentUser;
        const likesCount = getLikeCount(data.likes);
        const likedByMe = hasLiked(data.likes);
        const sentAt = formatMessageTimestamp(data.timestamp);
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isMe ? 'me' : 'other'}`;

        const avatar = getAvatar(data.sender);
        msgDiv.innerHTML = `
            <div class="message-sender">
                <span class="chat-avatar">${avatar}</span>
                ${isMe ? 'You' : data.sender}
            </div>
            <div class="message-text">${data.text}</div>
            <div class="message-footer">
                <span class="message-time">${sentAt}</span>
                <button class="like-btn ${likedByMe ? 'liked' : ''}" onclick="toggleMessageLike('${data.id}')">
                    <span class="like-label">${likedByMe ? '&#10084; Liked' : '&#10084; Like'}</span>
                    <span class="like-count">${likesCount}</span>
                </button>
            </div>
        `;

        chatMessages.appendChild(msgDiv);
    });

    // التمرير لأسفل
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
