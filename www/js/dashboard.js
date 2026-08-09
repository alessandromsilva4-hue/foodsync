// =======================================
// LOTRIX - DASHBOARD
// =======================================

import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("DASHBOARD.JS CARREGADO");

let productionChart = null;


// =======================================
// DATA
// =======================================

function startOfDay(date = new Date()) {

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

    if (typeof value.toDate === "function") {

        return value.toDate();

    }

    if (typeof value === "string") {

        const match = value.match(
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

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {

        return null;

    }

    return date;

}


// =======================================
// VERIFICAR HOJE
// =======================================

function isToday(value) {

    const date = toDate(value);

    if (!date) {
        return false;
    }

    return (
        startOfDay(date).getTime() ===
        startOfDay().getTime()
    );

}


// =======================================
// DATA FORMATADA
// =======================================

function dateText(value) {

    const date = toDate(value);

    if (!date) {

        return "Data não informada";

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

function escapeHtml(value = "") {

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

function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent = value;

    }

}


// =======================================
// REMOVER LOADING
// =======================================

function removeLoading() {

    document
        .querySelectorAll(".is-loading")
        .forEach(element => {

            element.classList.remove(
                "is-loading"
            );

        });

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
// DIAS ATÉ VENCIMENTO
// =======================================

function daysUntil(value) {

    const date = toDate(value);

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

            type === "produção"
                ? "Nenhuma produção registrada."
                : "Nenhuma etiqueta emitida.",

            type === "produção"
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
                    type === "produção"

                        ? item.dataProducao

                        : (
                            item.criadoEm ||
                            item.dataEtiqueta ||
                            item.dataProducao
                        );


                let detail;


                if (type === "produção") {

                    detail = `

                        ${escapeHtml(
                            item.quantidade ?? 0
                        )}

                        ${escapeHtml(
                            item.unidade || "UN"
                        )}

                        ·

                        ${dateText(date)}

                    `;

                } else {

                    detail = `

                        Lote

                        ${escapeHtml(
                            item.lote ||
                            item.codigo ||
                            "—"
                        )}

                        ·

                        ${dateText(date)}

                    `;

                }


                const icon =
                    type === "produção"
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

function renderExpiring(items) {

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

            "Nenhum produto próximo do vencimento.",

            "circle-check"

        );

        return;

    }


    container.innerHTML =

        items
            .slice(0, 5)
            .map(item => {

                const days =
                    daysUntil(item.validade);


                let urgency;

                if (days <= 0) {

                    urgency = "critical";

                } else if (days <= 3) {

                    urgency = "urgent";

                } else {

                    urgency = "soon";

                }


                let label;


                if (days === 0) {

                    label = "Vence hoje";

                } else if (days === 1) {

                    label = "Vence amanhã";

                } else {

                    label = `${days} dias`;

                }


                return `

                    <div class="attention-item">

                        <div>

                            <strong>

                                ${escapeHtml(
                                    item.produto ||
                                    "Produto sem nome"
                                )}

                            </strong>

                            <small>

                                Lote

                                ${escapeHtml(
                                    item.lote ||
                                    item.codigo ||
                                    "—"
                                )}

                                ·

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
// ESTOQUE CRÍTICO
// =======================================

function renderStock(items) {

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

            "Estoque dentro do nível mínimo.",

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

                                disponíveis

                                · mínimo

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

            "Ainda não há produções registradas.",

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
// GRÁFICO
// =======================================

function renderChart(
    productions
) {

    if (
        typeof window.Chart ===
        "undefined"
    ) {

        console.warn(
            "Chart.js não carregado."
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
                        item.dataProducao,
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
// DATA DO GRÁFICO
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
// SAUDAÇÃO
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


    let user = {};


    try {

        user =
            JSON.parse(
                localStorage.getItem(
                    "usuarioFoodSync"
                ) || "{}"
            );

    } catch (error) {

        console.warn(
            "Não foi possível ler usuário."
        );

    }


    setValue(
        "saudacao",
        `${period}, ${user.nome || "gestor"} 👋`
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
// CARREGAR DASHBOARD
// =======================================

async function loadDashboard() {

    console.log(
        "CARREGANDO DASHBOARD..."
    );


    updateGreeting();


    try {

        const [

            productionSnapshot,

            labelSnapshot,

            stockSnapshot

        ] = await Promise.all([

            getDocs(
                collection(
                    db,
                    "producoes"
                )
            ),

            getDocs(
                collection(
                    db,
                    "etiquetas"
                )
            ),

            getDocs(
                collection(
                    db,
                    "estoque"
                )
            )

        ]);


        const productions =
            productionSnapshot.docs.map(
                document =>
                    document.data()
            );


        const labels =
            labelSnapshot.docs.map(
                document =>
                    document.data()
            );


        const stock =
            stockSnapshot.docs.map(
                document =>
                    document.data()
            );


        console.log(
            "Produções:",
            productions.length
        );


        console.log(
            "Etiquetas:",
            labels.length
        );


        console.log(
            "Estoque:",
            stock.length
        );


        // =================================
        // ESTOQUE CRÍTICO
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
                        daysUntil(a.validade) -
                        daysUntil(b.validade)
                );


        // =================================
        // MÉTRICAS
        // =================================

        const producoesHoje =
            productions.filter(
                item =>
                    isToday(
                        item.dataProducao
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
        // LISTAS
        // =================================

        renderActivity(

            "listaProducao",

            [...productions].sort(
                (a, b) => {

                    const dateA =
                        toDate(
                            a.dataProducao
                        ) || 0;

                    const dateB =
                        toDate(
                            b.dataProducao
                        ) || 0;

                    return dateB - dateA;

                }
            ),

            "produção"

        );


        renderActivity(

            "listaEtiquetas",

            [...labels].sort(
                (a, b) => {

                    const dateA =
                        toDate(
                            a.criadoEm ||
                            a.dataProducao
                        ) || 0;

                    const dateB =
                        toDate(
                            b.criadoEm ||
                            b.dataProducao
                        ) || 0;

                    return dateB - dateA;

                }
            ),

            "etiqueta"

        );


        renderExpiring(
            expiring
        );


        renderStock(
            criticalStock
        );


        renderTopProducts(
            productions
        );


        renderChart(
            productions
        );


    } catch (error) {

        console.error(
            "ERRO AO CARREGAR DASHBOARD:",
            error
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


        document
            .querySelectorAll(
                ".activity-list, .attention-list, .rank-list"
            )
            .forEach(element => {

                renderEmpty(

                    element,

                    "Não foi possível carregar estes dados.",

                    "triangle-alert"

                );

            });

    } finally {

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
// INICIALIZAÇÃO
// =======================================

document.addEventListener(
    "DOMContentLoaded",
    loadDashboard
);