// =======================================
// LOTRIX - FIREBASE CONFIGURA??O
// =======================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =======================================
// CONFIGURA??O FIREBASE
// =======================================

const firebaseConfig = {

    apiKey:
        "AIzaSyBT-DwnbqUYmnkL-u0QK6FO4-RLJC0fXA4",

    authDomain:
        "foodsync-43a7e.firebaseapp.com",

    projectId:
        "foodsync-43a7e",

    storageBucket:
        "foodsync-43a7e.firebasestorage.app",

    messagingSenderId:
        "937632219130",

    appId:
        "1:937632219130:web:1caf4150ddc8c969922e43"

};


// =======================================
// APP PRINCIPAL
// =======================================
//
// Usado pelo login normal do sistema.
// =======================================

const app =
    initializeApp(firebaseConfig);


// =======================================
// AUTH PRINCIPAL
// =======================================
//
// N?O usar para criar usu?rios.
// =======================================

export const auth =
    getAuth(app);


// =======================================
// FIRESTORE
// =======================================
//
// Banco utilizado pelo sistema inteiro.
// =======================================

export const db =
    getFirestore(app);


// =======================================
// APP EXCLUSIVO PARA CADASTRO
// =======================================
//
// IMPORTANTE:
// ? uma segunda inst?ncia do Firebase.
// Assim, criar um usu?rio novo N?O
// substitui o usu?rio atualmente logado.
// =======================================

const cadastroApp =
    initializeApp(
        firebaseConfig,
        "cadastroApp"
    );


// =======================================
// AUTH DE CADASTRO
// =======================================

export const authCadastro =
    getAuth(cadastroApp);


console.log(
    "======================================="
);

console.log(
    "LOTRIX FIREBASE CARREGADO"
);

console.log(
    "AUTH PRINCIPAL: ATIVO"
);

console.log(
    "AUTH CADASTRO: ATIVO"
);

console.log(
    "FIRESTORE: ATIVO"
);

console.log(
    "======================================="
);