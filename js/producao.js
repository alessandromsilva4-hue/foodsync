console.log("PRODUCAO.JS CARREGADO");

import { db } from "./firebase.js";


import {

collection,
getDocs,
addDoc,
updateDoc,
deleteDoc,
doc,
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

produtos = [];

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


if(!produto){

alert("Produto não encontrado");

return;

}



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
) || 1,

unidade:
produto.unidade || "UN",


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
// REGISTRAR AUDITORIA
// =====================================

await addDoc(

collection(db,"auditoria"),

{

usuario:
dados.responsavel || "admin",


acao:
"Nova produção criada",


modulo:
"Produção",


detalhes:

produto.nome +
" - Quantidade: " +
dados.quantidade +
" " +
dados.unidade,


data:
serverTimestamp(),


status:
"Sucesso"

}

);
// =====================================
// BAIXAR ESTOQUE AUTOMATICAMENTE
// =====================================


const estoqueSnapshot = await getDocs(

collection(db,"estoque")

);



estoqueSnapshot.forEach(async(item)=>{


const estoque = item.data();



if(estoque.produto === produto.nome){



const novaQuantidade =

Number(estoque.quantidade)

-

Number(dados.quantidade);




await updateDoc(

doc(
db,
"estoque",
item.id
),

{

quantidade:
novaQuantidade,

atualizadoEm:
serverTimestamp()

}

);





await addDoc(

collection(db,"movimentacoes"),

{

produto:
produto.nome,

tipo:
"SAIDA",

quantidade:
dados.quantidade,

unidade:
dados.unidade,

motivo:
"Produção",

usuario:
"admin",

data:
serverTimestamp()

}

);


// =====================================
// AUDITORIA ESTOQUE
// =====================================

await addDoc(

collection(db,"auditoria"),

{

usuario:
"admin",


acao:
"Estoque movimentado",


modulo:
"Estoque",


detalhes:

produto.nome +
" - Saída: " +
dados.quantidade +
" " +
dados.unidade,


data:
serverTimestamp(),


status:
"Sucesso"

}

);


}



});
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

unidade:
dados.unidade,

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
// =====================================
// AUDITORIA ETIQUETA AUTOMÁTICA
// =====================================

await addDoc(

collection(db,"auditoria"),

{

usuario:
dados.responsavel || "admin",


acao:
"Etiqueta criada automaticamente",


modulo:
"Etiquetas",


detalhes:

produto.nome +
" - Código: " +
codigoEtiqueta,


data:
serverTimestamp(),


status:
"Sucesso"

}

);

alert(
"Produção registrada!"
);

carregarProducoes();

formulario.reset();


});




// =====================================
// CARREGAR PRODUÇÕES
// =====================================

async function carregarProducoes(){


const lista =
document.getElementById(
"listaProducoes"
);


lista.innerHTML = "";


const snapshot =
await getDocs(
collection(db,"producoes")
);



if(snapshot.empty){


lista.innerHTML = `

<tr>

<td colspan="5">

Nenhuma produção registrada

</td>

</tr>

`;

return;

}



snapshot.forEach(doc=>{


const producao = doc.data();



lista.innerHTML += `

<tr>

<td>${producao.produto}</td>

<td>
${producao.quantidade || 1}
${producao.unidade || "UN"}
</td>

<td>${formatarData(producao.dataProducao)}</td>

<td>${formatarData(producao.validade)}</td>

<td>${producao.status || "Finalizado"}</td>

<td>

<button
class="btn-delete"
onclick="excluirProducao('${doc.id}')">

🗑️

</button>

</td>

</tr>

`;


});


}


// =====================================
// FORMATAR DATA
// =====================================

function formatarData(data){


if(!data)
return "-";


// Firebase Timestamp

if(data.seconds){

const d =
new Date(
data.seconds * 1000
);

return d.toLocaleDateString("pt-BR");

}


// Data normal YYYY-MM-DD

if(typeof data === "string"){

const partes =
data.split("-");


if(partes.length === 3){

return `${partes[2]}/${partes[1]}/${partes[0]}`;

}

}


return data;

}
// =====================================
// EXCLUIR PRODUÇÃO
// =====================================

window.excluirProducao = async function(id){


const confirmar =
confirm(
"Deseja excluir esta produção?"
);


if(!confirmar)
return;



try{


await deleteDoc(
doc(
db,
"producoes",
id
)
);



alert(
"Produção excluída com sucesso!"
);



carregarProducoes();



}catch(error){


console.error(
"Erro ao excluir produção:",
error
);


alert(
"Erro ao excluir produção"
);


}


}

// =====================================
// INICIAR
// =====================================

carregarProdutos();
carregarProducoes();