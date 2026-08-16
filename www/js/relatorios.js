// =======================================
// FOODSYNCH - RELATÓRIOS
// V3 - MULTIEMPRESA
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

console.log("RELATORIOS.JS V3 CARREGADO");


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
// OBTER ID DA EMPRESA
// =======================================

function obterEmpresaId() {

    try {

        const perfilSalvo =
            localStorage.getItem("usuarioFoodSync");


        if (!perfilSalvo) {

            console.error(
                "RELATÓRIOS: perfil não encontrado no localStorage."
            );

            return null;

        }


        const perfil =
            JSON.parse(perfilSalvo);


        console.log(
            "RELATÓRIOS: perfil carregado:",
            perfil
        );


        if (!perfil.idEmpresa) {

            console.error(
                "RELATÓRIOS: idEmpresa não encontrado."
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

    console.log(
        "RELATÓRIOS: iniciando carregamento..."
    );


    const empresaId =
        obterEmpresaId();


    if (!empresaId) {

        console.error(
            "RELATÓRIOS: empresa não identificada."
        );

        return;

    }


    console.log(
        "RELATÓRIOS: empresa atual:",
        empresaId
    );


    // =======================================
    // PRODUÇÕES
    // =======================================

    try {

        console.log(
            "RELATÓRIOS: buscando PRODUÇÕES..."
        );


        const consultaProducoes =
            query(

                collection(
                    db,
                    "producoes"
                ),

                where(
                    "idEmpresa",
                    "==",
                    empresaId
                )

            );


        const producoes =
            await getDocs(
                consultaProducoes
            );


        console.log(
            "RELATÓRIOS: PRODUÇÕES OK:",
            producoes.size
        );


        if (totalProducoes) {

            totalProducoes.innerText =
                producoes.size;

        }


        // =======================================
        // GRÁFICO
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


            if (
                typeof Chart !== "undefined"
            ) {

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
                    "Chart.js não está carregado."
                );

            }

        }

    } catch (error) {

        console.error(
            "RELATÓRIOS: ERRO EM PRODUÇÕES:",
            error
        );

    }


    // =======================================
    // ETIQUETAS
    // =======================================

    try {

        console.log(
            "RELATÓRIOS: buscando ETIQUETAS..."
        );


        const consultaEtiquetas =
            query(

                collection(
                    db,
                    "etiquetas"
                ),

                where(
                    "idEmpresa",
                    "==",
                    empresaId
                )

            );


        const etiquetas =
            await getDocs(
                consultaEtiquetas
            );


        console.log(
            "RELATÓRIOS: ETIQUETAS OK:",
            etiquetas.size
        );


        if (totalEtiquetas) {

            totalEtiquetas.innerText =
                etiquetas.size;

        }

    } catch (error) {

        console.error(
            "RELATÓRIOS: ERRO EM ETIQUETAS:",
            error
        );

    }


    // =======================================
    // PRODUTOS
    // =======================================

    try {

        console.log(
            "RELATÓRIOS: buscando PRODUTOS..."
        );


        // IMPORTANTE:
        // Produtos utiliza o campo "empresas"
        // como ARRAY.

        const consultaProdutos =
            query(

                collection(
                    db,
                    "produtos"
                ),

                where(
                    "empresas",
                    "array-contains",
                    empresaId
                )

            );


        const produtos =
            await getDocs(
                consultaProdutos
            );


        console.log(
            "RELATÓRIOS: PRODUTOS OK:",
            produtos.size
        );


        if (totalProdutos) {

            totalProdutos.innerText =
                produtos.size;

        }

    } catch (error) {

        console.error(
            "RELATÓRIOS: ERRO EM PRODUTOS:",
            error
        );

    }


    // =======================================
    // ESTOQUE
    // =======================================

    try {

        console.log(
            "RELATÓRIOS: buscando ESTOQUE..."
        );


        const consultaEstoque =
            query(

                collection(
                    db,
                    "estoque"
                ),

                where(
                    "idEmpresa",
                    "==",
                    empresaId
                )

            );


        const estoque =
            await getDocs(
                consultaEstoque
            );


        console.log(
            "RELATÓRIOS: ESTOQUE OK:",
            estoque.size
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

    } catch (error) {

        console.error(
            "RELATÓRIOS: ERRO EM ESTOQUE:",
            error
        );

    }


    // =======================================
    // ÚLTIMAS PRODUÇÕES
    // =======================================

    if (tabelaProducao) {

        try {

            console.log(
                "RELATÓRIOS: buscando ÚLTIMAS PRODUÇÕES..."
            );


            tabelaProducao.innerHTML = "";


            const consultaUltimasProducoes =
                query(

                    collection(
                        db,
                        "producoes"
                    ),

                    where(
                        "idEmpresa",
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


            console.log(
                "RELATÓRIOS: ÚLTIMAS PRODUÇÕES OK:",
                dados.size
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

        } catch (error) {

            console.error(
                "RELATÓRIOS: ERRO NAS ÚLTIMAS PRODUÇÕES:",
                error
            );


            if (tabelaProducao) {

                tabelaProducao.innerHTML = `

                    <tr>

                        <td colspan="4">

                            Erro ao carregar produções.

                        </td>

                    </tr>

                `;

            }

        }

    }


    console.log(
        "RELATÓRIOS: FINALIZADO."
    );

}


// =======================================
// FORMATAR DATA
// =======================================

function formatarData(data) {

    if (!data) {

        return "-";

    }


    // Firebase Timestamp

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


    // Data YYYY-MM-DD

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

            const dados = [];


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
// FINAL
// =======================================

console.log(
    "RELATORIOS.JS V3 MULTIEMPRESA PRONTO"
);