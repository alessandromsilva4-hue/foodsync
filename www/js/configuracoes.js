// =========================================================
// LOTRIX - CONFIGURAÇÕES POR EMPRESA
// FIRESTORE + PRINTER SERVICE + ATUALIZAÇÃO DO APLICATIVO
// =========================================================

import { db } from "./firebase.js";

import {
    doc,
    setDoc,
    getDoc,
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

const VERSAO_ATUAL = "1.0.0";

const VERSAO_DISPONIVEL_URL =
    "https://SEU-ENDERECO.com/lotrix/version.json";


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

function obterUrlPrinterService() {

    const host = normalizarHost(
        campo("printerServiceIp")?.value
    );

    const porta = obterPorta();

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

        carregarConfiguracoes();


        const seletorTema =
            campo("temaSistema");


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
                        obterUrlPrinterService();


                    if (!url) {

                        mostrarStatusPrinter(
                            "Informe um IP e uma porta válidos.",
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


    // Mostrar versão instalada

    versaoInstalada.textContent =
        VERSAO_ATUAL;


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


        const comparacao =
            compararVersoes(
                VERSAO_ATUAL,
                versaoDisponivel
            );


        ultimaVerificacao.textContent =
            new Date().toLocaleString(
                "pt-BR"
            );


        // =============================================
        // NOVA VERSÃO
        // =============================================

        if (comparacao < 0) {

            status.className =
                "atualizacao-status";


            status.innerHTML =
                `
                🚀 <strong>Nova versão disponível!</strong><br>
                A versão <strong>${versaoDisponivel}</strong>
                do Lotrix está disponível para atualização.
                `;


            if (urlApk) {

                botaoBaixar.dataset.urlApk =
                    urlApk;


                botaoBaixar.style.display =
                    "inline-block";

            }


            return;
        }


        // =============================================
        // ATUALIZADO
        // =============================================

        status.className =
            "atualizacao-status sucesso";


        status.innerHTML =
            `
            ✅ <strong>Seu Lotrix está atualizado!</strong><br>
            Você já está usando a versão mais recente.
            `;


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

