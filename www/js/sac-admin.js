// =======================================
// FOODSYNC - SAC ADMIN
// =======================================

console.log("SAC-ADMIN.JS V2 CARREGADO");


import { db } from "./firebase.js";


import {
collection,
getDocs,
doc,
getDoc,
updateDoc,
addDoc,
serverTimestamp,
query,
orderBy
}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



const tabela =
document.getElementById("listaSACAdmin");


let chamadoAtual = null;



// =======================================
// CARREGAR CHAMADOS
// =======================================

async function carregarSAC(){


if(!tabela)
return;



const consulta = query(

collection(db,"sac"),

orderBy(
"criadoEm",
"desc"
)

);



const snapshot =
await getDocs(consulta);



tabela.innerHTML="";



snapshot.forEach(item=>{


const chamado =
item.data();



let data="-";


if(chamado.criadoEm?.seconds){

data =
new Date(
chamado.criadoEm.seconds * 1000
)
.toLocaleString("pt-BR");

}



tabela.innerHTML += `


<tr>

<td>${data}</td>

<td>${chamado.tipo || "-"}</td>

<td>${chamado.assunto || "-"}</td>

<td>${chamado.prioridade || "-"}</td>

<td>${chamado.status || "-"}</td>


<td>

<button 
class="btn-primary"
onclick="window.verChamado('${item.id}')">

👁️ Ver

</button>


</td>


</tr>


`;


});


}



// =======================================
// ABRIR CHAMADO
// =======================================


window.verChamado = async function(id){


chamadoAtual = id;


const referencia =
doc(db,"sac",id);



const documento =
await getDoc(referencia);



const chamado =
documento.data();



document.getElementById("dadosChamado").innerHTML = `


<p>
<strong>Tipo:</strong>
${chamado.tipo}
</p>


<p>
<strong>Assunto:</strong>
${chamado.assunto}
</p>


<p>
<strong>Descrição:</strong>
${chamado.descricao}
</p>


<p>
<strong>Prioridade:</strong>
${chamado.prioridade}
</p>


`;



document.getElementById("respostaSAC").value =
chamado.resposta || "";



document.getElementById("statusSAC").value =
chamado.status || "Aberto";



document.getElementById("modalSAC").style.display="flex";


};





// =======================================
// FECHAR MODAL
// =======================================


window.fecharModalSAC = function(){


document.getElementById("modalSAC").style.display="none";


};





// =======================================
// SALVAR ATENDIMENTO
// =======================================


window.salvarAtendimentoSAC = async function(){


if(!chamadoAtual)
return;



const resposta =
document.getElementById("respostaSAC").value;



const status =
document.getElementById("statusSAC").value;



await updateDoc(

doc(db,"sac",chamadoAtual),

{


resposta,

status,


atualizadoEm:
serverTimestamp(),


atendidoPor:
"admin"


}

);



// auditoria

await addDoc(

collection(db,"auditoria"),

{


usuario:"admin",

modulo:"SAC",

acao:"Atendimento SAC",

detalhes:chamadoAtual,

status:"Sucesso",

data:
serverTimestamp()


}

);



alert("Atendimento salvo com sucesso.");



fecharModalSAC();


carregarSAC();


};





carregarSAC();