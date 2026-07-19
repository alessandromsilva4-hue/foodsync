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


const graficoProducao =
document.getElementById("graficoProducao");




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

// =======================================
// GRÁFICO PRODUÇÃO POR PRODUTO
// =======================================

if(graficoProducao){


let dadosGrafico = {};



producoes.forEach(doc=>{


const p = doc.data();


const nome =
p.produto || "Sem nome";


const quantidade =
Number(p.quantidade || 0);



if(!dadosGrafico[nome]){

dadosGrafico[nome] = 0;

}


dadosGrafico[nome] += quantidade;


});



new Chart(

graficoProducao,

{

type:"bar",


data:{


labels:
Object.keys(dadosGrafico),


datasets:[{

label:
"Quantidade Produzida",


data:
Object.values(dadosGrafico)

}]


},


options:{


responsive:true


}


}

);


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
${formatarData(p.dataProducao)}
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
// FORMATAR DATA
// =======================================

function formatarData(data){


if(!data)
return "-";


// Firebase Timestamp

if(data.seconds){

return new Date(
data.seconds * 1000
).toLocaleDateString("pt-BR");

}


// Data YYYY-MM-DD

if(typeof data === "string"){

const partes =
data.split("-");


if(partes.length === 3){

return `${partes[2]}/${partes[1]}/${partes[0]}`;

}

}


return data;

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
// =======================================
// EXPORTAR EXCEL
// =======================================

window.exportarExcel = function(){


const tabela =
document.querySelector("table");


if(!tabela){

alert("Tabela não encontrada");

return;

}



const workbook =
XLSX.utils.table_to_book(tabela);



XLSX.writeFile(

workbook,

"relatorio-foodsync.xlsx"

);


};




// =======================================
// EXPORTAR CSV
// =======================================

window.exportarCSV = function(){


const tabela =
document.querySelector("table");


if(!tabela){

alert("Tabela não encontrada");

return;

}



let csv=[];



tabela.querySelectorAll("tr")
.forEach(linha=>{


let dados=[];



linha.querySelectorAll("th,td")
.forEach(coluna=>{


dados.push(
coluna.innerText
);


});



csv.push(
dados.join(";")
);



});



const arquivo =
csv.join("\n");



const blob =
new Blob(

[arquivo],

{
type:"text/csv;charset=utf-8;"
}

);



const link =
document.createElement("a");



link.href =
URL.createObjectURL(blob);



link.download =
"relatorio-foodsync.csv";



link.click();



};




// =======================================
// IMPRIMIR RELATÓRIO
// =======================================

window.imprimirRelatorio = function(){

window.print();

};