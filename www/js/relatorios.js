// =======================================
// LOTRIX - RELATÓRIOS
// V5 - PERFORMANCE + MULTIEMPRESA
// PROTEÇÃO DE CARGA
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


console.log("=======================================");
console.log("RELATORIOS.JS V5 LOTRIX CARREGADO");
console.log("PERFORMANCE + MULTIEMPRESA");
console.log("=======================================");


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
// LIMITES DE SEGURANÇA
// =======================================

const LIMITES = Object.freeze({

    producoes: 30,

    etiquetas: 50,

    produtos: 50,

    estoque: 50,

    tabela: 10,

    grafico: 8

});


// =======================================
// CONTROLE
// =======================================

let graficoInstance = null;

let relatorioCarregando = false;

let relatorioFinalizado = false;


// =======================================
// EMPRESA
// =======================================

function obterEmpresaId() {

    try {

        const perfilSalvo =
            localStorage.getItem(
                "usuarioFoodSync"
            );


        if (!perfilSalvo) {

            console.error(
                "RELATÓRIOS: perfil não encontrado."
            );

            return null;
        }


        const perfil =
            JSON.parse(
                perfilSalvo
            );


        if (
            !perfil ||
            !perfil.idEmpresa
        ) {

            console.error(
                "RELATÓRIOS: idEmpresa não encontrado."
            );

            return null;
        }


        return String(
            perfil.idEmpresa
        );

    } catch (error) {

        console.error(
            "RELATÓRIOS: erro ao ler perfil:",
            error
        );

        return null;
    }
}


// =======================================
// ESCAPAR HTML
// =======================================

function escaparHTML(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "";
    }


    return String(valor)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
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
        typeof data.toDate === "function"
    ) {

        try {

            return data
                .toDate()
                .toLocaleDateString(
                    "pt-BR"
                );

        } catch {

            return "-";
        }
    }


    // Timestamp antigo

    if (
        typeof data === "object" &&
        data !== null &&
        data.seconds !== undefined
    ) {

        try {

            const convertido =
                new Date(
                    data.seconds * 1000
                );


            if (
                !Number.isNaN(
                    convertido.getTime()
                )
            ) {

                return convertido
                    .toLocaleDateString(
                        "pt-BR"
                    );
            }

        } catch {

            return "-";
        }
    }


    // YYYY-MM-DD

    if (
        typeof data === "string"
    ) {

        const partes =
            data.split("-");


        if (
            partes.length === 3 &&
            partes[0].length === 4
        ) {

            return (
                `${partes[2]}/${partes[1]}/${partes[0]}`
            );
        }


        try {

            const convertido =
                new Date(data);


            if (
                !Number.isNaN(
                    convertido.getTime()
                )
            ) {

                return convertido
                    .toLocaleDateString(
                        "pt-BR"
                    );
            }

        } catch {

            return "-";
        }
    }


    return String(data);
}


// =======================================
// DESTRUIR GRÁFICO
// =======================================

function destruirGrafico() {

    if (!graficoInstance) {

        return;
    }


    try {

        graficoInstance.destroy();

    } catch (error) {

        console.warn(
            "RELATÓRIOS: erro ao destruir gráfico:",
            error
        );
    }


    graficoInstance = null;
}


// =======================================
// CARREGAR PRODUÇÕES
// =======================================

async function carregarProducoes(
    empresaId
) {

    console.log(
        "RELATÓRIOS: buscando últimas produções..."
    );


    const consulta =
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

            limit(
                LIMITES.producoes
            )

        );


    const snapshot =
        await getDocs(
            consulta
        );


    console.log(
        "RELATÓRIOS: produções carregadas:",
        snapshot.size
    );


    // ===================================
    // CARD
    // ===================================

    if (totalProducoes) {

        totalProducoes.innerText =
            snapshot.size >=
            LIMITES.producoes

                ? `${LIMITES.producoes}+`

                : snapshot.size;
    }


    // ===================================
    // SEM DADOS
    // ===================================

    if (
        snapshot.empty
    ) {

        if (tabelaProducao) {

            tabelaProducao.innerHTML = `
                <tr>
                    <td colspan="4">
                        Sem dados
                    </td>
                </tr>
            `;
        }


        destruirGrafico();

        return;
    }


    const dadosGrafico =
        Object.create(null);


    const linhas = [];


    let contadorTabela = 0;


    snapshot.forEach(
        (documento) => {

            const p =
                documento.data();


            const produto =
                p.produto ||
                "Sem nome";


            const quantidade =
                Number(
                    p.quantidade || 0
                );


            // ---------------------------
            // DADOS DO GRÁFICO
            // ---------------------------

            if (
                !dadosGrafico[produto]
            ) {

                dadosGrafico[produto] =
                    0;
            }


            dadosGrafico[produto] +=
                quantidade;


            // ---------------------------
            // TABELA
            // ---------------------------

            if (
                contadorTabela <
                LIMITES.tabela
            ) {

                linhas.push(`

                    <tr>

                        <td>
                            ${escaparHTML(
                                produto
                            )}
                        </td>

                        <td>
                            ${escaparHTML(
                                p.quantidade || 0
                            )}
                        </td>

                        <td>
                            ${escaparHTML(
                                p.responsavel || "-"
                            )}
                        </td>

                        <td>
                            ${escaparHTML(
                                formatarData(
                                    p.dataProducao ||
                                    p.criadoEm
                                )
                            )}
                        </td>

                    </tr>

                `);


                contadorTabela++;
            }

        }
    );


    if (tabelaProducao) {

        tabelaProducao.innerHTML =
            linhas.join("");
    }


    criarGrafico(
        dadosGrafico
    );
}


// =======================================
// CRIAR GRÁFICO
// =======================================

function criarGrafico(
    dadosGrafico
) {

    if (
        !graficoProducao
    ) {

        return;
    }


    if (
        typeof Chart ===
        "undefined"
    ) {

        console.warn(
            "RELATÓRIOS: Chart.js não carregado."
        );

        return;
    }


    destruirGrafico();


    const ranking =
        Object.entries(
            dadosGrafico
        )

        .map(
            ([nome, valor]) => ({

                nome:
                    String(nome),

                valor:
                    Number(valor) || 0

            })
        )

        .sort(
            (a, b) =>
                b.valor -
                a.valor
        )

        .slice(
            0,
            LIMITES.grafico
        );


    if (
        ranking.length === 0
    ) {

        return;
    }


    try {

        graficoInstance =
            new Chart(
                graficoProducao,
                {

                    type: "bar",


                    data: {

                        labels:
                            ranking.map(
                                item =>
                                    item.nome
                            ),


                        datasets: [

                            {

                                label:
                                    "Quantidade Produzida",

                                data:
                                    ranking.map(
                                        item =>
                                            item.valor
                                    )

                            }

                        ]

                    },


                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        animation: false,

                        parsing: false,

                        normalized: true,


                        plugins: {

                            legend: {

                                display: true

                            }

                        },


                        scales: {

                            x: {

                                ticks: {

                                    autoSkip: true,

                                    maxTicksLimit:
                                        LIMITES.grafico,

                                    maxRotation: 45,

                                    minRotation: 0

                                }

                            }

                        }

                    }

                }
            );

    } catch (error) {

        console.error(
            "RELATÓRIOS: erro ao criar gráfico:",
            error
        );

        graficoInstance = null;
    }
}


// =======================================
// ETIQUETAS
// =======================================

async function carregarEtiquetas(
    empresaId
) {

    console.log(
        "RELATÓRIOS: buscando etiquetas..."
    );


    const consulta =
        query(

            collection(
                db,
                "etiquetas"
            ),

            where(
                "idEmpresa",
                "==",
                empresaId
            ),

            limit(
                LIMITES.etiquetas
            )

        );


    const snapshot =
        await getDocs(
            consulta
        );


    console.log(
        "RELATÓRIOS: etiquetas carregadas:",
        snapshot.size
    );


    if (totalEtiquetas) {

        totalEtiquetas.innerText =
            snapshot.size >=
            LIMITES.etiquetas

                ? `${LIMITES.etiquetas}+`

                : snapshot.size;
    }
}


// =======================================
// PRODUTOS
// =======================================

async function carregarProdutos(
    empresaId
) {

    console.log(
        "RELATÓRIOS: buscando produtos..."
    );


    const consulta =
        query(

            collection(
                db,
                "produtos"
            ),

            where(
                "empresas",
                "array-contains",
                empresaId
            ),

            limit(
                LIMITES.produtos
            )

        );


    const snapshot =
        await getDocs(
            consulta
        );


    console.log(
        "RELATÓRIOS: produtos carregados:",
        snapshot.size
    );


    if (totalProdutos) {

        totalProdutos.innerText =
            snapshot.size >=
            LIMITES.produtos

                ? `${LIMITES.produtos}+`

                : snapshot.size;
    }
}


// =======================================
// ESTOQUE
// =======================================

async function carregarEstoque(
    empresaId
) {

    console.log(
        "RELATÓRIOS: buscando estoque..."
    );


    const consulta =
        query(

            collection(
                db,
                "estoque"
            ),

            where(
                "idEmpresa",
                "==",
                empresaId
            ),

            limit(
                LIMITES.estoque
            )

        );


    const snapshot =
        await getDocs(
            consulta
        );


    console.log(
        "RELATÓRIOS: estoque carregado:",
        snapshot.size
    );


    let baixo = 0;


    snapshot.forEach(
        (documento) => {

            const estoque =
                documento.data();


            const quantidade =
                Number(
                    estoque.quantidade || 0
                );


            const minimo =
                Number(
                    estoque.minimo || 0
                );


            if (
                quantidade <=
                minimo
            ) {

                baixo++;
            }

        }
    );


    if (totalEstoqueBaixo) {

        totalEstoqueBaixo.innerText =
            snapshot.size >=
            LIMITES.estoque

                ? `${baixo}+`

                : baixo;
    }
}


// =======================================
// ERRO NO CARD
// =======================================

function mostrarErroCard(
    elemento
) {

    if (elemento) {

        elemento.innerText =
            "—";
    }
}


// =======================================
// CARREGAR RELATÓRIOS
// =======================================

async function carregarRelatorios() {

    if (
        relatorioCarregando ||
        relatorioFinalizado
    ) {

        console.warn(
            "RELATÓRIOS: carregamento ignorado."
        );

        return;
    }


    relatorioCarregando =
        true;


    console.log(
        "RELATÓRIOS: iniciando carregamento..."
    );


    try {

        const empresaId =
            obterEmpresaId();


        if (!empresaId) {

            console.error(
                "RELATÓRIOS: empresa não identificada."
            );

            return;
        }


        // ===================================
        // PLACEHOLDERS
        // ===================================

        if (totalProducoes) {

            totalProducoes.innerText =
                "...";
        }


        if (totalEtiquetas) {

            totalEtiquetas.innerText =
                "...";
        }


        if (totalProdutos) {

            totalProdutos.innerText =
                "...";
        }


        if (totalEstoqueBaixo) {

            totalEstoqueBaixo.innerText =
                "...";
        }


        // ===================================
        // 1. PRODUÇÕES
        // ===================================

        try {

            await carregarProducoes(
                empresaId
            );

        } catch (error) {

            console.error(
                "RELATÓRIOS: erro em produções:",
                error
            );

            mostrarErroCard(
                totalProducoes
            );
        }


        // ===================================
        // 2. ETIQUETAS
        // ===================================

        try {

            await carregarEtiquetas(
                empresaId
            );

        } catch (error) {

            console.error(
                "RELATÓRIOS: erro em etiquetas:",
                error
            );

            mostrarErroCard(
                totalEtiquetas
            );
        }


        // ===================================
        // 3. PRODUTOS
        // ===================================

        try {

            await carregarProdutos(
                empresaId
            );

        } catch (error) {

            console.error(
                "RELATÓRIOS: erro em produtos:",
                error
            );

            mostrarErroCard(
                totalProdutos
            );
        }


        // ===================================
        // 4. ESTOQUE
        // ===================================

        try {

            await carregarEstoque(
                empresaId
            );

        } catch (error) {

            console.error(
                "RELATÓRIOS: erro em estoque:",
                error
            );

            mostrarErroCard(
                totalEstoqueBaixo
            );
        }


        console.log(
            "======================================="
        );

        console.log(
            "RELATÓRIOS: CARREGAMENTO FINALIZADO"
        );

        console.log(
            "Empresa:",
            empresaId
        );

        console.log(
            "=======================================");


        relatorioFinalizado =
            true;

    } catch (error) {

        console.error(
            "RELATÓRIOS: erro geral:",
            error
        );

    } finally {

        relatorioCarregando =
            false;
    }
}


// =======================================
// EXPORTAR EXCEL
// =======================================

window.exportarExcel =
    function () {

        const tabela =
            document.querySelector(
                "table"
            );


        if (!tabela) {

            alert(
                "Tabela não encontrada."
            );

            return;
        }


        if (
            typeof XLSX ===
            "undefined"
        ) {

            alert(
                "A biblioteca XLSX não foi carregada."
            );

            return;
        }


        try {

            const workbook =
                XLSX.utils.table_to_book(
                    tabela
                );


            XLSX.writeFile(
                workbook,
                "relatorio-lotrix.xlsx"
            );

        } catch (error) {

            console.error(
                "RELATÓRIOS: erro ao exportar Excel:",
                error
            );

            alert(
                "Não foi possível exportar o relatório."
            );
        }
    };


// =======================================
// EXPORTAR CSV
// =======================================

window.exportarCSV =
    function () {

        const tabela =
            document.querySelector(
                "table"
            );


        if (!tabela) {

            alert(
                "Tabela não encontrada."
            );

            return;
        }


        const linhas = [];


        tabela
            .querySelectorAll("tr")
            .forEach(
                linha => {

                    const dados = [];


                    linha
                        .querySelectorAll(
                            "th, td"
                        )
                        .forEach(
                            coluna => {

                                const texto =
                                    (
                                        coluna.innerText ||
                                        ""
                                    )
                                    .replace(
                                        /"/g,
                                        '""'
                                    );


                                dados.push(
                                    `"${texto}"`
                                );

                            }
                        );


                    linhas.push(
                        dados.join(";")
                    );

                }
            );


        const arquivo =
            linhas.join("\n");


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


        const url =
            URL.createObjectURL(
                blob
            );


        link.href =
            url;


        link.download =
            "relatorio-lotrix.csv";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(
            () => {

                URL.revokeObjectURL(
                    url
                );

            },
            1000
        );
    };


// =======================================
// IMPRIMIR
// =======================================

window.imprimirRelatorio =
    function () {

        window.print();

    };


// =======================================
// INICIALIZAÇÃO
// =======================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * Pequeno atraso para deixar:
         * - DOM
         * - sidebar
         * - Firebase
         * - Chart.js
         * estabilizarem antes das consultas.
         */

        setTimeout(
            () => {

                carregarRelatorios();

            },
            200
        );

    },
    {
        once: true
    }
);


// =======================================
// FINAL
// =======================================

console.log(
    "RELATORIOS.JS V5 LOTRIX PRONTO"
);
