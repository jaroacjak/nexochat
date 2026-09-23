import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";


/* =========================
   FIREBASE
========================= */

const firebaseConfig = {
    apiKey: "AIzaSyDijyOClNir_WcUOBfgCXmk0gNkrL_QBW4",
    authDomain: "nexochat-a2b36.firebaseapp.com",
    projectId: "nexochat-a2b36",
    storageBucket: "nexochat-a2b36.firebasestorage.app",
    messagingSenderId: "648415715222",
    appId: "1:648415715222:web:37ed1d320ccc72690907b7",
    measurementId: "G-2F0XV4S8LG"
};

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);


/* =========================
   PREMENNÉ
========================= */

let currentUser = null;
let selectedUser = null;

let unsubscribeMessages = null;
let unsubscribeChats = null;

let searchTimer = null;


/* =========================
   ELEMENTY
========================= */

const searchInput =
    document.getElementById("searchInput");

const suggestions =
    document.getElementById("suggestions");

const chatList =
    document.getElementById("chatList");

const welcome =
    document.getElementById("welcome");

const chatWindow =
    document.getElementById("chatWindow");

const messages =
    document.getElementById("messages");

const messageInput =
    document.getElementById("messageInput");

const messageForm =
    document.getElementById("messageForm");

const fileInput =
    document.getElementById("fileInput");

const attachBtn =
    document.getElementById("attachBtn");

const profileBtn =
    document.getElementById("profileBtn");

const profileInfo =
    document.getElementById("profileInfo");

const profileName =
    document.getElementById("profileName");

const profileEmail =
    document.getElementById("profileEmail");

const logoutBtn =
    document.getElementById("logoutBtn");

const chatName =
    document.getElementById("chatName");

const chatAvatar =
    document.getElementById("chatAvatar");

const callBtn =
    document.getElementById("callBtn");

const callModal =
    document.getElementById("callModal");

const closeCallBtn =
    document.getElementById("closeCallBtn");


/* =========================
   PRIHLÁSENIE
========================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    await loadCurrentUser();

    loadChats();
});


/* =========================
   NAČÍTANIE PROFILU
========================= */

async function loadCurrentUser() {

    try {

        const userRef =
            doc(db, "users", currentUser.uid);

        const userSnap =
            await getDoc(userRef);

        if (userSnap.exists()) {

            const data =
                userSnap.data();

            const fullName =
                `${data.firstName || ""} ${data.lastName || ""}`.trim();

            profileName.textContent =
                fullName || "Používateľ";

            profileEmail.textContent =
                data.email || currentUser.email || "—";

        } else {

            profileName.textContent =
                currentUser.displayName || "Používateľ";

            profileEmail.textContent =
                currentUser.email || "—";
        }

    } catch (error) {

        console.error(
            "Chyba pri načítaní profilu:",
            error
        );

    }
}


/* =========================
   VYHĽADÁVANIE
========================= */

searchInput.addEventListener("input", () => {

    clearTimeout(searchTimer);

    const value =
        searchInput.value.trim();

    if (value.length < 2) {

        suggestions.style.display =
            "none";

        suggestions.innerHTML = "";

        return;
    }

    searchTimer =
        setTimeout(() => {

            searchUsers(value);

        }, 300);
});


/* =========================
   HĽADANIE POUŽÍVATEĽOV
========================= */

async function searchUsers(value) {

    try {

        suggestions.innerHTML = `
            <div class="loading">
                Hľadám...
            </div>
        `;

        suggestions.style.display =
            "block";

        const usersRef =
            collection(db, "users");

        const snapshot =
            await getDocs(usersRef);

        const search =
            value
                .toLowerCase()
                .replace("@", "")
                .trim();

        const results = [];

        snapshot.forEach((userDoc) => {

            const user =
                userDoc.data();

            if (
                user.uid === currentUser.uid
            ) {
                return;
            }

            const firstName =
                String(user.firstName || "")
                    .toLowerCase();

            const lastName =
                String(user.lastName || "")
                    .toLowerCase();

            const username =
                String(user.username || "")
                    .toLowerCase()
                    .replace("@", "");

            const email =
                String(user.email || "")
                    .toLowerCase();

            const fullName =
                `${firstName} ${lastName}`;

            if (
                firstName.includes(search) ||
                lastName.includes(search) ||
                fullName.includes(search) ||
                username.includes(search) ||
                email.includes(search)
            ) {

                results.push({
                    id: userDoc.id,
                    ...user
                });
            }
        });

        renderSuggestions(results);

    } catch (error) {

        console.error(
            "Chyba vyhľadávania:",
            error
        );

        suggestions.innerHTML = `
            <div class="no-results">
                Nepodarilo sa vyhľadať používateľov.
            </div>
        `;

        suggestions.style.display =
            "block";
    }
}


/* =========================
   NAŠEPKÁVAČ
========================= */

function renderSuggestions(users) {

    if (!users.length) {

        suggestions.innerHTML = `
            <div class="no-results">
                Používateľ sa nenašiel.
            </div>
        `;

        suggestions.style.display =
            "block";

        return;
    }

    suggestions.innerHTML = `
        <div class="suggestions-title">
            POUŽÍVATELIA
        </div>
    `;

    users.forEach((user) => {

        const firstName =
            user.firstName || "";

        const lastName =
            user.lastName || "";

        const fullName =
            `${firstName} ${lastName}`.trim();

        const username =
            user.username
                ? `@${String(user.username).replace("@", "")}`
                : "";

        const avatar =
            getInitials(firstName, lastName);

        const item =
            document.createElement("div");

        item.className =
            "suggestion";

        item.innerHTML = `
            <div class="avatar small-avatar">
                ${escapeHtml(avatar)}
            </div>

            <div class="suggestion-info">

                <div class="suggestion-name">
                    ${escapeHtml(fullName || "Používateľ")}
                </div>

                <div class="suggestion-username">
                    ${escapeHtml(username)}
                </div>

                <div class="suggestion-email">
                    ${escapeHtml(user.email || "")}
                </div>

            </div>
        `;

        item.addEventListener("click", () => {

            openChat(user);

        });

        suggestions.appendChild(item);
    });

    suggestions.style.display =
        "block";
}


/* =========================
   OTVORIŤ CHAT
========================= */

function openChat(user) {

    selectedUser =
        user;

    welcome.style.display =
        "none";

    chatWindow.style.display =
        "flex";

    chatName.textContent =
        `${user.firstName || ""} ${user.lastName || ""}`.trim()
        || "Používateľ";

    chatAvatar.textContent =
        getInitials(
            user.firstName,
            user.lastName
        );

    searchInput.value = "";

    suggestions.innerHTML = "";

    suggestions.style.display =
        "none";

    loadMessages();

    messageInput.focus();
}


/* =========================
   ID CHATU
========================= */

function getChatId(uid1, uid2) {

    return [
        uid1,
        uid2
    ]
        .sort()
        .join("_");
}


/* =========================
   SPRÁVY
========================= */

function loadMessages() {

    if (!selectedUser) {
        return;
    }

    if (unsubscribeMessages) {

        unsubscribeMessages();

        unsubscribeMessages =
            null;
    }

    messages.innerHTML = `
        <div class="loading">
            Načítavam správy...
        </div>
    `;

    const chatId =
        getChatId(
            currentUser.uid,
            selectedUser.uid
        );

    const messagesRef =
        collection(
            db,
            "chats",
            chatId,
            "messages"
        );

    const messagesQuery =
        query(
            messagesRef,
            orderBy("createdAt", "asc")
        );

    unsubscribeMessages =
        onSnapshot(
            messagesQuery,
            (snapshot) => {

                messages.innerHTML = "";

                if (snapshot.empty) {

                    messages.innerHTML = `
                        <div class="empty">
                            Zatiaľ žiadne správy.
                            Napíš prvú správu.
                        </div>
                    `;

                    return;
                }

                snapshot.forEach((messageDoc) => {

                    const message =
                        messageDoc.data();

                    renderMessage(message);
                });

                messages.scrollTop =
                    messages.scrollHeight;
            },
            (error) => {

                console.error(
                    "Chyba správ:",
                    error
                );

                messages.innerHTML = `
                    <div class="empty">
                        Správy sa nepodarilo načítať.
                    </div>
                `;
            }
        );
}


/* =========================
   ZOBRAZENIE SPRÁVY
========================= */

function renderMessage(message) {

    const element =
        document.createElement("div");

    const mine =
        message.senderId === currentUser.uid;

    element.className =
        mine
            ? "message mine"
            : "message";

    let html = "";

    if (message.fileUrl) {

        const fileName =
            message.fileName || "Príloha";

        html += `
            <div class="message-file">
                📎
                <a
                    href="${escapeAttribute(message.fileUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    ${escapeHtml(fileName)}
                </a>
            </div>
        `;
    }

    if (message.text) {

        html += `
            <div class="message-text">
                ${escapeHtml(message.text)}
            </div>
        `;
    }

    html += `
        <div class="message-time">
            ${formatTime(message.createdAt)}
        </div>
    `;

    element.innerHTML =
        html;

    messages.appendChild(element);
}


/* =========================
   ODOSLANIE SPRÁVY
========================= */

messageForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        if (
            !currentUser ||
            !selectedUser
        ) {
            return;
        }

        const text =
            messageInput.value.trim();

        if (!text) {
            return;
        }

        try {

            const chatId =
                getChatId(
                    currentUser.uid,
                    selectedUser.uid
                );

            const messagesRef =
                collection(
                    db,
                    "chats",
                    chatId,
                    "messages"
                );

            await addDoc(
                messagesRef,
                {
                    text: text,

                    senderId:
                        currentUser.uid,

                    receiverId:
                        selectedUser.uid,

                    createdAt:
                        serverTimestamp()
                }
            );

            await updateChatInfo(
                chatId,
                text
            );

            messageInput.value = "";

            messageInput.focus();

        } catch (error) {

            console.error(
                "Chyba odosielania správy:",
                error
            );

            alert(
                "Správu sa nepodarilo odoslať."
            );
        }
    }
);


/* =========================
   PRÍLOHA
========================= */

attachBtn.addEventListener(
    "click",
    () => {

        if (!selectedUser) {

            alert(
                "Najprv vyber používateľa."
            );

            return;
        }

        fileInput.click();
    }
);


fileInput.addEventListener(
    "change",
    async () => {

        const file =
            fileInput.files[0];

        if (!file) {
            return;
        }

        if (
            !currentUser ||
            !selectedUser
        ) {
            return;
        }

        try {

            attachBtn.disabled =
                true;

            const chatId =
                getChatId(
                    currentUser.uid,
                    selectedUser.uid
                );

            const safeName =
                file.name.replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );

            const filePath =
                `chatFiles/${currentUser.uid}/${Date.now()}_${safeName}`;

            const storageRef =
                ref(
                    storage,
                    filePath
                );

            await uploadBytes(
                storageRef,
                file
            );

            const fileUrl =
                await getDownloadURL(
                    storageRef
                );

            const messagesRef =
                collection(
                    db,
                    "chats",
                    chatId,
                    "messages"
                );

            await addDoc(
                messagesRef,
                {
                    text: "",

                    senderId:
                        currentUser.uid,

                    receiverId:
                        selectedUser.uid,

                    fileUrl:
                        fileUrl,

                    fileName:
                        file.name,

                    fileType:
                        file.type || "unknown",

                    fileSize:
                        file.size,

                    createdAt:
                        serverTimestamp()
                }
            );

            await updateChatInfo(
                chatId,
                `📎 ${file.name}`
            );

            fileInput.value = "";

        } catch (error) {

            console.error(
                "Chyba prílohy:",
                error
            );

            alert(
                "Prílohu sa nepodarilo odoslať."
            );

        } finally {

            attachBtn.disabled =
                false;
        }
    }
);


/* =========================
   INFO O CHATE
========================= */

async function updateChatInfo(
    chatId,
    lastMessage
) {

    const chatRef =
        doc(
            db,
            "chats",
            chatId
        );

    await setDoc(
        chatRef,
        {
            participants: [
                currentUser.uid,
                selectedUser.uid
            ],

            lastMessage:
                lastMessage,

            lastMessageAt:
                serverTimestamp()
        },
        {
            merge: true
        }
    );
}


/* =========================
   ZOZNAM CHATOV
========================= */

function loadChats() {

    if (unsubscribeChats) {

        unsubscribeChats();

        unsubscribeChats =
            null;
    }

    const chatsRef =
        collection(db, "chats");

    const chatsQuery =
        query(
            chatsRef,
            where(
                "participants",
                "array-contains",
                currentUser.uid
            ),
            orderBy(
                "lastMessageAt",
                "desc"
            )
        );

    unsubscribeChats =
        onSnapshot(
            chatsQuery,
            async (snapshot) => {

                chatList.innerHTML = "";

                if (snapshot.empty) {

                    chatList.innerHTML = `
                        <div class="empty">
                            Zatiaľ nemáš žiadne chaty.
                            <br><br>
                            Vyhľadaj používateľa vyššie.
                        </div>
                    `;

                    return;
                }

                for (
                    const chatDoc of snapshot.docs
                ) {

                    const chat =
                        chatDoc.data();

                    const otherUid =
                        chat.participants.find(
                            uid =>
                                uid !== currentUser.uid
                        );

                    if (!otherUid) {
                        continue;
                    }

                    try {

                        const userSnap =
                            await getDoc(
                                doc(
                                    db,
                                    "users",
                                    otherUid
                                )
                            );

                        if (!userSnap.exists()) {
                            continue;
                        }

                        const user =
                            userSnap.data();

                        renderChatItem(
                            user,
                            chat
                        );

                    } catch (error) {

                        console.error(
                            "Chyba používateľa:",
                            error
                        );
                    }
                }
            },
            (error) => {

                console.error(
                    "Chyba načítania chatov:",
                    error
                );

                chatList.innerHTML = `
                    <div class="empty">
                        Chaty sa nepodarilo načítať.
                    </div>
                `;
            }
        );
}


/* =========================
   CHAT V ZOZNAME
========================= */

function renderChatItem(
    user,
    chat
) {

    const element =
        document.createElement("div");

    element.className =
        "chat";

    const fullName =
        `${user.firstName || ""} ${user.lastName || ""}`.trim()
        || "Používateľ";

    const initials =
        getInitials(
            user.firstName,
            user.lastName
        );

    element.innerHTML = `
        <div class="avatar">
            ${escapeHtml(initials)}
        </div>

        <div class="chat-info">

            <div class="chat-name">
                ${escapeHtml(fullName)}
            </div>

            <div class="last-message">
                ${escapeHtml(chat.lastMessage || "")}
            </div>

        </div>

        <div class="time">
            ${formatTime(chat.lastMessageAt)}
        </div>
    `;

    element.addEventListener(
        "click",
        () => {

            openChat({
                uid: user.uid,
                ...user
            });
        }
    );

    chatList.appendChild(element);
}


/* =========================
   PROFIL
========================= */

profileBtn.addEventListener(
    "click",
    () => {

        if (
            profileInfo.style.display ===
            "block"
        ) {

            profileInfo.style.display =
                "none";

        } else {

            profileInfo.style.display =
                "block";
        }
    }
);


/* =========================
   ODHLÁSENIE
========================= */

logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            window.location.href =
                "index.html";

        } catch (error) {

            console.error(
                "Chyba odhlásenia:",
                error
            );

            alert(
                "Nepodarilo sa odhlásiť."
            );
        }
    }
);


/* =========================
   VOLANIE
========================= */

callBtn.addEventListener(
    "click",
    () => {

        if (!selectedUser) {

            alert(
                "Najprv vyber používateľa."
            );

            return;
        }

        callModal.style.display =
            "flex";
    }
);


closeCallBtn.addEventListener(
    "click",
    () => {

        callModal.style.display =
            "none";
    }
);


callModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target === callModal
        ) {

            callModal.style.display =
                "none";
        }
    }
);


/* =========================
   KLIKNUTIE MIMO NAŠEPKÁVAČA
========================= */

document.addEventListener(
    "click",
    (event) => {

        if (
            !event.target.closest(
                ".search-wrapper"
            )
        ) {

            suggestions.style.display =
                "none";
        }
    }
);


/* =========================
   ENTER V SPRÁVE
========================= */

messageInput.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            messageForm.requestSubmit();
        }
    }
);


/* =========================
   POMOCNÉ FUNKCIE
========================= */

function getInitials(
    firstName = "",
    lastName = ""
) {

    const first =
        firstName
            .trim()
            .charAt(0);

    const last =
        lastName
            .trim()
            .charAt(0);

    return (
        `${first}${last}`.toUpperCase()
        || "N"
    );
}


function formatTime(timestamp) {

    if (!timestamp) {
        return "";
    }

    try {

        const date =
            timestamp.toDate
                ? timestamp.toDate()
                : new Date(timestamp);

        return date.toLocaleTimeString(
            "sk-SK",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    } catch {

        return "";
    }
}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
