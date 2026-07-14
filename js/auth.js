
// =======================================
// FOODSYNCH - AUTENTICAÇÃO
// =======================================


import { auth } from "./firebase.js";


import {

    signInWithEmailAndPassword,

    onAuthStateChanged,

    signOut

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";




// =======================================
// LOGIN
// =======================================


const loginForm = document.getElementById("loginForm");



if(loginForm){


    loginForm.addEventListener(
    "submit",
    async (e)=>{


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





        }catch(error){



            console.error(error);



            mensagem.style.color="#d9534f";



            mensagem.innerHTML =
            "E-mail ou senha inválidos.";



        }



    });


}







// =======================================
// VERIFICAR LOGIN
// =======================================


onAuthStateChanged(

auth,

(user)=>{


    const pagina =
    window.location.pathname;



    if(user){



        if(
            pagina.endsWith("index.html")
            ||
            pagina.endsWith("/")
        ){


            window.location.href =
            "dashboard.html";


        }



    }


});






// =======================================
// LOGOUT
// =======================================


window.logout = async function(){


    try{


        await signOut(auth);



        window.location.href =
        "index.html";



    }catch(error){


        console.error(
            "Erro ao sair:",
            error
        );


    }


};