// =======================================
// LOTRIX
// MIGRAÇÃO DE ESTOQUE - MULTIEMPRESA
// =======================================

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("=======================================");
console.log("INICIANDO MIGRAÇÃO DO ESTOQUE...");
console.log("=======================================");

async function migrarEstoque() {

    try {

        const estoqueRef = collection(db, "estoque");

        const snapshot = await getDocs(estoqueRef);

        console.log(
            "TOTAL DE ESTOQUES ENCONTRADOS:",
            snapshot.size
        );

        for (const item of snapshot.docs) {

            const dados = item.data();

            const produto =
                (dados.produto || "")
                    .trim()
                    .toUpperCase();

            console.log(
                "ANALISANDO:",
                item.id,
                dados
            );


            // =======================================
            // AMIDO
            // COMPARTILHADO
            // =======================================

            if (produto === "AMIDO") {

                console.log(
                    "AMIDO ENCONTRADO:",
                    item.id
                );


                // Estoque atual será da EMPRESA 1

                await updateDoc(

                    doc(
                        db,
                        "estoque",
                        item.id
                    ),

                    {

                        idEmpresa: "empresa1",

                        atualizadoEm:
                            serverTimestamp()

                    }

                );


                console.log(
                    "AMIDO → EMPRESA 1"
                );


                // Verificar se já existe AMIDO
                // para Empresa 2

                const estoqueEmpresa2 =
                    snapshot.docs.find(
                        outro => {

                            if (
                                outro.id === item.id
                            ) {
                                return false;
                            }

                            const outroDados =
                                outro.data();

                            return (
                                (outroDados.produto || "")
                                    .trim()
                                    .toUpperCase()
                                === "AMIDO"
                                &&
                                outroDados.idEmpresa
                                === "empresa2"
                            );

                        }
                    );


                if (!estoqueEmpresa2) {

                    await addDoc(

                        estoqueRef,

                        {

                            produtoId:
                                dados.produtoId || "",

                            produto:
                                "AMIDO",

                            quantidade: 0,

                            minimo:
                                Number(
                                    dados.minimo || 0
                                ),

                            maximo:
                                Number(
                                    dados.maximo || 0
                                ),

                            unidade:
                                dados.unidade || "KG",

                            idEmpresa:
                                "empresa2",

                            usuario:
                                "admin",

                            criadoEm:
                                serverTimestamp(),

                            atualizadoEm:
                                serverTimestamp()

                        }

                    );


                    console.log(
                        "AMIDO → EMPRESA 2 criado com 0 KG"
                    );

                }

            }


            // =======================================
            // ARROZ
            // EMPRESA 2
            // =======================================

            else if (produto === "ARROZ") {

                await updateDoc(

                    doc(
                        db,
                        "estoque",
                        item.id
                    ),

                    {

                        idEmpresa: "empresa2",

                        atualizadoEm:
                            serverTimestamp()

                    }

                );


                console.log(
                    "ARROZ → EMPRESA 2"
                );

            }


            // =======================================
            // OUTROS PRODUTOS
            // =======================================

            else {

                console.warn(
                    "PRODUTO NÃO MAPEADO:",
                    produto,
                    item.id
                );

            }

        }


        console.log("=======================================");
        console.log("MIGRAÇÃO DO ESTOQUE FINALIZADA!");
        console.log("=======================================");


        const status =
            document.getElementById("status");

        if (status) {

            status.textContent =
                "Migração do estoque concluída. Verifique o Console.";

        }

    }

    catch (error) {

        console.error(
            "ERRO NA MIGRAÇÃO DO ESTOQUE:",
            error
        );


        const status =
            document.getElementById("status");

        if (status) {

            status.textContent =
                "Erro na migração. Veja o Console.";

        }

    }

}

migrarEstoque();