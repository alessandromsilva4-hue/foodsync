// =======================================
// FOODSYNC - SAC
// =======================================

console.log("SAC.JS VERSÃƒO FINAL");


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
// ASSISTENTE DO SAC
// =======================================

const formAssistente = document.getElementById("formAssistenteSac");
const campoMensagemAssistente = document.getElementById("mensagemAssistente");
const mensagensAssistente = document.getElementById("mensagensAssistente");

function normalizarTexto(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function respostaAssistente(pergunta) {
    const texto = normalizarTexto(pergunta);

    if (texto.includes("etiqueta") || texto.includes("imprimir")) {
        return "Para gerar uma etiqueta, abra Etiquetas, selecione o produto, informe a data de produÃ§Ã£o e a quantidade. Depois, clique em Gerar Etiqueta e em Imprimir. A validade Ã© calculada conforme o cadastro do produto.";
    }
    if (texto.includes("producao") || texto.includes("produzir")) {
        return "Abra ProduÃ§Ã£o, escolha o produto e preencha quantidade, data/hora e responsÃ¡vel. Confira a validade sugerida e finalize o registro. Em seguida, vocÃª pode emitir as etiquetas da produÃ§Ã£o.";
    }
    if (texto.includes("produto") || texto.includes("cadastrar")) {
        return "Em Produtos, clique para cadastrar um item e informe nome, categoria, unidade, temperatura de conservaÃ§Ã£o e validade em dias. Esses dados sÃ£o usados no controle e nas etiquetas.";
    }
    if (texto.includes("estoque") || texto.includes("entrada") || texto.includes("saida")) {
        return "No mÃ³dulo Estoque, registre entradas e saÃ­das do item. Mantenha a quantidade atualizada para que o sistema destaque itens com estoque baixo.";
    }
    if (texto.includes("relatorio") || texto.includes("auditoria")) {
        return "Use RelatÃ³rios para acompanhar os dados consolidados e Auditoria para consultar as aÃ§Ãµes registradas no sistema.";
    }
    if (texto.includes("senha") || texto.includes("login") || texto.includes("acesso")) {
        return "Para questÃµes de acesso, confirme o e-mail e tente redefinir sua senha na tela de login. Se o problema continuar, abra um chamado para a equipe verificar seu usuÃ¡rio.";
    }
    return "Ainda nÃ£o encontrei uma orientaÃ§Ã£o especÃ­fica. Posso ajudar com produtos, produÃ§Ã£o, etiquetas, estoque, relatÃ³rios ou acesso. Se preferir, clique em â€œAbrir chamadoâ€ abaixo e eu preparo a solicitaÃ§Ã£o.";
}

function adicionarMensagemAssistente(texto, tipo) {
    if (!mensagensAssistente) return;
    const mensagem = document.createElement("div");
    mensagem.className = `assistant-sac__message assistant-sac__message--${tipo}`;
    mensagem.textContent = texto;
    mensagensAssistente.appendChild(mensagem);
    mensagensAssistente.scrollTop = mensagensAssistente.scrollHeight;
}

function abrirChamadoAssistente(pergunta) {
    const assunto = document.getElementById("assunto");
    const descricao = document.getElementById("descricao");
    if (assunto && !assunto.value) assunto.value = "SolicitaÃ§Ã£o de suporte";
    if (descricao && !descricao.value) descricao.value = pergunta;
    document.getElementById("formSac")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function enviarMensagemAssistente(pergunta) {
    const mensagem = pergunta.trim();
    if (!mensagem) return;
    adicionarMensagemAssistente(mensagem, "user");
    adicionarMensagemAssistente(respostaAssistente(mensagem), "bot");

    if (!normalizarTexto(mensagem).match(/etiqueta|imprimir|producao|produzir|produto|cadastrar|estoque|entrada|saida|relatorio|auditoria|senha|login|acesso/)) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "assistant-sac__open-ticket";
        botao.textContent = "Abrir chamado";
        botao.addEventListener("click", () => abrirChamadoAssistente(mensagem));
        mensagensAssistente.appendChild(botao);
    }
}

if (formAssistente) {
    formAssistente.addEventListener("submit", (event) => {
        event.preventDefault();
        enviarMensagemAssistente(campoMensagemAssistente.value);
        campoMensagemAssistente.value = "";
        campoMensagemAssistente.focus();
    });

    document.querySelectorAll("[data-pergunta]").forEach((botao) => {
        botao.addEventListener("click", () => enviarMensagemAssistente(botao.dataset.pergunta));
    });
}




// =======================================
// CARREGAR CHAMADOS DO USUÃRIO
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
// LOGIN DO USUÃRIO
// =======================================


onAuthStateChanged(auth,(user)=>{


if(user){


usuarioAtual = user;


console.log(

"UsuÃ¡rio SAC:",

usuarioAtual.email

);



carregarChamados();


}


else{


console.log(
"Nenhum usuÃ¡rio logado"
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

"UsuÃ¡rio nÃ£o autenticado.",

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

idEmpresa:

JSON.parse(localStorage.getItem("usuarioFoodSync"))?.idEmpresa || "",



usuarioNome:

usuarioAtual.displayName || "UsuÃ¡rio",



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


