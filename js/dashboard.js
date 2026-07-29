import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let productionChart;

const startOfDay = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

function toDate(value) {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    if (typeof value === "string") {
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function isToday(value) {
    const date = toDate(value);
    return date && startOfDay(date).getTime() === startOfDay().getTime();
}

function dateText(value) {
    const date = toDate(value);
    return date ? date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "Data não informada";
}

function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function removeLoading() {
    document.querySelectorAll(".is-loading").forEach(card => card.classList.remove("is-loading"));
}

function renderEmpty(container, message, icon = "inbox") {
    container.innerHTML = `<div class="empty-state"><i data-lucide="${icon}" aria-hidden="true"></i><span>${message}</span></div>`;
}

function daysUntil(value) {
    const date = toDate(value);
    if (!date) return Infinity;
    return Math.round((startOfDay(date) - startOfDay()) / 86400000);
}

function renderActivity(id, items, type) {
    const container = document.getElementById(id);
    if (!container) return;
    if (!items.length) return renderEmpty(container, type === "produção" ? "Nenhuma produção registrada." : "Nenhuma etiqueta emitida.");

    container.innerHTML = items.slice(0, 5).map(item => {
        const name = escapeHtml(item.produto || item.nomeProduto || "Produto sem nome");
        const date = type === "produção" ? item.dataProducao : (item.criadoEm || item.dataProducao);
        const detail = type === "produção"
            ? `${escapeHtml(item.quantidade || 0)} ${escapeHtml(item.unidade || "un")} · ${dateText(date)}`
            : `Lote ${escapeHtml(item.lote || item.codigo || "—")} · ${dateText(date)}`;
        const icon = type === "produção" ? "chef-hat" : "tag";
        return `<div class="activity-item"><span class="activity-icon"><i data-lucide="${icon}"></i></span><div><strong>${name}</strong><small>${detail}</small></div></div>`;
    }).join("");
}

function renderExpiring(items) {
    const container = document.getElementById("listaVencimentos");
    if (!container) return;
    if (!items.length) return renderEmpty(container, "Nenhum produto próximo do vencimento.", "circle-check");
    container.innerHTML = items.slice(0, 5).map(item => {
        const days = daysUntil(item.validade);
        const urgency = days <= 0 ? "critical" : days <= 3 ? "urgent" : "soon";
        const label = days === 0 ? "Vence hoje" : days === 1 ? "Vence amanhã" : `${days} dias`;
        return `<div class="attention-item"><div><strong>${escapeHtml(item.produto || "Produto sem nome")}</strong><small>Lote ${escapeHtml(item.lote || item.codigo || "—")} · ${dateText(item.validade)}</small></div><span class="status-pill ${urgency}">${label}</span></div>`;
    }).join("");
}

function renderStock(items) {
    const container = document.getElementById("listaEstoqueBaixo");
    if (!container) return;
    if (!items.length) return renderEmpty(container, "Estoque dentro do nível mínimo.", "circle-check");
    container.innerHTML = items.slice(0, 5).map(item => `<div class="attention-item"><div><strong>${escapeHtml(item.produto || "Produto sem nome")}</strong><small>${item.quantidade} ${escapeHtml(item.unidade || "un")} disponíveis · mínimo ${item.minimo}</small></div><span class="status-pill critical">Repor</span></div>`).join("");
}

function renderTopProducts(productions) {
    const container = document.getElementById("produtosMaisProduzidos");
    if (!container) return;
    const counts = productions.reduce((acc, item) => {
        const name = item.produto || item.nomeProduto || "Produto sem nome";
        acc[name] = (acc[name] || 0) + Number(item.quantidade || 1);
        return acc;
    }, {});
    const ranking = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (!ranking.length) return renderEmpty(container, "Ainda não há produções registradas.");
    const largest = ranking[0][1] || 1;
    container.innerHTML = ranking.map(([name, quantity], index) => `<li><span class="rank-number">${index + 1}</span><div><strong>${escapeHtml(name)}</strong><span class="rank-bar"><i style="width:${Math.max(12, quantity / largest * 100)}%"></i></span></div><b>${quantity}</b></li>`).join("");
}

function renderChart(productions) {
    if (!window.Chart) return;
    const labels = [];
    const values = [];
    for (let index = 6; index >= 0; index -= 1) {
        const date = startOfDay(); date.setDate(date.getDate() - index);
        labels.push(date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""));
        values.push(productions.filter(item => isTodayFor(item.dataProducao, date)).length);
    }
    const canvas = document.getElementById("graficoProducao");
    if (!canvas) return;
    productionChart?.destroy();
    productionChart = new Chart(canvas, {
        type: "line",
        data: { labels, datasets: [{ data: values, borderColor: "#15803d", backgroundColor: "rgba(21, 128, 61, .10)", fill: true, tension: .4, borderWidth: 3, pointRadius: 4, pointBackgroundColor: "#fff", pointBorderWidth: 3, pointBorderColor: "#15803d" }] },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { displayColors: false, backgroundColor: "#182230", padding: 10 } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: "#667085" } }, y: { beginAtZero: true, ticks: { precision: 0, color: "#667085", stepSize: 1 }, border: { display: false }, grid: { color: "#eef2f6" } } } }
    });
}

function isTodayFor(value, target) {
    const date = toDate(value);
    return date && startOfDay(date).getTime() === target.getTime();
}

function updateGreeting() {
    const hour = new Date().getHours();
    const period = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
    const user = JSON.parse(localStorage.getItem("usuarioFoodSync") || "{}");
    setValue("saudacao", `${period}, ${user.nome || "gestor"} 👋`);
    setValue("dataAtual", new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }));
}

async function loadDashboard() {
    updateGreeting();
    try {
        const [productionSnapshot, labelSnapshot, stockSnapshot] = await Promise.all([
            getDocs(collection(db, "producoes")), getDocs(collection(db, "etiquetas")), getDocs(collection(db, "estoque"))
        ]);
        const productions = productionSnapshot.docs.map(doc => doc.data());
        const labels = labelSnapshot.docs.map(doc => doc.data());
        const stock = stockSnapshot.docs.map(doc => doc.data());
        const expiring = labels.filter(item => { const days = daysUntil(item.validade); return days >= 0 && days <= 30; }).sort((a, b) => daysUntil(a.validade) - daysUntil(b.validade));
        const criticalStock = stock.filter(item => Number(item.minimo || 0) > 0 && Number(item.quantidade || 0) <= Number(item.minimo || 0));

        setValue("producoesHoje", productions.filter(item => isToday(item.dataProducao)).length);
        setValue("etiquetasHoje", labels.filter(item => isToday(item.criadoEm || item.dataEtiqueta || item.dataProducao)).length);
        setValue("vencendoHoje", labels.filter(item => daysUntil(item.validade) === 0).length);
        setValue("estoqueCritico", criticalStock.length);
        renderActivity("listaProducao", [...productions].sort((a, b) => (toDate(b.dataProducao) || 0) - (toDate(a.dataProducao) || 0)), "produção");
        renderActivity("listaEtiquetas", [...labels].sort((a, b) => (toDate(b.criadoEm || b.dataProducao) || 0) - (toDate(a.criadoEm || a.dataProducao) || 0)), "etiqueta");
        renderExpiring(expiring); renderStock(criticalStock); renderTopProducts(productions); renderChart(productions);
    } catch (error) {
        console.error("Erro ao carregar o dashboard:", error);
        document.querySelectorAll(".activity-list, .attention-list, .rank-list").forEach(element => renderEmpty(element, "Não foi possível carregar estes dados.", "triangle-alert"));
    } finally {
        removeLoading();
        window.lucide?.createIcons();
    }
}

document.addEventListener("DOMContentLoaded", loadDashboard);
