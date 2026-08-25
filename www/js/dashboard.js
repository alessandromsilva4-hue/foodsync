// =======================================
// LOTRIX - DASHBOARD
// FIRESTORE + MULTIEMPRESA ISOLADO
//
// VERSÃO CORRIGIDA
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
console.log("LOTRIX DASHBOARD CARREGADO");
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

        const usuario =
            JSON.parse(dados);

        console.log(
            "USUÁRIO ATUAL:",
            usuario
        );

        return usuario;

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
            "ID DA EMPRESA NÃO ENCONTRADO NO USUÁRIO:",
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
            "Não foi possível identificar a empresa."
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
// VERIFICAR DATA ESPECÍFICA
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
// ALERTAS DE VALIDADE
// =======================================

function renderLabelAlerts(labels) {

    const list =
        document.getElementById(
            "listaAlertasEtiquetas"
        );

    const cards =
        document.querySelectorAll(
            ".etiqueta-alerta-card[data-alerta]"
        );

    const alerts = {
        prestes: labels.filter(item => {

            const days = daysUntil(item.validade);

            return days >= 0 && days <= 7;

        }),

        dias: labels.filter(item => daysUntil(item.validade) > 7),

        vencida: labels.filter(item => daysUntil(item.validade) < 0)
    };

    setValue(
        "alertaEtiquetasPrestes",
        alerts.prestes.length
    );

    setValue(
        "alertaEtiquetasDias",
        alerts.dias.length
    );

    setValue(
        "alertaEtiquetasVencidas",
        alerts.vencida.length
    );

    if (!list || !cards.length) {

        return;

    }

    let activeAlert = null;

    const statusFor = (type, days) => {

        if (type === "vencida") {

            const elapsed = Math.abs(days);

            return elapsed === 1
                ? "Venceu ontem"
                : `Vencida há ${elapsed} dias`;

        }

        if (days === 0) {

            return "Vence hoje";

        }

        if (days === 1) {

            return "Vence amanhã";

        }

        return `Vence em ${days} dias`;

    };

    const colorFor = type => ({
        prestes: "amarelo",
        dias: "verde",
        vencida: "vermelho"
    })[type];

    const showAlert = type => {

        const items = alerts[type] || [];

        if (activeAlert === type) {

            activeAlert = null;
            list.hidden = true;
            list.innerHTML = "";

        } else {

            activeAlert = type;
            list.hidden = false;

            if (!items.length) {

                list.innerHTML = `

                    <div class="empty-state">
                        Nenhuma etiqueta nesta categoria.
                    </div>

                `;

            } else {

                list.innerHTML = items
                    .slice(0, 10)
                    .map(item => {

                        const days = daysUntil(item.validade);

                        return `

                            <div class="alerta-etiqueta-item">
                                <div class="alerta-etiqueta-produto">
                                    <strong>${escapeHtml(
                                        item.produto ||
                                        item.nomeProduto ||
                                        "Produto sem nome"
                                    )}</strong>
                                    <small>Lote ${escapeHtml(
                                        item.lote ||
                                        item.codigo ||
                                        "—"
                                    )} · ${dateText(item.validade)}</small>
                                </div>
                                <span class="alerta-etiqueta-status ${colorFor(type)}">
                                    ${statusFor(type, days)}
                                </span>
                            </div>

                        `;

                    })
                    .join("");

            }

        }

        cards.forEach(card => {

            const isActive =
                card.dataset.alerta === activeAlert;

            card.classList.toggle(
                "active",
                isActive
            );

            card.setAttribute(
                "aria-expanded",
                String(isActive)
            );

        });

        if (
            window.lucide &&
            typeof window.lucide.createIcons === "function"
        ) {

            window.lucide.createIcons();

        }

    };

    cards.forEach(card => {

        card.setAttribute(
            "aria-expanded",
            "false"
        );

        card.onclick = () => showAlert(card.dataset.alerta);

    });

}

// =======================================
// ABRIR DETALHE DA ETIQUETA
// =======================================

function abrirDetalheEtiqueta(id, labels = []) {

    console.log("=================================");
    console.log("🏷️ ABRINDO ETIQUETA");
    console.log("ID:", id);
    console.log("=================================");

    // -------------------------------
    // VERIFICAR ID
    // -------------------------------

    if (!id) {

        console.error(
            "❌ ID DA ETIQUETA AUSENTE."
        );

        return;

    }

    // -------------------------------
    // PROCURAR ETIQUETA
    // -------------------------------

    const etiqueta = labels.find(
        item =>
            String(item.id) ===
            String(id)
    );

    if (!etiqueta) {

        console.error(
            "❌ ETIQUETA NÃO ENCONTRADA:",
            id
        );

        console.log(
            "ETIQUETAS DISPONÍVEIS:",
            labels
        );

        return;

    }

    console.log(
        "✅ ETIQUETA ENCONTRADA:",
        etiqueta
    );

    // -------------------------------
    // SALVAR ID
    // -------------------------------

    sessionStorage.setItem(
        "etiquetaSelecionada",
        JSON.stringify(etiqueta)
    );

    // -------------------------------
    // ABRIR PÁGINA
    // -------------------------------

    const url =
        `etiquetas.html?id=${encodeURIComponent(id)}`;

    console.log(
        "➡️ REDIRECIONANDO PARA:",
        url
    );

    window.location.href = url;

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
                    item.produtoNome ||
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


                /*
                 * ETIQUETA:
                 * torna o item clicável.
                 */

                const clickAttribute =

                    type === "etiqueta"

                        ? `data-etiqueta-id="${escapeHtml(
                            item.id || ""
                        )}"`

                        : "";


                const clickableClass =

                    type === "etiqueta"

                        ? " activity-item-clickable"

                        : "";


                return `

                    <div
                        class="activity-item${clickableClass}"
                        ${clickAttribute}
                        role="${
                            type === "etiqueta"
                                ? "button"
                                : ""
                        }"
                        tabindex="${
                            type === "etiqueta"
                                ? "0"
                                : "-1"
                        }"
                    >

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


    /*
     * ÍCONES
     */

    if (

        window.lucide &&

        typeof window.lucide.createIcons ===
        "function"

    ) {

        window.lucide.createIcons();

    }


    /*
     * CLIQUE NAS ETIQUETAS
     */

    if (
        type === "etiqueta"
    ) {

        container
            .querySelectorAll(
                "[data-etiqueta-id]"
            )
            .forEach(element => {

                element.addEventListener(
                    "click",
                    () => {

                        const id =
                            element.dataset.etiquetaId;


                        console.log(
                            "🏷️ ETIQUETA CLICADA:",
                            id
                        );


                        abrirDetalheEtiqueta(
                            id,
                            items
                        );

                    }
                );


                /*
                 * Permite ENTER no teclado
                 */

                element.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key ===
                            "Enter"
                        ) {

                            const id =
                                element.dataset.etiquetaId;


                            abrirDetalheEtiqueta(
                                id,
                                items
                            );

                        }

                    }
                );

            });

    }

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
                        "Vence amanhã";

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
// CARREGAR COLEÇÃO
//
// MULTIEMPRESA
// =======================================

async function loadCollection(
    collectionName,
    idEmpresa
) {

    try {

        console.log(
            `📥 CARREGANDO ${collectionName}`
        );

        console.log(
            "🏢 EMPRESA:",
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

            `✅ ${collectionName.toUpperCase()} DA EMPRESA ${idEmpresa}:`,

            data.length

        );


        return data;

    } catch (error) {

        console.error(

            `❌ ERRO AO CARREGAR ${collectionName.toUpperCase()}:`,

            error

        );


        console.error(
            "Código do erro:",
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
    // PRODUÇÕES
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
        "TOTAL PRODUÇÕES:",
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

                    daysUntil(
                        a.validade
                    ) -

                    daysUntil(
                        b.validade
                    )

            );


    // =================================
    // MÉTRICAS
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
    // LISTA DE PRODUÇÕES
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

        "produção"

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


    renderLabelAlerts(
        labels
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

    if (

        window.lucide &&

        typeof window.lucide.createIcons ===
        "function"

    ) {

        window.lucide.createIcons();

    }


    // =================================
    // FINALIZAÇÃO
    // =================================

    removeLoading();


    console.log(
        "================================="
    );

    console.log(
        "✅ DASHBOARD FINALIZADO"
    );

    console.log(
        "EMPRESA:",
        idEmpresa
    );

    console.log(
        "PRODUÇÕES:",
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
            "✅ DASHBOARD CARREGADO COM SUCESSO"
        );


    } catch (error) {

        console.error(
            "❌ ERRO AO INICIAR DASHBOARD:",
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
