// =======================================
// FOODSYNC / LOTRIX - USUÁRIOS V5
// =======================================

console.log("USUARIOS.JS V5 CARREGADO");


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


const btnFecharModal =
document.getElementById("btnFecharModal");


const formUsuario =
document.getElementById("formUsuario");



// CAMPOS

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
// PERMISSÕES DOS CHECKBOX
// =======================================

function pegarPermissoes(){


return {

dashboard:
document.getElementById("permDashboard")?.checked || false,


produtos:
document.getElementById("permProdutos")?.checked || false,


producao:
document.getElementById("permProducao")?.checked || false,


etiquetas:
document.getElementById("permEtiquetas")?.checked || false,


estoque:
document.getElementById("permEstoque")?.checked || false,


relatorios:
document.getElementById("permRelatorios")?.checked || false,


usuarios:
document.getElementById("permUsuarios")?.checked || false,


configuracoes:
document.getElementById("permConfiguracoes")?.checked || false

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


console.error(error);


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
total.innerText = usuarios.length;



if(ativos)

ativos.innerText =

usuarios.filter(u=>

(u.status || "")
.toLowerCase()==="ativo"

).length;




if(admins)

admins.innerText =

usuarios.filter(u=>

(u.perfil || "")
.toLowerCase()==="administrador"

).length;




if(operadores)

operadores.innerText =

usuarios.filter(u=>

(u.perfil || "")
.toLowerCase()==="operador"

).length;


}






// =======================================
// MOSTRAR TABELA
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

<td>

<span class="status ${u.status}">

${u.status || "-"}

</span>

</td>


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
// ABRIR MODAL NOVO
// =======================================


btnNovoUsuario?.addEventListener(
"click",
()=>{


usuarioEditando=null;


formUsuario.reset();


emailUsuario.disabled=false;


senhaUsuario.required=true;



document.getElementById(
"tituloModal"
).innerHTML =
"👤 Novo Usuário";



modalUsuario.style.display="flex";


}

);





function fecharModal(){


modalUsuario.style.display="none";


}





btnCancelar?.addEventListener(
"click",
fecharModal
);



btnFecharModal?.addEventListener(
"click",
fecharModal
);
// =======================================
// MARCAR PERMISSÕES AO EDITAR
// =======================================

function carregarPermissoes(permissoes = {}){


document.getElementById("permDashboard").checked =
permissoes.dashboard || false;


document.getElementById("permProdutos").checked =
permissoes.produtos || false;


document.getElementById("permProducao").checked =
permissoes.producao || false;


document.getElementById("permEtiquetas").checked =
permissoes.etiquetas || false;


document.getElementById("permEstoque").checked =
permissoes.estoque || false;


document.getElementById("permRelatorios").checked =
permissoes.relatorios || false;


document.getElementById("permUsuarios").checked =
permissoes.usuarios || false;


document.getElementById("permConfiguracoes").checked =
permissoes.configuracoes || false;


}





// =======================================
// SALVAR USUÁRIO
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
perfilUsuario.value.toLowerCase();


const status =
statusUsuario.value.toLowerCase();



const permissoes =
pegarPermissoes();





// NOVO USUÁRIO

if(!usuarioEditando){


if(!senha){

mostrarToast(
"Informe uma senha",
"erro"
);

return;

}



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


perfil,


status,


permissoes,


criadoEm:
serverTimestamp()


}

);



mostrarToast(
"Usuário criado com sucesso!"
);


}




// EDITAR

else{


await updateDoc(

doc(
db,
"usuarios",
usuarioEditando
),

{


nome,


perfil,


status,


permissoes,


atualizadoEm:
serverTimestamp()


}

);



mostrarToast(
"Usuário atualizado!"
);


}




fecharModal();


formUsuario.reset();


usuarioEditando=null;


carregarUsuarios();



}


catch(error){


console.error(
"Erro:",
error
);



mostrarToast(
"Erro ao salvar usuário",
"erro"
);



}


}

);







// =======================================
// EDITAR USUÁRIO
// =======================================

window.editarUsuario=function(id){



const usuario =

usuarios.find(
u=>u.id===id
);



if(!usuario)
return;



usuarioEditando=id;



document.getElementById(
"tituloModal"
).innerHTML =
"✏️ Editar Usuário";



nomeUsuario.value =
usuario.nome || "";



emailUsuario.value =
usuario.email || "";



senhaUsuario.value="";


// senha não é alterada na edição

senhaUsuario.required=false;



emailUsuario.disabled=true;



perfilUsuario.value =
usuario.perfil || "operador";



statusUsuario.value =
usuario.status || "ativo";



carregarPermissoes(
usuario.permissoes
);



modalUsuario.style.display="flex";



};







// =======================================
// EXCLUIR USUÁRIO
// =======================================

window.excluirUsuario =
async function(id){



const confirmar =

confirm(
"Deseja realmente excluir este usuário?"
);



if(!confirmar)
return;



try{


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



}


catch(error){


console.error(error);


mostrarToast(
"Erro ao excluir usuário",
"erro"
);


}


};







// =======================================
// PESQUISA
// =======================================

document
.getElementById("pesquisaUsuario")
?.addEventListener(

"input",

(e)=>{


const texto =
e.target.value.toLowerCase();



const filtrados =

usuarios.filter(u=>{


return (

(u.nome || "")
.toLowerCase()
.includes(texto)


||


(u.email || "")
.toLowerCase()
.includes(texto)


||


(u.perfil || "")
.toLowerCase()
.includes(texto)


);


});



mostrarUsuarios(
filtrados
);


}

);








// =======================================
// INICIAR
// =======================================

carregarUsuarios();