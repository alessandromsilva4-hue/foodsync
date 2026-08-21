// =======================================
// LOTRIX - DASHBOARD V2
// FIRESTORE + MULTIEMPRESA ISOLADO
//
// PRODUÇÃO:
// SOMENTE EMPRESA ATUAL
//
// ETIQUETAS:
// SOMENTE EMPRESA ATUAL
//
// ESTOQUE:
// SOMENTE EMPRESA ATUAL
//
// NÃO MISTURA EMPRESAS
// =======================================

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


console.log("=================================");
console.log("LOTRIX DASHBOARD V2 CARREGADO");
console.log("FIRESTORE: MULTIEMPRESA ISOLADO");
console.log("=================================");


let productionChart = null;


// =======================================
// USUÁRIO ATUAL
// =======================================

function usuarioAtual() {

    try {

        const dados =
            localStorage.getItem(
                "usuarioFoodSync"
            );

        if (!dados) {

            console.warn(
                "usuarioFoodSync não encontrado."
            );

            return null;

        }

        return JSON.parse(dados);

    } catch (error) {

        console.error(
            "Erro ao carregar usuário:",
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
            "Usuário não encontrado."
        );

        return null;

    }

    const idEmpresa =
        usuario.idEmpresa;

    if (!idEmpresa) {

        console.error(
            "ID DA EMPRESA NÃO ENCONTRADO:",
            usuario
        );

        return null;

    }

    console.log(
        "🏢 EMPRESA ATUAL:",
        idEmpresa
    );

    return idEmpresa;

}


// =======================================
// VERIFICAR EMPRESA
// =======================================

function verificarEmpresa() {

    return !!empresaAtual();

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


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    if (
        typeof value === "object" &&
        value.seconds !== undefined
    ) {

        return new Date(
            Number(value.seconds) * 1000
        );

    }


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
// VERIFICAR DATA
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

        return "Data não informada";

    }

    return date.toLocaleDateString(
        "pt-BR",
        {
            day: "2-digit",
            month: "short"
        }
    ).replace(".", "");

}


// =======================================
// HORA FORMATADA
// =======================================

function timeText(value) {

    const date =
        toDate(value);

    if (!date) {

        return "";

    }

    const hours =
        date.getHours();

    const minutes =
        date.getMinutes();

    /*
     * Evita mostrar 00:00 quando
     * o banco não possui horário real.
     */

    if (
        hours === 0 &&
        minutes === 0
    ) {

        return "";

    }

    return date.toLocaleTimeString(
        "pt-BR",
        {
            hour: "2-digit",
            minute: "2-digit"
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

    createIcons();

}


// =======================================
// ÍCONES
// =======================================

function createIcons() {

    if (
        window.lucide &&
        typeof window.lucide.createIcons ===
        "function"
    ) {

        window.lucide.createIcons();

    }

}


// =======================================
// DIAS ATÉ VENCIMENTO
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

                        ? (
                            item.dataProducao ||
                            item.criadoEm
                        )

                        : (
                            item.criadoEm ||
                            item.dataEtiqueta ||
                            item.dataProducao
                        );


                const formattedDate =
                    dateText(date);


                const formattedTime =
                    timeText(date);


                let detail;


                if (
                    type === "produção"
                ) {

                    detail = `

                        ${escapeHtml(
                            item.quantidade ?? 0
                        )}

                        ${escapeHtml(
                            item.unidade || "UN"
                        )}

                        ·

                        ${formattedDate}

                        ${
                            formattedTime
                                ? ` · ${formattedTime}`
                                : ""
                        }

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

                        ${formattedDate}

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


    createIcons();

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
                    daysUntil(
                        item.validade
                    );


                let urgency;
                let label;


                if (days < 0) {

                    urgency = "critical";
                    label = "Vencido";

                } else if (days === 0) {

                    urgency = "critical";
                    label = "Vence hoje";

                } else if (days === 1) {

                    urgency = "urgent";
                    label = "Amanhã";

                } else if (days <= 3) {

                    urgency = "urgent";
                    label = `${days} dias`;

                } else {

                    urgency = "soon";
                    label = `${days} dias`;

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
                                    "—"
                                )}

                                ·

                                ${dateText(
                                    item.validade
                                )}

                            </small>

                        </div>


                        <span
                            class="status-pill ${urgency}"
                        >

                            ${label}

                        </span>

                    </div>

                `;

            })
            .join("");


    createIcons();

}


// =======================================
// ESTOQUE CRÍTICO
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
            "Estoque dentro do nível mínimo.",
            "circle-check"
        );

        return;

    }


    const sorted =
        [...items].sort(
            (a, b) => {

                const qa =
                    Number(a.quantidade || 0);

                const ma =
                    Number(a.minimo || 0);

                const qb =
                    Number(b.quantidade || 0);

                const mb =
                    Number(b.minimo || 0);

                const ratioA =
                    ma > 0 ? qa / ma : 999;

                const ratioB =
                    mb > 0 ? qb / mb : 999;

                return ratioA - ratioB;

            }
        );


    container.innerHTML =

        sorted
            .slice(0, 5)
            .map(item => {

                const quantidade =
                    Number(
                        item.quantidade || 0
                    );

                const minimo =
                    Number(
                        item.minimo || 0
                    );


                const zerado =
                    quantidade <= 0;


                const percentual =
                    minimo > 0
                        ? Math.round(
                            (quantidade / minimo) * 100
                        )
                        : 100;


                const status =
                    zerado
                        ? "Zerado"
                        : "Repor";


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

                                ${quantidade}

                                ${escapeHtml(
                                    item.unidade || "UN"
                                )}

                                disponíveis

                                · mínimo

                                ${minimo}

                                · ${percentual}%

                            </small>

                        </div>


                        <span
                            class="status-pill critical"
                        >

                            ${status}

                        </span>

                    </div>

                `;

            })
            .join("");


    createIcons();

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
                    (
                        Number.isFinite(
                            quantidade
                        )
                            ? quantidade
                            : 1
                    );


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

                            <span
                                class="rank-number"
                                title="Posição ${index + 1}"
                            >

                                ${index + 1}

                            </span>


                            <div>

                                <strong>
                                    ${escapeHtml(name)}
                                </strong>


                                <span class="rank-bar">

                                    <i
                                        style="width:${width}%"
                                    ></i>

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
                .replace(/^./, char =>
                    char.toUpperCase()
                )

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

                            label:
                                "Produções",

                            data:
                                values,

                            borderColor:
                                "#2563EB",

                            backgroundColor:
                                "rgba(37,99,235,.10)",

                            fill:
                                true,

                            tension:
                                .4,

                            borderWidth:
                                3,

                            pointRadius:
                                4,

                            pointHoverRadius:
                                6,

                            pointBackgroundColor:
                                "#FFFFFF",

                            pointBorderWidth:
                                3,

                            pointBorderColor:
                                "#2563EB"

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,


                    interaction: {

                        intersect:
                            false,

                        mode:
                            "index"

                    },


                    plugins: {

                        legend: {

                            display:
                                false

                        },


                        tooltip: {

                            displayColors:
                                false,

                            backgroundColor:
                                "#182230",

                            padding:
                                10,

                            callbacks: {

                                label:
                                    context =>
                                        ` ${context.parsed.y} produção(ões)`

                            }

                        }

                    },


                    scales: {

                        x: {

                            grid: {

                                display:
                                    false

                            },

                            border: {

                                display:
                                    false

                            }

                        },


                        y: {

                            beginAtZero:
                                true,

                            ticks: {

                                precision:
                                    0,

                                stepSize:
                                    1

                            },

                            border: {

                                display:
                                    false

                            }

                        }

                    }

                }

            }
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


    const user =
        usuarioAtual() || {};


    const nome =
        user.nome ||
        "gestor";


    setValue(
        "saudacao",
        `${period}, ${nome} 👋`
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
// CARREGAR COLEÇÃO
//
// MULTIEMPRESA
// =======================================

async function loadCollection(
    collectionName,
    idEmpresa
) {

    try {

        if (!idEmpresa) {

            console.error(
                "ID EMPRESA AUSENTE."
            );

            return [];

        }


        console.log(
            `📥 CARREGANDO ${collectionName} — EMPRESA ${idEmpresa}`
        );


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
            await getDocs(consulta);


        const data =
            snapshot.docs.map(
                document => ({

                    id:
                        document.id,

                    ...document.data()

                })
            );


        console.log(
            `✅ ${collectionName.toUpperCase()}: ${data.length}`
        );


        return data;

    } catch (error) {

        console.error(
            `❌ ERRO ${collectionName}:`,
            error
        );

        return [];

    }

}


// =======================================
// ATUALIZAR DESCRIÇÕES DOS CARDS
// =======================================

function updateMetricDescriptions(
    vencidos,
    estoqueZerado
) {

    const vencimentoDescricao =
        document.getElementById(
            "vencendoHojeDescricao"
        );


    if (vencimentoDescricao) {

        if (vencidos > 0) {

            vencimentoDescricao.textContent =
                `${vencidos} etiqueta(s) vencida(s)`;

        } else {

            vencimentoDescricao.textContent =
                "Produtos para revisar";

        }

    }


    const estoqueDescricao =
        document.getElementById(
            "estoqueCriticoDescricao"
        );


    if (estoqueDescricao) {

        if (estoqueZerado > 0) {

            estoqueDescricao.textContent =
                `${estoqueZerado} produto(s) zerado(s)`;

        } else {

            estoqueDescricao.textContent =
                "Abaixo do mínimo";

        }

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
        "CARREGANDO DASHBOARD V2..."
    );

    console.log(
        "================================="
    );


    const idEmpresa =
        empresaAtual();


    if (!idEmpresa) {

        console.error(
            "DASHBOARD BLOQUEADO: EMPRESA NÃO IDENTIFICADA."
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


    updateGreeting();


    // =================================
    // CARREGAR DADOS
    // =================================

    const [

        productions,

        labels,

        stock

    ] = await Promise.all([

        loadCollection(
            "producoes",
            idEmpresa
        ),

        loadCollection(
            "etiquetas",
            idEmpresa
        ),

        loadCollection(
            "estoque",
            idEmpresa
        )

    ]);


    console.log(
        "================================="
    );

    console.log(
        "RESUMO:",
        {
            empresa: idEmpresa,
            producoes: productions.length,
            etiquetas: labels.length,
            estoque: stock.length
        }
    );

    console.log(
        "================================="
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


    const estoqueZerado =

        stock.filter(item => {

            return (
                Number(
                    item.quantidade || 0
                ) <= 0
            );

        }).length;


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
                    days <= 30 &&
                    days !== Infinity
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


    const vencidos =

        labels.filter(item => {

            return (
                daysUntil(
                    item.validade
                ) < 0
            );

        }).length;


    // =================================
    // PRODUÇÕES HOJE
    // =================================

    const producoesHoje =

        productions.filter(item => {

            return isToday(

                item.dataProducao ||
                item.criadoEm

            );

        }).length;


    // =================================
    // ETIQUETAS HOJE
    // =================================

    const etiquetasHoje =

        labels

            .filter(item => {

                return isToday(

                    item.criadoEm ||
                    item.dataEtiqueta ||
                    item.dataProducao

                );

            })

            .reduce(

                (total, item) => {

                    const quantidade =
                        Number(
                            item.quantidade
                        );


                    return total +

                        (
                            Number.isFinite(
                                quantidade
                            ) &&
                            quantidade > 0

                                ? quantidade

                                : 1
                        );

                },

                0

            );


    // =================================
    // VENCENDO HOJE
    // =================================

    const vencendoHoje =

        labels.filter(item => {

            return (
                daysUntil(
                    item.validade
                ) === 0
            );

        }).length;


    // =================================
    // CARDS
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


    updateMetricDescriptions(
        vencidos,
        estoqueZerado
    );


    // =================================
    // PRODUÇÕES
    // =================================

    const sortedProductions =

        [...productions].sort(

            (a, b) => {

                const dateA =
                    toDate(
                        a.dataProducao ||
                        a.criadoEm
                    );

                const dateB =
                    toDate(
                        b.dataProducao ||
                        b.criadoEm
                    );


                return (
                    (dateB?.getTime() || 0) -
                    (dateA?.getTime() || 0)
                );

            }

        );


    renderActivity(
        "listaProducao",
        sortedProductions,
        "produção"
    );


    // =================================
    // ETIQUETAS
    // =================================

    const sortedLabels =

        [...labels].sort(

            (a, b) => {

                const dateA =
                    toDate(
                        a.criadoEm ||
                        a.dataEtiqueta ||
                        a.dataProducao
                    );

                const dateB =
                    toDate(
                        b.criadoEm ||
                        b.dataEtiqueta ||
                        b.dataProducao
                    );


                return (
                    (dateB?.getTime() || 0) -
                    (dateA?.getTime() || 0)
                );

            }

        );


    renderActivity(
        "listaEtiquetas",
        sortedLabels,
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
    // GRÁFICO
    // =================================

    renderChart(
        productions
    );


    // =================================
    // ÍCONES
    // =================================

    createIcons();


    // =================================
    // FINALIZAÇÃO
    // =================================

    removeLoading();


    console.log(
        "================================="
    );

    console.log(
        "✅ DASHBOARD V2 FINALIZADO"
    );

    console.log(
        "EMPRESA:",
        idEmpresa
    );

    console.log(
        "PRODUÇÕES HOJE:",
        producoesHoje
    );

    console.log(
        "ETIQUETAS HOJE:",
        etiquetasHoje
    );

    console.log(
        "VENCENDO HOJE:",
        vencendoHoje
    );

    console.log(
        "VENCIDOS:",
        vencidos
    );

    console.log(
        "ESTOQUE CRÍTICO:",
        criticalStock.length
    );

    console.log(
        "================================="
    );

}


// =======================================
// INICIALIZAR
// =======================================

async function initDashboard() {

    console.log(
        "================================="
    );

    console.log(
        "INICIANDO LOTRIX DASHBOARD V2"
    );

    console.log(
        "================================="
    );


    try {

        if (
            !verificarEmpresa()
        ) {

            removeLoading();

            return;

        }


        await loadDashboard();


        console.log(
            "✅ DASHBOARD CARREGADO COM SUCESSO"
        );


    } catch (error) {

        console.error(
            "❌ ERRO AO INICIAR DASHBOARD:",
            error
        );


    } finally {

        removeLoading();

        createIcons();

    }

}


// =======================================
// INICIAR
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


// =======================================
// DISPONIBILIZAR PARA DEBUG
// =======================================

window.lotrixDashboard = {

    recarregar: loadDashboard,

    empresaAtual,

    usuarioAtual

};