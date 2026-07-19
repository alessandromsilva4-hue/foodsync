// =======================================
// FOODSYNC - ESTOQUE
// =======================================


import { db } from "./firebase.js";


import {

    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



console.log("ESTOQUE.JS CARREGADO");



// =======================================
// ELEMENTOS
// =======================================


const estoqueForm =
document.getElementById("estoqueForm");


const produtoSelect =
document.getElementById("produtoEstoque");


const listaEstoque =
document.getElementById("listaEstoque");



const quantidadeInput =
document.getElementById("quantidadeEstoque");


const minimoInput =
document.getElementById("estoqueMinimo");


const maximoInput =
document.getElementById("estoqueMaximo");



let produtos = [];

let estoqueAtual = [];

// =======================================
// MOVIMENTAÇÃO DE ESTOQUE
// =======================================


const movimentacaoForm =
document.getElementById("movimentacaoForm");


const produtoMovimentacao =
document.getElementById("produtoMovimentacao");


const tipoMovimentacao =
document.getElementById("tipoMovimentacao");


const quantidadeMovimentacao =
document.getElementById("quantidadeMovimentacao");


const motivoMovimentacao =
document.getElementById("motivoMovimentacao");


const listaMovimentacoes =
document.getElementById("listaMovimentacoes");

// =======================================
// CARREGAR PRODUTOS
// =======================================


async function carregarProdutos(){


    if(!produtoSelect) return;


    produtoSelect.innerHTML = `

        <option value="">
            Selecione o produto
        </option>

    `;



    try{


        const snapshot =
        await getDocs(
            collection(db,"produtos")
        );



        produtos = [];



snapshot.forEach(item=>{


    const produto = {

        id:item.id,

        ...item.data()

    };


    produtos.push(produto);



    produtoSelect.innerHTML += `

        <option value="${produto.nome}">

            ${produto.nome}

        </option>

    `;



    if(produtoMovimentacao){


        produtoMovimentacao.innerHTML += `

        <option value="${produto.nome}">

            ${produto.nome}

        </option>

        `;


    }


});



        console.log(
            "Produtos carregados:",
            produtos
        );



    }catch(error){


        console.error(
            "Erro ao carregar produtos:",
            error
        );


    }


}



// =======================================
// BUSCAR ESTOQUE
// =======================================


async function carregarEstoque(){


    if(!listaEstoque) return;



    listaEstoque.innerHTML="";



    try{


        const snapshot =
        await getDocs(
            collection(db,"estoque")
        );



        estoqueAtual=[];



        if(snapshot.empty){


            listaEstoque.innerHTML = `

            <tr>

                <td colspan="7">

                    Nenhum estoque cadastrado

                </td>

            </tr>

            `;


            return;

        }



        snapshot.forEach(item=>{


            estoqueAtual.push({

                id:item.id,

                ...item.data()

            });


        });



        renderizarEstoque();



    }catch(error){


        console.error(
            "Erro ao carregar estoque:",
            error
        );


    }


}
// =======================================
// STATUS DO ESTOQUE
// =======================================


function verificarStatus(item){


    const atual =
    Number(item.quantidade || 0);


    const minimo =
    Number(item.minimo || 0);



    if(atual <= minimo){


        return `
        <span style="color:red;font-weight:bold">
        🔴 Crítico
        </span>
        `;


    }



    if(atual <= minimo + 5){


        return `
        <span style="color:#ca8a04;font-weight:bold">
        🟡 Atenção
        </span>
        `;


    }



    return `

    <span style="color:green;font-weight:bold">

    🟢 Normal

    </span>

    `;


}



// =======================================
// RENDERIZAR TABELA
// =======================================


function renderizarEstoque(){


    listaEstoque.innerHTML="";



    estoqueAtual.forEach(item=>{


        listaEstoque.innerHTML += `

        <tr>


            <td>

                ${item.produto}

            </td>



            <td>

                ${item.quantidade || 0}

            </td>



            <td>

                ${item.unidade || "UN"}

            </td>



            <td>

                ${item.minimo || 0}

            </td>



            <td>

                ${item.maximo || 0}

            </td>



            <td>

                ${verificarStatus(item)}

            </td>



            <td>


                <button
                onclick="excluirEstoque('${item.id}')">

                    🗑️

                </button>


            </td>


        </tr>

        `;


    });


}



// =======================================
// SALVAR ESTOQUE
// =======================================


if(estoqueForm){


estoqueForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



const produto =
produtoSelect.value;



if(!produto){


    alert(
    "Selecione o produto."
    );


    return;

}



const existente =
estoqueAtual.find(
item =>
item.produto === produto
);



const dados = {


    produto:produto,


    quantidade:
    Number(
        quantidadeInput.value
    ),


    minimo:
    Number(
        minimoInput.value
    ),


    maximo:
    Number(
        maximoInput.value
    ),


  unidade:
(
    produtos.find(
        p => p.nome === produto
    )?.unidade || "UN"
),


    atualizadoEm:
    serverTimestamp(),


    usuario:"admin"


};





try{



    if(existente){



        await updateDoc(

            doc(
                db,
                "estoque",
                existente.id
            ),

            dados

        );



        console.log(
        "Estoque atualizado."
        );



    }else{



        await addDoc(

            collection(
                db,
                "estoque"
            ),

            dados

        );



        console.log(
        "Estoque criado."
        );



    }



    estoqueForm.reset();



    await carregarEstoque();



}catch(error){



    console.error(
        "Erro ao salvar estoque:",
        error
    );


}



});


}
// =======================================
// EXCLUIR ESTOQUE
// =======================================


window.excluirEstoque = async function(id){


    const confirmar =
    confirm(
        "Deseja excluir este estoque?"
    );



    if(!confirmar){

        return;

    }



    try{


        await deleteDoc(

            doc(
                db,
                "estoque",
                id
            )

        );



        console.log(
            "Estoque excluído."
        );



        await carregarEstoque();



    }catch(error){


        console.error(
            "Erro ao excluir estoque:",
            error
        );


    }


}

// =======================================
// REGISTRAR MOVIMENTAÇÃO
// =======================================


if(movimentacaoForm){


movimentacaoForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



const produto =
produtoMovimentacao.value;


const tipo =
tipoMovimentacao.value;


const quantidade =
Number(
quantidadeMovimentacao.value
);



const motivo =
motivoMovimentacao.value || "-";



if(!produto){


alert(
"Selecione o produto."
);


return;


}



try{


const estoque =
estoqueAtual.find(

item => item.produto === produto

);



if(!estoque){


alert(
"Produto não encontrado no estoque."
);


return;


}



let novaQuantidade =
Number(estoque.quantidade);



if(tipo === "ENTRADA"){


novaQuantidade += quantidade;


}



if(tipo === "SAIDA"){


novaQuantidade -= quantidade;


}



if(novaQuantidade < 0){


alert(
"Estoque insuficiente."
);


return;


}




// Atualiza estoque


await updateDoc(

doc(
db,
"estoque",
estoque.id
),

{

quantidade:
novaQuantidade,

atualizadoEm:
serverTimestamp()

}

);





// Salva histórico


await addDoc(

collection(
db,
"movimentacoes"
),

{

produto,

tipo,

quantidade,

motivo,

usuario:"admin",

data:
serverTimestamp()

}

);





alert(
"Movimentação registrada com sucesso!"
);



movimentacaoForm.reset();



await carregarEstoque();



console.log(
"Movimentação salva."
);



}catch(error){


console.error(

"Erro na movimentação:",
error

);


}



});


}
// =======================================
// CARREGAR MOVIMENTAÇÕES
// =======================================

async function carregarMovimentacoes(){


    if(!listaMovimentacoes) return;


    listaMovimentacoes.innerHTML = "";


    try{


        const snapshot = await getDocs(
            collection(db,"movimentacoes")
        );



        if(snapshot.empty){


            listaMovimentacoes.innerHTML = `

            <tr>

                <td colspan="6">

                    Nenhuma movimentação

                </td>

            </tr>

            `;


            return;

        }



        snapshot.forEach(item=>{


           const mov = item.data();


if(!mov.produto || !mov.tipo){

    return;

}


            const data = mov.data?.toDate
            ? mov.data.toDate().toLocaleDateString("pt-BR")
            : "-";



            listaMovimentacoes.innerHTML += `

            <tr>

                <td>${mov.produto}</td>

                <td>${mov.tipo}</td>

                <td>${mov.quantidade}</td>

                <td>${mov.motivo}</td>

                <td>${mov.usuario}</td>

                <td>${data}</td>

            </tr>

            `;


        });



    }catch(error){


        console.error(
            "Erro ao carregar movimentações:",
            error
        );


    }


}

// =======================================
// INICIALIZAÇÃO
// =======================================


document.addEventListener(
"DOMContentLoaded",
async()=>{


    await carregarProdutos();


    await carregarEstoque();


    await carregarMovimentacoes();

    console.log(
        "Módulo Estoque iniciado."
    );


});