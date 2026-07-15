// =======================================
// FOODSYNCH - DASHBOARD FIRESTORE
// =======================================

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =======================================
// CARREGAR DASHBOARD
// =======================================

async function carregarDashboard(){

try{


// ===============================
// PRODUÇÕES HOJE
// ===============================

const producaoSnap = await getDocs(
    collection(db,"producoes")
);


let totalProducao = 0;


producaoSnap.forEach(doc=>{

const dados = doc.data();

if(dados.dataProducao){

totalProducao++;

}

});


document.getElementById("totalProducao").innerText =
totalProducao;



// ===============================
// ETIQUETAS
// ===============================


const etiquetasSnap = await getDocs(
collection(db,"etiquetas")
);


document.getElementById("totalEtiquetas").innerText =
etiquetasSnap.size;



// ===============================
// PRODUTOS VENCENDO
// ===============================


const produtosSnap = await getDocs(
collection(db,"produtos")
);


let vencendo = 0;


produtosSnap.forEach(doc=>{


const produto = doc.data();


if(produto.validadeDias <= 3){

vencendo++;

}


});


document.getElementById("produtosVencendo").innerText =
vencendo;



// ===============================
// ESTOQUE BAIXO
// ===============================


const estoqueSnap = await getDocs(
collection(db,"estoque")
);


let baixo = 0;


estoqueSnap.forEach(doc=>{


const item = doc.data();


if(item.Saldo <= 3){

baixo++;

}


});


document.getElementById("estoqueBaixo").innerText =
baixo;



// ===============================
// ÚLTIMAS PRODUÇÕES
// ===============================


const tabela =
document.getElementById("listaProducao");


tabela.innerHTML="";


const ultimas = query(

collection(db,"producoes"),

orderBy("dataProducao","desc"),

limit(5)

);



const producoes =
await getDocs(ultimas);



if(producoes.empty){


tabela.innerHTML=`

<tr>

<td colspan="4">

Nenhuma produção registrada

</td>

</tr>

`;

return;

}



producoes.forEach(doc=>{


const p = doc.data();


console.log(p);


let data = "-";


if(p.dataProducao){

data =
p.dataProducao.toDate()
.toLocaleDateString("pt-BR");

}



let nomeProduto = p.Produto || p["Produto "] || p.produto || "-";

console.log("NOME DO PRODUTO:", nomeProduto);

const linha = document.createElement("tr");

linha.innerHTML = `

<td>${nomeProduto}</td>

<td>${p.quantidade || 0}</td>

<td>${data}</td>

<td>Finalizado</td>

`;

tabela.appendChild(linha);

});


}

catch(error){

console.error(
"Erro dashboard:",
error
);

}


}



// =======================================
// INICIAR
// =======================================


document.addEventListener(
"DOMContentLoaded",
carregarDashboard
);