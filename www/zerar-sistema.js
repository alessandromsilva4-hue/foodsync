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
// COLE??ES OPERACIONAIS
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
// USU?RIO ATUAL
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
            "Erro ao carregar usu?rio:",
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
            "Usu?rio n?o encontrado."
        );

        return null;
    }

    if (!usuario.idEmpresa) {

        console.error(
            "Usu?rio sem idEmpresa:",
            usuario
        );

        alert(
            "Este usu?rio n?o possui uma empresa vinculada."
        );

        return null;
    }

    return usuario.idEmpresa;
}

// =======================================
// APAGAR COLE??O DA EMPRESA
// =======================================

async function apagarColecao(
    nomeColecao,
    idEmpresa
) {

    console.log(
        `Limpando cole??o: ${nomeColecao}`
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
    // SEGURAN?A
    // ===================================

    if (!usuarioEhAdministrador()) {

        alert(
            "? Acesso negado.\n\n" +
            "Somente o administrador pode zerar o sistema."
        );

        console.warn(
            "Tentativa de zerar sistema por usu?rio sem permiss?o."
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
        "EMPRESA QUE SER? LIMPA:",
        idEmpresa
    );

    // ===================================
    // PRIMEIRA CONFIRMA??O
    // ===================================

    const primeiraConfirmacao =
        confirm(
            "?? ATEN??O!\n\n" +

            "Voc? est? prestes a ZERAR o Lotrix " +
            "para esta empresa.\n\n" +

            "Ser?o apagados SOMENTE os dados " +
            "operacionais desta empresa:\n\n" +

            "? Produtos\n" +
            "? Produ??es\n" +
            "? Estoque\n" +
            "? Movimenta??es\n" +
            "? Etiquetas\n" +
            "? Auditoria\n\n" +

            "Usu?rios N?O ser?o apagados.\n" +
            "A empresa N?O ser? apagada.\n\n" +

            "Esta opera??o n?o poder? ser desfeita.\n\n" +

            "Deseja continuar?"
        );

    if (!primeiraConfirmacao) {

        console.log(
            "Opera??o cancelada."
        );

        return;
    }

    // ===================================
    // SEGUNDA CONFIRMA??O
    // ===================================

    const segundaConfirmacao =
        prompt(
            "?? ?LTIMA CONFIRMA??O ??\n\n" +

            "Todos os dados operacionais desta empresa " +
            "ser?o apagados.\n\n" +

            "Digite exatamente:\n\n" +

            "ZERAR\n\n" +

            "para confirmar."
        );

    if (
        segundaConfirmacao !== "ZERAR"
    ) {

        alert(
            "Opera??o cancelada.\n\n" +
            "Nenhum dado foi apagado."
        );

        return;
    }

    // ===================================
    // BOT?O
    // ===================================

    const botao =
        document.getElementById(
            "btnZerarSistema"
        );

    if (botao) {

        botao.disabled = true;

        botao.textContent =
            "? Zerando sistema...";
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
            "? LOTRIX ZERADO COM SUCESSO!\n\n" +

            "Todos os dados operacionais desta empresa " +
            "foram apagados.\n\n" +

            "Empresa e usu?rios foram mantidos.\n\n" +

            `Registros apagados: ${totalApagado}\n\n` +

            "O Lotrix est? pronto para come?ar novamente."
        );

        window.location.reload();

    } catch (erro) {

        console.error(
            "ERRO AO ZERAR SISTEMA:",
            erro
        );

        alert(
            "? Erro ao zerar o sistema.\n\n" +
            "Nenhuma garantia de conclus?o total pode ser dada.\n\n" +
            "Verifique o Console do navegador."
        );

        if (botao) {

            botao.disabled = false;

            botao.textContent =
                "??? Zerar Sistema";
        }
    }
}

// =======================================
// EXPOR FUN??O
// =======================================

window.zerarSistema =
    zerarSistema;

// =======================================
// INICIALIZA??O
// =======================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const botao =
            document.getElementById(
                "btnZerarSistema"
            );

        // =================================
        // OCULTAR PARA N?O ADMIN
        // =================================

        if (
            botao &&
            !usuarioEhAdministrador()
        ) {

            botao.style.display =
                "none";

            console.log(
                "Zerar Sistema ocultado: usu?rio n?o ? administrador."
            );

            return;
        }

        // =================================
        // CONFIGURAR BOT?O
        // =================================

        if (botao) {

            botao.addEventListener(
                "click",
                zerarSistema
            );

            console.log(
                "Bot?o Zerar Sistema configurado para administrador."
            );
        }
    }
);