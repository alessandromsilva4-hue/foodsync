// =======================================
// FOODSYNC - AUTENTICAÇÃO E PERMISSÕES
// =======================================


import { auth, db } from "./firebase.js";


import {

signInWithEmailAndPassword,

onAuthStateChanged,

signOut

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {

collection,
query,
where,
getDocs

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";




// =======================================
// LOGIN
// =======================================


const loginForm =
document.getElementById("loginForm");



if(loginForm){


loginForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();



const email =
document.getElementById("email").value;


const senha =
document.getElementById("senha").value;


const mensagem =
document.getElementById("mensagemLogin");



try{


await signInWithEmailAndPassword(

auth,

email,

senha

);



mensagem.style.color="#28a745";


mensagem.innerHTML =
"Login realizado com sucesso...";



setTimeout(()=>{


window.location.href =
"dashboard.html";


},1000);



}

catch(error){


console.error(error);



mensagem.style.color="#d9534f";


mensagem.innerHTML =
"Usuário ou senha inválidos";


}



});


}








// =======================================
// BUSCAR PERFIL DO USUÁRIO
// =======================================


async function carregarPerfil(user){


try{


const consulta = query(

collection(db,"usuarios"),

where(

"email",

"==",

user.email

)

);



const resultado =
await getDocs(consulta);



if(resultado.empty){



console.warn(
"Usuário sem perfil cadastrado"
);



return;



}



resultado.forEach(doc=>{


const dados =
doc.data();



localStorage.setItem(

"usuarioFoodSync",

JSON.stringify({

id:doc.id,

nome:dados.nome,

email:dados.email,

perfil:dados.perfil,

status:dados.status,

permissoes:dados.permissoes


})

);



});



}

catch(error){


console.error(

"Erro carregar perfil:",

error

);


}



}









// =======================================
// VERIFICAR LOGIN E PERMISSÕES
// =======================================


onAuthStateChanged(

auth,

async(user)=>{



const pagina =
window.location.pathname.split("/").pop();



if(user){



await carregarPerfil(user);





const paginasProtegidas = {


"produtos.html":"produtos",

"producao.html":"producao",

"etiquetas.html":"etiquetas",

"estoque.html":"estoque",

"relatorios.html":"relatorios",

"auditoria.html":"auditoria",

"usuario.html":"usuarios",

"configuracoes.html":"configuracoes",

"sac.html":"sac"


};





const permissaoNecessaria =

paginasProtegidas[pagina];





const usuarioSalvo =

JSON.parse(

localStorage.getItem(

"usuarioFoodSync"

)

);





if(

permissaoNecessaria &&

usuarioSalvo &&

usuarioSalvo.permissoes

){



if(

usuarioSalvo.permissoes[permissaoNecessaria]

!== true

){


alert(

"Você não possui permissão para acessar esta página."

);



window.location.href =
"dashboard.html";


return;


}



}




// esconder menus


controlarMenu();



if(

pagina === "index.html"

||

pagina === ""

){


window.location.href =
"dashboard.html";


}




}

else{



if(

pagina !== "index.html"

&&

pagina !== ""

){


window.location.href =
"index.html";


}



}



});










// =======================================
// CONTROLAR MENU
// =======================================


function controlarMenu(){


const usuario =

JSON.parse(

localStorage.getItem(

"usuarioFoodSync"

)

);



if(!usuario || !usuario.permissoes)
return;



const mapa = {


"produtos.html":"produtos",

"producao.html":"producao",

"etiquetas.html":"etiquetas",

"estoque.html":"estoque",

"relatorios.html":"relatorios",

"auditoria.html":"auditoria",

"usuario.html":"usuarios",

"configuracoes.html":"configuracoes",

"sac.html":"sac"


};



document.querySelectorAll(

".menu a"

)

.forEach(link=>{


const destino =

link.getAttribute("href");



const permissao =

mapa[destino];



if(

permissao &&

usuario.permissoes[permissao] !== true

){


link.style.display="none";


}



});



}









// =======================================
// LOGOUT
// =======================================


window.logout = async function(){


try{


await signOut(auth);



localStorage.removeItem(

"usuarioFoodSync"

);



window.location.href =
"index.html";



}

catch(error){


console.error(

"Erro ao sair:",

error

);


}



};