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


alert("ETIQUETAS NOVA VERSÃO");


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

        const nomeProduto = produtoSelect.value;

        if (!nomeProduto) {

            alert("Selecione um produto.");

            return;

        }

        const producao = await buscarUltimaProducao(nomeProduto);

        if (!producao) {

            alert("Não existe produção registrada para este produto.");

            return;

        }

        // Dados da produção

        const dataProducao = producao.dataProducao.toDate();
        const validade = producao.validade.toDate();

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
// TEMPERATURA

const produtoAtual = produtos.find(
    p => p.nome === nomeProduto
);

document.getElementById("temperaturaEtiqueta").innerText =
    "TEMP. " + (produtoAtual?.temperatura || producao.temperatura || "AMBIENTE");


// RESPONSÁVEL

document.getElementById("responsavelEtiqueta").innerText =
    producao.responsavel || producao.usuario || "admin";


// GERAR QR CODE

const qrDiv = document.getElementById("qrcodeEtiqueta");


if(qrDiv){

    qrDiv.innerHTML = "";


    const codigoEtiqueta = 
        "FS-" + Date.now();


  new QRCode(

    qrDiv,

    {

        text:
"https://alessandromsilva4-hue.github.io/Label-Control/consulta.html?codigo=" + codigoEtiqueta,

        width:80,

        height:80

    }

);

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

        temperatura: produtoAtual?.temperatura || "AMBIENTE",

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