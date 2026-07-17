// =======================================
// FOODSYNC - ETIQUETAS
// =======================================

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";




console.log("ETIQUETAS.JS CARREGADO");

// ELEMENTOS

const etiquetaForm = document.getElementById("etiquetaForm");
const produtoSelect = document.getElementById("produtoEtiqueta");

let produtos = [];

// =======================================
// CARREGAR PRODUTOS
// =======================================

async function carregarProdutos() {

    if (!produtoSelect) return;

    produtoSelect.innerHTML = `
        <option value="">Selecione o produto</option>
    `;

    produtos = [];

    try {

        const snapshot = await getDocs(
            collection(db, "produtos")
        );

        snapshot.forEach(doc => {

            const produto = {
                id: doc.id,
                ...doc.data()
            };

            produtos.push(produto);

            produtoSelect.innerHTML += `
                <option value="${produto.nome}">
                    ${produto.nome}
                </option>
            `;

        });

        console.log("Produtos carregados:", produtos);

    } catch (error) {

        console.error("Erro ao carregar produtos:", error);

    }

}

// =======================================
// BUSCAR ÚLTIMA PRODUÇÃO
// =======================================

async function buscarUltimaProducao(nomeProduto) {

    const consulta = query(
        collection(db, "producoes"),
        where("produto", "==", nomeProduto),
        orderBy("dataProducao", "desc"),
        limit(1)
    );

    const snapshot = await getDocs(consulta);

    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0].data();

}

// =======================================
// GERAR ETIQUETA
// =======================================

if (etiquetaForm) {

   etiquetaForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const codigoEtiqueta = "FS-" + Date.now();


console.log("TESTE CODIGO:", codigoEtiqueta);

        const nomeProduto = produtoSelect.value;

        if (!nomeProduto) {

            alert("Selecione o produto.");

            return;

        }

        const producao = await buscarUltimaProducao(nomeProduto);

        if (!producao) {

            alert("Não existe produção registrada para este produto.");

            return;

        }

    // Dados da produção

const dataProducao = new Date(producao.dataProducao);

const validade = new Date(producao.validade);

const producaoFormatada =
    dataProducao.toLocaleDateString("pt-BR");

const validadeFormatada =
    validade.toLocaleDateString("pt-BR");

// Preencher etiqueta

document.getElementById("nomeEtiqueta").innerText =
    producao.produto;

document.getElementById("dataEtiqueta").innerText =
    producaoFormatada;

document.getElementById("validadeEtiqueta").innerText =
    validadeFormatada;

// Temperatura
document.getElementById("temperaturaEtiqueta").innerText =
    producao.temperatura || "-";
// RESPONSÁVEL

document.getElementById("responsavelEtiqueta").innerText =
    producao.responsavel || producao.usuario || "admin";


// GERAR QR CODE

const qrDiv = document.getElementById("qrcodeEtiqueta");

if (qrDiv) {

    qrDiv.innerHTML = "";

   const linkConsulta =
"https://alessandromsilva4-hue.github.io/foodsync/consulta.html?codigo="
+ codigoEtiqueta;


    console.log("Link QR:", linkConsulta);


    new QRCode(qrDiv, {
        text: linkConsulta,
        width: 90,
        height: 90,
        correctLevel: QRCode.CorrectLevel.H
    });

}


// Salvar histórico

try {

    await addDoc(
        collection(db, "etiquetas"),
        {
            codigo: codigoEtiqueta,

            produto: producao.produto,

            quantidade: producao.quantidade,

            unidade: producao.unidade || "UN",

            dataProducao: producao.dataProducao,

            validade: producao.validade,

            usuario: producao.usuario || "admin",

            temperatura: producao.temperatura || "AMBIENTE",

            lote: codigoEtiqueta,

            observacao: "",

            criadoEm: serverTimestamp()
        }
    );

       console.log("Etiqueta salva.");

} catch (erro) {

    console.error(
        "Erro ao salvar etiqueta:",
        erro
    );

}

});

}
// =======================================
// IMPRIMIR ETIQUETA
// =======================================

window.imprimirEtiqueta = function () {

    window.print();

};


// =======================================
// INICIALIZAÇÃO
// =======================================

document.addEventListener(
"DOMContentLoaded",
async()=>{

    await carregarProdutos();


    const campoData =
    document.getElementById("dataProducao");


    if(campoData){

        const hoje = new Date();

        campoData.value =
        hoje.toISOString().split("T")[0];

    }


    console.log(
    "Módulo de etiquetas iniciado."
    );

});