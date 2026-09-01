// ==========================================
// NEXOCHAT - app.js
// ==========================================

import { Client, Account } from "https://cdn.jsdelivr.net/npm/appwrite@17.0.0/+esm";

// ==========================================
// APPWRITE
// ==========================================

const client = new Client();

client
    .setEndpoint("https://fra.cloud.appwrite.io/v1")
    .setProject("6a96906900028b83d49d");

const account = new Account(client);


// ==========================================
// PRIPOJENIE
// ==========================================

console.log("🚀 NexoChat sa spúšťa...");
console.log("✅ Appwrite je pripravený.");


// ==========================================
// TLAČIDLÁ
// ==========================================

const loginButton = document.getElementById("loginButton");
const registerButton = document.getElementById("registerButton");


// ==========================================
// PRIHLÁSENIE
// ==========================================

if (loginButton) {
    loginButton.addEventListener("click", () => {
        alert("🔐 Prihlásenie do NexoChat");
    });
}


// ==========================================
// REGISTRÁCIA
// ==========================================

if (registerButton) {
    registerButton.addEventListener("click", () => {
        alert("👤 Vytvorenie účtu NexoChat");
    });
}


// ==========================================
// KONTROLA PRIHLÁSENÉHO POUŽÍVATEĽA
// ==========================================

async function checkUser() {
    try {
        const user = await account.get();

        console.log("👤 Prihlásený používateľ:", user.name);
        console.log("📧 Email:", user.email);

    } catch (error) {
        console.log("ℹ️ Nikto nie je prihlásený.");
    }
}

checkUser();


// ==========================================
// NEXOCHAT FUNKCIE
// ==========================================

// 💬 Chat
// 📷 Obrázky
// 📎 Prílohy
// 📞 Hlasové hovory
// 🎥 Videohovory
// 🖥️ Zdieľanie obrazovky
// 👥 Priatelia
// 🟢 Online stav
// 🔔 Notifikácie
// ⚡ Realtime správy


console.log("✅ NexoChat je pripravený!");
