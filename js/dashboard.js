// =======================================
// FOODSYNC - DASHBOARD
// =======================================

import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =======================================
// FORMATAR DATA
// =======================================

function formatarData(data){

    if(!data) return "-";

    const d = new Date(data);

    return d.toLocaleDateString("pt-BR");

}


// =======================================
// DIFERENÇA EM DIAS
// =======================================

function diasRestantes(data){

    const hoje = new Date();

    hoje.setHours(0,0,0,0);

    const validade = new Date(data);

    validade.setHours(0,0,0,0);

    return Math.floor(

        (validade-hoje)/(1000*60*60*24)

    );

}



// =======================================
// CARDS
// =======================================

async function carregarCards(){

    try{

        const produtos =
        await getDocs(collection(db,"produtos"));

        const producoes =
        await getDocs(collection(db,"producoes"));

        const etiquetas =
        await getDocs(collection(db,"etiquetas"));

        const usuarios =
        await getDocs(collection(db,"usuarios"));


        document.getElementById("totalProdutos").innerText =
        produtos.size;


        document.getElementById("totalProducoes").innerText =
        producoes.size;


        document.getElementById("totalEtiquetas").innerText =
        etiquetas.size;


        document.getElementById("totalUsuarios").innerText =
        usuarios.size;


        let vencendo = 0;

        let vencidos = 0;


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
            "Erro cards:",
            error
        );

    }

}
// =======================================
// ÚLTIMAS PRODUÇÕES
// =======================================

async function carregarProducoesRecentes() {

    try {

        const tabela =
            document.getElementById("listaProducao");

        tabela.innerHTML = "";

        const snapshot =
            await getDocs(collection(db, "producoes"));

        if (snapshot.empty) {

            tabela.innerHTML = `
                <tr>
                    <td colspan="5">
                        Nenhuma produção registrada
                    </td>
                </tr>
            `;

            return;
        }

        const lista = [];

        snapshot.forEach(doc => {

            lista.push(doc.data());

        });

        lista.sort((a, b) => {

            return new Date(b.dataProducao) - new Date(a.dataProducao);

        });

        lista.slice(0, 5).forEach(p => {

            const linha = document.createElement("tr");

            linha.innerHTML = `

                <td>${p.produto || "-"}</td>

                <td>${p.quantidade || 0} ${p.unidade || ""}</td>

                <td>${formatarData(p.dataProducao)}</td>

                <td>${formatarData(p.validade)}</td>

                <td>${p.responsavel || "admin"}</td>

            `;

            tabela.appendChild(linha);

        });

    }

    catch (error) {

        console.error(
            "Erro produções:",
            error
        );

    }

}



// =======================================
// DASHBOARD
// =======================================

async function carregarDashboard() {

    await carregarCards();

    await carregarProducoesRecentes();

}



// =======================================
// INICIAR
// =======================================

document.addEventListener(

    "DOMContentLoaded",

    carregarDashboard

);