// =======================================
// FOODSYNC - USUÁRIOS V4
// =======================================

console.log("USUARIOS.JS V4 CARREGADO");


import { db, auth } from "./firebase.js";

import {
collection,
getDocs,
doc,
setDoc,
updateDoc,
deleteDoc,
serverTimestamp
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import {
createUserWithEmailAndPassword
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
mostrarToast
}
from "./utils.js";




// ELEMENTOS

const tabelaUsuarios =
document.getElementById("tabelaUsuarios");


const btnNovoUsuario =
document.getElementById("btnNovoUsuario");


const modalUsuario =
document.getElementById("modalUsuario");


const btnCancelar =
document.getElementById("btnCancelar");


const fecharModal =
document.getElementById("fecharModal");


const formUsuario =
document.getElementById("formUsuario");


// CAMPOS FORMULÁRIO

const nomeUsuario =
document.getElementById("nomeUsuario");

const emailUsuario =
document.getElementById("emailUsuario");

const senhaUsuario =
document.getElementById("senhaUsuario");

const perfilUsuario =
document.getElementById("perfilUsuario");

const statusUsuario =
document.getElementById("statusUsuario");



let usuarios=[];

let usuarioEditando=null;



// =======================================
// PERMISSÕES
// =======================================

function definirPermissoes(perfil){


perfil =
perfil.toLowerCase();



if(perfil==="administrador"){

return {

dashboard:true,
produtos:true,
producao:true,
etiquetas:true,
estoque:true,
movimentacoes:true,
relatorios:true,
auditoria:true,
usuarios:true,
configuracoes:true,
sac:true

};

}


return {

dashboard:true,
produtos:true,
producao:true,
etiquetas:true,
estoque:true,
movimentacoes:true,
relatorios:false,
auditoria:false,
usuarios:false,
configuracoes:false,
sac:true

};


}




// =======================================
// CARREGAR USUÁRIOS
// =======================================

async function carregarUsuarios(){


if(!tabelaUsuarios)
return;


try{


const snap =
await getDocs(
collection(db,"usuarios")
);



usuarios=[];


snap.forEach(item=>{


usuarios.push({

id:item.id,

...item.data()

});


});



mostrarUsuarios(usuarios);

atualizarCards();


}

catch(error){

console.error(
"Erro carregando usuários:",
error
);

mostrarToast(
"Erro ao carregar usuários",
"erro"
);


}


}






// =======================================
// CARDS
// =======================================

function atualizarCards(){


const total =
document.getElementById("cardTotal");


const ativos =
document.getElementById("cardAtivos");


const admins =
document.getElementById("cardAdmins");


const operadores =
document.getElementById("cardOperadores");



if(total)
total.innerText =
usuarios.length;



if(ativos)

ativos.innerText =

usuarios.filter(u=>

(u.status || "")
.toLowerCase()
==="ativo"

).length;



if(admins)

admins.innerText =

usuarios.filter(u=>

(u.perfil || "")
.toLowerCase()
==="administrador"

).length;



if(operadores)

operadores.innerText =

usuarios.filter(u=>

(u.perfil || "")
.toLowerCase()
==="operador"

).length;



}






// =======================================
// TABELA
// =======================================

function mostrarUsuarios(lista){


if(!tabelaUsuarios)
return;



tabelaUsuarios.innerHTML="";



lista.forEach(u=>{


tabelaUsuarios.innerHTML += `

<tr>

<td>${u.nome || "-"}</td>

<td>${u.email || "-"}</td>

<td>${u.perfil || "-"}</td>

<td>${u.status || "-"}</td>


<td>

<button onclick="editarUsuario('${u.id}')">
✏️
</button>


<button onclick="excluirUsuario('${u.id}')">
🗑️
</button>


</td>

</tr>

`;

});


}






// =======================================
// MODAL
// =======================================

btnNovoUsuario?.addEventListener(
"click",
()=>{


usuarioEditando=null;


formUsuario.reset();



document.getElementById(
"tituloModal"
).innerText="👤 Novo Usuário";



modalUsuario.style.display="flex";


});


function fechar(){

modalUsuario.style.display="none";

}



btnCancelar?.addEventListener(
"click",
fechar
);


fecharModal?.addEventListener(
"click",
fechar
);






// =======================================
// SALVAR
// =======================================

formUsuario?.addEventListener(
"submit",

async(e)=>{


e.preventDefault();



try{


const nome =
nomeUsuario.value.trim();


const email =
emailUsuario.value.trim();


const senha =
senhaUsuario.value;


const perfil =
perfilUsuario.value;


const status =
statusUsuario.value;





if(!usuarioEditando){


const credencial =

await createUserWithEmailAndPassword(

auth,

email,

senha

);



const uid =
credencial.user.uid;



await setDoc(

doc(
db,
"usuarios",
uid
),

{


nome,

email,

perfil:
perfil.toLowerCase(),


status:
status.toLowerCase(),


permissoes:

definirPermissoes(perfil),


criadoEm:
serverTimestamp()


}

);



mostrarToast(
"Usuário criado!"
);



}


else{


await updateDoc(

doc(
db,
"usuarios",
usuarioEditando
),

{


nome,


perfil:
perfil.toLowerCase(),


status:
status.toLowerCase(),


permissoes:

definirPermissoes(perfil),


atualizadoEm:
serverTimestamp()


}

);


mostrarToast(
"Usuário atualizado!"
);


}



fechar();


formUsuario.reset();


carregarUsuarios();



}

catch(error){


console.error(error);


mostrarToast(
"Erro ao salvar usuário",
"erro"
);


}



});







// =======================================
// EDITAR
// =======================================

window.editarUsuario=function(id){


const u =
usuarios.find(
x=>x.id===id
);


if(!u)
return;



usuarioEditando=id;



document.getElementById(
"tituloModal"
).innerText="✏️ Editar Usuário";



nomeUsuario.value =
u.nome || "";


emailUsuario.value =
u.email || "";


perfilUsuario.value =
u.perfil || "operador";


statusUsuario.value =
u.status || "ativo";


senhaUsuario.value="";


modalUsuario.style.display="flex";


};







// =======================================
// EXCLUIR
// =======================================

window.excluirUsuario=async function(id){


if(!confirm(
"Deseja excluir este usuário?"
))
return;



await deleteDoc(

doc(
db,
"usuarios",
id
)

);



mostrarToast(
"Usuário removido!"
);



carregarUsuarios();


};






// =======================================
// PESQUISA
// =======================================

document.getElementById(
"pesquisaUsuario"
)
?.addEventListener(
"input",

(e)=>{


const texto =
e.target.value.toLowerCase();



mostrarUsuarios(

usuarios.filter(u=>

(u.nome||"")
.toLowerCase()
.includes(texto)


||

(u.email||"")
.toLowerCase()
.includes(texto)

)

);


});







// =======================================
// INICIO
// =======================================

carregarUsuarios();
