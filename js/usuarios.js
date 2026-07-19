// =======================================
// FOODSYNC - USUÁRIOS
// =======================================

console.log("USUARIOS.JS CARREGADO");


import { db } from "./firebase.js";


import {

collection,
addDoc,
getDocs,
deleteDoc,
doc,
serverTimestamp,
query,
orderBy

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import {

mostrarToast

}

from "./utils.js";





const usuarioForm =
document.getElementById("usuarioForm");


const listaUsuarios =
document.getElementById("listaUsuarios");





// =======================================
// PERMISSÕES POR PERFIL
// =======================================


function definirPermissoes(perfil){


if(perfil === "Administrador"){


return {

dashboard:true,
produtos:true,
producao:true,
etiquetas:true,
estoque:true,
relatorios:true,
auditoria:true,
usuarios:true,
configuracoes:true,
sac:true

};


}



if(perfil === "Operador"){


return {

dashboard:true,
produtos:false,
producao:true,
etiquetas:true,
estoque:true,
relatorios:false,
auditoria:false,
usuarios:false,
configuracoes:false,
sac:true

};


}



return {

dashboard:true,
produtos:false,
producao:false,
etiquetas:false,
estoque:false,
relatorios:true,
auditoria:true,
usuarios:false,
configuracoes:false,
sac:false

};


}








// =======================================
// CADASTRAR USUÁRIO
// =======================================


if(usuarioForm){


usuarioForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();



const nome =
document.getElementById("nomeUsuario").value.trim();


const email =
document.getElementById("emailUsuario").value.trim();


const perfil =
document.getElementById("perfilUsuario").value;


const status =
document.getElementById("statusUsuario").value;



const usuario = {


nome,

email,

perfil,

status,


permissoes:
definirPermissoes(perfil),


criadoEm:
serverTimestamp()


};



try{


await addDoc(

collection(db,"usuarios"),

usuario

);




// Auditoria


await addDoc(

collection(db,"auditoria"),

{


usuario:"admin",

modulo:"Usuários",

acao:"Novo usuário criado",

detalhes:

`${nome} - ${perfil}`,

status:"Sucesso",

data:
serverTimestamp()


}

);



mostrarToast(

"Usuário cadastrado com sucesso!"

);



usuarioForm.reset();


carregarUsuarios();



}

catch(error){


console.error(

"Erro usuário:",

error

);



mostrarToast(

"Erro ao cadastrar usuário.",

"erro"

);


}



});


}









// =======================================
// LISTAR USUÁRIOS
// =======================================


async function carregarUsuarios(){



if(!listaUsuarios)
return;



try{


const consulta = query(

collection(db,"usuarios"),

orderBy(
"criadoEm",
"desc"
)

);



const dados =
await getDocs(consulta);



listaUsuarios.innerHTML="";



if(dados.empty){


listaUsuarios.innerHTML = `

<tr>

<td colspan="6">

Nenhum usuário cadastrado

</td>

</tr>

`;


return;


}





dados.forEach(item=>{


const u =
item.data();



let data="-";


if(u.criadoEm?.seconds){


data =
new Date(

u.criadoEm.seconds * 1000

).toLocaleDateString(
"pt-BR"
);


}




listaUsuarios.innerHTML += `


<tr>


<td>
${u.nome || "-"}
</td>


<td>
${u.email || "-"}
</td>


<td>
${u.perfil || "-"}
</td>


<td>
${u.status || "-"}
</td>


<td>
${data}
</td>


<td>


<button

onclick="excluirUsuario('${item.id}')">

🗑️

</button>


</td>


</tr>


`;



});



}

catch(error){


console.error(

"Erro carregar usuários:",

error

);


}



}










// =======================================
// EXCLUIR USUÁRIO
// =======================================


window.excluirUsuario =

async function(id){



if(!confirm(

"Deseja excluir este usuário?"

))

return;




try{


await deleteDoc(

doc(

db,

"usuarios",

id

)

);




await addDoc(

collection(db,"auditoria"),

{


usuario:"admin",

modulo:"Usuários",

acao:"Usuário excluído",

detalhes:id,

status:"Sucesso",

data:
serverTimestamp()


}

);




mostrarToast(

"Usuário excluído com sucesso!"

);



carregarUsuarios();



}

catch(error){


console.error(

"Erro excluir usuário:",

error

);



mostrarToast(

"Erro ao excluir usuário.",

"erro"

);



}



};









// =======================================
// INICIAR
// =======================================


document.addEventListener(

"DOMContentLoaded",

()=>{


carregarUsuarios();


}

);