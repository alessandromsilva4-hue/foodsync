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






const produtoSelect =
document.getElementById("produtoProducao");


const producaoForm =
document.getElementById("producaoForm");


const listaProducao =
document.getElementById("listaProducao");



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



responsavel:
document.getElementById(
"responsavelProducao"
).value,



status:
document.getElementById(
"statusProducao"
).value,



data:
new Date()
.toLocaleDateString(
"pt-BR"
),



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
${p.produto}
</td>



<td>
${p.quantidade}
</td>



<td>
${p.responsavel || "-"}
</td>



<td>
${p.data}
</td>



<td>
${p.status}
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