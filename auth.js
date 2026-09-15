import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


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


const firebaseApp =
    initializeApp(firebaseConfig);

const auth =
    getAuth(firebaseApp);

const db =
    getFirestore(firebaseApp);


/* ==========================================
   REGISTRÁCIA
========================================== */

const registerForm =
    document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const firstName =
                document
                    .getElementById("firstName")
                    .value
                    .trim();

            const lastName =
                document
                    .getElementById("lastName")
                    .value
                    .trim();

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();

            const username =
                document
                    .getElementById("username")
                    .value
                    .trim()
                    .toLowerCase();

            const password =
                document
                    .getElementById("password")
                    .value;

            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    .value;


            /* Kontrola */

            if (
                !firstName ||
                !lastName ||
                !email ||
                !username ||
                !password ||
                !confirmPassword
            ) {

                alert(
                    "Vyplň všetky polia."
                );

                return;
            }


            if (
                password !==
                confirmPassword
            ) {

                alert(
                    "Heslá sa nezhodujú."
                );

                return;
            }


            if (password.length < 6) {

                alert(
                    "Heslo musí mať aspoň 6 znakov."
                );

                return;
            }


            try {

                /* Vytvorenie Firebase účtu */

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

                const user =
                    userCredential.user;


                /* Meno vo Firebase Authentication */

                await updateProfile(
                    user,
                    {
                        displayName:
                            `${firstName} ${lastName}`
                    }
                );


                /* Uloženie profilu do Firestore */

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {
                        uid:
                            user.uid,

                        firstName:
                            firstName,

                        lastName:
                            lastName,

                        username:
                            username,

                        email:
                            email,

                        createdAt:
                            serverTimestamp()
                    }
                );


                /* Presmerovanie do NexoChat */

                window.location.href =
                    "app.html";

            } catch (error) {

                console.error(
                    "Registrácia:",
                    error
                );

                showFirebaseError(
                    error
                );
            }
        }
    );
}


/* ==========================================
   PRIHLÁSENIE
========================================== */

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const emailOrUsername =
                document
                    .getElementById("email")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("password")
                    .value;


            if (
                !emailOrUsername ||
                !password
            ) {

                alert(
                    "Vyplň e-mail a heslo."
                );

                return;
            }


            try {

                /*
                 * Firebase prihlasovanie
                 * používa e-mail.
                 */

                await signInWithEmailAndPassword(
                    auth,
                    emailOrUsername,
                    password
                );


                window.location.href =
                    "app.html";

            } catch (error) {

                console.error(
                    "Prihlásenie:",
                    error
                );

                showFirebaseError(
                    error
                );
            }
        }
    );
}


/* ==========================================
   ODHLÁSENIE
========================================== */

const logoutBtn =
    document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

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
}


/* ==========================================
   FIREBASE CHYBY
========================================== */

function showFirebaseError(error) {

    switch (error.code) {

        case "auth/email-already-in-use":

            alert(
                "Tento e-mail už má vytvorený účet."
            );

            break;


        case "auth/invalid-email":

            alert(
                "E-mailová adresa nie je platná."
            );

            break;


        case "auth/weak-password":

            alert(
                "Heslo je príliš slabé."
            );

            break;


        case "auth/invalid-credential":

            alert(
                "Nesprávny e-mail alebo heslo."
            );

            break;


        case "auth/user-not-found":

            alert(
                "Používateľ neexistuje."
            );

            break;


        case "auth/wrong-password":

            alert(
                "Nesprávne heslo."
            );

            break;


        default:

            alert(
                "Nastala chyba. Skús to znova."
            );

            console.error(
                error
            );
    }
}
