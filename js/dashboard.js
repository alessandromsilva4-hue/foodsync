// =======================================
// FOODSYNCH - DASHBOARD
// =======================================

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



// =======================================
// CARREGAR DASHBOARD
// =======================================

async function carregarDashboard(){


    try {


        // ===============================
        // PRODUÇÕES
        // ===============================


        const producaoSnap = await getDocs(
            collection(db,"producoes")
        );


        let totalProducao = 0;


        producaoSnap.forEach(doc=>{


            const dados = doc.data();


            if(dados.data){

                totalProducao++;

            }


        });



        document.getElementById("totalProducao").innerText =
        totalProducao;




        // ===============================
        // ETIQUETAS
        // ===============================


        const etiquetasSnap = await getDocs(
            collection(db,"etiquetas")
        );


        document.getElementById("totalEtiquetas").innerText =
        etiquetasSnap.size;






        // ===============================
        // PRODUTOS VENCENDO
        // ===============================


        const produtosSnap = await getDocs(
            collection(db,"produtos")
        );


        let vencendo = 0;


        const hoje = new Date();


        produtosSnap.forEach(doc=>{


            const produto = doc.data();


            if(produto.validade){


                const validade =
                new Date(produto.validade);



                const diferenca =
                (validade-hoje)
                /
                (1000*60*60*24);



                if(diferenca <= 3){

                    vencendo++;

                }


            }


        });



        document.getElementById("produtosVencendo").innerText =
        vencendo;








        // ===============================
        // ESTOQUE BAIXO
        // ===============================


        const estoqueSnap = await getDocs(
            collection(db,"estoque")
        );


        let baixo = 0;


        estoqueSnap.forEach(doc=>{


            const item = doc.data();



            if(item.quantidade <= item.minimo){

                baixo++;

            }



        });



        document.getElementById("estoqueBaixo").innerText =
        baixo;






        // ===============================
        // ÚLTIMAS PRODUÇÕES
        // ===============================


        const tabela =
        document.getElementById("listaProducao");



        tabela.innerHTML="";



        const ultimas = query(

            collection(db,"producoes"),

            orderBy("data","desc"),

            limit(5)

        );



        const producoes =
        await getDocs(ultimas);



        if(producoes.empty){


            tabela.innerHTML = `

            <tr>

            <td colspan="4">

            Nenhuma produção registrada

            </td>

            </tr>

            `;


            return;

        }





        producoes.forEach(doc=>{


            const p = doc.data();



            tabela.innerHTML += `

            <tr>


            <td>
            ${p.produto || "-"}
            </td>


            <td>
            ${p.quantidade || 0}
            </td>


            <td>
            ${p.data || "-"}
            </td>


            <td>
            ${p.status || "Finalizado"}
            </td>


            </tr>


            `;



        });




    } catch(error){


        console.error(
            "Erro ao carregar dashboard:",
            error
        );


    }


}





// =======================================
// INICIAR
// =======================================


document.addEventListener(
"DOMContentLoaded",
()=>{

    carregarDashboard();

});