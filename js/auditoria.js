// =======================================
// FOODSYNC - AUDITORIA
// =======================================

console.log("AUDITORIA.JS CARREGADO");


import { db } from "./firebase.js";


import {

collection,
getDocs,
query,
orderBy

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



// ELEMENTOS

const tabela =
document.getElementById("listaAuditoria");


const filtroModulo =
document.getElementById("filtroModulo");


const filtroData =
document.getElementById("filtroData");



// DADOS

let dadosAuditoria = [];





// =======================================
// CARREGAR AUDITORIA
// =======================================


async function carregarAuditoria(){


if(!tabela)
return;


try{


tabela.innerHTML="";


const consulta =
query(

collection(db,"auditoria"),

orderBy(
"data",
"desc"
)

);



const snapshot =
await getDocs(consulta);



dadosAuditoria=[];



snapshot.forEach(item=>{


dadosAuditoria.push({

id:item.id,

...item.data()

});


});



renderizarTabela(
dadosAuditoria
);



}

catch(error){


console.error(
"Erro auditoria:",
error
);



tabela.innerHTML=`

<tr>

<td colspan="6">

Erro ao carregar auditoria

</td>

</tr>

`;


}


}







// =======================================
// TABELA
// =======================================


function renderizarTabela(lista){


tabela.innerHTML="";



if(lista.length===0){


tabela.innerHTML=`

<tr>

<td colspan="6">

Nenhuma ação registrada

</td>

</tr>

`;

return;


}



lista.forEach(a=>{


tabela.innerHTML += `

<tr>

<td>
${formatarData(a.data)}
</td>

<td>
${a.usuario || "-"}
</td>

<td>
${a.modulo || "-"}
</td>

<td>
${a.acao || "-"}
</td>

<td>
${a.detalhes || "-"}
</td>

<td>
${a.status || "-"}
</td>

</tr>

`;


});


}







// =======================================
// DATA FIREBASE
// =======================================


function formatarData(data){


if(!data)
return "-";


// Timestamp Firebase

if(data.toDate){


return data
.toDate()
.toLocaleString(
"pt-BR"
);


}


// formato antigo

if(data.seconds){


return new Date(

data.seconds * 1000

)
.toLocaleString(
"pt-BR"
);


}


return data;


}








// =======================================
// FILTROS
// =======================================


window.filtrarAuditoria=function(){


let resultado =
[...dadosAuditoria];



if(
filtroModulo &&
filtroModulo.value
){


resultado =
resultado.filter(a=>

a.modulo === filtroModulo.value

);


}




if(
filtroData &&
filtroData.value
){


resultado =
resultado.filter(a=>{


let data =
formatarData(a.data);


return data.includes(
filtroData.value
);


});


}



renderizarTabela(resultado);


}








// =======================================
// EXPORTAR EXCEL
// =======================================


window.exportarExcel=function(){


if(!dadosAuditoria.length)
return;


const ws =
XLSX.utils.json_to_sheet(
dadosAuditoria
);


const wb =
XLSX.utils.book_new();


XLSX.utils.book_append_sheet(
wb,
ws,
"Auditoria"
);


XLSX.writeFile(
wb,
"auditoria-foodsync.xlsx"
);


}








// =======================================
// IMPRIMIR
// =======================================


window.imprimirAuditoria=function(){


window.print();


}








document.addEventListener(

"DOMContentLoaded",

()=>{


carregarAuditoria();


}

);