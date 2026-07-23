// =======================================
// FOODSYNC - ESTOQUE V2
// =======================================


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



console.log("ESTOQUE.JS V2 CARREGADO");




// =======================================
// ELEMENTOS
// =======================================


const estoqueForm =
document.getElementById("estoqueForm");


const produtoSelect =
document.getElementById("produtoEstoque");


const listaEstoque =
document.getElementById("listaEstoque");


const quantidadeInput =
document.getElementById("quantidadeEstoque");


const minimoInput =
document.getElementById("estoqueMinimo");


const maximoInput =
document.getElementById("estoqueMaximo");



const movimentacaoForm =
document.getElementById("movimentacaoForm");


const produtoMovimentacao =
document.getElementById("produtoMovimentacao");


const tipoMovimentacao =
document.getElementById("tipoMovimentacao");


const quantidadeMovimentacao =
document.getElementById("quantidadeMovimentacao");


const motivoMovimentacao =
document.getElementById("motivoMovimentacao");


const listaMovimentacoes =
document.getElementById("listaMovimentacoes");



let produtos=[];


let estoqueAtual=[];




// =======================================
// CARREGAR PRODUTOS
// =======================================


async function carregarProdutos(){


if(!produtoSelect)
return;



produtoSelect.innerHTML=`

<option value="">
Selecione o produto
</option>

`;



if(produtoMovimentacao){

produtoMovimentacao.innerHTML=`

<option value="">
Selecione o produto
</option>

`;

}



const snapshot =
await getDocs(
collection(db,"produtos")
);



produtos=[];



snapshot.forEach(item=>{


const produto={

id:item.id,

...item.data()

};



produtos.push(produto);



produtoSelect.innerHTML +=`

<option value="${produto.id}">
${produto.nome}
</option>

`;



if(produtoMovimentacao){


produtoMovimentacao.innerHTML +=`

<option value="${produto.id}">
${produto.nome}
</option>

`;

}



});


console.log(
"Produtos:",
produtos
);


}
// =======================================
// CARREGAR ESTOQUE
// =======================================


async function carregarEstoque(){


if(!listaEstoque)
return;



listaEstoque.innerHTML="";



const snapshot =
await getDocs(
collection(db,"estoque")
);



estoqueAtual=[];



snapshot.forEach(item=>{


estoqueAtual.push({

id:item.id,

...item.data()

});


});



renderizarEstoque();


}



// =======================================
// STATUS ESTOQUE
// =======================================


function verificarStatus(item){


const quantidade =
Number(item.quantidade || 0);



const minimo =
Number(item.minimo || 0);



if(quantidade <= minimo){


return `

<span style="color:red;font-weight:bold">

🔴 Crítico

</span>

`;

}



if(quantidade <= minimo + 5){


return `

<span style="color:#ca8a04;font-weight:bold">

🟡 Atenção

</span>

`;

}



return `

<span style="color:green;font-weight:bold">

🟢 Normal

</span>

`;


}





// =======================================
// RENDERIZAR ESTOQUE
// =======================================


function renderizarEstoque(){


listaEstoque.innerHTML="";



estoqueAtual.forEach(item=>{


listaEstoque.innerHTML +=`

<tr>


<td>
${item.produto}
</td>


<td>
${item.quantidade || 0}
</td>


<td>
${item.unidade || "UN"}
</td>


<td>
${item.minimo || 0}
</td>


<td>
${item.maximo || 0}
</td>


<td>

${verificarStatus(item)}

</td>


<td>


<button
onclick="excluirEstoque('${item.id}')">

🗑️

</button>


</td>


</tr>

`;



});


}






// =======================================
// SALVAR / ATUALIZAR ESTOQUE
// =======================================


if(estoqueForm){



estoqueForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();



const produtoId =
produtoSelect.value;



const produto =
produtos.find(

p =>
p.id === produtoId

);



if(!produto){


alert(
"Selecione um produto."
);


return;


}





const existente =
estoqueAtual.find(

item =>

item.produtoId === produtoId

);





const dados={



produtoId:


produto.id,



produto:


produto.nome,



quantidade:


Number(
quantidadeInput.value
) || 0,



minimo:


Number(
minimoInput.value
) || 0,



maximo:


Number(
maximoInput.value
) || 0,



unidade:


produto.unidade || "UN",



atualizadoEm:


serverTimestamp(),



usuario:


"admin"



};





try{



if(existente){



await updateDoc(


doc(
db,
"estoque",
existente.id
),


dados


);



console.log(
"Estoque atualizado"
);



}else{



await addDoc(


collection(
db,
"estoque"
),


dados


);



console.log(
"Estoque criado"
);



}




alert(
"Estoque salvo com sucesso!"
);



estoqueForm.reset();



await carregarEstoque();



}catch(error){



console.error(
"Erro estoque:",
error
);



}



});


}






// =======================================
// EXCLUIR ESTOQUE
// =======================================


window.excluirEstoque =
async function(id){



if(!confirm(
"Deseja excluir este estoque?"
))

return;



await deleteDoc(

doc(
db,
"estoque",
id
)

);



await carregarEstoque();


}
// =======================================
// REGISTRAR MOVIMENTAÇÃO
// =======================================


if(movimentacaoForm){


movimentacaoForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();



const produtoId =
produtoMovimentacao.value;



const produto =
produtos.find(

p =>
p.id === produtoId

);



if(!produto){


alert(
"Selecione um produto."
);


return;


}




const tipo =
tipoMovimentacao.value;



const quantidade =
Number(
quantidadeMovimentacao.value
);



const motivo =
motivoMovimentacao.value || "-";





const estoque =
estoqueAtual.find(

item =>

item.produtoId === produtoId

);





if(!estoque){


alert(
"Produto não encontrado no estoque."
);


return;


}





let novaQuantidade =
Number(
estoque.quantidade || 0
);




if(tipo === "ENTRADA"){


novaQuantidade += quantidade;


}



if(tipo === "SAIDA"){


novaQuantidade -= quantidade;


}




if(novaQuantidade < 0){


alert(
"Estoque insuficiente."
);


return;


}





try{



// Atualiza estoque


await updateDoc(


doc(
db,
"estoque",
estoque.id
),


{


quantidade:
novaQuantidade,


atualizadoEm:
serverTimestamp()


}


);






// Salva movimentação


await addDoc(


collection(
db,
"movimentacoes"
),


{


produtoId:


produto.id,



produto:


produto.nome,



tipo,



quantidade,



unidade:


produto.unidade || "UN",



motivo,



usuario:


"admin",



data:


serverTimestamp()



}


);







// Auditoria


await addDoc(


collection(
db,
"auditoria"
),


{


usuario:


"admin",



modulo:


"Estoque",



acao:


"Movimentação de estoque",



detalhes:


produto.nome +

" - " +

tipo +

": " +

quantidade +

" " +

(produto.unidade || "UN"),



status:


"Sucesso",



data:


serverTimestamp()



}


);







alert(
"Movimentação registrada!"
);



movimentacaoForm.reset();



await carregarEstoque();



}catch(error){



console.error(
"Erro movimentação:",
error
);



}



});


}







// =======================================
// CARREGAR MOVIMENTAÇÕES
// =======================================


async function carregarMovimentacoes(){



if(!listaMovimentacoes)
return;




listaMovimentacoes.innerHTML="";




const snapshot =
await getDocs(

collection(
db,
"movimentacoes"
)

);





if(snapshot.empty){


listaMovimentacoes.innerHTML=`

<tr>

<td colspan="6">

Nenhuma movimentação

</td>

</tr>

`;

return;


}







snapshot.forEach(item=>{



const mov =
item.data();




const data =

mov.data?.toDate

?

mov.data
.toDate()
.toLocaleDateString("pt-BR")

:

"-";





listaMovimentacoes.innerHTML +=`


<tr>


<td>
${mov.produto || "-"}
</td>



<td>
${mov.tipo || "-"}
</td>



<td>
${mov.quantidade || 0}
</td>



<td>
${mov.motivo || "-"}
</td>



<td>
${mov.usuario || "-"}
</td>



<td>
${data}
</td>



</tr>


`;



});



}






// =======================================
// INICIALIZAÇÃO
// =======================================


document.addEventListener(

"DOMContentLoaded",

async()=>{


await carregarProdutos();


await carregarEstoque();


await carregarMovimentacoes();



console.log(
"ESTOQUE V2 INICIADO"
);



});