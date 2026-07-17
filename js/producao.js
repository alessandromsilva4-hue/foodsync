console.log("PRODUCAO.JS CARREGADO");

import { db } from "./firebase.js";


import {

collection,
getDocs,
addDoc,
serverTimestamp

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



const produtoSelect =
document.getElementById("produtoSelect");


const formulario =
document.getElementById("producaoForm");


let produtos = [];




// =====================================
// CARREGAR PRODUTOS
// =====================================

async function carregarProdutos(){


const snapshot =
await getDocs(
collection(db,"produtos")
);



produtoSelect.innerHTML = `

<option value="">
Selecione o produto
</option>

`;



snapshot.forEach(doc=>{


const produto = {

id:doc.id,

...doc.data()

};


produtos.push(produto);



produtoSelect.innerHTML += `

<option value="${produto.id}">

${produto.nome}

</option>

`;


});


console.log(
"Produtos disponíveis:",
produtos
);


}





// =====================================
// PREENCHER DADOS AUTOMÁTICOS
// =====================================


produtoSelect.addEventListener(
"change",
()=>{


const produto = produtos.find(

p =>
p.id === produtoSelect.value

);



if(!produto)
return;



document.getElementById(
"temperaturaProducao"
).value =
produto.temperatura || "";



const data =
document.getElementById(
"dataProducao"
).value;



if(data && produto.validadeDias){


calcularValidade(
produto.validadeDias
);


}


});




// =====================================
// CALCULAR VALIDADE
// =====================================


document.getElementById(
"dataProducao"
)
.addEventListener(
"change",
()=>{


const produto =
produtos.find(

p =>
p.id === produtoSelect.value

);



if(produto){

calcularValidade(
produto.validadeDias
);

}


});



function calcularValidade(dias){


const data =
new Date(
document.getElementById(
"dataProducao"
).value
);



data.setDate(
data.getDate()+dias
);



document.getElementById(
"validadeProducao"
).value =

data.toISOString()
.split("T")[0];


}




// =====================================
// SALVAR PRODUÇÃO
// =====================================


formulario.addEventListener(

"submit",

async(e)=>{


e.preventDefault();



const produto = produtos.find(

p =>
p.id === produtoSelect.value

);



const dados = {


produtoId:
produto.id,


produto:
produto.nome,


codigo:
produto.codigo,


quantidade:
Number(
document.getElementById(
"quantidadeProducao"
).value
),


dataProducao:
document.getElementById(
"dataProducao"
).value,


validade:
document.getElementById(
"validadeProducao"
).value,


temperatura:
document.getElementById(
"temperaturaProducao"
).value,


responsavel:
document.getElementById(
"responsavelProducao"
).value,


status:
document.getElementById(
"statusProducao"
).value,


criadoEm:
serverTimestamp()


};



const producaoRef = await addDoc(

collection(db,"producoes"),

dados

);


// =====================================
// GERAR ETIQUETA AUTOMÁTICA
// =====================================


const codigoEtiqueta = 
"FS-" + Date.now();



const etiqueta = {


codigoEtiqueta,


producaoId:
producaoRef.id,


produto:
produto.nome,


codigo:
produto.codigo,


quantidade:
dados.quantidade,


dataProducao:
dados.dataProducao,


validade:
dados.validade,


temperatura:
dados.temperatura,


responsavel:
dados.responsavel,


status:
"ativa",


criadoEm:
serverTimestamp()


};



await addDoc(

collection(db,"etiquetas"),

etiqueta

);


alert(
"Produção registrada!"
);



formulario.reset();


});




// =====================================
// INICIAR
// =====================================

carregarProdutos();