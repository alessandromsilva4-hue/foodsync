// =======================================
// FOODSYNCH - RELATÓRIOS
// =======================================

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("RELATORIOS.JS CARREGADO");

// =======================================
// ELEMENTOS
// =======================================

const totalProducoes =
    document.getElementById("totalProducoes");

const totalEtiquetas =
    document.getElementById("totalEtiquetas");

const totalProdutos =
    document.getElementById("totalProdutos");

const totalEstoqueBaixo =
    document.getElementById("totalEstoqueBaixo");

const tabelaProducao =
    document.getElementById("relatorioProducao");

const graficoProducao =
    document.getElementById("graficoProducao");


// =======================================
// PEGAR EMPRESA DO USUÁRIO
// =======================================

function obterEmpresaId() {

    try {

        const perfilSalvo =
            localStorage.getItem("usuarioFoodSync");

        if (!perfilSalvo) {

            console.error(
                "RELATÓRIOS: perfil do usuário não encontrado."
            );

            return null;
        }


        const perfil =
            JSON.parse(perfilSalvo);


        if (!perfil.idEmpresa) {

            console.error(
                "RELATÓRIOS: idEmpresa não encontrado no perfil."
            );

            return null;
        }


        console.log(
            "RELATÓRIOS - ID EMPRESA:",
            perfil.idEmpresa
        );


        return perfil.idEmpresa;

    } catch (error) {

        console.error(
            "RELATÓRIOS: erro ao ler perfil:",
            error
        );

        return null;

    }

}


// =======================================
// CARREGAR RELATÓRIOS
// =======================================

async function carregarRelatorios() {

    try {

        // =======================================
        // EMPRESA ATUAL
        // =======================================

        const empresaId =
            obterEmpresaId();


        if (!empresaId) {

            console.error(
                "RELATÓRIOS: empresa não identificada."
            );

            return;

        }


        console.log(
            "RELATÓRIOS: carregando dados da empresa",
            empresaId
        );


        // =======================================
        // PRODUÇÕES
        // =======================================

        const consultaProducoes =
            query(
                collection(
                    db,
                    "producoes"
                ),

                where(
                    "empresaId",
                    "==",
                    empresaId
                )
            );


        const producoes =
            await getDocs(
                consultaProducoes
            );


        if (totalProducoes) {

            totalProducoes.innerText =
                producoes.size;

        }


        // =======================================
        // GRÁFICO DE PRODUÇÃO
        // =======================================

        if (graficoProducao) {

            const dadosGrafico = {};


            producoes.forEach(doc => {

                const p =
                    doc.data();


                const nome =
                    p.produto ||
                    "Sem nome";


                const quantidade =
                    Number(
                        p.quantidade || 0
                    );


                if (!dadosGrafico[nome]) {

                    dadosGrafico[nome] = 0;

                }


                dadosGrafico[nome] +=
                    quantidade;

            });


            // =======================================
            // EVITAR ERRO SE CHART.JS NÃO ESTIVER CARREGADO
            // =======================================

            if (typeof Chart !== "undefined") {

                new Chart(

                    graficoProducao,

                    {

                        type: "bar",

                        data: {

                            labels:
                                Object.keys(
                                    dadosGrafico
                                ),

                            datasets: [

                                {

                                    label:
                                        "Quantidade Produzida",

                                    data:
                                        Object.values(
                                            dadosGrafico
                                        )

                                }

                            ]

                        },

                        options: {

                            responsive: true,

                            maintainAspectRatio: false

                        }

                    }

                );

            } else {

                console.warn(
                    "Chart.js não foi carregado."
                );

            }

        }


        // =======================================
        // ETIQUETAS
        // =======================================

        const consultaEtiquetas =
            query(
                collection(
                    db,
                    "etiquetas"
                ),

                where(
                    "empresaId",
                    "==",
                    empresaId
                )
            );


        const etiquetas =
            await getDocs(
                consultaEtiquetas
            );


        if (totalEtiquetas) {

            totalEtiquetas.innerText =
                etiquetas.size;

        }


        // =======================================
        // PRODUTOS
        // =======================================

        const consultaProdutos =
            query(
                collection(
                    db,
                    "produtos"
                ),

                where(
                    "empresaId",
                    "==",
                    empresaId
                )
            );


        const produtos =
            await getDocs(
                consultaProdutos
            );


        if (totalProdutos) {

            totalProdutos.innerText =
                produtos.size;

        }


        // =======================================
        // ESTOQUE
        // =======================================

        const consultaEstoque =
            query(
                collection(
                    db,
                    "estoque"
                ),

                where(
                    "empresaId",
                    "==",
                    empresaId
                )
            );


        const estoque =
            await getDocs(
                consultaEstoque
            );


        let baixo = 0;


        estoque.forEach(doc => {

            const e =
                doc.data();


            const quantidade =
                Number(
                    e.quantidade || 0
                );


            const minimo =
                Number(
                    e.minimo || 0
                );


            if (
                quantidade <= minimo
            ) {

                baixo++;

            }

        });


        if (totalEstoqueBaixo) {

            totalEstoqueBaixo.innerText =
                baixo;

        }


        // =======================================
        // ÚLTIMAS PRODUÇÕES
        // =======================================

        if (tabelaProducao) {

            tabelaProducao.innerHTML = "";


            const consultaUltimasProducoes =
                query(

                    collection(
                        db,
                        "producoes"
                    ),

                    where(
                        "empresaId",
                        "==",
                        empresaId
                    ),

                    orderBy(
                        "criadoEm",
                        "desc"
                    ),

                    limit(10)

                );


            const dados =
                await getDocs(
                    consultaUltimasProducoes
                );


            if (dados.empty) {

                tabelaProducao.innerHTML = `

                    <tr>

                        <td colspan="4">

                            Sem dados

                        </td>

                    </tr>

                `;

            } else {

                dados.forEach(item => {

                    const p =
                        item.data();


                    tabelaProducao.innerHTML += `

                        <tr>

                            <td>
                                ${p.produto || "-"}
                            </td>

                            <td>
                                ${p.quantidade || 0}
                            </td>

                            <td>
                                ${p.responsavel || "-"}
                            </td>

                            <td>
                                ${formatarData(
                                    p.dataProducao
                                )}
                            </td>

                        </tr>

                    `;

                });

            }

        }


        console.log(
            "RELATÓRIOS CARREGADOS COM SUCESSO."
        );


    } catch (error) {

        console.error(
            "Erro nos relatórios:",
            error
        );


        // =======================================
        // MOSTRAR ERRO NA TABELA
        // =======================================

        if (tabelaProducao) {

            tabelaProducao.innerHTML = `

                <tr>

                    <td colspan="4">

                        Erro ao carregar os relatórios.

                    </td>

                </tr>

            `;

        }

    }

}


// =======================================
// FORMATAR DATA
// =======================================

function formatarData(data) {

    if (!data) {

        return "-";

    }


    // =======================================
    // FIREBASE TIMESTAMP
    // =======================================

    if (
        typeof data === "object" &&
        data !== null &&
        data.seconds
    ) {

        return new Date(
            data.seconds * 1000
        ).toLocaleDateString(
            "pt-BR"
        );

    }


    // =======================================
    // DATA YYYY-MM-DD
    // =======================================

    if (
        typeof data === "string"
    ) {

        const partes =
            data.split("-");


        if (
            partes.length === 3
        ) {

            return `${partes[2]}/${partes[1]}/${partes[0]}`;

        }

    }


    return data;

}


// =======================================
// INICIAR
// =======================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        carregarRelatorios();

    }

);


// =======================================
// EXPORTAR EXCEL
// =======================================

window.exportarExcel = function () {

    const tabela =
        document.querySelector("table");


    if (!tabela) {

        alert(
            "Tabela não encontrada."
        );

        return;

    }


    if (
        typeof XLSX === "undefined"
    ) {

        alert(
            "A biblioteca XLSX não foi carregada."
        );

        return;

    }


    const workbook =
        XLSX.utils.table_to_book(
            tabela
        );


    XLSX.writeFile(

        workbook,

        "relatorio-foodsync.xlsx"

    );

};


// =======================================
// EXPORTAR CSV
// =======================================

window.exportarCSV = function () {

    const tabela =
        document.querySelector("table");


    if (!tabela) {

        alert(
            "Tabela não encontrada."
        );

        return;

    }


    let csv = [];


    tabela
        .querySelectorAll("tr")
        .forEach(linha => {

            let dados = [];


            linha
                .querySelectorAll(
                    "th, td"
                )
                .forEach(coluna => {

                    const texto =
                        coluna.innerText
                            .replace(
                                /"/g,
                                '""'
                            );


                    dados.push(
                        `"${texto}"`
                    );

                });


            csv.push(
                dados.join(";")
            );

        });


    const arquivo =
        csv.join("\n");


    const blob =
        new Blob(

            [arquivo],

            {

                type:
                    "text/csv;charset=utf-8;"

            }

        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        URL.createObjectURL(
            blob
        );


    link.download =
        "relatorio-foodsync.csv";


    link.click();


    URL.revokeObjectURL(
        link.href
    );

};


// =======================================
// IMPRIMIR RELATÓRIO
// =======================================

window.imprimirRelatorio = function () {

    window.print();

};


// =======================================
// FIM
// =======================================

console.log(
    "RELATORIOS.JS V2 MULTIEMPRESA PRONTO"
);