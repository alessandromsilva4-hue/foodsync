// =======================================
// FOODSYNC - AUTENTICAÇÃO E PERMISSÕES
// =======================================


import "./design-system.js";
import { auth, db } from "./firebase.js";


import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    deleteUser
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    setDoc
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

if(perfilLogin?.status?.toLowerCase() === "pendente"){

    await signOut(auth);

    mensagem.style.color="#b45309";
    mensagem.textContent =
    "Cadastro recebido. Aguarde a liberação da equipe.";

    return;

}


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
// SENHA: MOSTRAR, CADASTRAR E REDEFINIR
// =======================================

document.querySelectorAll("[data-password-toggle]").forEach((botao)=>{

    botao.addEventListener("click", ()=>{

        const campo = document.getElementById(botao.dataset.passwordToggle);

        if(!campo){
            return;
        }

        const mostrar = campo.type === "password";

        campo.type = mostrar ? "text" : "password";
        botao.setAttribute("aria-pressed", String(mostrar));
        botao.setAttribute(
            "aria-label",
            mostrar ? "Ocultar senha" : "Mostrar senha"
        );
    });

});


const cadastroForm = document.getElementById("cadastroForm");
const mostrarCadastro = document.getElementById("mostrarCadastro");
const voltarLogin = document.getElementById("voltarLogin");
const alterarSenha = document.getElementById("alterarSenha");

function exibirCadastro(exibir){

    loginForm.hidden = exibir;
    cadastroForm.hidden = !exibir;

}

mostrarCadastro?.addEventListener("click", ()=> exibirCadastro(true));
voltarLogin?.addEventListener("click", ()=> exibirCadastro(false));

alterarSenha?.addEventListener("click", async()=>{

    const email = document.getElementById("email").value.trim();
    const mensagem = document.getElementById("mensagemLogin");

    if(!email){
        mensagem.style.color="#dc2626";
        mensagem.textContent = "Informe seu e-mail para alterar a senha.";
        document.getElementById("email").focus();
        return;
    }

    try{

        await sendPasswordResetEmail(auth, email);
        mensagem.style.color="#16a34a";
        mensagem.textContent =
        "Enviamos um link para alterar sua senha.";

    }
    catch(error){

        console.error("Erro ao solicitar alteração de senha:", error);
        mensagem.style.color="#dc2626";
        mensagem.textContent =
        "Não foi possível enviar o link. Confira o e-mail informado.";

    }

});

cadastroForm?.addEventListener("submit", async(evento)=>{

    evento.preventDefault();

    const nome = document.getElementById("nomeCadastro").value.trim();
    const email = document.getElementById("emailCadastro").value.trim();
    const senha = document.getElementById("senhaCadastro").value;
    const confirmarSenha =
    document.getElementById("confirmarSenhaCadastro").value;
    const mensagem = document.getElementById("mensagemCadastro");

    if(senha !== confirmarSenha){
        mensagem.style.color="#dc2626";
        mensagem.textContent = "As senhas precisam ser iguais.";
        return;
    }

    let credencial;
    let perfilCriado = false;

    try{

        credencial = await createUserWithEmailAndPassword(
            auth,
            email,
            senha
        );

        await setDoc(doc(db, "usuarios", credencial.user.uid), {
            nome,
            email,
            perfil: "colaborador",
            status: "pendente",
            permissoes: {},
            criadoEm: serverTimestamp()
        });

        perfilCriado = true;

        await signOut(auth);

        mensagem.style.color="#16a34a";
        mensagem.textContent =
        "Cadastro solicitado. Aguarde a liberação da equipe.";
        cadastroForm.reset();

    }
    catch(error){

        console.error("Erro no cadastro:", error);

        if(credencial?.user && !perfilCriado){
            await deleteUser(credencial.user).catch((erroLimpeza)=>{
                console.error("Erro ao cancelar cadastro incompleto:", erroLimpeza);
            });
        }

        mensagem.style.color="#dc2626";

        mensagem.textContent = error.code === "auth/email-already-in-use"
            ? "Este e-mail já possui cadastro."
            : "Não foi possível concluir o cadastro. Tente novamente.";

    }

});


// =======================================
// CARREGAR PERFIL FIRESTORE
// =======================================

async function carregarPerfil(user){

try{


const referencia =
doc(
    db,
    "usuarios",
    user.uid
);


const resultado =
await getDoc(referencia);



if(!resultado.exists()){


console.warn(
"Perfil não encontrado"
);


return null;


}



const dados =
resultado.data();



const perfil = {

id:
resultado.id,

nome:
dados.nome || "",

email:
dados.email || user.email,

perfil:
(dados.perfil || "").trim(),

status:
dados.status,

idEmpresa:
dados.idEmpresa || "",

permissoes:
dados.permissoes || {}

};



localStorage.setItem(

"usuarioFoodSync",

JSON.stringify(perfil)

);



console.log(
"PERFIL CARREGADO:",
perfil
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
// ATUALIZAR USUÁRIO NA SIDEBAR
// =======================================

function atualizarUsuarioTela(usuario){

    const nome =
    document.getElementById("nomeUsuarioLogado");


    const perfil =
    document.getElementById("perfilUsuarioLogado");


    if(nome){
        nome.innerText =
        usuario.nome || "Usuário";
    }


    if(perfil){

        let textoPerfil =
        usuario.perfil || "";

        textoPerfil =
        textoPerfil.charAt(0).toUpperCase()
        +
        textoPerfil.slice(1);


        perfil.innerText =
        textoPerfil;

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
"sac",

"sac-admin.html":
"sacAdmin"


};








// =======================================
// VERIFICAÇÃO DE LOGIN
// =======================================


onAuthStateChanged(

auth,

async(user)=>{

if(user){

console.log("UID ATUAL:", user.uid);
console.log("EMAIL ATUAL:", user.email);

}

const pagina =
window.location.pathname
.split("/")
.pop();




if(user){



const usuario =
await carregarPerfil(user);


if(usuario){


    atualizarUsuarioTela(usuario);



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

(usuario.perfil || "").toLowerCase()
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
"sac",

"sac-admin.html":
"sacAdmin"

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
