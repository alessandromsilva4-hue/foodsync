// =======================================
// FOODSYNC - SISTEMA PRINCIPAL
// =======================================

import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";



// =======================================
// USU?RIO LOGADO
// =======================================

onAuthStateChanged(auth,(user)=>{


    const nomeUsuario =
    document.getElementById("usuarioNome");



    if(user){


        console.log(
            "Usu?rio conectado:",
            user.email
        );



        if(nomeUsuario){


         const usuarioSalvo =
JSON.parse(
    localStorage.getItem(
        "usuarioFoodSync"
    )
);


if(usuarioSalvo?.nome){


    nomeUsuario.innerText =
    "Bem-vindo, " + usuarioSalvo.nome + " ??";


}
else{


    nomeUsuario.innerText =
    "Bem-vindo, usu?rio";


}


        }



    }


});




// =======================================
// DATA ATUAL
// =======================================

function dataAtual(){


    return new Date()
    .toLocaleDateString(
        "pt-BR"
    );


}


window.dataAtual =
dataAtual;





// =======================================
// MENSAGEM GLOBAL
// =======================================

window.mostrarMensagem = function(
    mensagem,
    tipo="sucesso"
){



    const alerta =
    document.createElement("div");



    alerta.className =
    "alerta "+tipo;



    alerta.innerHTML =
    mensagem;



    document.body.appendChild(alerta);



    setTimeout(()=>{


        alerta.remove();


    },3000);



};






// =======================================
// CONFIRMA??O
// =======================================


window.confirmarAcao=function(
    mensagem
){


    return confirm(mensagem);


};






// =======================================
// LOG SISTEMA
// =======================================

console.log(
    "FOODSYNC APP.JS CARREGADO"
);