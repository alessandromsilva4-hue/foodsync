// =======================================
// FOODSYNC - DASHBOARD
// =======================================

console.log("DASHBOARD.JS NOVO CARREGADO");

import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =======================================
// FORMATAR DATA
// =======================================

function converterData(data) {

    if (!data) return null;

    // Timestamp do Firestore
    if (typeof data?.toDate === "function") {
        return data.toDate();
    }

    // String YYYY-MM-DD
    if (typeof data === "string") {

        const partes = data.split("-");

        if (partes.length === 3) {

            return new Date(
                Number(partes[0]),
                Number(partes[1]) - 1,
                Number(partes[2])
            );

        }

        return new Date(data);
    }

    if (data instanceof Date) {
        return data;
    }

    return new Date(data);

}


function formatarData(data) {

    const d = converterData(data);

    if (!d || isNaN(d.getTime())) {
        return "-";
    }

    return d.toLocaleDateString("pt-BR");

}



// =======================================
// DIFERENÇA EM DIAS
// =======================================

function diasRestantes(data){

    const validade = converterData(data);

    if (!validade) return 9999;

    const hoje = new Date();

    hoje.setHours(0,0,0,0);

    validade.setHours(0,0,0,0);

    return Math.floor(
        (validade - hoje) / (1000 * 60 * 60 * 24)
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

    return converterData(b.dataProducao) - converterData(a.dataProducao);

});

lista.slice(0, 5).forEach(p => {

    console.log("PRODUÇÃO:", p);

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


} catch (error) {

    console.error(
        "Erro produções:",
        error
    );

}

} // fecha carregarProducoesRecentes

// =======================================
// PRÓXIMOS VENCIMENTOS
// =======================================

async function carregarVencimentos(){

    try{

        const tabela =
        document.getElementById("listaVencimentos");


        tabela.innerHTML = "";


        const snapshot =
        await getDocs(
            collection(db,"etiquetas")
        );


        const lista = [];


        snapshot.forEach(doc=>{

            const e = doc.data();


            const dias =
            diasRestantes(e.validade);


            if(dias <= 7 && dias >= 0){

                lista.push({

                    produto: e.produto || "-",

                    lote: e.lote || e.codigo || "-",

                    validade: e.validade,

                    dias: dias

                });

            }


        });



        lista.sort((a,b)=>{

            return a.dias - b.dias;

        });



        if(lista.length === 0){

            tabela.innerHTML = `

            <tr>

                <td colspan="4">
                    Nenhum vencimento próximo
                </td>

            </tr>

            `;

            return;

        }



        lista.slice(0,10).forEach(v=>{


            const linha =
            document.createElement("tr");


            linha.innerHTML = `

                <td>${v.produto}</td>

                <td>${v.lote}</td>

                <td>${formatarData(v.validade)}</td>

                <td>${v.dias} dia(s)</td>

            `;


            tabela.appendChild(linha);


        });


    }
    catch(error){

        console.error(
            "Erro vencimentos:",
            error
        );

    }

}
// =======================================
// GRÁFICO PRODUÇÃO POR DIA
// =======================================

async function carregarGraficoProducao(){

    try{

        const snapshot =
        await getDocs(
            collection(db,"producoes")
        );


        const producaoPorDia = {};


        snapshot.forEach(doc=>{

            const p = doc.data();


            const data =
            formatarData(p.dataProducao);



            if(producaoPorDia[data]){

                producaoPorDia[data] +=
                Number(p.quantidade || 0);

            }
            else{

                producaoPorDia[data] =
                Number(p.quantidade || 0);

            }


        });



        const canvas =
        document.getElementById(
            "graficoProducao"
        );


        if(!canvas) return;

console.log("DADOS GRÁFICO:", producaoPorDia);
console.log("CANVAS:", canvas);
console.log("CHART:", typeof Chart);

        new Chart(canvas, {


            type:"bar",


            data:{


                labels:
                Object.keys(producaoPorDia),


                datasets:[{


                    label:
                    "Quantidade Produzida",


                    data:
                    Object.values(producaoPorDia)


                }]


            },


           options:{

    responsive:true,

    maintainAspectRatio:false

}


        });


    }

    catch(error){

        console.error(
            "Erro gráfico produção:",
            error
        );

    }

}
// =======================================
// GRÁFICO DE VALIDADE
// =======================================

async function carregarGraficoValidade(){

    try{

        const snapshot =
        await getDocs(
            collection(db,"etiquetas")
        );


        let hoje = 0;
        let tresDias = 0;
        let seteDias = 0;
        let acima = 0;


        snapshot.forEach(doc=>{

            const e = doc.data();

            const dias =
            diasRestantes(e.validade);



            if(dias < 0){

                return;

            }


            if(dias === 0){

                hoje++;

            }

            else if(dias <=3){

                tresDias++;

            }

            else if(dias <=7){

                seteDias++;

            }

            else{

                acima++;

            }


        });



        const canvas =
        document.getElementById(
            "graficoValidade"
        );


        if(!canvas) return;



        new Chart(canvas, {


            type:"doughnut",


            data:{


                labels:[

                    "Vence hoje",

                    "1-3 dias",

                    "4-7 dias",

                    "Acima de 7 dias"

                ],


                datasets:[{

                    label:"Etiquetas",

                    data:[

                        hoje,

                        tresDias,

                        seteDias,

                        acima

                    ]

                }]

            },


            options:{


                responsive:true,

                maintainAspectRatio:false


            }


        });



    }

    catch(error){

        console.error(
            "Erro gráfico validade:",
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

    await carregarVencimentos();

    await carregarGraficoProducao();

    await carregarGraficoValidade();

}


// =======================================
// INICIAR
// =======================================

document.addEventListener(
    "DOMContentLoaded",
    carregarDashboard
);