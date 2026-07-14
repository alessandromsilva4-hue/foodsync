// =======================================
// FOODSYNCH - CONFIGURAÇÕES
// =======================================


import { db } from "./firebase.js";


import {

    doc,
    setDoc,
    getDoc,
    serverTimestamp

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";







const configForm =
document.getElementById("configForm");





// =======================================
// CARREGAR CONFIGURAÇÕES
// =======================================


async function carregarConfiguracoes(){



if(!configForm)
return;





const referencia =
doc(
db,
"configuracoes",
"sistema"
);




const dados =
await getDoc(
referencia
);





if(dados.exists()){



const c =
dados.data();





document.getElementById(
"nomeEmpresa"
).value =
c.nomeEmpresa || "FoodSync";





document.getElementById(
"tamanhoEtiqueta"
).value =
c.tamanhoEtiqueta || "80x50 mm";





document.getElementById(
"validadePadrao"
).value =
c.validadePadrao || 1;





document.getElementById(
"impressora"
).value =
c.impressora || "";



}



}








// =======================================
// SALVAR CONFIGURAÇÕES
// =======================================


if(configForm){



configForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();





const configuracao = {



nomeEmpresa:
document.getElementById(
"nomeEmpresa"
).value,



tamanhoEtiqueta:
document.getElementById(
"tamanhoEtiqueta"
).value,



validadePadrao:
Number(
document.getElementById(
"validadePadrao"
).value
),



impressora:
document.getElementById(
"impressora"
).value,



atualizadoEm:
serverTimestamp()



};






try{


await setDoc(

doc(

db,

"configuracoes",

"sistema"

),

configuracao

);





alert(
"Configurações salvas!"
);





}catch(error){



console.error(
"Erro configurações:",
error
);



alert(
"Erro ao salvar configurações"
);



}



});


}








// =======================================
// INICIAR
// =======================================


document.addEventListener(

"DOMContentLoaded",

()=>{


carregarConfiguracoes();


}

);