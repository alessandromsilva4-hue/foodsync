// =======================================
// FOODSYNC - DASHBOARD
// =======================================

console.log("DASHBOARD.JS ESTOQUE ALERTA CARREGADO");


import { db } from "./firebase.js";


import {
    collection,
    getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



// =======================================
// CONVERTER DATA
// =======================================

function converterData(data){

    if(!data)
        return null;


    if(typeof data?.toDate === "function"){
        return data.toDate();
    }


    if(typeof data === "string"){

        const partes = data.split("-");


        if(partes.length === 3){

            return new Date(
                partes[0],
                partes[1]-1,
                partes[2]
            );

        }

    }


    return new Date(data);

}



function formatarData(data){

    const d = converterData(data);


    if(!d || isNaN(d))
        return "-";


    return d.toLocaleDateString("pt-BR");

}




// =======================================
// DIAS VALIDADE
// =======================================

function diasRestantes(data){

    const validade =
    converterData(data);


    if(!validade)
        return 999;


    const hoje = new Date();


    hoje.setHours(0,0,0,0);

    validade.setHours(0,0,0,0);


    return Math.floor(
        (validade-hoje)
        /
        (1000*60*60*24)
    );

}




// =======================================
// CARDS
// =======================================

async function carregarCards(){


try{


const produtos =
await getDocs(
collection(db,"produtos")
);


const producoes =
await getDocs(
collection(db,"producoes")
);


const etiquetas =
await getDocs(
collection(db,"etiquetas")
);


const usuarios =
await getDocs(
collection(db,"usuarios")
);



document.getElementById("totalProdutos").innerText =
produtos.size;


document.getElementById("totalProducoes").innerText =
producoes.size;


document.getElementById("totalEtiquetas").innerText =
etiquetas.size;


document.getElementById("totalUsuarios").innerText =
usuarios.size;



let vencendo=0;

let vencidos=0;



etiquetas.forEach(doc=>{


const e = doc.data();


const dias =
diasRestantes(e.validade);



if(dias < 0){

    vencidos++;

}

else if(dias <=3){

    vencendo++;

}


});



document.getElementById("produtosVencendo").innerText =
vencendo;


document.getElementById("produtosVencidos").innerText =
vencidos;



}
catch(error){

console.error(
"Erro cards",
error
);


}



}



// =======================================
// ESTOQUE BAIXO
// =======================================


async function carregarEstoqueBaixo(){


try{


const card =
document.getElementById(
"estoqueBaixo"
);


const tabela =
document.getElementById(
"listaEstoqueBaixo"
);



if(!card && !tabela)
return;



const snapshot =
await getDocs(
collection(db,"estoque")
);

console.log("TOTAL ESTOQUE:", snapshot.size);

let baixos=[];


snapshot.forEach(doc => {

    const item = doc.data();

    console.log(item);

    console.log(
        item.produto,
        item.quantidade,
        item.minimo
    );

    const quantidade = Number(item.quantidade || 0);

    const minimo = Number(item.minimo || 0);

    if (quantidade <= minimo) {

        baixos.push({
            produto: item.produto,
            quantidade,
            minimo,
            unidade: item.unidade || "UN"
        });

    }

});



// CARD


if(card){

card.innerText =
baixos.length;

}




// TABELA


if(tabela){


tabela.innerHTML="";



if(baixos.length===0){


tabela.innerHTML=`

<tr>

<td colspan="4">

🟢 Estoque normal

</td>

</tr>

`;

return;


}



baixos.forEach(item=>{


tabela.innerHTML += `

<tr>

<td>
${item.produto}
</td>


<td>
${item.quantidade}
${item.unidade}
</td>


<td>
${item.minimo}
${item.unidade}
</td>


<td>

<span style="color:red;font-weight:bold">

🔴 Comprar

</span>

</td>


</tr>

`;


});


}



}
catch(error){


console.error(
"Erro estoque baixo:",
error
);


}



}





// =======================================
// PRODUÇÕES RECENTES
// =======================================

async function carregarProducoesRecentes(){


const tabela =
document.getElementById(
"listaProducao"
);



if(!tabela)
return;



tabela.innerHTML="";



const snapshot =
await getDocs(
collection(db,"producoes")
);



let lista=[];



snapshot.forEach(doc=>{

lista.push(doc.data());

});



lista.sort((a,b)=>

converterData(b.dataProducao)
-
converterData(a.dataProducao)

);



lista.slice(0,5)
.forEach(p=>{


tabela.innerHTML +=`

<tr>

<td>
${p.produto}
</td>


<td>
${p.quantidade}
${p.unidade || ""}
</td>


<td>
${formatarData(p.dataProducao)}
</td>


<td>
${p.status || "Finalizado"}
</td>


</tr>

`;


});


}




// =======================================
// VENCIMENTOS
// =======================================

async function carregarVencimentos(){


const tabela =
document.getElementById(
"listaVencimentos"
);


if(!tabela)
return;



tabela.innerHTML="";



const snapshot =
await getDocs(
collection(db,"etiquetas")
);



let lista=[];



snapshot.forEach(doc=>{


const e=doc.data();


const dias =
diasRestantes(e.validade);



if(dias<=7 && dias>=0){


lista.push({

produto:e.produto,

lote:e.codigoEtiqueta,

validade:e.validade,

dias

});


}



});



lista.sort((a,b)=>a.dias-b.dias);



if(lista.length===0){


tabela.innerHTML=`

<tr>

<td colspan="4">

Nenhum vencimento próximo

</td>

</tr>

`;

return;


}



lista.forEach(v=>{


tabela.innerHTML +=`

<tr>

<td>${v.produto}</td>

<td>${v.lote}</td>

<td>${formatarData(v.validade)}</td>

<td>${v.dias} dia(s)</td>

</tr>

`;


});



}




// =======================================
// INICIAR DASHBOARD
// =======================================


async function carregarDashboard(){


await carregarCards();


await carregarEstoqueBaixo();


await carregarProducoesRecentes();


await carregarVencimentos();


}



document.addEventListener(

"DOMContentLoaded",

carregarDashboard

);