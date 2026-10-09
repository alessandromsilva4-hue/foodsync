// =========================================================
// LOTRIX - CONFIGURAÇÕES POR EMPRESA
// FIRESTORE + PRINTER SERVICE + ATUALIZAÇÃO DO APLICATIVO
// =========================================================

import { db } from "./firebase.js";

import {
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =========================================================
// CONFIGURAÇÃO DA ATUALIZAÇÃO
// =========================================================
//
// IMPORTANTE:
// Quando você hospedar o APK, coloque aqui a URL pública.
//
// Exemplo:
// const URL_APK = "https://seusite.com/lotrix/app-release.apk";
//
// E altere a versão disponível.
//
// =========================================================

const LotrixAppInfo = window.Capacitor?.registerPlugin?.("LotrixAppInfo") || null;
const VERSAO_DISPONIVEL_URL =
    new URL("../version.json", import.meta.url).toString();
const SUPABASE_PRINTER_STATUS_READ_ENABLED = false;
let versaoAtualInstalada = null;
let ultimoIpPrinterDescobertoEm = 0;
let erroLeituraStatusSupabaseReportado = false;

function statusPrinterFoiAtualizadoRecentemente(dados) {
    const marca = dados?.lastSeenAt;
    let atualizadoEm;
    if (marca instanceof Date) {
        atualizadoEm = marca.getTime();
    } else if (typeof marca?.toDate === "function") {
        atualizadoEm = marca.toDate().getTime();
    } else if (typeof marca === "string") {
        atualizadoEm = Date.parse(marca);
    } else if (typeof marca === "number") {
        atualizadoEm = marca;
    }

    if (!Number.isFinite(atualizadoEm)) return false;
    const idade = Date.now() - atualizadoEm;
    return idade >= -30000 && idade <= 180000;
}

async function atualizarStatusPrinterDoSupabase() {
    if (!SUPABASE_PRINTER_STATUS_READ_ENABLED) return;
    const idEmpresa = idEmpresaAtual();
    if (!idEmpresa || Date.now() - ultimoIpPrinterDescobertoEm < 120000) return;

    try {
        const { obterDocumentoSupabase } = await import("./supabase-documents.js");
        const dados = await obterDocumentoSupabase("printerServiceStatus", idEmpresa);
        if (!dados || !statusPrinterFoiAtualizadoRecentemente(dados) ||
            Date.now() - ultimoIpPrinterDescobertoEm < 120000) return;

        const campoHost = campo("printerServiceIp");
        const campoPorta = campo("printerServicePort");
        if (campoHost && dados.host && document.activeElement !== campoHost) {
            campoHost.value = dados.host;
        }
        if (campoPorta && dados.port && document.activeElement !== campoPorta) {
            campoPorta.value = String(dados.port);
        }
        erroLeituraStatusSupabaseReportado = false;
    } catch (erro) {
        if (!erroLeituraStatusSupabaseReportado) {
            console.warn("Leitura do status da impressora no Supabase indisponível:", erro);
            erroLeituraStatusSupabaseReportado = true;
        }
    }
}


// =========================================================
// ELEMENTOS
// =========================================================

const configForm = document.getElementById("configForm");


// =========================================================
// EMPRESA ATUAL
// =========================================================

function idEmpresaAtual() {

    try {

        return JSON.parse(
            localStorage.getItem("usuarioFoodSync") || "null"
        )?.idEmpresa || null;

    } catch (error) {

        console.error(
            "Erro ao identificar empresa:",
            error
        );

        return null;
    }
}


// =========================================================
// CAMPO
// =========================================================

function campo(id) {

    return document.getElementById(id);

}


// =========================================================
// NORMALIZAR HOST
// =========================================================

function normalizarHost(valor) {

    return String(valor || "")
        .trim()
        .replace(/^https?:\/\//i, "")
        .replace(/\/.*$/, "")
        .replace(/:\d+$/, "");

}


// =========================================================
// PORTA
// =========================================================

function obterPorta() {

    return Number(
        campo("printerServicePort")?.value || 9100
    );

}


// =========================================================
// URL PRINTER SERVICE
// =========================================================

async function obterUrlPrinterService() {

    const plugin = window.Capacitor?.Plugins?.LotrixPrinterDiscovery;

    if (plugin?.discover) {
        try {
            const encontrado = await plugin.discover({ timeoutMs: 2500 });
            const hostDescoberto = normalizarHost(encontrado.host);
            const portaDescoberta = Number(encontrado.port);

            if (hostDescoberto && Number.isInteger(portaDescoberta) && portaDescoberta >= 1 && portaDescoberta <= 65535) {
                ultimoIpPrinterDescobertoEm = Date.now();
                const campoHost = campo("printerServiceIp");
                if (campoHost) campoHost.value = hostDescoberto;

                const idEmpresa = idEmpresaAtual();
                if (idEmpresa) {
                    try {
                        const referencia = doc(db, "configuracoes", idEmpresa);
                        const snapshot = await getDoc(referencia);
                        const dadosSalvos = snapshot.exists() ? snapshot.data() : {};
                        if (
                            normalizarHost(dadosSalvos.printerServiceIp) !== hostDescoberto ||
                            Number(dadosSalvos.printerServicePort || 9100) !== portaDescoberta
                        ) {
                            await setDoc(referencia, {
                                printerServiceIp: hostDescoberto,
                                printerServicePort: portaDescoberta,
                                atualizadoEm: serverTimestamp()
                            }, { merge: true });
                        }
                    } catch (erro) {
                        console.warn("Não foi possível salvar o IP descoberto do Printer Service:", erro);
                    }
                }

                return `https://${hostDescoberto}:${portaDescoberta}/health`;
            }
        } catch (erro) {
            console.warn("Printer Service não localizado automaticamente:", erro);
        }
    }

    let host = normalizarHost(campo("printerServiceIp")?.value);
    let porta = obterPorta();
    const idEmpresa = idEmpresaAtual();
    if (idEmpresa) {
        try {
            const status = await getDoc(doc(db, "printerServiceStatus", idEmpresa));
            if (status.exists()) {
                host = normalizarHost(status.data().host) || host;
                porta = Number(status.data().port) || porta;
                if (campo("printerServiceIp")) campo("printerServiceIp").value = host;
                if (campo("printerServicePort")) campo("printerServicePort").value = String(porta);
            }
        } catch (erro) {
            console.warn("Não foi possível ler o IP publicado pelo Printer Service:", erro);
        }
    }

    if (
        !host ||
        !Number.isInteger(porta) ||
        porta < 1 ||
        porta > 65535
    ) {

        return null;
    }

    return `https://${host}:${porta}/health`;

}


// =========================================================
// STATUS PRINTER SERVICE
// =========================================================

function mostrarStatusPrinter(
    mensagem,
    erro = false
) {

    const status =
        campo("statusPrinterService");

    if (status) {

        status.textContent = mensagem;

        status.style.color =
            erro
                ? "#b42318"
                : "#167a3d";

    }

}


// =========================================================
// CARREGAR CONFIGURAÇÕES
// =========================================================

async function carregarConfiguracoes() {

    if (!configForm) return;

    const idEmpresa =
        idEmpresaAtual();

    if (!idEmpresa) return;

    try {

        const dados = await getDoc(
            doc(
                db,
                "configuracoes",
                idEmpresa
            )
        );

        if (!dados.exists()) return;

        const configuracao =
            dados.data();


        campo("nomeSistema").value =
            configuracao.nomeSistema ||
            "Lotrix";


        campo("tamanhoEtiqueta").value =
            configuracao.tamanhoEtiqueta ||
            "60x60 mm";


        campo("validadePadrao").value =
            configuracao.validadePadrao ||
            1;


        campo("impressora").value =
            configuracao.impressora ||
            "";


        campo("printerServiceIp").value =
            configuracao.printerServiceIp ||
            "";


        campo("printerServicePort").value =
            configuracao.printerServicePort ||
            9100;


        campo("qrCode").value =
            configuracao.qrCode ||
            "sim";


        campo("temaSistema").value =
            window.getLotrixThemePreference?.() ||
            configuracao.temaSistema ||
            "auto";

    } catch (error) {

        console.error(
            "Erro ao carregar configurações:",
            error
        );

    }

}


// =========================================================
// SALVAR CONFIGURAÇÕES
// =========================================================

if (configForm) {

    configForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const idEmpresa =
                idEmpresaAtual();


            const printerServiceIp =
                normalizarHost(
                    campo("printerServiceIp").value
                );


            const printerServicePort =
                obterPorta();


            if (!idEmpresa) {

                alert(
                    "Empresa não identificada."
                );

                return;
            }


            if (
                printerServiceIp &&
                (
                    !Number.isInteger(
                        printerServicePort
                    ) ||
                    printerServicePort < 1 ||
                    printerServicePort > 65535
                )
            ) {

                alert(
                    "Informe uma porta entre 1 e 65535."
                );

                return;
            }


            const configuracao = {

                idEmpresa,

                nomeSistema:
                    campo("nomeSistema")
                        .value
                        .trim() ||
                    "Lotrix",

                tamanhoEtiqueta:
                    campo("tamanhoEtiqueta")
                        .value,

                validadePadrao:
                    Number(
                        campo("validadePadrao")
                            .value
                    ),

                impressora:
                    campo("impressora")
                        .value
                        .trim(),

                printerServiceIp,

                printerServicePort,

                qrCode:
                    campo("qrCode")
                        .value,

                temaSistema:
                    campo("temaSistema")
                        .value,

                atualizadoEm:
                    serverTimestamp()

            };


            try {

                window
                    .setLotrixThemePreference
                    ?.(
                        configuracao.temaSistema
                    );


                await setDoc(
                    doc(
                        db,
                        "configuracoes",
                        idEmpresa
                    ),
                    configuracao
                );


                alert(
                    "Configurações da empresa salvas!"
                );


            } catch (error) {

                console.error(
                    "Erro nas configurações:",
                    error
                );


                alert(
                    "Erro ao salvar as configurações da empresa."
                );

            }

        }
    );

}


// =========================================================
// TEMA
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        carregarConfiguracoes().then(() => {
            const idEmpresa = idEmpresaAtual();
            if (idEmpresa) {
                onSnapshot(doc(db, "printerServiceStatus", idEmpresa), snapshot => {
                    // A descoberta local conhece a interface acessível deste
                    // tablet. Não deixe um status antigo da nuvem sobrescrevê-la.
                    if (Date.now() - ultimoIpPrinterDescobertoEm < 120000) return;

                    const dados = snapshot.exists() ? snapshot.data() : {};
                    if (!statusPrinterFoiAtualizadoRecentemente(dados)) return;
                    const campoHost = campo("printerServiceIp");
                    const campoPorta = campo("printerServicePort");
                    if (campoHost && dados.host && document.activeElement !== campoHost) {
                        campoHost.value = dados.host;
                    }
                    if (campoPorta && dados.port) campoPorta.value = String(dados.port);
                });
            }
            if (SUPABASE_PRINTER_STATUS_READ_ENABLED) {
                void atualizarStatusPrinterDoSupabase();
                window.setInterval(atualizarStatusPrinterDoSupabase, 15000);
            }
            return obterUrlPrinterService();
        }).then(url => {
            if (url) mostrarStatusPrinter("Printer Service encontrado na rede.");
        }).catch(() => {
            // A descoberta é opcional enquanto o serviço estiver desligado.
        });


        const seletorTema =
            campo("temaSistema");

        campo("vincularPrinterService")?.addEventListener("click", async () => {
            const idEmpresa = idEmpresaAtual();
            if (!idEmpresa) {
                mostrarStatusPrinter("Entre novamente no sistema para vincular o computador da impressora.", true);
                return;
            }

            try {
                const bytes = new Uint8Array(32);
                window.crypto.getRandomValues(bytes);
                const token = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
                await setDoc(doc(db, "printerServicePairings", idEmpresa), {
                    idEmpresa,
                    token,
                    atualizadoEm: serverTimestamp()
                });

                const conteudo = JSON.stringify({ idEmpresa, token }, null, 2);
                const arquivo = new Blob([conteudo], { type: "application/json" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(arquivo);
                link.download = "registration.json";
                link.click();
                setTimeout(() => URL.revokeObjectURL(link.href), 1000);
                mostrarStatusPrinter("Arquivo de pareamento baixado. Copie-o para a pasta printer-service no computador da impressora e reinicie o serviço.");
            } catch (erro) {
                console.error("Falha ao vincular o Printer Service:", erro);
                mostrarStatusPrinter("Não foi possível criar o pareamento do Printer Service.", true);
            }
        });


        if (seletorTema) {

            seletorTema.value =
                window
                    .getLotrixThemePreference
                    ?.() ||
                "auto";


            seletorTema.addEventListener(
                "change",
                () => {

                    window
                        .setLotrixThemePreference
                        ?.(
                            seletorTema.value
                        );

                }
            );

        }


        // =================================================
        // TESTE PRINTER SERVICE
        // =================================================

        const botaoTeste =
            campo(
                "testarPrinterService"
            );


        if (botaoTeste) {

            botaoTeste.addEventListener(
                "click",
                async () => {

                    const url =
                        await obterUrlPrinterService();


                    if (!url) {

                        mostrarStatusPrinter(
                            "Não foi possível localizar o Printer Service na rede.",
                            true
                        );

                        return;
                    }


                    mostrarStatusPrinter(
                        "Testando conexão..."
                    );


                    botaoTeste.disabled =
                        true;


                    try {

                        const resposta =
                            await fetch(url);


                        if (!resposta.ok) {

                            throw new Error(
                                `Status ${resposta.status}`
                            );

                        }


                        mostrarStatusPrinter(
                            "Printer Service conectado."
                        );


                    } catch (error) {

                        console.error(
                            "Erro no teste do Printer Service:",
                            error
                        );


                        mostrarStatusPrinter(
                            "Não foi possível conectar. Verifique IP, porta, rede e certificado HTTPS.",
                            true
                        );


                    } finally {

                        botaoTeste.disabled =
                            false;

                    }

                }
            );

        }


        // =================================================
        // INICIALIZAR ATUALIZAÇÃO
        // =================================================

        inicializarAtualizacao();

    }
);


// =========================================================
// ATUALIZAÇÃO DO APLICATIVO
// =========================================================

function inicializarAtualizacao() {

    const versaoInstalada =
        campo("versaoInstalada");


    const ultimaVerificacao =
        campo("ultimaVerificacao");

    const versaoDisponivel =
        campo("versaoDisponivel");


    const status =
        campo("statusAtualizacao");


    const botaoVerificar =
        campo("verificarAtualizacao");


    const botaoBaixar =
        campo("baixarAtualizacao");


    if (
        !versaoInstalada ||
        !ultimaVerificacao ||
        !status ||
        !botaoVerificar ||
        !botaoBaixar
    ) {

        return;
    }


    Promise.resolve()
        .then(() => {
            if (!LotrixAppInfo) throw new Error("App nativo indisponível");
            return LotrixAppInfo.getVersion();
        })
        .then((info) => {
            versaoAtualInstalada = info?.versionName || null;
            campo("versaoInstalada").textContent =
                versaoAtualInstalada || "Não identificada";
        })
        .catch(() => {
            campo("versaoInstalada").textContent = "Acesso pelo navegador";
        })
        .finally(() => {
            verificarAtualizacao();
        });


    // Botão verificar

    botaoVerificar.addEventListener(
        "click",
        async () => {

            await verificarAtualizacao();

        }
    );

    // Botão baixar

    botaoBaixar.addEventListener(
        "click",
        () => {

            baixarAtualizacao();

        }
    );

}


// =========================================================
// COMPARAR VERSÕES
// =========================================================

function compararVersoes(
    versaoA,
    versaoB
) {

    const a =
        String(versaoA)
            .replace(/^v/i, "")
            .split(".")
            .map(Number);


    const b =
        String(versaoB)
            .replace(/^v/i, "")
            .split(".")
            .map(Number);


    const tamanho =
        Math.max(
            a.length,
            b.length
        );


    for (
        let i = 0;
        i < tamanho;
        i++
    ) {

        const numeroA =
            Number.isFinite(a[i])
                ? a[i]
                : 0;


        const numeroB =
            Number.isFinite(b[i])
                ? b[i]
                : 0;


        if (numeroA > numeroB) {

            return 1;

        }


        if (numeroA < numeroB) {

            return -1;

        }

    }


    return 0;

}


// =========================================================
// VERIFICAR ATUALIZAÇÃO
// =========================================================

async function verificarAtualizacao() {

    const status =
        campo("statusAtualizacao");


    const ultimaVerificacao =
        campo("ultimaVerificacao");


    const botaoVerificar =
        campo("verificarAtualizacao");


    const botaoBaixar =
        campo("baixarAtualizacao");

    const campoVersaoDisponivel =
        campo("versaoDisponivel");


    if (!status) return;


    botaoVerificar.disabled =
        true;


    botaoBaixar.style.display =
        "none";


    status.className =
        "atualizacao-status";


    status.textContent =
        "🔄 Verificando se existe uma nova versão...";


    try {

        const resposta =
            await fetch(
                `${VERSAO_DISPONIVEL_URL}?t=${Date.now()}`,
                {
                    cache: "no-store"
                }
            );


        if (!resposta.ok) {

            throw new Error(
                `HTTP ${resposta.status}`
            );

        }


        const dados =
            await resposta.json();


        const versaoDisponivel =
            dados.versao;


        const urlApk =
            dados.urlApk;


        if (!versaoDisponivel) {

            throw new Error(
                "Versão não informada pelo servidor."
            );

        }


        if (campoVersaoDisponivel) {
            campoVersaoDisponivel.textContent = versaoDisponivel;
        }

        const comparacao = versaoAtualInstalada
            ? compararVersoes(versaoAtualInstalada, versaoDisponivel)
            : 0;


        ultimaVerificacao.textContent =
            new Date().toLocaleString(
                "pt-BR"
            );


        // =============================================
        // NOVA VERSÃO
        // =============================================

        if (urlApk) {
            botaoBaixar.dataset.urlApk = urlApk;
            botaoBaixar.textContent = `⬇️ Baixar app Android (${versaoDisponivel})`;
            botaoBaixar.style.display = "inline-block";
        }

        if (comparacao < 0) {

            status.className =
                "atualizacao-status";


            status.innerHTML =
                `
                🚀 <strong>Nova versão disponível!</strong><br>
                A versão <strong>${versaoDisponivel}</strong>
                do Lotrix está disponível para atualização.
                `;


            return;
        }


        // =============================================
        // ATUALIZADO
        // =============================================

        status.className =
            "atualizacao-status sucesso";


        status.textContent = versaoAtualInstalada
            ? "✅ Seu Lotrix está atualizado. Você já está usando a versão mais recente."
            : "✅ Esta é a versão mais recente do app Android. Baixe o ZIP, extraia o APK e toque nele para instalar.";


    } catch (error) {

        console.error(
            "Erro ao verificar atualização:",
            error
        );


        ultimaVerificacao.textContent =
            new Date().toLocaleString(
                "pt-BR"
            );


        status.className =
            "atualizacao-status erro";


        status.innerHTML =
            `
            ❌ <strong>Não foi possível verificar.</strong><br>
            Verifique sua conexão com a internet.
            `;

    } finally {

        botaoVerificar.disabled =
            false;

    }

}


// =========================================================
// BAIXAR ATUALIZAÇÃO
// =========================================================

function baixarAtualizacao() {

    const botaoBaixar =
        campo("baixarAtualizacao");


    const url =
        botaoBaixar?.dataset?.urlApk;


    if (!url) {

        alert(
            "O endereço da atualização não foi encontrado."
        );

        return;
    }


    // Abrir o APK para iniciar o download

    window.open(
        url,
        "_blank"
    );

}
