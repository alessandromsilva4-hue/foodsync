// =======================================
// FOODSYNC - PRODUÇÃO V2
// =======================================

console.log("PRODUCAO.JS V2 CARREGADO");


import { db } from "./firebase.js";


import {

collection,
getDocs,
addDoc,
updateDoc,
deleteDoc,
doc,
serverTimestamp

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



const produtoSelect =
document.getElementById("produtoSelect");


const formulario =
document.getElementById("producaoForm");


let produtos = [];



// =======================================
// USUÁRIO LOGADO
// =======================================


function usuarioAtual(){

    try{

        return JSON.parse(
            localStorage.getItem("usuarioFoodSync")
        );

    }
    catch{

        return null;

    }

}





// =======================================
// CARREGAR PRODUTOS
// =======================================


async function carregarProdutos(){


    produtos = [];


    const snapshot =
    await getDocs(
        collection(db,"produtos")
    );



    produtoSelect.innerHTML = `

    <option value="">
    Selecione o produto
    </option>

    `;



    snapshot.forEach(item=>{


        const produto = {

            id:item.id,

            ...item.data()

        };


        produtos.push(produto);



        produtoSelect.innerHTML += `

        <option value="${produto.id}">
            ${produto.nome}
        </option>

        `;


    });



    console.log(
        "Produtos carregados:",
        produtos
    );


}




// =======================================
// BUSCAR PRODUTO SELECIONADO
// =======================================


function produtoSelecionado(){


    return produtos.find(

        p =>
        p.id === produtoSelect.value

    );


}




// =======================================
// ALTERAÇÃO DO PRODUTO
// =======================================


produtoSelect.addEventListener(

"change",

()=>{


const produto =
produtoSelecionado();



if(!produto)
return;



document.getElementById(
"temperaturaProducao"
).value =

produto.temperatura || "";



const data =
document.getElementById(
"dataProducao"
).value;



if(
data &&
produto.validadeDias
){

calcularValidade(
produto.validadeDias
);

}



});
// =======================================
// CALCULAR VALIDADE
// =======================================


document
.getElementById("dataProducao")
.addEventListener(

"change",

()=>{


const produto =
produtoSelecionado();



if(produto){

calcularValidade(
produto.validadeDias
);

}


});


function calcularValidade(dias){


const campo =
document.getElementById(
"dataProducao"
);



if(!campo.value)
return;



const data =
new Date(
campo.value + "T00:00:00"
);



data.setDate(
data.getDate() + Number(dias)
);



document.getElementById(
"validadeProducao"
).value =

data.toISOString()
.split("T")[0];


}







// =======================================
// SALVAR PRODUÇÃO
// =======================================


formulario.addEventListener(

"submit",

async(e)=>{


e.preventDefault();



try{


const produto =
produtoSelecionado();



if(!produto){

alert(
"Selecione um produto"
);

return;

}



const usuario =
usuarioAtual();




const dados = {


produtoId:
produto.id,


produto:
produto.nome,


codigo:
produto.codigo || "",



quantidade:

Number(

document.getElementById(
"quantidadeProducao"
).value

) || 1,



unidade:

produto.unidade || "UN",



dataProducao:

document.getElementById(
"dataProducao"
).value,



validade:

document.getElementById(
"validadeProducao"
).value,



temperatura:

document.getElementById(
"temperaturaProducao"
).value,



responsavel:

document.getElementById(
"responsavelProducao"
).value

||

usuario?.nome

||

"Sistema",



status:

document.getElementById(
"statusProducao"
).value || "Finalizado",



criadoEm:

serverTimestamp()


};





// SALVA PRODUÇÃO


const producaoRef =

await addDoc(

collection(db,"producoes"),

dados

);






// =======================================
// AUDITORIA PRODUÇÃO
// =======================================


await addDoc(

collection(db,"auditoria"),

{


usuario:

usuario?.nome || "Sistema",



email:

usuario?.email || "",



modulo:

"Produção",



acao:

"NOVA PRODUÇÃO",



detalhes:

produto.nome +

" - Quantidade: " +

dados.quantidade +

" " +

dados.unidade,



status:

"Sucesso",



data:

serverTimestamp()


}

);







// =======================================
// BAIXA ESTOQUE
// =======================================


const estoqueSnapshot =

await getDocs(

collection(db,"estoque")

);



for(
const item of estoqueSnapshot.docs
){



const estoque =
item.data();



const corresponde =


estoque.produtoId === produto.id

||

estoque.produto === produto.nome

||

estoque.produto?.toLowerCase()
===
produto.nome?.toLowerCase();



if(corresponde){



const novaQuantidade =

Number(
estoque.quantidade || 0
)

-

Number(
dados.quantidade
);





await updateDoc(

doc(
db,
"estoque",
item.id
),

{


quantidade:

novaQuantidade,


produtoId:

produto.id,


atualizadoEm:

serverTimestamp()


}

);





// movimentação


await addDoc(

collection(db,"movimentacoes"),

{


produtoId:

produto.id,


produto:

produto.nome,


tipo:

"SAIDA",


quantidade:

dados.quantidade,


unidade:

dados.unidade,


motivo:

"Produção",


usuario:

usuario?.nome || "Sistema",


data:

serverTimestamp()


}

);



}



}

// =======================================
// GERAR ETIQUETA AUTOMÁTICA
// =======================================


const codigoEtiqueta =

"FS-" + Date.now();




const etiqueta = {


codigoEtiqueta:


codigoEtiqueta,



producaoId:

producaoRef.id,



produtoId:

produto.id,



produto:

produto.nome,



codigo:

produto.codigo || "",



quantidade:

dados.quantidade,



unidade:

dados.unidade,



dataProducao:

dados.dataProducao,



validade:

dados.validade,



temperatura:

dados.temperatura,



responsavel:

dados.responsavel,



status:

"ativa",



criadoEm:

serverTimestamp()


};





await addDoc(

collection(db,"etiquetas"),

etiqueta

);






// =======================================
// AUDITORIA ETIQUETA
// =======================================


await addDoc(

collection(db,"auditoria"),

{


usuario:

usuario?.nome || "Sistema",



email:

usuario?.email || "",



modulo:

"Etiquetas",



acao:

"ETIQUETA GERADA",



detalhes:

produto.nome +

" - Código: " +

codigoEtiqueta,



status:

"Sucesso",



data:

serverTimestamp()


}

);






alert(

"Produção registrada com sucesso!"

);



formulario.reset();



carregarProducoes();





}

catch(error){



console.error(

"Erro ao salvar produção:",

error

);



alert(

"Erro ao registrar produção"

);


}



});
// =======================================
// CARREGAR PRODUÇÕES
// =======================================


async function carregarProducoes(){


const lista =

document.getElementById(
"listaProducoes"
);



if(!lista)
return;



lista.innerHTML = "";



const snapshot =

await getDocs(

collection(db,"producoes")

);





if(snapshot.empty){


lista.innerHTML = `

<tr>

<td colspan="6">

Nenhuma produção registrada

</td>

</tr>

`;


return;


}





snapshot.forEach(item=>{


const producao = item.data();



lista.innerHTML += `

<tr>


<td>
${producao.produto || "-"}
</td>


<td>
${producao.quantidade || 1}
${producao.unidade || "UN"}
</td>


<td>
${formatarData(
producao.dataProducao
)}
</td>


<td>
${formatarData(
producao.validade
)}
</td>


<td>
${producao.status || "Finalizado"}
</td>


<td>


<button

class="btn-delete"

onclick="excluirProducao('${item.id}')"

>

🗑️

</button>


</td>


</tr>

`;



});



}








// =======================================
// FORMATAR DATA
// =======================================


function formatarData(data){


if(!data)
return "-";



// Timestamp Firebase

if(data.seconds){


return new Date(

data.seconds * 1000

)

.toLocaleDateString(
"pt-BR"
);


}



// YYYY-MM-DD

if(typeof data === "string"){


const partes =
data.split("-");



if(partes.length === 3){


return (

partes[2]

+

"/"

+

partes[1]

+

"/"

+

partes[0]

);


}



}



return data;


}








// =======================================
// EXCLUIR PRODUÇÃO
// =======================================


window.excluirProducao = async function(id){


const confirmar =

confirm(

"Deseja excluir esta produção?"

);



if(!confirmar)
return;




try{


await deleteDoc(

doc(

db,

"producoes",

id

)

);



alert(

"Produção excluída!"

);



carregarProducoes();



}

catch(error){



console.error(

"Erro ao excluir:",

error

);



alert(

"Erro ao excluir produção"

);


}



}








// =======================================
// INICIALIZAÇÃO
// =======================================


carregarProdutos();

carregarProducoes();