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


/* ==========================================
   FIREBASE
========================================== */

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


/* ==========================================
   PREMENNÉ
========================================== */

let currentUser = null;
let selectedUser = null;
let unsubscribeMessages = null;
let unsubscribeChats = null;
let searchTimer = null;


/* ==========================================
   HTML ELEMENTY
========================================== */

const searchInput = document.getElementById("searchInput");
const suggestions = document.getElementById("suggestions");
const chatList = document.getElementById("chatList");

const welcome = document.getElementById("welcome");
const chatWindow = document.getElementById("chatWindow");

const messages = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const messageForm = document.getElementById("messageForm");

const fileInput = document.getElementById("fileInput");
const attachBtn = document.getElementById("attachBtn");

const profileBtn = document.getElementById("profileBtn");
const profileInfo = document.getElementById("profileInfo");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const logoutBtn = document.getElementById("logoutBtn");

const chatName = document.getElementById("chatName");
const chatAvatar = document.getElementById("chatAvatar");

const callBtn = document.getElementById("callBtn");
const callModal = document.getElementById("callModal");
const closeCallBtn = document.getElementById("closeCallBtn");


/* ==========================================
   PRIHLÁSENIE
========================================== */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    profileEmail.textContent = user.email || "";

    await loadCurrentUser();
    loadChats();
});


/* ==========================================
   NAČÍTANIE VLASTNÉHO PROFILU
========================================== */

async function loadCurrentUser() {

    try {

        const userRef = doc(
            db,
            "users",
            currentUser.uid
        );

        const snapshot = await getDoc(userRef);

        if (!snapshot.exists()) {
            profileName.textContent = "Používateľ";
            return;
        }

        const data = snapshot.data();

        const name =
            `${data.firstName || ""} ${data.lastName || ""}`.trim();

        profileName.textContent =
            name || "Používateľ";

    } catch (error) {

        console.error(
            "Chyba pri načítaní profilu:",
            error
        );
    }
}


/* ==========================================
   NAŠEPKÁVAČ VYHĽADÁVANIA
========================================== */

searchInput.addEventListener("input", () => {

    clearTimeout(searchTimer);

    const value =
        searchInput.value.trim();

    if (value.length < 2) {

        suggestions.style.display = "none";
        suggestions.innerHTML = "";

        return;
    }

    suggestions.style.display = "block";

    suggestions.innerHTML = `
        <div class="suggestions-title">
            Hľadám používateľov...
        </div>
    `;

    searchTimer = setTimeout(() => {
        searchUsers(value);
    }, 300);
});


/* ==========================================
   VYHĽADANIE POUŽÍVATEĽOV
========================================== */

async function searchUsers(value) {

    try {

        const snapshot = await getDocs(
            collection(db, "users")
        );

        suggestions.innerHTML = `
            <div class="suggestions-title">
                Používatelia
            </div>
        `;

        const search =
            value.toLowerCase();

        let found = false;

        snapshot.forEach((userDoc) => {

            const data = userDoc.data();

            if (
                data.uid ===
                currentUser.uid
            ) {
                return;
            }

            const firstName =
                String(data.firstName || "");

            const lastName =
                String(data.lastName || "");

            const username =
                String(data.username || "");

            const email =
                String(data.email || "");

            const fullName =
                `${firstName} ${lastName}`.trim();

            const searchable =
                `
                ${firstName}
                ${lastName}
                ${fullName}
                ${username}
                ${email}
                `
                .toLowerCase();

            if (!searchable.includes(search)) {
                return;
            }

            found = true;

            const initials =
                getInitials(fullName);

            const result =
                document.createElement("div");

            result.className = "suggestion";

            result.innerHTML = `
                <div class="avatar small-avatar">
                    ${escapeHtml(initials)}
                </div>

                <div class="suggestion-info">

                    <div class="suggestion-name">
                        ${escapeHtml(
                            fullName || username
                        )}
                    </div>

                    <div class="suggestion-email">
                        ${escapeHtml(
                            username
                                ? "@" + username
                                : email
                        )}
                    </div>

                </div>
            `;

            result.addEventListener(
                "click",
                () => {

                    openChat({
                        uid:
                            data.uid ||
                            userDoc.id,

                        name:
                            fullName ||
                            username ||
                            "Používateľ",

                        initials:
                            initials
                    });
                }
            );

            suggestions.appendChild(result);
        });


        if (!found) {

            suggestions.innerHTML = `
                <div class="no-results">
                    Používateľ sa nenašiel.
                </div>
            `;
        }

    } catch (error) {

        console.error(
            "Chyba vyhľadávania:",
            error
        );

        suggestions.innerHTML = `
            <div class="no-results">
                Vyhľadávanie sa nepodarilo.
            </div>
        `;
    }
}


/* ==========================================
   OTVORENIE CHATU
========================================== */

async function openChat(user) {

    selectedUser = user;

    welcome.style.display = "none";
    chatWindow.style.display = "flex";

    chatName.textContent =
        user.name;

    chatAvatar.textContent =
        user.initials;

    suggestions.style.display = "none";
    suggestions.innerHTML = "";

    searchInput.value = "";

    await loadMessages();

    messageInput.focus();
}


/* ==========================================
   CHAT ID
========================================== */

function getChatId(uid1, uid2) {

    return [
        uid1,
        uid2
    ]
        .sort()
        .join("_");
}


/* ==========================================
   NAČÍTANIE SPRÁV
========================================== */

async function loadMessages() {

    if (
        !currentUser ||
        !selectedUser
    ) {
        return;
    }

    if (unsubscribeMessages) {

        unsubscribeMessages();

        unsubscribeMessages = null;
    }

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
            orderBy(
                "createdAt",
                "asc"
            )
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
                            <br><br>
                            Napíš prvú správu.
                        </div>
                    `;

                    return;
                }

                snapshot.forEach(
                    (messageDoc) => {

                        renderMessage(
                            messageDoc.data()
                        );
                    }
                );

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


/* ==========================================
   VYKRESLENIE SPRÁVY
========================================== */

function renderMessage(data) {

    const element =
        document.createElement("div");

    const mine =
        data.senderId ===
        currentUser.uid;

    element.className =
        mine
            ? "message mine"
            : "message";

    let html = "";


    /* PRÍLOHA */

    if (data.fileUrl) {

        html += `
            <div class="message-file">
                📎

                <a
                    href="${escapeAttribute(
                        data.fileUrl
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    ${escapeHtml(
                        data.fileName ||
                        "Príloha"
                    )}
                </a>
            </div>
        `;
    }


    /* TEXT */

    if (data.text) {

        html += `
            <div class="message-text">
                ${escapeHtml(
                    data.text
                )}
            </div>
        `;
    }


    /* ČAS */

    html += `
        <div class="message-time">
            ${formatTime(
                data.createdAt
            )}
        </div>
    `;

    element.innerHTML = html;

    messages.appendChild(element);
}


/* ==========================================
   ODOSLANIE TEXTOVEJ SPRÁVY
========================================== */

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

        const chatId =
            getChatId(
                currentUser.uid,
                selectedUser.uid
            );

        try {

            await addDoc(
                collection(
                    db,
                    "chats",
                    chatId,
                    "messages"
                ),
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
                "Chyba odoslania:",
                error
            );

            alert(
                "Správu sa nepodarilo odoslať."
            );
        }
    }
);


/* ==========================================
   PRÍLOHY
========================================== */

attachBtn.addEventListener(
    "click",
    () => {

        if (!selectedUser) {

            alert(
                "Najprv otvor chat."
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

        if (
            !file ||
            !currentUser ||
            !selectedUser
        ) {
            return;
        }

        try {

            const safeName =
                file.name.replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );

            const filePath =
                `chatFiles/${currentUser.uid}/${Date.now()}_${safeName}`;

            const fileRef =
                ref(
                    storage,
                    filePath
                );

            await uploadBytes(
                fileRef,
                file
            );

            const fileUrl =
                await getDownloadURL(
                    fileRef
                );

            const chatId =
                getChatId(
                    currentUser.uid,
                    selectedUser.uid
                );

            await addDoc(
                collection(
                    db,
                    "chats",
                    chatId,
                    "messages"
                ),
                {
                    text: "",

                    fileUrl:
                        fileUrl,

                    fileName:
                        file.name,

                    fileType:
                        file.type,

                    fileSize:
                        file.size,

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
                "📎 Príloha"
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

            fileInput.value = "";
        }
    }
);


/* ==========================================
   AKTUALIZÁCIA CHATU
========================================== */

async function updateChatInfo(
    chatId,
    lastMessage
) {

    try {

        await setDoc(
            doc(
                db,
                "chats",
                chatId
            ),
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

    } catch (error) {

        console.error(
            "Chyba aktualizácie chatu:",
            error
        );
    }
}


/* ==========================================
   ZOZNAM CHATOV
========================================== */

function loadChats() {

    if (!currentUser) {
        return;
    }

    if (unsubscribeChats) {
        unsubscribeChats();
    }

    try {

        const chatsQuery =
            query(
                collection(
                    db,
                    "chats"
                ),
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
                                Vyhľadaj používateľa hore.
                            </div>
                        `;

                        return;
                    }

                    for (
                        const chatDoc of snapshot.docs
                    ) {

                        const data =
                            chatDoc.data();

                        const otherUid =
                            data.participants.find(
                                uid =>
                                    uid !==
                                    currentUser.uid
                            );

                        if (!otherUid) {
                            continue;
                        }

                        try {

                            const userSnapshot =
                                await getDoc(
                                    doc(
                                        db,
                                        "users",
                                        otherUid
                                    )
                                );

                            if (
                                !userSnapshot.exists()
                            ) {
                                continue;
                            }

                            const user =
                                userSnapshot.data();

                            const name =
                                `${user.firstName || ""} ${user.lastName || ""}`.trim();

                            const displayName =
                                name ||
                                user.username ||
                                "Používateľ";

                            const initials =
                                getInitials(
                                    displayName
                                );

                            const chat =
                                document.createElement(
                                    "div"
                                );

                            chat.className =
                                "chat";

                            chatList.innerHTML = `
                        <div class="empty">
                            Chaty sa nepodarilo načítať.
                        </div>
                    `;
                }
            );

    } catch (error) {

        console.error(
            "Chyba načítania chatov:",
            error
        );
    }
}


/* ==========================================
   PROFIL
========================================== */

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


/* ==========================================
   ODHLÁSENIE
========================================== */

logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            if (unsubscribeMessages) {
                unsubscribeMessages();
            }

            if (unsubscribeChats) {
                unsubscribeChats();
            }

            await signOut(auth);

            window.location.href =
                "index.html";

        } catch (error) {

            console.error(
                "Odhlásenie:",
                error
            );

            alert(
                "Odhlásenie sa nepodarilo."
            );
        }
    }
);


/* ==========================================
   VOLANIE
========================================== */

callBtn.addEventListener(
    "click",
    () => {

        if (!selectedUser) {

            alert(
                "Najprv otvor chat."
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
            event.target ===
            callModal
        ) {

            callModal.style.display =
                "none";
        }
    }
);


/* ==========================================
   SKRYTIE NAŠEPKÁVAČA
========================================== */

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


/* ==========================================
   POMOCNÉ FUNKCIE
========================================== */

function getInitials(name) {

    return name
        .split(" ")
        .filter(Boolean)
        .map(
            word =>
                word.charAt(0)
        )
        .join("")
        .substring(0, 2)
        .toUpperCase() || "N";
}


function formatTime(timestamp) {

    if (!timestamp) {
        return "teraz";
    }

    try {

        const date =
            timestamp.toDate();

        return date.toLocaleTimeString(
            "sk-SK",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    } catch {

        return "teraz";
    }
}


function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(text ?? "");

    return div.innerHTML;
}


function escapeAttribute(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
