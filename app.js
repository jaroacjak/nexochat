// ==========================================
// NEXOCHAT - app.js
// Appwrite registrácia + prihlásenie
// ==========================================

import { Client, Account, ID } from "https://cdn.jsdelivr.net/npm/appwrite@17.0.0/+esm";

// ==========================================
// APPWRITE
// ==========================================

const client = new Client();

client
    .setEndpoint("https://fra.cloud.appwrite.io/v1")
    .setProject("6a96906900028b83d49d");

const account = new Account(client);

console.log("🚀 NexoChat sa spúšťa...");
console.log("✅ Appwrite je pripravený.");


// ==========================================
// ELEMENTY
// ==========================================

const loginButton = document.getElementById("loginButton");
const registerButton = document.getElementById("registerButton");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginFormElement = document.getElementById("loginFormElement");
const registerFormElement = document.getElementById("registerFormElement");

const closeLoginButton = document.getElementById("closeLoginButton");
const closeRegisterButton = document.getElementById("closeRegisterButton");

const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");


// ==========================================
// OTVORENIE PRIHLÁSENIA
// ==========================================

if (loginButton) {
    loginButton.addEventListener("click", () => {

        loginForm.hidden = false;
        registerForm.hidden = true;

        loginForm.scrollIntoView({
            behavior: "smooth"
        });
    });
}


// ==========================================
// OTVORENIE REGISTRÁCIE
// ==========================================

if (registerButton) {
    registerButton.addEventListener("click", () => {

        registerForm.hidden = false;
        loginForm.hidden = true;

        registerForm.scrollIntoView({
            behavior: "smooth"
        });
    });
}


// ==========================================
// ZATVORENIE PRIHLÁSENIA
// ==========================================

if (closeLoginButton) {
    closeLoginButton.addEventListener("click", () => {
        loginForm.hidden = true;
        loginMessage.textContent = "";
    });
}


// ==========================================
// ZATVORENIE REGISTRÁCIE
// ==========================================

if (closeRegisterButton) {
    closeRegisterButton.addEventListener("click", () => {
        registerForm.hidden = true;
        registerMessage.textContent = "";
    });
}


// ==========================================
// REGISTRÁCIA
// ==========================================

if (registerFormElement) {

    registerFormElement.addEventListener("submit", async (event) => {

        event.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;

        registerMessage.textContent = "⏳ Vytváram účet...";

        try {

            const user = await account.create(
                ID.unique(),
                email,
                password,
                name
            );

            console.log("👤 Účet vytvorený:", user);

            registerMessage.textContent =
                "✅ Účet bol úspešne vytvorený! Teraz sa môžeš prihlásiť.";

            registerFormElement.reset();

        } catch (error) {

            console.error("❌ Registrácia:", error);

            if (error.code === 409) {
                registerMessage.textContent =
                    "❌ Tento e-mail už má vytvorený účet.";
            } else if (error.code === 400) {
                registerMessage.textContent =
                    "❌ Skontroluj údaje. Heslo musí mať aspoň 8 znakov.";
            } else {
                registerMessage.textContent =
                    "❌ Registrácia sa nepodarila: " + error.message;
            }
        }
    });
}


// ==========================================
// PRIHLÁSENIE
// ==========================================

if (loginFormElement) {

    loginFormElement.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        loginMessage.textContent = "⏳ Prihlasujem...";

        try {

            const session = await account.createEmailPasswordSession(
                email,
                password
            );

            console.log("🔐 Prihlásenie úspešné:", session);

            const user = await account.get();

            loginMessage.textContent =
                "✅ Vitaj späť, " + user.name + "!";

            loginFormElement.reset();

        } catch (error) {

            console.error("❌ Prihlásenie:", error);

            if (error.code === 401) {
                loginMessage.textContent =
                    "❌ Nesprávny e-mail alebo heslo.";
            } else {
                loginMessage.textContent =
                    "❌ Prihlásenie sa nepodarilo: " + error.message;
            }
        }
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
// NEXOCHAT
// ==========================================

console.log("✅ NexoChat je pripravený!");===

console.log("✅ NexoChat je pripravený!");
