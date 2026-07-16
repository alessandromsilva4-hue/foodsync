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



async function buscarEtiqueta(){

console.log("Código recebido pelo QR:", codigo);

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


console.log("Consultando Firestore...");


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



resultado.innerHTML = `

<h2>${dados.produto}</h2>

<p>
<b>Temperatura:</b>
${dados.temperatura || "AMBIENTE"}
</p>

<p>
<b>Manipulação:</b>
${dados.dataProducao.toDate().toLocaleDateString("pt-BR")}
</p>

<p>
<b>Validade:</b>
${dados.validade.toDate().toLocaleDateString("pt-BR")}
</p>

<p>
<b>Lote:</b>
${dados.lote || "-"}
</p>

<p>
<b>Quantidade:</b>
${dados.quantidade} ${dados.unidade}
</p>

<p>
<b>Responsável:</b>
${dados.usuario}
</p>

<p>
<b>Observação:</b>
${dados.observacao || "-"}
</p>

`;


}catch(erro){

console.error(
"Erro dentro da busca:",
erro
);

resultado.innerHTML =
"Erro ao consultar etiqueta.";

}

}


buscarEtiqueta()
.catch((erro) => {

    console.error(
        "Erro ao iniciar consulta:",
        erro
    );

});