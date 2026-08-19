// LOTRIX - CONFIGURAÇÕES POR EMPRESA
import { db } from "./firebase.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const configForm = document.getElementById("configForm");

function idEmpresaAtual() {
    try {
        return JSON.parse(localStorage.getItem("usuarioFoodSync") || "null")?.idEmpresa || null;
    } catch (error) {
        console.error("Erro ao identificar empresa:", error);
        return null;
    }
}

function campo(id) {
    return document.getElementById(id);
}

function normalizarHost(valor) {
    return String(valor || "").trim()
        .replace(/^https?:\/\//i, "")
        .replace(/\/.*$/, "")
        .replace(/:\d+$/, "");
}

function obterPorta() {
    return Number(campo("printerServicePort")?.value || 9100);
}

function obterUrlPrinterService() {
    const host = normalizarHost(campo("printerServiceIp")?.value);
    const porta = obterPorta();

    if (!host || !Number.isInteger(porta) || porta < 1 || porta > 65535) {
        return null;
    }

    return `https://${host}:${porta}/health`;
}

function mostrarStatusPrinter(mensagem, erro = false) {
    const status = campo("statusPrinterService");

    if (status) {
        status.textContent = mensagem;
        status.style.color = erro ? "#b42318" : "#167a3d";
    }
}

async function carregarConfiguracoes() {
    if (!configForm) return;

    const idEmpresa = idEmpresaAtual();
    if (!idEmpresa) return;

    const dados = await getDoc(doc(db, "configuracoes", idEmpresa));
    if (!dados.exists()) return;

    const configuracao = dados.data();
    campo("nomeSistema").value = configuracao.nomeSistema || "Lotrix";
    campo("tamanhoEtiqueta").value = configuracao.tamanhoEtiqueta || "60x60 mm";
    campo("validadePadrao").value = configuracao.validadePadrao || 1;
    campo("impressora").value = configuracao.impressora || "";
    campo("printerServiceIp").value = configuracao.printerServiceIp || "";
    campo("printerServicePort").value = configuracao.printerServicePort || 9100;
    campo("qrCode").value = configuracao.qrCode || "sim";
    campo("temaSistema").value = window.getLotrixThemePreference?.() || configuracao.temaSistema || "auto";
}

if (configForm) {
    configForm.addEventListener("submit", async event => {
        event.preventDefault();

        const idEmpresa = idEmpresaAtual();
        const printerServiceIp = normalizarHost(campo("printerServiceIp").value);
        const printerServicePort = obterPorta();

        if (!idEmpresa) {
            alert("Empresa não identificada.");
            return;
        }

        if (printerServiceIp && (!Number.isInteger(printerServicePort) || printerServicePort < 1 || printerServicePort > 65535)) {
            alert("Informe uma porta entre 1 e 65535.");
            return;
        }

        const configuracao = {
            idEmpresa,
            nomeSistema: campo("nomeSistema").value.trim() || "Lotrix",
            tamanhoEtiqueta: campo("tamanhoEtiqueta").value,
            validadePadrao: Number(campo("validadePadrao").value),
            impressora: campo("impressora").value.trim(),
            printerServiceIp,
            printerServicePort,
            qrCode: campo("qrCode").value,
            temaSistema: campo("temaSistema").value,
            atualizadoEm: serverTimestamp()
        };

        try {
            window.setLotrixThemePreference?.(configuracao.temaSistema);
            await setDoc(doc(db, "configuracoes", idEmpresa), configuracao);
            alert("Configurações da empresa salvas!");
        } catch (error) {
            console.error("Erro nas configurações:", error);
            alert("Erro ao salvar as configurações da empresa.");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    carregarConfiguracoes();

    const seletorTema = campo("temaSistema");
    if (seletorTema) {
        seletorTema.value = window.getLotrixThemePreference?.() || "auto";
        seletorTema.addEventListener("change", () => window.setLotrixThemePreference?.(seletorTema.value));
    }

    const botaoTeste = campo("testarPrinterService");
    if (botaoTeste) {
        botaoTeste.addEventListener("click", async () => {
            const url = obterUrlPrinterService();
            if (!url) {
                mostrarStatusPrinter("Informe um IP e uma porta válidos.", true);
                return;
            }

            mostrarStatusPrinter("Testando conexão...");
            botaoTeste.disabled = true;

            try {
                const resposta = await fetch(url);
                if (!resposta.ok) throw new Error(`Status ${resposta.status}`);
                mostrarStatusPrinter("Printer Service conectado.");
            } catch (error) {
                console.error("Erro no teste do Printer Service:", error);
                mostrarStatusPrinter("Não foi possível conectar. Verifique IP, porta, rede e certificado HTTPS.", true);
            } finally {
                botaoTeste.disabled = false;
            }
        });
    }
});
