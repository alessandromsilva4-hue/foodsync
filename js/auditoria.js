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

const tabela = document.getElementById("listaAuditoria");


// armazenar dados para filtros/exportação

let dadosAuditoria = [];




// =======================================
// CARREGAR AUDITORIA
// =======================================


async function carregarAuditoria(){


if(!tabela)
return;


try{


tabela.innerHTML = "";



const consulta = query(

collection(db,"auditoria"),

orderBy(
"data",
"desc"
)

);



const snapshot = await getDocs(consulta);



dadosAuditoria = [];



snapshot.forEach(item=>{


dadosAuditoria.push({

id:item.id,

...item.data()

});


});



if(dadosAuditoria.length === 0){


tabela.innerHTML = `

<tr>

<td colspan="6">

Nenhuma ação registrada

</td>

</tr>

`;


return;

}



renderizarTabela(dadosAuditoria);



}catch(error){


console.error(

"Erro ao carregar auditoria:",
error

);


tabela.innerHTML = `

<tr>

<td colspan="6">

Erro ao carregar auditoria

</td>

</tr>

`;


}


}






// =======================================
// RENDERIZAR TABELA
// =======================================


function renderizarTabela(lista){


tabela.innerHTML = "";



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
// FORMATAR DATA
// =======================================


function formatarData(data){


if(!data)
return "-";



// Timestamp Firebase

if(data.seconds){


return new Date(

data.seconds * 1000

).toLocaleString(
"pt-BR"
);


}



return data;


}






// =======================================
// INICIAR
// =======================================


document.addEventListener(

"DOMContentLoaded",

()=>{


carregarAuditoria();


}

);