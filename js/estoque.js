// =======================================
// FOODSYNCH - ESTOQUE
// =======================================


import { db } from "./firebase.js";


import {

    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";






const produtoSelect =
document.getElementById("produtoEstoque");


const estoqueForm =
document.getElementById("estoqueForm");


const listaEstoque =
document.getElementById("listaEstoque");



let produtos=[];







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


const p =
doc.data();



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
// SALVAR ESTOQUE
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
p=>p.id===produtoId
);






if(!produto){


alert(
"Selecione um produto"
);


return;


}





const estoque = {



produtoId:
produto.id,



produto:
produto.nome,



quantidade:
Number(
document.getElementById(
"quantidadeEstoque"
).value
),



minimo:
Number(
document.getElementById(
"estoqueMinimo"
).value
),



maximo:
Number(
document.getElementById(
"estoqueMaximo"
).value
),



criadoEm:
serverTimestamp()



};






try{


await addDoc(

collection(db,"estoque"),

estoque

);



alert(
"Estoque salvo!"
);



estoqueForm.reset();



carregarEstoque();



}catch(error){


console.error(
"Erro estoque:",
error
);


}



});


}









// =======================================
// LISTAR ESTOQUE
// =======================================


async function carregarEstoque(){



if(!listaEstoque)
return;





listaEstoque.innerHTML="";



const dados =
await getDocs(
collection(db,"estoque")
);





if(dados.empty){



listaEstoque.innerHTML = `


<tr>

<td colspan="6">

Nenhum estoque cadastrado

</td>

</tr>


`;


return;


}





dados.forEach(item=>{


const e =
item.data();



let situacao =
"Normal";



if(
e.quantidade <= e.minimo
){


situacao =
"⚠️ Baixo";


}




listaEstoque.innerHTML += `


<tr>


<td>

${e.produto}

</td>




<td>

${e.quantidade}

</td>




<td>

${e.minimo}

</td>




<td>

${e.maximo}

</td>




<td>

${situacao}

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
// EXCLUIR ESTOQUE
// =======================================


window.excluirEstoque =
async function(id){



if(!confirm(
"Excluir registro de estoque?"
))

return;





await deleteDoc(

doc(
db,
"estoque",
id
)

);



carregarEstoque();



};








// =======================================
// INICIAR
// =======================================


document.addEventListener(

"DOMContentLoaded",

()=>{


carregarProdutos();


carregarEstoque();


}

);