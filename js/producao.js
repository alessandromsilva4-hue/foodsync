// =======================================
// FOODSYNCH - PRODUÇÃO
// =======================================


import { db } from "./firebase.js";


import {

    collection,
    addDoc,
    getDocs,
    serverTimestamp,
    orderBy,
    query

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



console.log("PRODUCAO.JS CARREGADO");


const produtoSelect =
document.getElementById("produtoSelect");


const producaoForm =
document.getElementById("producaoForm");


const listaProducao =
document.getElementById("listaProducoes");



let produtos = [];







// =======================================
// CARREGAR PRODUTOS
// =======================================


async function carregarProdutos(){


if(!produtoSelect)
return;



const dados =
await getDocs(
collection(db,"produtos")
);



produtoSelect.innerHTML = `

<option value="">

Selecione o produto

</option>

`;



produtos=[];



dados.forEach(doc=>{


const p = doc.data();



produtos.push({

id:doc.id,

...p

});



produtoSelect.innerHTML += `

<option value="${doc.id}">

${p.nome}

</option>

`;

console.log("ADICIONANDO NO SELECT:", p.nome);

});



console.log(
"Produtos carregados:",
produtos
);


}



// =======================================
// PREENCHER DADOS DO PRODUTO
// =======================================

if(produtoSelect){

produtoSelect.addEventListener(
"change",
()=>{


const produtoSelecionado =
produtos.find(
p=>p.id === produtoSelect.value
);



if(!produtoSelecionado)
return;



const hoje = new Date();



document.getElementById(
"dataProducao"
).value =
hoje.toISOString().split("T")[0];



const dias =
produtoSelecionado.validadeDias || 1;



const validade =
new Date();


validade.setDate(
hoje.getDate() + dias
);



document.getElementById(
"validadeProducao"
).value =
validade.toISOString().split("T")[0];



document.getElementById(
"temperaturaProducao"
).value =
produtoSelecionado.temperatura || "AMBIENTE";



});

}




// =======================================
// CADASTRAR PRODUÇÃO
// =======================================


if(producaoForm){



producaoForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();





const produtoId =
produtoSelect.value;




const produto =
produtos.find(
p=>p.id===produtoId
);





if(!produto){


alert(
"Selecione um produto"
);


return;


}






const hoje = new Date();

const validadeDias = produto.validadeDias || 1;

const dataValidade = new Date();

dataValidade.setDate(
    hoje.getDate() + validadeDias
);



const producao = {


produtoId:
produto.id,


produto:
produto.nome,


quantidade:
Number(
document.getElementById(
"quantidadeProducao"
).value
),


unidade:
produto.unidade || "UN",


temperatura:
produto.temperatura || "AMBIENTE",


responsavel:
document.getElementById(
"responsavelProducao"
).value || "admin",


status:
document.getElementById(
"statusProducao"
).value,


dataProducao:
hoje,


validade:
dataValidade,


criadoEm:
serverTimestamp()


};






try{


await addDoc(

collection(db,"producoes"),

producao

);



alert(
"Produção registrada!"
);



producaoForm.reset();



carregarProducoes();



}catch(error){


console.error(
"Erro produção:",
error
);



}



});


}





// =======================================
// LISTAR PRODUÇÕES
// =======================================


async function carregarProducoes(){



if(!listaProducao)
return;





listaProducao.innerHTML="";




const consulta =
query(

collection(db,"producoes"),

orderBy(
"criadoEm",
"desc"
)

);




const dados =
await getDocs(
consulta
);







if(dados.empty){


listaProducao.innerHTML = `


<tr>

<td colspan="5">

Nenhuma produção registrada

</td>

</tr>


`;

return;


}







dados.forEach(doc=>{


const p =
doc.data();




listaProducao.innerHTML += `

<tr>

<td>
${p.produto || "-"}
</td>

<td>
${p.quantidade || 0} ${p.unidade || ""}
</td>

<td>
${p.dataProducao 
? p.dataProducao.toDate().toLocaleDateString("pt-BR") 
: "-"
}
</td>

<td>
${p.validade 
? p.validade.toDate().toLocaleDateString("pt-BR") 
: "-"
}
</td>

<td>
${p.status || "Finalizado"}
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

()=>{


carregarProdutos();


carregarProducoes();


}

);