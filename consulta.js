import { db } from "./js/firebase.js";


import {

collection,
query,
where,
getDocs

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



const resultado = 
document.getElementById("resultadoEtiqueta");



const parametros = 
new URLSearchParams(
window.location.search
);



const codigo =
parametros.get("codigo");




// ===============================
// STATUS DA VALIDADE
// ===============================

function verificarValidade(dataValidade){


const hoje = new Date();

hoje.setHours(0,0,0,0);



const validade = new Date(dataValidade);

validade.setHours(0,0,0,0);



const diferenca = 
(validade - hoje) /
(1000 * 60 * 60 * 24);



if(diferenca < 0){

return {

texto:"🔴 PRODUTO VENCIDO",

classe:"vencido"

};

}



if(diferenca === 0){

return {

texto:"🟡 VENCE HOJE",

classe:"alerta"

};

}



return {

texto:`🟢 DENTRO DA VALIDADE - ${diferenca} dia(s) restante(s)`,

classe:"valido"

};


}




async function buscarEtiqueta(){


console.log(
"Código recebido pelo QR:",
codigo
);



try {



if(!codigo){


resultado.innerHTML =
"Etiqueta não encontrada";


return;

}




const consulta = query(


collection(db,"etiquetas"),


where(
"codigo",
"==",
codigo
)


);



console.log(
"Consultando Firestore..."
);



const snapshot =
await getDocs(consulta);



console.log(
"Documentos encontrados:",
snapshot.size
);




if(snapshot.empty){


resultado.innerHTML =
"Etiqueta inválida";


return;


}




const dados =
snapshot.docs[0].data();



console.log(
"Dados encontrados:",
dados
);



const dataValidade =
dados.validade.toDate();



const status =
verificarValidade(dataValidade);





resultado.innerHTML = `



<div class="status ${status.classe}">

${status.texto}

</div>




<h2>Controle de Validade</h2>



<div class="campo">

<strong>Produto:</strong>

${dados.produto}

</div>




<div class="campo">

<strong>Temperatura:</strong>

${dados.temperatura || "AMBIENTE"}

</div>




<div class="campo">

<strong>Manipulação:</strong>

${dados.dataProducao
.toDate()
.toLocaleDateString("pt-BR")}

</div>




<div class="campo">

<strong>Validade:</strong>

${dataValidade
.toLocaleDateString("pt-BR")}

</div>




<div class="campo">

<strong>Lote:</strong>

${dados.lote || "-"}

</div>




<div class="campo">

<strong>Quantidade:</strong>

${dados.quantidade || "-"} 
${dados.unidade || ""}

</div>




<div class="campo">

<strong>Responsável:</strong>

${dados.usuario || "-"}

</div>




<div class="campo">

<strong>Observação:</strong>

${dados.observacao || "-"}

</div>


<div id="qrcodeConsulta"></div>


<button 
class="btn-imprimir"
onclick="window.print()">

🖨️ Imprimir Etiqueta

</button>



`;


// ===============================
// GERAR QR CODE NA CONSULTA
// ===============================

const qrDiv =
document.getElementById("qrcodeConsulta");


if(qrDiv){

    qrDiv.innerHTML = "";


    new QRCode(qrDiv, {

        text: window.location.href,

        width:120,

        height:120,

        correctLevel:QRCode.CorrectLevel.H

    });

}

}catch(erro){


console.error(
"Erro dentro da busca:",
erro
);



resultado.innerHTML =

`
<div class="status vencido">

Erro ao consultar etiqueta

</div>
`;



}


}



buscarEtiqueta();