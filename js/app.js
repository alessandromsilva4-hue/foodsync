
// =======================================
// FOODSYNCH - SISTEMA PRINCIPAL
// =======================================


// Importar Firebase

import { auth } from "./firebase.js";


import {

    onAuthStateChanged

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";




// =======================================
// VERIFICAR USUÁRIO LOGADO
// =======================================


onAuthStateChanged(

auth,

(user)=>{


    const nomeUsuario =
    document.getElementById("usuarioNome");



    if(user){



        if(nomeUsuario){


            nomeUsuario.innerText =
            user.email;



        }



    }


});






// =======================================
// DATA ATUAL DO SISTEMA
// =======================================


function dataAtual(){


    const hoje =
    new Date();



    return hoje.toLocaleDateString(
        "pt-BR"
    );


}



window.dataAtual = dataAtual;






// =======================================
// ALERTAS PADRÃO
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
// CONFIRMAR AÇÃO
// =======================================


window.confirmarAcao = function(
    mensagem
){


    return confirm(mensagem);


};

