// =======================================
// LOTRIX - DASHBOARD
// FIRESTORE + MULTIEMPRESA ISOLADO
//
// VERS?O CORRIGIDA
//
// PRODU??O:
// SOMENTE EMPRESA ATUAL
//
// ETIQUETAS:
// SOMENTE EMPRESA ATUAL
//
// ESTOQUE:
// SOMENTE EMPRESA ATUAL
//
// N?O MISTURA EMPRESAS
// =======================================

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("=================================");
console.log("LOTRIX DASHBOARD CARREGADO");
console.log("FIRESTORE: MULTIEMPRESA ISOLADO");
console.log("=================================");

let productionChart = null;


// =======================================
// USU?RIO ATUAL
// =======================================

function usuarioAtual() {

    try {

        const dados =
            localStorage.getItem(
                "usuarioFoodSync"
            );

        if (!dados) {

            console.warn(
                "usuarioFoodSync n?o encontrado."
            );

            return null;

        }

        const usuario =
            JSON.parse(dados);

        console.log(
            "USU?RIO ATUAL:",
            usuario
        );

        return usuario;

    } catch (error) {

        console.error(
            "Erro ao carregar usu?rio:",
            error
        );

        return null;

    }

}


// =======================================
// EMPRESA ATUAL
// =======================================

function empresaAtual() {

    const usuario =
        usuarioAtual();

    if (!usuario) {

        console.error(
            "Usu?rio n?o encontrado."
        );

        return null;

    }

    const idEmpresa =
        usuario.idEmpresa;

    if (!idEmpresa) {

        console.error(
            "ID DA EMPRESA N?O ENCONTRADO NO USU?RIO:",
            usuario
        );

        return null;

    }

    console.log(
        "EMPRESA ATUAL:",
        idEmpresa
    );

    return idEmpresa;

}


// =======================================
// VERIFICAR EMPRESA
// =======================================

function verificarEmpresa() {

    const idEmpresa =
        empresaAtual();

    if (!idEmpresa) {

        console.error(
            "N?o foi poss?vel identificar a empresa."
        );

        return false;

    }

    return true;

}


// =======================================
// DATA
// =======================================

function startOfDay(
    date = new Date()
) {

    return new Date(

        date.getFullYear(),

        date.getMonth(),

        date.getDate()

    );

}


// =======================================
// CONVERTER DATA
// =======================================

function toDate(value) {

    if (!value) {

        return null;

    }


    // Firestore Timestamp

    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    // Firestore Timestamp serializado

    if (
        typeof value === "object" &&
        value.seconds
    ) {

        return new Date(
            Number(value.seconds) * 1000
        );

    }


    // String YYYY-MM-DD

    if (
        typeof value === "string"
    ) {

        const match =
            value.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );

        if (match) {

            return new Date(

                Number(match[1]),

                Number(match[2]) - 1,

                Number(match[3])

            );

        }

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


// =======================================
// VERIFICAR HOJE
// =======================================

function isToday(value) {

    const date =
        toDate(value);

    if (!date) {

        return false;

    }

    return (

        startOfDay(date).getTime() ===

        startOfDay().getTime()

    );

}


// =======================================
// VERIFICAR DATA ESPECFICA
// =======================================

function isTodayFor(
    value,
    target
) {

    const date =
        toDate(value);

    if (!date) {

        return false;

    }

    return (

        startOfDay(date).getTime() ===

        startOfDay(target).getTime()

    );

}


// =======================================
// DATA FORMATADA
// =======================================

function dateText(value) {

    const date =
        toDate(value);

    if (!date) {

        return "Data n?o informada";

    }

    return date.toLocaleDateString(

        "pt-BR",

        {

            day: "2-digit",

            month: "short"

        }

    );

}


// =======================================
// ESCAPAR HTML
// =======================================

function escapeHtml(
    value = ""
) {

    return String(value).replace(

        /[&<>'"]/g,

        char => {

            const map = {

                "&": "&amp;",

                "<": "&lt;",

                ">": "&gt;",

                "'": "&#39;",

                '"': "&quot;"

            };

            return map[char];

        }

    );

}


// =======================================
// ALTERAR VALOR
// =======================================

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

    }

}


// =======================================
// REMOVER LOADING
// =======================================

function removeLoading() {

    document
        .querySelectorAll(
            ".is-loading"
        )
        .forEach(
            element => {

                element.classList.remove(
                    "is-loading"
                );

            }
        );

}


// =======================================
// ESTADO VAZIO
// =======================================

function renderEmpty(
    container,
    message,
    icon = "inbox"
) {

    if (!container) {

        return;

    }

    container.innerHTML = `

        <div class="empty-state">

            <i
                data-lucide="${icon}"
                aria-hidden="true">
            </i>

            <span>
                ${escapeHtml(message)}
            </span>

        </div>

    `;

}


// =======================================
// DIAS AT? VENCIMENTO
// =======================================

function daysUntil(value) {

    const date =
        toDate(value);

    if (!date) {

        return Infinity;

    }

    return Math.round(

        (

            startOfDay(date).getTime() -

            startOfDay().getTime()

        ) / 86400000

    );

}


// =======================================
// ATIVIDADES
// =======================================

function renderActivity(
    id,
    items,
    type
) {

    const container =
        document.getElementById(id);

    if (!container) {

        return;

    }


    if (!items.length) {

        renderEmpty(

            container,

            type === "produ??o"

                ? "Nenhuma produ??o registrada."

                : "Nenhuma etiqueta emitida.",

            type === "produ??o"

                ? "chef-hat"

                : "tag"

        );

        return;

    }


    container.innerHTML =

        items

            .slice(0, 5)

            .map(item => {

                const name =

                    item.produto ||

                    item.nomeProduto ||

                    "Produto sem nome";


                const date =

                    type === "produ??o"

                        ? (

                            item.dataProducao ||

                            item.criadoEm

                        )

                        : (

                            item.criadoEm ||

                            item.dataEtiqueta ||

                            item.dataProducao

                        );


                let detail;


                if (
                    type === "produ??o"
                ) {

                    detail = `

                        ${escapeHtml(
                            item.quantidade ?? 0
                        )}

                        ${escapeHtml(
                            item.unidade || "UN"
                        )}

                        ?

                        ${dateText(date)}

                    `;

                } else {

                    detail = `

                        Lote

                        ${escapeHtml(
                            item.lote ||
                            item.codigo ||
                            ""
                        )}

                        ?

                        ${dateText(date)}

                    `;

                }


                const icon =

                    type === "produ??o"

                        ? "chef-hat"

                        : "tag";


                return `

                    <div class="activity-item">

                        <span class="activity-icon">

                            <i
                                data-lucide="${icon}">
                            </i>

                        </span>

                        <div>

                            <strong>
                                ${escapeHtml(name)}
                            </strong>

                            <small>
                                ${detail}
                            </small>

                        </div>

                    </div>

                `;

            })

            .join("");

}


// =======================================
// VENCIMENTOS
// =======================================

function renderExpiring(
    items
) {

    const container =
        document.getElementById(
            "listaVencimentos"
        );

    if (!container) {

        return;

    }


    if (!items.length) {

        renderEmpty(

            container,

            "Nenhum produto pr?ximo do vencimento.",

            "circle-check"

        );

        return;

    }


    container.innerHTML =

        items

            .slice(0, 5)

            .map(item => {

                const days =
                    daysUntil(
                        item.validade
                    );


                let urgency;


                if (days <= 0) {

                    urgency = "critical";

                } else if (days <= 3) {

                    urgency = "urgent";

                } else {

                    urgency = "soon";

                }


                let label;


                if (days < 0) {

                    label =
                        "Vencido";

                } else if (days === 0) {

                    label =
                        "Vence hoje";

                } else if (days === 1) {

                    label =
                        "Vence amanh?";

                } else {

                    label =
                        `${days} dias`;

                }


                return `

                    <div class="attention-item">

                        <div>

                            <strong>

                                ${escapeHtml(
                                    item.produto ||
                                    item.nomeProduto ||
                                    "Produto sem nome"
                                )}

                            </strong>

                            <small>

                                Lote

                                ${escapeHtml(
                                    item.lote ||
                                    item.codigo ||
                                    ""
                                )}

                                ?

                                ${dateText(
                                    item.validade
                                )}

                            </small>

                        </div>

                        <span
                            class="status-pill ${urgency}">

                            ${label}

                        </span>

                    </div>

                `;

            })

            .join("");

}


// =======================================
// ESTOQUE CR?TICO
// =======================================

function renderStock(
    items
) {

    const container =
        document.getElementById(
            "listaEstoqueBaixo"
        );

    if (!container) {

        return;

    }


    if (!items.length) {

        renderEmpty(

            container,

            "Estoque dentro do n?vel m?nimo.",

            "circle-check"

        );

        return;

    }


    container.innerHTML =

        items

            .slice(0, 5)

            .map(item => {

                return `

                    <div class="attention-item">

                        <div>

                            <strong>

                                ${escapeHtml(
                                    item.produto ||
                                    item.nomeProduto ||
                                    "Produto sem nome"
                                )}

                            </strong>

                            <small>

                                ${Number(
                                    item.quantidade || 0
                                )}

                                ${escapeHtml(
                                    item.unidade || "UN"
                                )}

                                dispon?veis

                                ? m?nimo

                                ${Number(
                                    item.minimo || 0
                                )}

                            </small>

                        </div>

                        <span
                            class="status-pill critical">

                            Repor

                        </span>

                    </div>

                `;

            })

            .join("");

}


// =======================================
// RANKING
// =======================================

function renderTopProducts(
    productions
) {

    const container =
        document.getElementById(
            "produtosMaisProduzidos"
        );

    if (!container) {

        return;

    }


    const counts =
        productions.reduce(

            (acc, item) => {

                const name =

                    item.produto ||

                    item.nomeProduto ||

                    "Produto sem nome";


                const quantidade =

                    Number(
                        item.quantidade || 1
                    );


                acc[name] =

                    (acc[name] || 0) +

                    quantidade;


                return acc;

            },

            {}

        );


    const ranking =

        Object.entries(counts)

            .sort(
                (a, b) =>
                    b[1] - a[1]
            )

            .slice(0, 5);


    if (!ranking.length) {

        renderEmpty(

            container,

            "Ainda n?o h? produ??es registradas.",

            "package"

        );

        return;

    }


    const largest =
        ranking[0][1] || 1;


    container.innerHTML =

        ranking

            .map(
                ([name, quantity], index) => {

                    const width =

                        Math.max(

                            12,

                            (
                                quantity /
                                largest
                            ) * 100

                        );


                    return `

                        <li>

                            <span class="rank-number">

                                ${index + 1}

                            </span>

                            <div>

                                <strong>

                                    ${escapeHtml(
                                        name
                                    )}

                                </strong>

                                <span class="rank-bar">

                                    <i
                                        style="
                                            width:${width}%
                                        ">
                                    </i>

                                </span>

                            </div>

                            <b>

                                ${quantity}

                            </b>

                        </li>

                    `;

                }
            )

            .join("");

}


// =======================================
// GR?FICO
// =======================================

function renderChart(
    productions
) {

    if (
        typeof window.Chart ===
        "undefined"
    ) {

        console.warn(
            "Chart.js n?o carregado."
        );

        return;

    }


    const canvas =
        document.getElementById(
            "graficoProducao"
        );

    if (!canvas) {

        return;

    }


    const labels = [];

    const values = [];


    for (
        let index = 6;
        index >= 0;
        index--
    ) {

        const date =
            startOfDay();


        date.setDate(
            date.getDate() - index
        );


        labels.push(

            date

                .toLocaleDateString(

                    "pt-BR",

                    {
                        weekday: "short"
                    }

                )

                .replace(".", "")

        );


        values.push(

            productions.filter(

                item =>

                    isTodayFor(

                        item.dataProducao ||
                        item.criadoEm,

                        date

                    )

            ).length

        );

    }


    if (productionChart) {

        productionChart.destroy();

    }


    productionChart =

        new Chart(

            canvas,

            {

                type: "line",

                data: {

                    labels,

                    datasets: [

                        {

                            data: values,

                            borderColor:
                                "#2563EB",

                            backgroundColor:
                                "rgba(37,99,235,.10)",

                            fill: true,

                            tension: .4,

                            borderWidth: 3,

                            pointRadius: 4,

                            pointBackgroundColor:
                                "#FFFFFF",

                            pointBorderWidth: 3,

                            pointBorderColor:
                                "#2563EB"

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            display: false

                        },

                        tooltip: {

                            displayColors:
                                false,

                            backgroundColor:
                                "#182230",

                            padding: 10

                        }

                    },

                    scales: {

                        x: {

                            grid: {

                                display: false

                            },

                            border: {

                                display: false

                            }

                        },

                        y: {

                            beginAtZero: true,

                            ticks: {

                                precision: 0,

                                stepSize: 1

                            },

                            border: {

                                display: false

                            }

                        }

                    }

                }

            }

        );

}


// =======================================
// SAUDAO
// =======================================

function updateGreeting() {

    const hour =
        new Date().getHours();


    let period;


    if (hour < 12) {

        period = "Bom dia";

    } else if (hour < 18) {

        period = "Boa tarde";

    } else {

        period = "Boa noite";

    }


    const user =
        usuarioAtual() || {};


    setValue(

        "saudacao",

        `${period}, ${user.nome || "gestor"} ??`

    );


    setValue(

        "dataAtual",

        new Date().toLocaleDateString(

            "pt-BR",

            {

                weekday: "long",

                day: "numeric",

                month: "long"

            }

        )

    );

}


// =======================================
// CARREGAR COLEO
//
// MULTIEMPRESA
// =======================================

async function loadCollection(
    collectionName,
    idEmpresa
) {

    try {

        console.log(
            `CARREGANDO ${collectionName}`
        );

        console.log(
            "EMPRESA:",
            idEmpresa
        );


        if (!idEmpresa) {

            console.error(
                "ID EMPRESA AUSENTE."
            );

            return [];

        }


        const consulta =

            query(

                collection(
                    db,
                    collectionName
                ),

                where(
                    "idEmpresa",
                    "==",
                    idEmpresa
                )

            );


        const snapshot =

            await getDocs(
                consulta
            );


        const data =

            snapshot.docs.map(

                document => ({

                    id:
                        document.id,

                    ...document.data()

                })

            );


        console.log(

            `OK ${collectionName.toUpperCase()} DA EMPRESA ${idEmpresa}:`,

            data.length

        );


        return data;

    } catch (error) {

        console.error(

            `ERRO AO CARREGAR ${collectionName.toUpperCase()}:`,

            error

        );


        console.error(
            "Cdigo do erro:",
            error?.code
        );


        console.error(
            "Mensagem:",
            error?.message
        );


        return [];

    }

}


// =======================================
// CARREGAR DASHBOARD
// =======================================

async function loadDashboard() {

    console.log(
        "================================="
    );

    console.log(
        "CARREGANDO DASHBOARD..."
    );

    console.log(
        "================================="
    );


    // =================================
    // EMPRESA
    // =================================

    const idEmpresa =
        empresaAtual();


    if (!idEmpresa) {

        console.error(
            "DASHBOARD BLOQUEADO: EMPRESA N?O IDENTIFICADA."
        );

        setValue(
            "producoesHoje",
            "0"
        );

        setValue(
            "etiquetasHoje",
            "0"
        );

        setValue(
            "vencendoHoje",
            "0"
        );

        setValue(
            "estoqueCritico",
            "0"
        );

        removeLoading();

        return;

    }


    console.log(
        "================================="
    );

    console.log(
        "DASHBOARD MULTIEMPRESA"
    );

    console.log(
        "EMPRESA:",
        idEmpresa
    );

    console.log(
        "================================="
    );


    updateGreeting();


    let productions = [];

    let labels = [];

    let stock = [];


    // =================================
    // PRODU??ES
    // =================================

    productions =

        await loadCollection(

            "producoes",

            idEmpresa

        );


    // =================================
    // ETIQUETAS
    // =================================

    labels =

        await loadCollection(

            "etiquetas",

            idEmpresa

        );


    // =================================
    // ESTOQUE
    // =================================

    stock =

        await loadCollection(

            "estoque",

            idEmpresa

        );


    // =================================
    // RESUMO
    // =================================

    console.log(
        "================================="
    );

    console.log(
        "RESUMO DA EMPRESA:",
        idEmpresa
    );

    console.log(
        "TOTAL PRODU??ES:",
        productions.length
    );

    console.log(
        "TOTAL ETIQUETAS:",
        labels.length
    );

    console.log(
        "TOTAL ESTOQUE:",
        stock.length
    );

    console.log(
        "================================="
    );


    // =================================
    // ESTOQUE CR?TICO
    // =================================

    const criticalStock =

        stock.filter(item => {

            const quantidade =

                Number(
                    item.quantidade || 0
                );


            const minimo =

                Number(
                    item.minimo || 0
                );


            return (

                minimo > 0 &&

                quantidade <= minimo

            );

        });


    // =================================
    // VENCIMENTOS
    // =================================

    const expiring =

        labels

            .filter(item => {

                const days =

                    daysUntil(
                        item.validade
                    );


                return (

                    days >= 0 &&

                    days <= 30

                );

            })

            .sort(

                (a, b) =>

                    daysUntil(
                        a.validade
                    ) -

                    daysUntil(
                        b.validade
                    )

            );


    // =================================
    // M?TRICAS
    // =================================

    const producoesHoje =

        productions.filter(

            item =>

                isToday(

                    item.dataProducao ||

                    item.criadoEm

                )

        ).length;


    const etiquetasHoje =

        labels.filter(

            item =>

                isToday(

                    item.criadoEm ||

                    item.dataEtiqueta ||

                    item.dataProducao

                )

        ).length;


    const vencendoHoje =

        labels.filter(

            item =>

                daysUntil(

                    item.validade

                ) === 0

        ).length;


    // =================================
    // ATUALIZAR CARDS
    // =================================

    setValue(

        "producoesHoje",

        producoesHoje

    );


    setValue(

        "etiquetasHoje",

        etiquetasHoje

    );


    setValue(

        "vencendoHoje",

        vencendoHoje

    );


    setValue(

        "estoqueCritico",

        criticalStock.length

    );


    // =================================
    // LISTA DE PRODU??ES
    // =================================

    renderActivity(

        "listaProducao",

        [...productions].sort(

            (a, b) => {

                const dateA =

                    toDate(

                        a.dataProducao ||

                        a.criadoEm

                    ) || 0;


                const dateB =

                    toDate(

                        b.dataProducao ||

                        b.criadoEm

                    ) || 0;


                return dateB - dateA;

            }

        ),

        "produ??o"

    );


    // =================================
    // LISTA DE ETIQUETAS
    // =================================

    renderActivity(

        "listaEtiquetas",

        [...labels].sort(

            (a, b) => {

                const dateA =

                    toDate(

                        a.criadoEm ||

                        a.dataEtiqueta ||

                        a.dataProducao

                    ) || 0;


                const dateB =

                    toDate(

                        b.criadoEm ||

                        b.dataEtiqueta ||

                        b.dataProducao

                    ) || 0;


                return dateB - dateA;

            }

        ),

        "etiqueta"

    );


    // =================================
    // VENCIMENTOS
    // =================================

    renderExpiring(
        expiring
    );


    // =================================
    // ESTOQUE
    // =================================

    renderStock(
        criticalStock
    );


    // =================================
    // RANKING
    // =================================

    renderTopProducts(
        productions
    );


    // =================================
    // GR?FICO
    // =================================

    renderChart(
        productions
    );


    // =================================
    // ?CONES
    // =================================

    if (

        window.lucide &&

        typeof window.lucide.createIcons ===
        "function"

    ) {

        window.lucide.createIcons();

    }


    // =================================
    // FINALIZAO
    // =================================

    removeLoading();


    console.log(
        "================================="
    );

    console.log(
        "? DASHBOARD FINALIZADO"
    );

    console.log(
        "EMPRESA:",
        idEmpresa
    );

    console.log(
        "PRODU??ES:",
        productions.length
    );

    console.log(
        "ETIQUETAS:",
        labels.length
    );

    console.log(
        "ESTOQUE:",
        stock.length
    );

    console.log(
        "================================="
    );

}


// =======================================
// INICIALIZAR DASHBOARD
// =======================================

async function initDashboard() {

    console.log(
        "================================="
    );

    console.log(
        "INICIANDO LOTRIX DASHBOARD"
    );

    console.log(
        "================================="
    );


    try {

        // =================================
        // VERIFICAR EMPRESA
        // =================================

        if (
            !verificarEmpresa()
        ) {

            removeLoading();

            return;

        }


        await loadDashboard();


        console.log(
            "? DASHBOARD CARREGADO COM SUCESSO"
        );


    } catch (error) {

        console.error(
            "? ERRO AO INICIAR DASHBOARD:",
            error
        );


    } finally {

        // =================================
        // NUNCA DEIXAR LOADING PRESO
        // =================================

        removeLoading();


        if (

            window.lucide &&

            typeof window.lucide.createIcons ===
            "function"

        ) {

            window.lucide.createIcons();

        }

    }

}


// =======================================
// INICIAR QUANDO HTML ESTIVER PRONTO
// =======================================

if (

    document.readyState ===
    "loading"

) {

    document.addEventListener(

        "DOMContentLoaded",

        initDashboard

    );

} else {

    initDashboard();

}