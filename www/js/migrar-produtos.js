import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("=== LOTRIX - MIGRAÇÃO DE PRODUTOS ===");

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

            // Produto já migrado
            if (produto.idEmpresa) {

                console.log(
                    "Já possui idEmpresa:",
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

            // Cria uma cópia para cada empresa
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
                    "→",
                    idEmpresa
                );
            }
        }

        console.log("================================");
        console.log("MIGRAÇÃO CONCLUÍDA");
        console.log("Criados:", criados);
        console.log("Ignorados:", ignorados);
        console.log("================================");

        document.getElementById("resultado").innerHTML = `
            <strong>✅ Migração concluída!</strong><br><br>
            Produtos criados: ${criados}<br>
            Produtos ignorados: ${ignorados}
        `;

    }
    catch (erro) {

        console.error(
            "ERRO NA MIGRAÇÃO:",
            erro
        );

        document.getElementById("resultado").innerHTML = `
            <strong>❌ Erro na migração</strong><br><br>
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