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


const dataProducao = new Date(
    producao.dataProducao
);


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





document.getElementById("categoriaEtiqueta").innerText =
produtoSelecionado?.categoria || "--";


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

       dataProducao: producao.dataProducao || producaoFormatada,

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
            "RESP: " + dados.usuario;



            imprimirEtiqueta();


        }


    });


};
// =======================================
// IMPRIMIR ETIQUETA
// =======================================

window.imprimirEtiqueta = function () {


    const conteudo =
    document.getElementById("etiquetaGerada").outerHTML;



    const janela =
    window.open(
        "",
        "_blank",
        "width=227,height=227"
    );



    janela.document.write(`

<!DOCTYPE html>

<html lang="pt-BR">

<head>

<meta charset="UTF-8">


<style>


@page{

    size:60mm 60mm;

    margin:0;

}



html,
body{

    width:60mm;

    height:60mm;

    margin:0;

    padding:0;

    overflow:hidden;

    font-family:Arial,Helvetica,sans-serif;

}



.etiqueta{


    width:60mm;

    height:60mm;


    box-sizing:border-box;


    padding:2mm;


    overflow:hidden;


}



.etiqueta-logo{


    text-align:center;

    font-size:12px;

    font-weight:bold;

    border-bottom:1px solid #000;

    padding-bottom:1mm;

}



#nomeEtiqueta{


    font-size:16px;

    font-weight:bold;

    text-align:center;

    margin:1mm 0;

}



.etiqueta p{


    font-size:10px;

    margin:0.5mm 0;

}



#qrcodeEtiqueta{


    display:flex;

    justify-content:center;

    margin-top:2mm;

}



#qrcodeEtiqueta img,
#qrcodeEtiqueta canvas{


    width:15mm!important;

    height:15mm!important;


}



@media print{


    html,
    body{


        width:60mm;

        height:60mm;

        overflow:hidden;

    }


}



</style>


</head>


<body>


${conteudo}



<script>


window.onload=function(){


    setTimeout(()=>{


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