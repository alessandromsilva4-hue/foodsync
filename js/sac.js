// =======================================
// FOODSYNC - SAC
// =======================================

console.log("SAC.JS VERSÃO FINAL");


// FIREBASE

import { db, auth } from "./firebase.js";


import {

collection,
addDoc,
getDocs,
query,
where,
orderBy,
serverTimestamp

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import {

onAuthStateChanged

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


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



let usuarioAtual = null;




// =======================================
// CARREGAR CHAMADOS DO USUÁRIO
// =======================================


async function carregarChamados(){


if(!tabela || !usuarioAtual)
return;



try{


const consulta = query(


collection(db,"sac"),


where(
"usuarioId",
"==",
usuarioAtual.uid
),


orderBy(
"criadoEm",
"desc"
)


);



const snapshot =
await getDocs(consulta);



tabela.innerHTML="";



if(snapshot.empty){


tabela.innerHTML=`

<tr>

<td colspan="6">

Nenhum chamado encontrado.

</td>

</tr>

`;

return;

}




snapshot.forEach(item=>{


const chamado =
item.data();



let data="-";



if(chamado.criadoEm?.seconds){


data =

new Date(

chamado.criadoEm.seconds * 1000

)

.toLocaleString(
"pt-BR"
);


}




let status = chamado.status || "Aberto";



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

${status}

</td>



<td>

${chamado.resposta || 
"Aguardando atendimento"}

</td>



</tr>


`;



});



}

catch(error){


console.error(
"Erro carregar SAC:",
error
);



mostrarToast(

"Erro ao carregar chamados.",

"erro"

);


}


}






// =======================================
// LOGIN DO USUÁRIO
// =======================================


onAuthStateChanged(auth,(user)=>{


if(user){


usuarioAtual = user;


console.log(

"Usuário SAC:",

usuarioAtual.email

);



carregarChamados();


}


else{


console.log(
"Nenhum usuário logado"
);


}



});







// =======================================
// ENVIAR CHAMADO
// =======================================


if(formulario){


formulario.addEventListener(

"submit",

async(e)=>{


e.preventDefault();




if(!usuarioAtual){


mostrarToast(

"Usuário não autenticado.",

"erro"

);


return;

}





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



status:"Aberto",



resposta:"",



usuarioId:

usuarioAtual.uid,



usuarioNome:

usuarioAtual.displayName || "Usuário",



usuarioEmail:

usuarioAtual.email,



criadoEm:

serverTimestamp(),



atualizadoEm:

serverTimestamp()



}

);





// =======================================
// AUDITORIA
// =======================================


await addDoc(

collection(db,"auditoria"),

{


usuario:

usuarioAtual.email,


modulo:

"SAC",


acao:

"Novo chamado",


detalhes:

assunto,


status:

"Sucesso",


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


console.error(

"Erro enviar SAC:",

error

);



mostrarToast(

"Erro ao enviar chamado.",

"erro"

);


}



}

);


}