import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("INICIANDO DIAGNÓSTICO DO ESTOQUE...");

const status =
    document.getElementById("status");

try {

    const snapshot =
        await getDocs(
            collection(db, "estoque")
        );

    console.log(
        "TOTAL DE REGISTROS DE ESTOQUE:",
        snapshot.size
    );

    snapshot.forEach((docSnap) => {

        console.log(
            "ESTOQUE:",
            docSnap.id,
            docSnap.data()
        );

    });

    status.textContent =
        `Encontrados ${snapshot.size} registros. Veja o Console (F12).`;

}
catch (error) {

    console.error(
        "ERRO DIAGNÓSTICO:",
        error
    );

    status.textContent =
        "Erro. Veja o Console.";

}
