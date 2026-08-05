require("dotenv").config();

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

console.log("Firebase conectado");

db.collection("estoque").get()
.then(snapshot => {
  console.log("Documentos encontrados:", snapshot.size);

  snapshot.forEach(doc => {
    console.log("ID:", doc.id);
    console.log(doc.data());
  });

  process.exit();
})
.catch(err => {
  console.error("Erro:", err);
});