import { db } from "./firebase.js";

import {
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const produtosEmpresas = {

    "92Ko9oB75TQnS2uBATH1": ["empresa2"], // ARROZ

    "ISe0RpzDCl5syfjHIMLx": ["empresa2"], // MOSTARDA

    "JOLf85I1ZG8W5cfj8bPw": ["empresa2"], // FEIJÃO

    "ML9hPsknTy9Au47CkvNX": ["empresa2"], // FARINHA

    "P1CFzaDj73W3Eyw6br2N": ["empresa2"], // PUDIM

    "UO6GP45pejnxT9Z8bqSx": ["empresa1", "empresa2"], // AMIDO

    "WYLSsOkGyxhXTYDKr1if": ["empresa2"], // LEITE

    "ahVp31E176Gjsy9d6GEo": ["empresa1"], // SHOYU DLV

    "c18UmrTSrZQ0z8Vjrd3m": ["empresa2"], // PICANHA

    "lJA4Ezf21bvwY2lqP3bg": ["empresa1", "empresa2"], // SALMÃO

    "qtZOUx9VxQTgEWj5Yoo8": ["empresa2"], // ARROZ INTEGRAL

    "wVIdttE6i9n1hdbj8Heg": ["empresa1", "empresa2"] // AZEITE

};


async function migrarProdutos() {

    console.log("INICIANDO MIGRAÇÃO DOS PRODUTOS...");

    for (const [idProduto, empresas] of Object.entries(produtosEmpresas)) {

        try {

            await updateDoc(
                doc(db, "produtos", idProduto),
                {
                    empresas: empresas
                }
            );

            console.log(
                "ATUALIZADO:",
                idProduto,
                empresas
            );

        } catch (error) {

            console.error(
                "ERRO:",
                idProduto,
                error
            );

        }

    }

    console.log("MIGRAÇÃO FINALIZADA.");

}


migrarProdutos();