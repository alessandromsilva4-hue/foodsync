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
    width: 55,
    height: 55,
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

    const conteudo = document.getElementById("etiquetaGerada").outerHTML;

    const janela = window.open("", "_blank", "width=500,height=500");

    janela.document.write(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8

<style>

@page{
    size:60mm 60mm;
    margin:0;
}

html,body{
    width:60mm;
    height:60mm;
    margin:0;
    padding:0;
    font-family:Arial,Helvetica,sans-serif;
}

.etiqueta{

    width:60mm;
    height:60mm;

    box-sizing:border-box;

    padding:2mm;

    display:flex;

    flex-direction:column;

}

.<style>

.etiqueta-logo{

    text-align:center;

    font-size:10px;

    font-weight:bold;

    border-bottom:1px solid #000;

    padding-bottom:1mm;

    margin-bottom:1mm;

}


#nomeEtiqueta{

    font-size:14px;

    font-weight:bold;

    text-align:center;

    margin:1mm 0;

    border-bottom:1px solid #000;

    padding-bottom:1mm;

}


#temperaturaEtiqueta{

    font-size:11px;

    font-weight:bold;

    margin:1mm 0;

}


.etiqueta p{

    font-size:10px;

    margin:1mm 0;

    line-height:1.1;

}


#qrcodeEtiqueta{

    margin-top:auto;

    display:flex;

    justify-content:flex-end;

}


#qrcodeEtiqueta img,
#qrcodeEtiqueta canvas{

    width:14mm !important;

    height:14mm !important;

}

</style>

</head>

<body>

${conteudo}

<script>

window.onload = () => {

    setTimeout(() => {

        window.print();

        window.close();

    },300);

}

</script>

</body>

</html>
`);

    janela.document.close();

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