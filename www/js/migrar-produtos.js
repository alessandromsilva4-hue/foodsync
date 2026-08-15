import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("=== LOTRIX - MIGRA??O DE PRODUTOS ===");

async function migrarProdutos() {

    try {

        const snapshot = await getDocs(
            collection(db, "produtos")
        );

        console.log(
            "Produtos encontrados:",
            snapshot.size
        );

        let criados = 0;
        let ignorados = 0;

        for (const documento of snapshot.docs) {

            const produto = documento.data();

            console.log(
                "Analisando:",
                documento.id,
                produto.nome
            );

            // Produto j? migrado
            if (produto.idEmpresa) {

                console.log(
                    "J? possui idEmpresa:",
                    produto.idEmpresa
                );

                ignorados++;
                continue;
            }

            // Produto sem empresas
            if (
                !Array.isArray(produto.empresas) ||
                produto.empresas.length === 0
            ) {

                console.warn(
                    "Produto sem empresa:",
                    produto.nome
                );

                ignorados++;
                continue;
            }

            // Cria uma c?pia para cada empresa
            for (const idEmpresa of produto.empresas) {

                if (!idEmpresa) {
                    continue;
                }

                const novoProduto = {
                    ...produto,

                    idEmpresa: idEmpresa,

                    migradoDe: documento.id,

                    migradoEm: serverTimestamp()
                };

                // Remove o campo antigo
                delete novoProduto.empresas;

                await addDoc(
                    collection(db, "produtos"),
                    novoProduto
                );

                criados++;

                console.log(
                    "CRIADO:",
                    produto.nome,
                    "?",
                    idEmpresa
                );
            }
        }

        console.log("================================");
        console.log("MIGRA??O CONCLU?DA");
        console.log("Criados:", criados);
        console.log("Ignorados:", ignorados);
        console.log("================================");

        document.getElementById("resultado").innerHTML = `
            <strong>? Migra??o conclu?da!</strong><br><br>
            Produtos criados: ${criados}<br>
            Produtos ignorados: ${ignorados}
        `;

    }
    catch (erro) {

        console.error(
            "ERRO NA MIGRA??O:",
            erro
        );

        document.getElementById("resultado").innerHTML = `
            <strong>? Erro na migra??o</strong><br><br>
            ${erro.message}
        `;
    }
}

document
    .getElementById("iniciarMigracao")
    .addEventListener(
        "click",
        migrarProdutos
    );