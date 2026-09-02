import { db } from "./firebase.js";
import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const resultado = document.getElementById("dadosEtiqueta");

function escaparHtml(valor) {
    return String(valor ?? "-")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatarData(valor) {
    if (!valor) {
        return "-";
    }

    const data = typeof valor.toDate === "function"
        ? valor.toDate()
        : new Date(`${valor}T00:00:00`);

    return Number.isNaN(data.getTime())
        ? escaparHtml(valor)
        : data.toLocaleDateString("pt-BR");
}

function obterStatus(validade) {
    const data = new Date(`${validade}T23:59:59`);

    if (Number.isNaN(data.getTime())) {
        return { classe: "alerta", texto: "Validade não informada" };
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (data < hoje) {
        return { classe: "vencido", texto: "Produto vencido" };
    }

    const tresDias = new Date(hoje);
    tresDias.setDate(tresDias.getDate() + 3);

    return data <= tresDias
        ? { classe: "alerta", texto: "Próximo da validade" }
        : { classe: "valido", texto: "Produto dentro da validade" };
}

function exibirEtiqueta(etiqueta) {
    const status = obterStatus(etiqueta.validade);

    resultado.innerHTML = `
        <div class="cabecalho-etiqueta">
            <h2>Consulta de Etiqueta</h2>
            <span>${escaparHtml(etiqueta.codigo)}</span>
        </div>
        <div class="linha"></div>
        <div class="produto-destaque">${escaparHtml(etiqueta.produto)}</div>
        <div class="campo"><strong>Temperatura:</strong> ${escaparHtml(etiqueta.temperatura)}</div>
        <div class="campo"><strong>Fabricado:</strong> ${formatarData(etiqueta.dataProducao)}</div>
        <div class="validade-destaque">
            <span>VALIDADE</span>
            <strong>${formatarData(etiqueta.validade)}</strong>
        </div>
        <div class="campo"><strong>Lote:</strong> ${escaparHtml(etiqueta.lote)}</div>
        <div class="campo"><strong>Responsável:</strong> ${escaparHtml(etiqueta.responsavel)}</div>
        <div class="status ${status.classe}">${status.texto}</div>
    `;
}

async function consultarEtiqueta() {
    const codigo = new URLSearchParams(window.location.search)
        .get("codigo")
        ?.trim();

    if (!codigo) {
        resultado.innerHTML = "<div class=\"status alerta\">Código da etiqueta não informado.</div>";
        return;
    }

    try {
        const consulta = await getDoc(doc(db, "consultasPublicas", codigo));

        if (!consulta.exists()) {
            resultado.innerHTML = "<div class=\"status alerta\">Etiqueta não encontrada.</div>";
            return;
        }

        exibirEtiqueta(consulta.data());
    } catch (error) {
        console.error("Erro ao consultar etiqueta pública:", error);
        resultado.innerHTML = "<div class=\"status vencido\">Não foi possível consultar esta etiqueta.</div>";
    }
}

consultarEtiqueta();
