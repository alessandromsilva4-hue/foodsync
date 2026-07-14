// =======================================
// FOODSYNCH - RELATÓRIOS
// =======================================


import { db } from "./firebase.js";


import {

    collection,
    getDocs,
    query,
    orderBy,
    limit

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";






const totalProducoes =
document.getElementById("totalProducoes");


const totalEtiquetas =
document.getElementById("totalEtiquetas");


const totalProdutos =
document.getElementById("totalProdutos");


const totalEstoqueBaixo =
document.getElementById("totalEstoqueBaixo");


const tabelaProducao =
document.getElementById("relatorioProducao");







// =======================================
// CARREGAR RELATÓRIOS
// =======================================


async function carregarRelatorios(){


try{





// PRODUÇÕES


const producoes =
await getDocs(
collection(db,"producoes")
);



if(totalProducoes){

totalProducoes.innerText =
producoes.size;

}







// ETIQUETAS


const etiquetas =
await getDocs(
collection(db,"etiquetas")
);



if(totalEtiquetas){

totalEtiquetas.innerText =
etiquetas.size;

}








// PRODUTOS


const produtos =
await getDocs(
collection(db,"produtos")
);



if(totalProdutos){

totalProdutos.innerText =
produtos.size;

}









// ESTOQUE BAIXO


const estoque =
await getDocs(
collection(db,"estoque")
);



let baixo=0;



estoque.forEach(doc=>{


const e =
doc.data();



if(
e.quantidade <= e.minimo
){


baixo++;


}



});




if(totalEstoqueBaixo){

totalEstoqueBaixo.innerText =
baixo;

}









// ÚLTIMAS PRODUÇÕES


if(tabelaProducao){



tabelaProducao.innerHTML="";



const consulta =
query(

collection(db,"producoes"),

orderBy(
"criadoEm",
"desc"
),

limit(10)

);





const dados =
await getDocs(
consulta
);





if(dados.empty){



tabelaProducao.innerHTML = `


<tr>

<td colspan="4">

Sem dados

</td>

</tr>


`;



return;


}







dados.forEach(item=>{


const p =
item.data();




tabelaProducao.innerHTML += `


<tr>


<td>
${p.produto || "-"}
</td>


<td>
${p.quantidade || 0}
</td>


<td>
${p.responsavel || "-"}
</td>


<td>
${p.data || "-"}
</td>



</tr>


`;



});



}





}catch(error){


console.error(

"Erro nos relatórios:",

error

);


}



}








// =======================================
// INICIAR
// =======================================


document.addEventListener(

"DOMContentLoaded",

()=>{


carregarRelatorios();



}

);