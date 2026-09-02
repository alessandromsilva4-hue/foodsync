// =======================================
// FOODSYNCH - FIREBASE CONFIGURAÇÃO
// =======================================


import { initializeApp } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


import { 

getAuth 

}

from 

"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";



import { 

getFirestore 

}

from

"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";





const firebaseConfig = {


apiKey: "AIzaSyBT-DwnbqUYmnkL-u0QK6FO4-RLJC0fXA4",


authDomain: "foodsync-43a7e.firebaseapp.com",


projectId: "foodsync-43a7e",


storageBucket: "foodsync-43a7e.firebasestorage.app",


messagingSenderId: "937632219130",


appId: "1:937632219130:web:1caf4150ddc8c969922e43"


};






// Inicializar Firebase


const app = initializeApp(firebaseConfig);



// Autenticação


export const auth = getAuth(app);



// Banco Firestore


export const db = getFirestore(app);