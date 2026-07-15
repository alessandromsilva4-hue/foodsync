console.log("PRODUTOS.JS CARREGADO");



// =======================================
// FOODSYNCH v2
// PRODUTOS - FIRESTORE
// =======================================


import { db } from "./firebase.js";


import {

collection,
addDoc,
getDocs,
doc,
deleteDoc,
updateDoc,
serverTimestamp

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";





// ELEMENTOS


const formulario =
document.getElementById("produtoForm");


const tabela =
document.getElementById("listaProdutos");


const pesquisa =
document.getElementById("pesquisaProduto");



let produtos = [];

let produtoEditando = null;





// =======================================
// ABRIR MODAL
// =======================================


window.abrirModalProduto = function(){


const modal =
document.getElementById("modalProduto");


modal.classList.add("active");


};






// =======================================
// FECHAR MODAL
// =======================================


window.fecharModalProduto = function(){


const modal =
document.getElementById("modalProduto");


modal.classList.remove("active");


produtoEditando=null;


if(formulario){

formulario.reset();

}


};







// =======================================
// CARREGAR PRODUTOS
// =======================================


async function carregarProdutos(){


try{


const snapshot =
await getDocs(
collection(db,"produtos")
);


console.log("TOTAL PRODUTOS FIREBASE:", snapshot.size);



produtos=[];



snapshot.forEach(doc=>{


const dados = doc.data();


console.log("PRODUTO ENCONTRADO:", dados);



produtos.push({

id: doc.id,

...dados

});


});



console.log("LISTA FINAL:", produtos);



mostrarProdutos(produtos);



}

catch(error){


console.error(

"Erro carregar produtos:",

error

);


}


}







// =======================================
// MOSTRAR NA TABELA
// =======================================

function mostrarProdutos(lista){

   console.log(
    "DADOS PARA TABELA:",
    lista,
    "Quantidade:",
    lista ? lista.length : "sem lista"
);

    const tabela = document.getElementById("listaProdutos");

    if(!tabela){
        console.error("Tabela listaProdutos não encontrada.");
        return;
    }

    tabela.innerHTML = "";

    if(lista.length === 0){

        tabela.innerHTML = `
        <tr>
            <td colspan="8">
                Nenhum produto cadastrado
            </td>
        </tr>
        `;

        return;
    }


lista.forEach(p=>{


const status =

p.status === "ativo"

?

`<span class="status-ativo">
Ativo
</span>`

:

`<span class="status-inativo">
Inativo
</span>`;


tabela.innerHTML += `

<tr>

<td>
${p.codigo || "-"}
</td>

<td>
${p.nome || "-"}
</td>

<td>
${p.categoria || "-"}
</td>

<td>
${p.unidade || "-"}
</td>

<td>
${p.validadeDias || 0} dias
</td>

<td>
${p.setor || "-"}
</td>

<td>
${status}
</td>

<td>

<button
class="btn-editar"
onclick="editarProduto('${p.id}')">

✏️

</button>


<button
class="btn-excluir"
onclick="excluirProduto('${p.id}')">

🗑️

</button>

</td>

</tr>

`;

});



}









// =======================================
// SALVAR PRODUTO
// =======================================


if(formulario){



formulario.addEventListener(

"submit",

async(e)=>{


e.preventDefault();




const dados = {

codigo:
document.getElementById("codigoProduto").value.trim(),


nome:
document.getElementById("nomeProduto").value.trim(),


categoria:
document.getElementById("categoriaProduto").value,


unidade:
document.getElementById("unidadeProduto").value,


validadeDias:
Number(
document.getElementById("validadeProduto").value
),


validadeAberto:
Number(
document.getElementById("validadeAberto").value
),


temperatura:
document.getElementById("temperaturaProduto").value,


setor:
document.getElementById("setorProduto").value,


estoqueMinimo:
Number(
document.getElementById("estoqueMinimoProduto").value
),


status:
document.getElementById("statusProduto").value,


observacao:
document.getElementById("observacaoProduto").value.trim(),


atualizadoEm:
serverTimestamp()

};





try{



if(produtoEditando){



await updateDoc(

doc(
db,
"produtos",
produtoEditando

),

dados

);



alert(
"Produto atualizado!"
);



}else{



dados.criadoEm =
serverTimestamp();


await addDoc(
collection(db,"produtos"),
{

nome: nomeProduto,

temperatura:
document.getElementById("temperaturaProduto").value,

validadeDias:
Number(
document.getElementById("validadeProduto").value
),

unidade:
document.getElementById("unidadeProduto").value

}
);



fecharModalProduto();



carregarProdutos();



}



catch(error){


console.error(

"Erro salvar produto:",

error

);


}



});


}







// =======================================
// EDITAR PRODUTO
// =======================================


window.editarProduto = function(id){



const produto =

produtos.find(

p=>p.id===id

);



if(!produto)
return;



produtoEditando=id;




document.getElementById(
"codigoProduto"
).value =
produto.codigo || "";



document.getElementById(
"nomeProduto"
).value =
produto.nome || "";



document.getElementById(
"categoriaProduto"
).value =
produto.categoria || "";



document.getElementById(
"unidadeProduto"
).value =
produto.unidade || "";



document.getElementById(
"validadeProduto"
).value =
produto.validadeDias || 1;



document.getElementById(
"validadeAberto"
).value =
produto.validadeAberto || 1;



document.getElementById(
"temperaturaProduto"
).value =
produto.temperatura || "";



document.getElementById(
"setorProduto"
).value =
produto.setor || "";



document.getElementById(
"estoqueMinimoProduto"
).value =
produto.estoqueMinimo || 1;



document.getElementById(
"statusProduto"
).value =
produto.status || "ativo";



document.getElementById(
"observacaoProduto"
).value =
produto.observacao || "";



abrirModalProduto();


};








// =======================================
// EXCLUIR PRODUTO
// =======================================


window.excluirProduto = async function(id){



if(!confirm(

"Deseja excluir este produto?"

))

return;



await deleteDoc(

doc(
db,
"produtos",
id

)

);



carregarProdutos();



};









// =======================================
// PESQUISA
// =======================================

if(pesquisa){

pesquisa.addEventListener(
"input",
()=>{


const texto =
pesquisa.value
.trim()
.toLowerCase();



if(texto === ""){

    mostrarProdutos(produtos);

    return;

}



const resultado =
produtos.filter(p=>{

return (
p.nome &&
p.nome
.toLowerCase()
.includes(texto)
);

});



mostrarProdutos(resultado);



});


}









// =======================================
// INICIAR
// =======================================


document.addEventListener(

"DOMContentLoaded",

()=>{


carregarProdutos();



}

);