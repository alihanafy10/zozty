import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

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

let currentUser = null;

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
    if (lowerName === 'ali') return '<img src="assets/wolf.png" class="avatar-img" alt="Ali" />';
    if (lowerName === 'zoza') return '<img src="assets/bee.png" class="avatar-img" alt="Zoza" />';
    return '👤';
}
const logoutBtn = document.getElementById('logoutBtn');

const noteTextInput = document.getElementById('noteTextInput');
const noteCategory = document.getElementById('noteCategory');
const addNoteBtn = document.getElementById('addNoteBtn');
const myNotesList = document.getElementById('myNotesList');
const partnerNotesList = document.getElementById('partnerNotesList');

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMsgBtn = document.getElementById('sendMsgBtn');

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
    
    loginError.textContent = '';
    displayUsername.textContent = currentUser;
    userAvatar.innerHTML = getAvatar(currentUser);
    
    loginSection.classList.add('hidden');
    mainApp.classList.remove('hidden');

    initApp();
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    mainApp.classList.add('hidden');
    loginSection.classList.remove('hidden');
    usernameInput.value = '';
    passwordInput.value = '';
});

// =======================
// تهيئة التطبيق (Firebase)
// =======================
function initApp() {
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
        renderNotes(notesArray);
    });

    // الاستماع للرسائل
    const messagesRef = ref(db, 'messages');
    onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        const messagesArray = [];
        if (data) {
            for (let id in data) {
                messagesArray.push(data[id]);
            }
        }
        renderMessages(messagesArray);
    });
}

// =======================
// نظام الملاحظات
// =======================
addNoteBtn.addEventListener('click', () => {
    const text = noteTextInput.value.trim();
    const category = noteCategory.value;

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
window.deleteNote = function(id) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    const noteRef = ref(db, 'notes/' + id);
    remove(noteRef).catch(err => alert("Error deleting: " + err.message));
};

window.editNote = function(id) {
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

window.saveNote = function(id) {
    const editInput = document.getElementById(`edit-input-${id}`);
    const newText = editInput.value.trim();
    
    if (!newText) {
        alert("Cannot save an empty note!");
        return;
    }

    const noteRef = ref(db, 'notes/' + id);
    update(noteRef, { text: newText }).catch(err => alert("Error saving: " + err.message));
};

function renderNotes(notes) {
    notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    myNotesList.innerHTML = '';
    partnerNotesList.innerHTML = '';

    notes.forEach(note => {
        const isMine = note.owner === currentUser;
        const date = new Date(note.createdAt).toLocaleDateString('en-US');
        
        const card = document.createElement('div');
        card.className = `note-card ${note.category === 'Good' ? 'good' : 'bad'}`;
        
        card.innerHTML = `
            <div class="note-header">
                <span>${note.category === 'Good' ? 'Positive' : 'Negative'}</span>
                <span>${date}</span>
            </div>
            <p id="note-text-${note.id}">${note.text}</p>
            ${isMine ? `
                <div class="note-actions-overlay">
                    <button id="edit-btn-${note.id}" class="note-edit" onclick="editNote('${note.id}')">✏️ Edit</button>
                    <button class="note-delete" onclick="deleteNote('${note.id}')">🗑️ Delete</button>
                </div>
            ` : ''}
        `;

        if (isMine) {
            myNotesList.appendChild(card);
        } else {
            const ownerSpan = document.createElement('div');
            ownerSpan.style.fontSize = '11px';
            ownerSpan.style.fontWeight = 'bold';
            ownerSpan.style.marginBottom = '5px';
            ownerSpan.textContent = `By: ${note.owner}`;
            card.insertBefore(ownerSpan, card.firstChild);
            
            partnerNotesList.appendChild(card);
        }
    });

    if (myNotesList.children.length === 0) myNotesList.innerHTML = '<p style="color:#94a3b8; font-size:13px">No notes yet.</p>';
    if (partnerNotesList.children.length === 0) partnerNotesList.innerHTML = '<p style="color:#94a3b8; font-size:13px">No notes from your partner yet.</p>';
}

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

function renderMessages(messages) {
    chatMessages.innerHTML = '';
    
    // ترتيب الرسائل من الأقدم للأحدث (حسب الإضافة غالباً Firebase بيرجعها مترتبة، لكن زيادة تأكيد)
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    messages.forEach(data => {
        const isMe = data.sender === currentUser;
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isMe ? 'me' : 'other'}`;
        
        const avatar = getAvatar(data.sender);
        msgDiv.innerHTML = `
            <div class="message-sender">
                <span class="chat-avatar">${avatar}</span>
                ${isMe ? 'You' : data.sender}
            </div>
            <div class="message-text">${data.text}</div>
        `;
        
        chatMessages.appendChild(msgDiv);
    });
    
    // التمرير لأسفل
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
