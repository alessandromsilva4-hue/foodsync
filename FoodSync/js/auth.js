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
    getDocs,
    addDoc,
    serverTimestamp
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



console.log("AUTH.JS CARREGADO");








// =======================================
// REGISTRAR AUDITORIA
// =======================================


window.registrarAuditoria = async function(
    modulo,
    acao,
    detalhes=""
){


    try{


        const usuario =
        JSON.parse(
            localStorage.getItem("usuarioFoodSync")
        );



        await addDoc(
            collection(db,"auditoria"),
            {


                usuario:
                usuario?.nome || "Sistema",


                email:
                usuario?.email || "",


                modulo:
                modulo,


                acao:
                acao,


                detalhes:
                detalhes,


                status:
                "Sucesso",


                data:
                serverTimestamp()


            }
        );



        console.log(
            "Auditoria registrada:",
            acao
        );



    }
    catch(error){


        console.error(
            "Erro auditoria:",
            error
        );


    }


};






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


const resultadoLogin =
await signInWithEmailAndPassword(
    auth,
    email,
    senha
);


// busca usuário no Firestore para pegar o nome

const perfilLogin = await carregarPerfil(
    auth.currentUser
);


// grava auditoria do login

await addDoc(
    collection(db,"auditoria"),
    {

        usuario:
        perfilLogin?.nome || email,


        email:
        email,


        modulo:
        "Sistema",


        acao:
        "LOGIN",


        detalhes:
        "Usuário realizou login no sistema",


        status:
        "Sucesso",


        data:
        serverTimestamp()

    }
);


mensagem.style.color="#16a34a";


mensagem.innerHTML =
"Login realizado com sucesso!";



setTimeout(()=>{


window.location.href =
"dashboard.html";


},1000);



}
catch(error){


console.error(
"Erro login:",
error
);



mensagem.style.color="#dc2626";


mensagem.innerHTML =
"Usuário ou senha inválidos";



}


});


}








// =======================================
// CARREGAR PERFIL FIRESTORE
// =======================================


async function carregarPerfil(user){


try{


const consulta =
query(

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
"Perfil não encontrado"
);


return null;


}



let perfil;



resultado.forEach(doc=>{


const dados =
doc.data();



perfil = {


id:
doc.id,


nome:
dados.nome || "",


email:
dados.email,


perfil:
(dados.perfil || "").trim(),


status:
dados.status,


permissoes:
dados.permissoes || {}



};



});




localStorage.setItem(

"usuarioFoodSync",

JSON.stringify(perfil)

);



return perfil;



}
catch(error){


console.error(
"Erro perfil:",
error
);


return null;


}



}









// =======================================
// PÁGINAS PROTEGIDAS
// =======================================


const paginasProtegidas = {


"produtos.html":
"produtos",


"producao.html":
"producao",


"etiquetas.html":
"etiquetas",


"estoque.html":
"estoque",


"relatorios.html":
"relatorios",


"auditoria.html":
"auditoria",


"usuario.html":
"usuarios",


"configuracoes.html":
"configuracoes",


"sac.html":
"sac"


};








// =======================================
// VERIFICAÇÃO DE LOGIN
// =======================================


onAuthStateChanged(

auth,

async(user)=>{



const pagina =
window.location.pathname
.split("/")
.pop();




if(user){



const usuario =
await carregarPerfil(user);



if(usuario){


if(
!sessionStorage.getItem(
"loginAuditoriaRegistrado"
)
){


sessionStorage.setItem(
"loginAuditoriaRegistrado",
"true"
);


await registrarAuditoria(

"Sistema",

"LOGIN",

"Usuário realizou login no sistema"

);


}









const permissao =
paginasProtegidas[pagina];




if(permissao){



// administrador libera tudo


if(

usuario.perfil.toLowerCase()
!==
"administrador"

){



if(

usuario.permissoes[permissao]
!==
true

){



alert(
"Sem permissão para acessar esta página."
);



window.location.href =
"dashboard.html";


return;


}



}



}




controlarMenu(usuario);



}




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



}

);









// =======================================
// CONTROLAR MENU
// =======================================


function controlarMenu(usuario){



const mapa = {


"dashboard.html":
"dashboard",


"produtos.html":
"produtos",


"producao.html":
"producao",


"etiquetas.html":
"etiquetas",


"estoque.html":
"estoque",


"relatorios.html":
"relatorios",


"auditoria.html":
"auditoria",


"usuario.html":
"usuarios",


"configuracoes.html":
"configuracoes",


"sac.html":
"sac"



};




document
.querySelectorAll(".menu a")
.forEach(link=>{


const pagina =
link.getAttribute("href");



const permissao =
mapa[pagina];



if(!permissao)
return;




// administrador vê tudo


if(

usuario.perfil.toLowerCase()
===
"administrador"

){


link.style.display="block";


return;


}




if(

usuario.permissoes
&&

usuario.permissoes[permissao]
===true

){


link.style.display="block";


}

else{


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



console.log(
"Logout realizado"
);



window.location.href =
"index.html";



}
catch(error){


console.error(
"Erro logout:",
error
);



}



};