let currentUser = null;

// =======================
// عناصر الـ DOM
// =======================
const themeToggle = document.getElementById('themeToggle');
const loginSection = document.getElementById('loginSection');
const mainApp = document.getElementById('mainApp');
const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const displayUsername = document.getElementById('displayUsername');
const logoutBtn = document.getElementById('logoutBtn');

// الملاحظات
const noteTextInput = document.getElementById('noteTextInput');
const noteCategory = document.getElementById('noteCategory');
const addNoteBtn = document.getElementById('addNoteBtn');
const myNotesList = document.getElementById('myNotesList');
const partnerNotesList = document.getElementById('partnerNotesList');

// الدردشة
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
    themeToggle.textContent = newTheme === 'light' ? '🌙 الوضع الليلي' : '☀️ الوضع النهاري';
    localStorage.setItem('theme', newTheme);
});

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'light' ? '🌙 الوضع الليلي' : '☀️ الوضع النهاري';

// =======================
// تسجيل الدخول والخروج
// =======================
loginBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (!username) {
        loginError.textContent = 'الرجاء إدخال اسم المستخدم';
        return;
    }
    
    currentUser = username;
    loginError.textContent = '';
    displayUsername.textContent = currentUser;
    
    loginSection.classList.add('hidden');
    mainApp.classList.remove('hidden');

    initApp();
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    mainApp.classList.add('hidden');
    loginSection.classList.remove('hidden');
    usernameInput.value = '';
});

// =======================
// تهيئة التطبيق
// =======================
function initApp() {
    loadNotes();
    loadMessages();
}

// الاستماع للتغييرات في localStorage (عشان لو فاتحين تابين مختلفتين)
window.addEventListener('storage', (e) => {
    if (e.key === 'app_notes') {
        loadNotes();
    }
    if (e.key === 'app_messages') {
        loadMessages();
    }
});

// =======================
// نظام الملاحظات (Local Storage DB)
// =======================
function getNotesDB() {
    const data = localStorage.getItem('app_notes');
    return data ? JSON.parse(data) : [];
}

function saveNotesDB(notes) {
    localStorage.setItem('app_notes', JSON.stringify(notes));
}

function loadNotes() {
    const notes = getNotesDB();
    renderNotes(notes);
}

addNoteBtn.addEventListener('click', () => {
    const text = noteTextInput.value.trim();
    const category = noteCategory.value;

    if (!text) return;

    const notes = getNotesDB();
    const newNote = {
        id: Date.now().toString(),
        text,
        category,
        owner: currentUser,
        createdAt: new Date().toISOString()
    };
    
    notes.push(newNote);
    saveNotesDB(notes);
    
    noteTextInput.value = '';
    loadNotes();
});

window.deleteNote = function(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) return;

    let notes = getNotesDB();
    const noteToDelete = notes.find(n => n.id === id);
    
    if (noteToDelete && noteToDelete.owner === currentUser) {
        notes = notes.filter(n => n.id !== id);
        saveNotesDB(notes);
        loadNotes();
    } else {
        alert('لا يمكنك حذف هذه الملاحظة (غير مصرح)');
    }
};

function renderNotes(notes) {
    // ترتيب من الأحدث للأقدم
    notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    myNotesList.innerHTML = '';
    partnerNotesList.innerHTML = '';

    notes.forEach(note => {
        const isMine = note.owner === currentUser;
        const date = new Date(note.createdAt).toLocaleDateString('ar-EG');
        
        const card = document.createElement('div');
        card.className = `note-card ${note.category === 'Good' ? 'good' : 'bad'}`;
        
        card.innerHTML = `
            <div class="note-header">
                <span>${note.category === 'Good' ? 'إيجابية' : 'سلبية'}</span>
                <span>${date}</span>
            </div>
            <p>${note.text}</p>
            ${isMine ? `<button class="note-delete" onclick="deleteNote('${note.id}')">🗑️ حذف</button>` : ''}
        `;

        if (isMine) {
            myNotesList.appendChild(card);
        } else {
            const ownerSpan = document.createElement('div');
            ownerSpan.style.fontSize = '11px';
            ownerSpan.style.fontWeight = 'bold';
            ownerSpan.style.marginBottom = '5px';
            ownerSpan.textContent = `بقلم: ${note.owner}`;
            card.insertBefore(ownerSpan, card.firstChild);
            
            partnerNotesList.appendChild(card);
        }
    });

    if (myNotesList.children.length === 0) myNotesList.innerHTML = '<p style="color:#94a3b8; font-size:13px">لا توجد ملاحظات لك.</p>';
    if (partnerNotesList.children.length === 0) partnerNotesList.innerHTML = '<p style="color:#94a3b8; font-size:13px">لا توجد ملاحظات من الطرف الآخر.</p>';
}

// =======================
// نظام الدردشة (Local Storage DB)
// =======================
function getMessagesDB() {
    const data = localStorage.getItem('app_messages');
    return data ? JSON.parse(data) : [];
}

function saveMessagesDB(messages) {
    localStorage.setItem('app_messages', JSON.stringify(messages));
}

function loadMessages() {
    const messages = getMessagesDB();
    chatMessages.innerHTML = '';
    messages.forEach(msg => appendMessage(msg));
}

sendMsgBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    const messages = getMessagesDB();
    const newMsg = {
        id: Date.now().toString(),
        sender: currentUser,
        text: text,
        timestamp: new Date().toISOString()
    };
    
    messages.push(newMsg);
    saveMessagesDB(messages);
    
    chatInput.value = '';
    loadMessages(); // تحديث الواجهة فوراً
}

function appendMessage(data) {
    const isMe = data.sender === currentUser;
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isMe ? 'me' : 'other'}`;
    
    msgDiv.innerHTML = `
        <div class="message-sender">${isMe ? 'أنت' : data.sender}</div>
        <div class="message-text">${data.text}</div>
    `;
    
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
