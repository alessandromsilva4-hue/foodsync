// =======================================
// FOODSYNC - SAC
// =======================================

console.log("SAC.JS CARREGADO");


import { db } from "./firebase.js";


import {

collection,
addDoc,
getDocs,
query,
orderBy,
serverTimestamp

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



import {

mostrarToast

}

from "./utils.js";




// =======================================
// ELEMENTOS
// =======================================


const formulario =
document.getElementById("formSac");


const tabela =
document.getElementById("listaChamados");




// =======================================
// CARREGAR CHAMADOS
// =======================================


async function carregarChamados(){


if(!tabela)
return;


try{


const consulta = query(

collection(db,"sac"),

orderBy(
"criadoEm",
"desc"
)

);



const snapshot =
await getDocs(consulta);



tabela.innerHTML = "";



if(snapshot.empty){


tabela.innerHTML = `

<tr>

<td colspan="5">

Nenhum chamado encontrado.

</td>

</tr>

`;


return;

}




snapshot.forEach(doc=>{


const chamado =
doc.data();



let data = "-";


if(chamado.criadoEm?.seconds){


data =
new Date(

chamado.criadoEm.seconds * 1000

).toLocaleString(
"pt-BR"
);


}



tabela.innerHTML += `

<tr>

<td>
${data}
</td>


<td>
${chamado.tipo || "-"}
</td>


<td>
${chamado.assunto || "-"}
</td>


<td>
${chamado.prioridade || "-"}
</td>


<td>
${chamado.status || "-"}
</td>


</tr>

`;



});



}
catch(error){


console.error(
"Erro carregar chamados:",
error
);


mostrarToast(
"Erro ao carregar chamados.",
"erro"
);


}


}






// =======================================
// ENVIAR CHAMADO
// =======================================


if(formulario){


formulario.addEventListener(


"submit",


async(e)=>{


e.preventDefault();



const tipo =
document.getElementById("tipo").value;



const prioridade =
document.getElementById("prioridade").value;



const assunto =
document.getElementById("assunto").value.trim();



const descricao =
document.getElementById("descricao").value.trim();



if(!assunto || !descricao){


mostrarToast(

"Preencha todos os campos.",

"aviso"

);


return;


}



try{


await addDoc(

collection(db,"sac"),

{


tipo,

prioridade,

assunto,

descricao,


usuario:"admin",


status:"Aberto",


criadoEm:
serverTimestamp()


}

);




// Registrar auditoria


await addDoc(

collection(db,"auditoria"),

{


usuario:"admin",

modulo:"SAC",

acao:"Novo chamado",

detalhes:assunto,

status:"Sucesso",

data:
serverTimestamp()


}

);



mostrarToast(

"Chamado enviado com sucesso!"

);



formulario.reset();



carregarChamados();



}

catch(error){


console.error(error);



mostrarToast(

"Erro ao enviar chamado.",

"erro"

);


}



});


}






// =======================================
// INICIAR
// =======================================


document.addEventListener(

"DOMContentLoaded",

()=>{


carregarChamados();


}

);