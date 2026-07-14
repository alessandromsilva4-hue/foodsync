// =======================================
// FOODSYNCH - ETIQUETAS
// =======================================


import { db } from "./firebase.js";


import {

    collection,
    getDocs,
    addDoc,
    serverTimestamp

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";





const produtoSelect =
document.getElementById("produtoEtiqueta");


const etiquetaForm =
document.getElementById("etiquetaForm");





let produtos = [];






// =======================================
// CARREGAR PRODUTOS
// =======================================


async function carregarProdutos(){



if(!produtoSelect)
return;



const snapshot =
await getDocs(
collection(db,"produtos")
);



produtos=[];



produtoSelect.innerHTML =
`
<option value="">
Selecione o produto
</option>
`;




snapshot.forEach(doc=>{


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
// GERAR ETIQUETA
// =======================================


if(etiquetaForm){



etiquetaForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();





const idProduto =
produtoSelect.value;



const produto =
produtos.find(
p=>p.id===idProduto
);





if(!produto){


alert(
"Selecione um produto"
);


return;


}






const dataProducao =
new Date(
document.getElementById("dataProducao").value
);




const validade =
new Date(dataProducao);



validade.setDate(

validade.getDate()
+
Number(produto.validade)

);







const validadeFormatada =
validade.toLocaleDateString(
"pt-BR"
);




const producaoFormatada =
dataProducao.toLocaleDateString(
"pt-BR"
);







// preencher etiqueta


document.getElementById(
"nomeEtiqueta"
).innerText =
produto.nome;



document.getElementById(
"dataEtiqueta"
).innerText =
producaoFormatada;



document.getElementById(
"validadeEtiqueta"
).innerText =
validadeFormatada;



document.getElementById(
"qtdEtiqueta"
).innerText =
document.getElementById(
"quantidadeEtiqueta"
).value;







// salvar histórico


await addDoc(

collection(db,"etiquetas"),

{


produto:
produto.nome,


produtoId:
produto.id,


dataProducao:
producaoFormatada,


validade:
validadeFormatada,


quantidade:
Number(
document.getElementById(
"quantidadeEtiqueta"
).value
),


criadoEm:
serverTimestamp()


}



);



}


);


}








// =======================================
// IMPRESSÃO
// =======================================


window.imprimirEtiqueta =
function(){


window.print();


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