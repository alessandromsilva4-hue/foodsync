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
    serverTimestamp,
    deleteDoc,
    doc
}from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";




console.log("ETIQUETAS.JS VERSÃO NOVA - 19/07/2026");

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
// HISTÓRICO DE ETIQUETAS
// =======================================

async function carregarHistoricoEtiquetas(){

    const tabela =
    document.getElementById("listaEtiquetas");


    if(!tabela) return;


    tabela.innerHTML="";


    try {


        const consulta = query(

            collection(db,"etiquetas"),

            orderBy(
                "criadoEm",
                "desc"
            )

        );


        const snapshot =
        await getDocs(consulta);



        if(snapshot.empty){

            tabela.innerHTML = `

            <tr>
            <td colspan="7">
            Nenhuma etiqueta gerada
            </td>
            </tr>

            `;

            return;

        }



        snapshot.forEach(item=>{


            const etiqueta =
            item.data();



            tabela.innerHTML += `

            <tr>

            <td>
            ${etiqueta.codigo}
            </td>


            <td>
            ${etiqueta.produto}
            </td>


            <td>
            ${etiqueta.quantidade || "-"}
            ${etiqueta.unidade || ""}
            </td>


            <td>
            ${formatarData(etiqueta.dataProducao)}
            </td>


            <td>
            ${formatarData(etiqueta.validade)}
            </td>


            <td>
            ${etiqueta.usuario}
            </td>


            <td>

            <button onclick="
            reimprimirEtiqueta('${item.id}')
            ">
            🖨️
            </button>


            <button onclick="
            excluirEtiqueta('${item.id}')
            ">
            🗑️
            </button>


            </td>

            </tr>

            `;


        });



    }catch(error){

        console.error(
            "Erro histórico:",
            error
        );

    }

}




function formatarData(data){

    if(!data)
        return "-";

    // Datas no formato YYYY-MM-DD devem ser interpretadas como data local.
    // new Date("YYYY-MM-DD") usa UTC e pode exibir o dia anterior no Brasil.
    if (typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
        const [ano, mes, dia] = data.split("-");
        return `${dia}/${mes}/${ano}`;
    }

    return new Date(data)
    .toLocaleDateString("pt-BR");

}
// =======================================
// BUSCAR ÚLTIMA PRODUÇÃO
// =======================================

async function buscarUltimaProducao(produtoId) {

    const consulta = query(
        collection(db, "producoes"),
       where("produtoId","==",produtoId),
        orderBy("dataProducao", "desc"),
        limit(1)
    );


    const snapshot = await getDocs(consulta);


    if(snapshot.empty){

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
const produtoSelecionado = produtos.find(
    p => p.nome === nomeProduto
);

console.log("Produto selecionado:", produtoSelecionado);

        if (!nomeProduto) {

            alert("Selecione o produto.");

            return;

        }

     const producao = await buscarUltimaProducao(produtoSelecionado.id);
console.log("ÚLTIMA PRODUÇÃO USADA NA ETIQUETA:", producao);

if (!producao) {

    alert("Não existe produção registrada para este produto.");

    return;

}


// Buscar dados do produto cadastrado

const produtoDados = produtos.find(
    p => p.nome === nomeProduto
);



// ================================
// DADOS DA ETIQUETA
// ================================


const dataSelecionada = document.getElementById("dataProducao").value;

if (!dataSelecionada) {
    alert("Informe a data de produção.");
    return;
}

// Cria a data no horário local para preservar exatamente o dia escolhido.
const [ano, mes, dia] = dataSelecionada.split("-").map(Number);
const dataProducao = new Date(ano, mes - 1, dia);


let validade;


if(produtoSelecionado?.validadeDias){

    validade = new Date(dataProducao);

    validade.setDate(
        validade.getDate() + Number(produtoSelecionado.validadeDias)
    );

}else{

    validade = new Date(producao.validade);

}



const producaoFormatada =
dataProducao.toLocaleDateString("pt-BR");


const validadeFormatada =
validade.toLocaleDateString("pt-BR");




// PRODUTO

document.getElementById("nomeEtiqueta").innerText =
(producao.produto || nomeProduto)
.toUpperCase();





const categoriaEtiqueta = document.getElementById("categoriaEtiqueta");

if (categoriaEtiqueta) {
    categoriaEtiqueta.innerText = produtoSelecionado?.categoria || "--";
}


document.getElementById("temperaturaEtiqueta").innerText =
produtoSelecionado?.temperatura || "--";


document.getElementById("quantidadeEtiqueta").innerText =
(producao.quantidade || 1) 
+ " "
+ (produtoSelecionado?.unidade || "UN");



// DATAS

document.getElementById("dataEtiqueta").innerText =
producaoFormatada;


document.getElementById("validadeEtiqueta").innerText =
validadeFormatada;




// TEMPERATURA DO PRODUTO

document.getElementById("temperaturaEtiqueta").innerText =
produtoSelecionado?.temperatura || "AMBIENTE";




// RESPONSÁVEL

document.getElementById("responsavelEtiqueta").innerText =

producao.responsavel ||

producao.usuario ||

"Alessandro";





// QUANTIDADE

document.getElementById("quantidadeEtiqueta").innerText =
(producao.quantidade || 1)
+ " "
+ (produtoSelecionado?.unidade || "UN");





// LOTE

document.getElementById("loteEtiqueta").innerText =

codigoEtiqueta.substring(0,12);

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
    width: 200,
    height: 200,
    correctLevel: QRCode.CorrectLevel.H
});

}


// Salvar histórico

try {


console.log("ETIQUETA QUE SERÁ SALVA:", {

    codigo: codigoEtiqueta,

    dataProducaoOriginal: producao.dataProducao,

    dataProducaoFormatada: producaoFormatada

});


await addDoc(
    collection(db, "etiquetas"),
    {
        codigo: codigoEtiqueta,

        produto: producao.produto,

        quantidade: producao.quantidade,

        unidade: producao.unidade || "UN",

       dataProducao: dataSelecionada,

        validade: validade.toISOString().split("T")[0],

        categoria: produtoSelecionado?.categoria || "",

        usuario: producao.responsavel || "Alessandro",

        temperatura: produtoSelecionado?.temperatura || "AMBIENTE",

        lote: codigoEtiqueta,

        observacao: "",

        criadoEm: serverTimestamp()
    }
);

      console.log("Etiqueta salva.");

await carregarHistoricoEtiquetas();
} catch (erro) {

    console.error(
        "Erro ao salvar etiqueta:",
        erro
    );

}

});

}
// =======================================
// EXCLUIR ETIQUETA
// =======================================

window.excluirEtiqueta = async function(id){


    if(!confirm("Excluir etiqueta?"))
    return;


    await deleteDoc(
        doc(db,"etiquetas",id)
    );


    await carregarHistoricoEtiquetas();


};



// =======================================
// REIMPRIMIR ETIQUETA
// =======================================

window.reimprimirEtiqueta = async function(id){


    const snapshot =
    await getDocs(
        collection(db,"etiquetas")
    );


    snapshot.forEach(item=>{


        if(item.id === id){


            const dados =
            item.data();



            document.getElementById(
                "nomeEtiqueta"
            ).innerText =
            dados.produto;



            document.getElementById(
                "dataEtiqueta"
            ).innerText =
            formatarData(
                dados.dataProducao
            );



            document.getElementById(
                "validadeEtiqueta"
            ).innerText =
            formatarData(
                dados.validade
            );



            document.getElementById(
                "temperaturaEtiqueta"
            ).innerText =
            dados.temperatura;



            document.getElementById(
                "responsavelEtiqueta"
            ).innerText =
            dados.usuario || "--";



            imprimirEtiqueta();


        }


    });


};
// =======================================
// IMPRIMIR ETIQUETA
// =======================================

window.imprimirEtiqueta = function () {

    const qtd =
        Number(new URLSearchParams(window.location.search).get("qtd")) || 1;

    const conteudo =
        document.getElementById("etiquetaGerada").outerHTML;

    let etiquetas = "";

    for (let i = 0; i < qtd; i++) {
        etiquetas += conteudo;
    }

    const janela = window.open(
        "",
        "_blank",
        "width=800,height=600"
    );

    janela.document.write(`
<!DOCTYPE html>
<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<link rel="stylesheet" href="${new URL("css/impressao-etiqueta.css", window.location.href).href}">

<style>

@page{
    size:60mm 60mm;
    margin:0;
}

html{
    width:60mm;
    height:60mm;
}

body{
    margin:0;
    padding:0;
    font-family:Arial,Helvetica,sans-serif;
    width:60mm;
}

*, *::before, *::after{
    box-sizing:border-box;
}

.etiqueta{
    position:relative;
    width:60mm;
    height:60mm;
    box-sizing:border-box;
    padding:1.5mm 2mm;
    overflow:hidden;
    background:#fff;
    page-break-after:always;
    break-after:page;
    page-break-inside:avoid;
    break-inside:avoid;
}

.etiqueta:last-child{
    page-break-after:auto;
    break-after:auto;
}

.etiqueta-logo{
    position:absolute;
    top:1.5mm;
    left:2mm;
    right:2mm;
    margin:0;
    padding-bottom:.4mm;
    border-bottom:.25mm solid #000;
    font-size:11px;
    font-weight:700;
    text-align:center;
}

#nomeEtiqueta{
    position:absolute;
    top:2.5mm;
    left:2mm;
    right:2mm;
    margin:0;
    font-size:16px;
    font-weight:900;
    line-height:1.05;
    text-align:center;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
}

#categoriaEtiqueta{
    position:absolute;
    top:11.5mm;
    left:2mm;
    right:2mm;
    font-size:9px;
    font-weight:700;
    text-align:center;
}

.linha-etiqueta{
    position:absolute;
    top:15.5mm;
    left:2mm;
    right:2mm;
    margin:0;
    border-top:.25mm solid #000;
}

.datas-etiqueta + .linha-etiqueta{
    top:29mm;
}

.datas-etiqueta,
.info-etiqueta{
    position:absolute;
    left:2mm;
    right:2mm;
}

.datas-etiqueta{
    top:18mm;
}

.info-etiqueta{
    top:31.5mm;
}

.datas-etiqueta p,
.info-etiqueta p{
    margin:.7mm 0;
    font-size:10px;
    font-weight:700;
    line-height:1.05;
}

.datas-etiqueta strong,
.info-etiqueta strong{
    display:inline-block;
    min-width:17mm;
}

#qrcodeEtiqueta{
    position:absolute;
    right:2mm;
    bottom:2mm;
    left:auto;
    display:flex;
    align-items:center;
    justify-content:center;
    width:18mm;
    height:18mm;
    margin:0;
}

#qrcodeEtiqueta img,
#qrcodeEtiqueta canvas{
    display:block;
    width:18mm !important;
    height:18mm !important;
}

.temperatura-destaque{
    position:absolute;
    top:10.5mm;
    right:2mm;
    left:2mm;
    margin:0;
    font-size:10px;
    font-weight:700;
    letter-spacing:.2mm;
}

.datas-etiqueta p{
    display:flex;
    justify-content:space-between;
}

.datas-etiqueta span{
    text-align:right;
}

.info-etiqueta p:nth-child(2){
    display:none;
}

.info-etiqueta p:nth-child(3){
    margin-top:1.5mm;
    font-size:8px;
}


</style>

</head>

<body>

${etiquetas}

<script>

window.onload = () => {

    setTimeout(() => {

        window.print();

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

await carregarHistoricoEtiquetas();


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
