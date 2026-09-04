// =======================================
// LOTRIX - ZERAR SISTEMA
// APAGA DADOS OPERACIONAIS DA EMPRESA
// SOMENTE ADMINISTRADOR
// =======================================

console.log("ZERAR-SISTEMA.JS CARREGADO");

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    deleteDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =======================================
// COLEÇÕES OPERACIONAIS
// =======================================

const COLECOES = [
    "produtos",
    "producoes",
    "estoque",
    "movimentacoes",
    "etiquetas",
    "auditoria"
];

// =======================================
// USUÁRIO ATUAL
// =======================================

function obterUsuarioAtual() {

    try {

        const dados =
            localStorage.getItem("usuarioFoodSync");

        if (!dados) {
            return null;
        }

        return JSON.parse(dados);

    } catch (erro) {

        console.error(
            "Erro ao carregar usuário:",
            erro
        );

        return null;
    }
}

// =======================================
// VERIFICAR ADMINISTRADOR
// =======================================

function usuarioEhAdministrador() {

    const usuario =
        obterUsuarioAtual();

    if (!usuario) {
        return false;
    }

    const perfil =
        String(
            usuario.perfil || ""
        )
        .trim()
        .toLowerCase();

    return (
        perfil === "admin" ||
        perfil === "administrador"
    );
}

// =======================================
// EMPRESA ATUAL
// =======================================

function obterEmpresaAtual() {

    const usuario =
        obterUsuarioAtual();

    if (!usuario) {

        alert(
            "Usuário não encontrado."
        );

        return null;
    }

    if (!usuario.idEmpresa) {

        console.error(
            "Usuário sem idEmpresa:",
            usuario
        );

        alert(
            "Este usuário não possui uma empresa vinculada."
        );

        return null;
    }

    return usuario.idEmpresa;
}

// =======================================
// APAGAR COLEÇÃO DA EMPRESA
// =======================================

async function apagarColecao(
    nomeColecao,
    idEmpresa
) {

    console.log(
        `Limpando coleção: ${nomeColecao}`
    );

    const referencia =
        collection(
            db,
            nomeColecao
        );

    const consulta =
        query(
            referencia,
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

    let quantidade = 0;

    for (
        const item of snapshot.docs
    ) {

        await deleteDoc(
            item.ref
        );

        quantidade++;
    }

    console.log(
        `${nomeColecao}: ${quantidade} registro(s) apagado(s).`
    );

    return quantidade;
}

// =======================================
// ZERAR SISTEMA
// =======================================

async function zerarSistema() {

    // ===================================
    // SEGURANÇA
    // ===================================

    if (!usuarioEhAdministrador()) {

        alert(
            "⛔ Acesso negado.\n\n" +
            "Somente o administrador pode zerar o sistema."
        );

        console.warn(
            "Tentativa de zerar sistema por usuário sem permissão."
        );

        return;
    }

    // ===================================
    // EMPRESA
    // ===================================

    const idEmpresa =
        obterEmpresaAtual();

    if (!idEmpresa) {
        return;
    }

    const usuario =
        obterUsuarioAtual();

    console.log(
        "ADMINISTRADOR:",
        usuario.nome
    );

    console.log(
        "EMPRESA QUE SERÁ LIMPA:",
        idEmpresa
    );

    // ===================================
    // PRIMEIRA CONFIRMAÇÃO
    // ===================================

    const primeiraConfirmacao =
        confirm(
            "⚠️ ATENÇÃO!\n\n" +

            "Você está prestes a ZERAR o Lotrix " +
            "para esta empresa.\n\n" +

            "Serão apagados SOMENTE os dados " +
            "operacionais desta empresa:\n\n" +

            "• Produtos\n" +
            "• Produções\n" +
            "• Estoque\n" +
            "• Movimentações\n" +
            "• Etiquetas\n" +
            "• Auditoria\n\n" +

            "Usuários NÃO serão apagados.\n" +
            "A empresa NÃO será apagada.\n\n" +

            "Esta operação não poderá ser desfeita.\n\n" +

            "Deseja continuar?"
        );

    if (!primeiraConfirmacao) {

        console.log(
            "Operação cancelada."
        );

        return;
    }

    // ===================================
    // SEGUNDA CONFIRMAÇÃO
    // ===================================

    const segundaConfirmacao =
        prompt(
            "🚨 ÚLTIMA CONFIRMAÇÃO 🚨\n\n" +

            "Todos os dados operacionais desta empresa " +
            "serão apagados.\n\n" +

            "Digite exatamente:\n\n" +

            "ZERAR\n\n" +

            "para confirmar."
        );

    if (
        segundaConfirmacao !== "ZERAR"
    ) {

        alert(
            "Operação cancelada.\n\n" +
            "Nenhum dado foi apagado."
        );

        return;
    }

    // ===================================
    // BOTÃO
    // ===================================

    const botao =
        document.getElementById(
            "btnZerarSistema"
        );

    if (botao) {

        botao.disabled = true;

        botao.textContent =
            "⏳ Zerando sistema...";
    }

    // ===================================
    // EXECUTAR
    // ===================================

    try {

        let totalApagado = 0;

        for (
            const colecao of COLECOES
        ) {

            const quantidade =
                await apagarColecao(
                    colecao,
                    idEmpresa
                );

            totalApagado +=
                quantidade;
        }

        // ===================================
        // RESULTADO
        // ===================================

        console.log(
            "======================================="
        );

        console.log(
            "LOTRIX ZERADO COM SUCESSO"
        );

        console.log(
            "EMPRESA:",
            idEmpresa
        );

        console.log(
            "ADMINISTRADOR:",
            usuario.nome
        );

        console.log(
            "TOTAL APAGADO:",
            totalApagado
        );

        console.log(
            "======================================="
        );

        alert(
            "✅ LOTRIX ZERADO COM SUCESSO!\n\n" +

            "Todos os dados operacionais desta empresa " +
            "foram apagados.\n\n" +

            "Empresa e usuários foram mantidos.\n\n" +

            `Registros apagados: ${totalApagado}\n\n` +

            "O Lotrix está pronto para começar novamente."
        );

        window.location.reload();

    } catch (erro) {

        console.error(
            "ERRO AO ZERAR SISTEMA:",
            erro
        );

        alert(
            "❌ Erro ao zerar o sistema.\n\n" +
            "Nenhuma garantia de conclusão total pode ser dada.\n\n" +
            "Verifique o Console do navegador."
        );

        if (botao) {

            botao.disabled = false;

            botao.textContent =
                "🗑️ Zerar Sistema";
        }
    }
}

// =======================================
// EXPOR FUNÇÃO
// =======================================

window.zerarSistema =
    zerarSistema;

// =======================================
// INICIALIZAÇÃO
// =======================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const botao =
            document.getElementById(
                "btnZerarSistema"
            );

        // =================================
        // OCULTAR PARA NÃO ADMIN
        // =================================

        if (
            botao &&
            !usuarioEhAdministrador()
        ) {

            botao.style.display =
                "none";

            console.log(
                "Zerar Sistema ocultado: usuário não é administrador."
            );

            return;
        }

        // =================================
        // CONFIGURAR BOTÃO
        // =================================

        if (botao) {

            botao.addEventListener(
                "click",
                zerarSistema
            );

            console.log(
                "Botão Zerar Sistema configurado para administrador."
            );
        }
    }
);