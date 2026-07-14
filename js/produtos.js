// =======================================
// FOODSYNCH - PRODUTOS
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





const produtoForm =
document.getElementById("produtoForm");


const listaProdutos =
document.getElementById("listaProdutos");





// =======================================
// CADASTRAR PRODUTO
// =======================================


if(produtoForm){


produtoForm.addEventListener(
"submit",

async(e)=>{


e.preventDefault();




const produto = {


codigo:
document.getElementById("codigoProduto").value,


nome:
document.getElementById("nomeProduto").value,


categoria:
document.getElementById("categoriaProduto").value,


unidade:
document.getElementById("unidadeProduto").value,


validade:
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



status:
document.getElementById("statusProduto").value,



observacao:
document.getElementById("observacaoProduto").value,



criadoEm:
serverTimestamp()



};






try{


await addDoc(

collection(db,"produtos"),

produto

);




alert(
"Produto cadastrado com sucesso!"
);



produtoForm.reset();



carregarProdutos();



}catch(error){



console.error(
"Erro ao salvar produto:",
error
);



alert(
"Erro ao cadastrar produto"
);



}



});


}








// =======================================
// LISTAR PRODUTOS
// =======================================


async function carregarProdutos(){



if(!listaProdutos)
return;



listaProdutos.innerHTML="";



const produtos =
await getDocs(
collection(db,"produtos")
);





if(produtos.empty){


listaProdutos.innerHTML = `


<tr>

<td colspan="5">

Nenhum produto cadastrado

</td>

</tr>


`;


return;


}





produtos.forEach((item)=>{


const p =
item.data();



listaProdutos.innerHTML += `



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
${p.validade || 0} dias
</td>


<td>


<button 
onclick="excluirProduto('${item.id}')">

🗑️

</button>


</td>


</tr>



`;



});



}







// =======================================
// EXCLUIR PRODUTO
// =======================================


window.excluirProduto = async function(id){



if(!confirm(
"Deseja excluir este produto?"
))

return;





try{


await deleteDoc(

doc(
db,
"produtos",
id
)

);



carregarProdutos();



}catch(error){


console.error(
"Erro ao excluir:",
error
);



}



};







// =======================================
// INICIAR
// =======================================


document.addEventListener(

"DOMContentLoaded",

()=>{


carregarProdutos();


}

);