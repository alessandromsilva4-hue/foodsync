// =======================================
// LOTRIX - USUÁRIOS V7
// FIRESTORE + MULTIEMPRESA
//
// SEM CLOUD FUNCTIONS
// SEM TROCAR SESSÃO DO ADMINISTRADOR
//
// NOVO USUÁRIO:
// - Criado em uma segunda instância do Firebase Auth
// - Pertence sempre à empresa do administrador
//
// LISTAGEM:
// - Somente usuários da empresa atual
//
// SEGURANÇA:
// - Somente administrador ativo pode criar
// - Somente usuários da empresa atual podem ser editados/excluídos
// =======================================

console.log("=======================================");
console.log("LOTRIX USUARIOS.JS V7 CARREGADO");
console.log("MULTIEMPRESA ATIVO");
console.log("SEM CLOUD FUNCTIONS");
console.log("AUTH SECUNDÁRIO ATIVO");
console.log("=======================================");


// =======================================
// FIREBASE
// =======================================

import {
    db,
    auth
} from "./firebase.js";

import {
    collection,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    createUserWithEmailAndPassword,
    deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getApp,
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    mostrarToast
} from "./utils.js";


// =======================================
// AUTH SECUNDÁRIO
//
// IMPORTANTE:
//
// O administrador continua conectado
// no auth principal.
//
// O novo usuário é criado somente
// no auth secundário.
//
// Isso evita trocar a sessão.
// =======================================

let authSecundario = null;

try {

    const appPrincipal =
        getApp();

    const appSecundario =
        initializeApp(
            appPrincipal.options,
            "LotrixUsuarioSecundario"
        );

    authSecundario =
        getAuth(
            appSecundario
        );

    console.log(
        "AUTH SECUNDÁRIO INICIALIZADO."
    );

} catch (error) {

    console.error(
        "ERRO AO INICIALIZAR AUTH SECUNDÁRIO:",
        error
    );

}


// =======================================
// ELEMENTOS
// =======================================

const tabelaUsuarios =
    document.getElementById(
        "tabelaUsuarios"
    );

const btnNovoUsuario =
    document.getElementById(
        "btnNovoUsuario"
    );

const modalUsuario =
    document.getElementById(
        "modalUsuario"
    );

const btnCancelar =
    document.getElementById(
        "btnCancelar"
    );

const btnFecharModal =
    document.getElementById(
        "btnFecharModal"
    );

const formUsuario =
    document.getElementById(
        "formUsuario"
    );


// =======================================
// CAMPOS
// =======================================

const nomeUsuario =
    document.getElementById(
        "nomeUsuario"
    );

const emailUsuario =
    document.getElementById(
        "emailUsuario"
    );

const senhaUsuario =
    document.getElementById(
        "senhaUsuario"
    );

const perfilUsuario =
    document.getElementById(
        "perfilUsuario"
    );

const statusUsuario =
    document.getElementById(
        "statusUsuario"
    );


// =======================================
// VARIÁVEIS
// =======================================

let usuarios = [];

let usuarioEditando = null;


// =======================================
// USUÁRIO LOGADO
// =======================================

function usuarioAtual() {

    try {

        const dados =
            localStorage.getItem(
                "usuarioFoodSync"
            );

        if (!dados) {

            console.error(
                "usuarioFoodSync não encontrado."
            );

            return null;

        }

        return JSON.parse(
            dados
        );

    } catch (error) {

        console.error(
            "Erro ao ler usuário logado:",
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
            "Usuário logado não encontrado."
        );

        return null;

    }

    if (!usuario.idEmpresa) {

        console.error(
            "Usuário logado não possui idEmpresa:",
            usuario
        );

        return null;

    }

    return usuario.idEmpresa;

}


// =======================================
// VERIFICAR ADMINISTRADOR
// =======================================

function ehAdministrador() {

    const usuario =
        usuarioAtual();

    if (!usuario) {

        return false;

    }

    const perfil =
        String(
            usuario.perfil || ""
        )
            .toLowerCase()
            .trim();

    const status =
        String(
            usuario.status || ""
        )
            .toLowerCase()
            .trim();

    return (
        perfil === "administrador" &&
        status === "ativo"
    );

}


// =======================================
// VERIFICAR EMPRESA
// =======================================

function verificarEmpresa() {

    const idEmpresa =
        empresaAtual();

    if (!idEmpresa) {

        console.error(
            "Não foi possível identificar a empresa atual."
        );

        mostrarToast(
            "Não foi possível identificar a loja atual.",
            "erro"
        );

        return false;

    }

    console.log(
        "LOJA ATUAL:",
        idEmpresa
    );

    return true;

}


// =======================================
// PERMISSÕES
// =======================================

function pegarPermissoes() {

    return {

        dashboard:
            document.getElementById(
                "permDashboard"
            )?.checked || false,

        produtos:
            document.getElementById(
                "permProdutos"
            )?.checked || false,

        producao:
            document.getElementById(
                "permProducao"
            )?.checked || false,

        etiquetas:
            document.getElementById(
                "permEtiquetas"
            )?.checked || false,

        estoque:
            document.getElementById(
                "permEstoque"
            )?.checked || false,

        relatorios:
            document.getElementById(
                "permRelatorios"
            )?.checked || false,

        usuarios:
            document.getElementById(
                "permUsuarios"
            )?.checked || false,

        configuracoes:
            document.getElementById(
                "permConfiguracoes"
            )?.checked || false

    };

}


// =======================================
// CARREGAR USUÁRIOS
//
// SOMENTE EMPRESA ATUAL
// =======================================

async function carregarUsuarios() {

    if (!tabelaUsuarios) {

        return;

    }

    const idEmpresa =
        empresaAtual();

    if (!idEmpresa) {

        tabelaUsuarios.innerHTML = `

            <tr>

                <td colspan="5">

                    Não foi possível identificar a loja atual.

                </td>

            </tr>

        `;

        return;

    }

    try {

        console.log("=======================================");
        console.log("CARREGANDO USUÁRIOS");
        console.log(
            "LOJA ATUAL:",
            idEmpresa
        );
        console.log("=======================================");

        const consulta =
            query(

                collection(
                    db,
                    "usuarios"
                ),

                where(
                    "idEmpresa",
                    "==",
                    idEmpresa
                )

            );

        const snap =
            await getDocs(
                consulta
            );

        usuarios = [];

        snap.forEach(
            item => {

                const dados =
                    item.data();

                // SEGURANÇA EXTRA
                if (
                    dados.idEmpresa !==
                    idEmpresa
                ) {

                    return;

                }

                usuarios.push({

                    id:
                        item.id,

                    ...dados

                });

            }
        );

        console.log(
            "USUÁRIOS DA LOJA:",
            usuarios.length
        );

        mostrarUsuarios(
            usuarios
        );

        atualizarCards();

    } catch (error) {

        console.error(
            "ERRO AO CARREGAR USUÁRIOS:",
            error
        );

        mostrarToast(
            "Erro ao carregar usuários.",
            "erro"
        );

    }

}


// =======================================
// CARDS
// =======================================

function atualizarCards() {

    const total =
        document.getElementById(
            "cardTotal"
        );

    const ativos =
        document.getElementById(
            "cardAtivos"
        );

    const admins =
        document.getElementById(
            "cardAdmins"
        );

    const operadores =
        document.getElementById(
            "cardOperadores"
        );

    if (total) {

        total.innerText =
            usuarios.length;

    }

    if (ativos) {

        ativos.innerText =
            usuarios.filter(
                u =>
                    String(
                        u.status || ""
                    )
                        .toLowerCase() ===
                    "ativo"
            ).length;

    }

    if (admins) {

        admins.innerText =
            usuarios.filter(
                u =>
                    String(
                        u.perfil || ""
                    )
                        .toLowerCase() ===
                    "administrador"
            ).length;

    }

    if (operadores) {

        operadores.innerText =
            usuarios.filter(
                u =>
                    String(
                        u.perfil || ""
                    )
                        .toLowerCase() ===
                    "operador"
            ).length;

    }

}


// =======================================
// MOSTRAR TABELA
// =======================================

function mostrarUsuarios(lista) {

    if (!tabelaUsuarios) {

        return;

    }

    tabelaUsuarios.innerHTML =
        "";

    if (!lista.length) {

        tabelaUsuarios.innerHTML = `

            <tr>

                <td colspan="5">

                    Nenhum usuário cadastrado nesta loja.

                </td>

            </tr>

        `;

        return;

    }

    lista.forEach(
        u => {

            const nome =
                escapeHtml(
                    u.nome || "-"
                );

            const email =
                escapeHtml(
                    u.email || "-"
                );

            const perfil =
                escapeHtml(
                    u.perfil || "-"
                );

            const status =
                escapeHtml(
                    u.status || "-"
                );

            tabelaUsuarios.innerHTML += `

                <tr>

                    <td>
                        ${nome}
                    </td>

                    <td>
                        ${email}
                    </td>

                    <td>
                        ${perfil}
                    </td>

                    <td>

                        <span class="status ${status}">

                            ${status}

                        </span>

                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="editarUsuario('${u.id}')">

                            ✏️

                        </button>

                        <button
                            type="button"
                            onclick="excluirUsuario('${u.id}')">

                            🗑️

                        </button>

                    </td>

                </tr>

            `;

        }
    );

}


// =======================================
// PROTEÇÃO CONTRA HTML
// =======================================

function escapeHtml(valor) {

    return String(
        valor
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =======================================
// ABRIR NOVO USUÁRIO
// =======================================

btnNovoUsuario?.addEventListener(
    "click",
    () => {

        if (!ehAdministrador()) {

            mostrarToast(
                "Somente administradores ativos podem criar usuários.",
                "erro"
            );

            return;

        }

        if (!authSecundario) {

            mostrarToast(
                "Serviço de autenticação indisponível.",
                "erro"
            );

            return;

        }

        usuarioEditando =
            null;

        formUsuario?.reset();

        emailUsuario.disabled =
            false;

        senhaUsuario.required =
            true;

        document.getElementById(
            "tituloModal"
        ).innerHTML =
            "👤 Novo Usuário";

        carregarPermissoes({});

        modalUsuario.style.display =
            "flex";

    }
);


// =======================================
// FECHAR MODAL
// =======================================

function fecharModal() {

    if (modalUsuario) {

        modalUsuario.style.display =
            "none";

    }

    usuarioEditando =
        null;

    if (formUsuario) {

        formUsuario.reset();

    }

    emailUsuario.disabled =
        false;

    senhaUsuario.required =
        true;

}


btnCancelar?.addEventListener(
    "click",
    fecharModal
);


btnFecharModal?.addEventListener(
    "click",
    fecharModal
);


// =======================================
// CARREGAR PERMISSÕES
// =======================================

function carregarPermissoes(
    permissoes = {}
) {

    const campos = {

        permDashboard:
            permissoes.dashboard,

        permProdutos:
            permissoes.produtos,

        permProducao:
            permissoes.producao,

        permEtiquetas:
            permissoes.etiquetas,

        permEstoque:
            permissoes.estoque,

        permRelatorios:
            permissoes.relatorios,

        permUsuarios:
            permissoes.usuarios,

        permConfiguracoes:
            permissoes.configuracoes

    };

    Object.entries(
        campos
    ).forEach(
        ([id, valor]) => {

            const elemento =
                document.getElementById(
                    id
                );

            if (elemento) {

                elemento.checked =
                    valor || false;

            }

        }
    );

}


// =======================================
// CRIAR USUÁRIO
//
// SEM CLOUD FUNCTION
//
// USA AUTH SECUNDÁRIO
// =======================================

async function criarNovoUsuario({
    nome,
    email,
    senha,
    perfil,
    status,
    permissoes,
    idEmpresa
}) {

    if (!authSecundario) {

        throw new Error(
            "AUTH_SECUNDARIO_NAO_INICIALIZADO"
        );

    }

    console.log(
        "CRIANDO NOVO USUÁRIO NO AUTH SECUNDÁRIO..."
    );

    let credencial =
        null;

    try {

        // ===================================
        // CRIAR AUTH
        // ===================================

        credencial =
            await createUserWithEmailAndPassword(

                authSecundario,

                email,

                senha

            );

        const novoUsuario =
            credencial.user;

        const uid =
            novoUsuario.uid;

        console.log(
            "UID NOVO USUÁRIO:",
            uid
        );

        // ===================================
        // CRIAR PERFIL FIRESTORE
        // ===================================

        await setDoc(

            doc(
                db,
                "usuarios",
                uid
            ),

            {

                id:
                    uid,

                nome:
                    nome,

                email:
                    email,

                perfil:
                    perfil,

                status:
                    status,

                permissoes:
                    permissoes,

                idEmpresa:
                    idEmpresa,

                criadoPor:
                    auth.currentUser?.uid || null,

                criadoEm:
                    serverTimestamp()

            }

        );

        console.log(
            "PERFIL CRIADO NA EMPRESA:",
            idEmpresa
        );

        // ===================================
        // DESLOGAR AUTH SECUNDÁRIO
        // ===================================

        try {

            await authSecundario.signOut();

        } catch (logoutError) {

            console.warn(
                "Não foi possível sair do AUTH secundário:",
                logoutError
            );

        }

        return {

            sucesso:
                true,

            uid:
                uid

        };

    } catch (error) {

        console.error(
            "ERRO AO CRIAR USUÁRIO:",
            error
        );

        // ===================================
        // ROLLBACK
        //
        // Se criou AUTH mas falhou Firestore,
        // remove o usuário criado.
        // ===================================

        if (
            credencial?.user
        ) {

            try {

                await deleteUser(
                    credencial.user
                );

                console.log(
                    "ROLLBACK AUTH REALIZADO."
                );

            } catch (rollbackError) {

                console.error(
                    "ERRO NO ROLLBACK:",
                    rollbackError
                );

            }

        }

        throw error;

    }

}


// =======================================
// SALVAR USUÁRIO
// =======================================

formUsuario?.addEventListener(
    "submit",

    async event => {

        event.preventDefault();

        try {

            // ===================================
            // VERIFICAR ADMIN
            // ===================================

            if (!ehAdministrador()) {

                mostrarToast(
                    "Somente administradores ativos podem gerenciar usuários.",
                    "erro"
                );

                return;

            }

            // ===================================
            // EMPRESA
            // ===================================

            const idEmpresa =
                empresaAtual();

            if (!idEmpresa) {

                mostrarToast(
                    "Não foi possível identificar a loja atual.",
                    "erro"
                );

                return;

            }

            // ===================================
            // DADOS
            // ===================================

            const nome =
                nomeUsuario.value
                    .trim();

            const email =
                emailUsuario.value
                    .trim()
                    .toLowerCase();

            const senha =
                senhaUsuario.value;

            const perfil =
                String(
                    perfilUsuario.value || "operador"
                )
                    .toLowerCase()
                    .trim();

            const status =
                String(
                    statusUsuario.value || "ativo"
                )
                    .toLowerCase()
                    .trim();

            const permissoes =
                pegarPermissoes();

            // ===================================
            // VALIDAÇÕES
            // ===================================

            if (!nome) {

                mostrarToast(
                    "Informe o nome do usuário.",
                    "erro"
                );

                return;

            }

            if (!email) {

                mostrarToast(
                    "Informe o email.",
                    "erro"
                );

                return;

            }

            // ===================================
            // NOVO USUÁRIO
            // ===================================

            if (!usuarioEditando) {

                if (!senha) {

                    mostrarToast(
                        "Informe uma senha.",
                        "erro"
                    );

                    return;

                }

                if (senha.length < 6) {

                    mostrarToast(
                        "A senha deve ter pelo menos 6 caracteres.",
                        "erro"
                    );

                    return;

                }

                console.log(
                    "======================================="
                );

                console.log(
                    "CRIANDO NOVO USUÁRIO"
                );

                console.log(
                    "EMPRESA:",
                    idEmpresa
                );

                console.log(
                    "PERFIL:",
                    perfil
                );

                console.log(
                    "======================================="
                );

                await criarNovoUsuario({

                    nome,

                    email,

                    senha,

                    perfil,

                    status,

                    permissoes,

                    idEmpresa

                });

                mostrarToast(
                    "Usuário criado com sucesso!"
                );

            }

            // ===================================
            // EDITAR USUÁRIO
            // ===================================

            else {

                const usuario =
                    usuarios.find(
                        u =>
                            u.id ===
                            usuarioEditando
                    );

                if (!usuario) {

                    mostrarToast(
                        "Usuário não encontrado.",
                        "erro"
                    );

                    return;

                }

                // ===================================
                // SEGURANÇA MULTIEMPRESA
                // ===================================

                if (
                    usuario.idEmpresa !==
                    idEmpresa
                ) {

                    mostrarToast(
                        "Este usuário não pertence à loja atual.",
                        "erro"
                    );

                    return;

                }

                await updateDoc(

                    doc(
                        db,
                        "usuarios",
                        usuarioEditando
                    ),

                    {

                        nome,

                        perfil,

                        status,

                        permissoes,

                        atualizadoEm:
                            serverTimestamp()

                    }

                );

                mostrarToast(
                    "Usuário atualizado!"
                );

            }

            // ===================================
            // FINALIZAR
            // ===================================

            fecharModal();

            await carregarUsuarios();

        } catch (error) {

            console.error(
                "ERRO AO SALVAR USUÁRIO:",
                error
            );

            let mensagem =
                "Erro ao salvar usuário.";

            // Firebase Auth
            if (
                error?.code ===
                "auth/email-already-in-use"
            ) {

                mensagem =
                    "Este email já está cadastrado.";

            } else if (
                error?.code ===
                "auth/invalid-email"
            ) {

                mensagem =
                    "Email inválido.";

            } else if (
                error?.code ===
                "auth/weak-password"
            ) {

                mensagem =
                    "A senha deve ter pelo menos 6 caracteres.";

            } else if (
                error?.code ===
                "auth/network-request-failed"
            ) {

                mensagem =
                    "Erro de conexão com o Firebase.";

            } else if (
                error?.code ===
                "permission-denied"
            ) {

                mensagem =
                    "Você não tem permissão para criar este usuário.";

            } else if (
                error?.message ===
                "AUTH_SECUNDARIO_NAO_INICIALIZADO"
            ) {

                mensagem =
                    "Não foi possível iniciar o cadastro de usuário.";

            }

            mostrarToast(
                mensagem,
                "erro"
            );

        }

    }
);


// =======================================
// EDITAR USUÁRIO
// =======================================

window.editarUsuario =
    function(id) {

        // ===================================
        // SEGURANÇA
        // ===================================

        if (!ehAdministrador()) {

            mostrarToast(
                "Somente administradores ativos podem editar usuários.",
                "erro"
            );

            return;

        }

        const usuario =
            usuarios.find(
                u =>
                    u.id ===
                    id
            );

        if (!usuario) {

            mostrarToast(
                "Usuário não encontrado.",
                "erro"
            );

            return;

        }

        const idEmpresa =
            empresaAtual();

        if (
            !idEmpresa ||
            usuario.idEmpresa !==
            idEmpresa
        ) {

            mostrarToast(
                "Este usuário não pertence à loja atual.",
                "erro"
            );

            return;

        }

        usuarioEditando =
            id;

        document.getElementById(
            "tituloModal"
        ).innerHTML =
            "✏️ Editar Usuário";

        nomeUsuario.value =
            usuario.nome || "";

        emailUsuario.value =
            usuario.email || "";

        senhaUsuario.value =
            "";

        senhaUsuario.required =
            false;

        emailUsuario.disabled =
            true;

        perfilUsuario.value =
            usuario.perfil ||
            "operador";

        statusUsuario.value =
            usuario.status ||
            "ativo";

        carregarPermissoes(
            usuario.permissoes || {}
        );

        modalUsuario.style.display =
            "flex";

    };


// =======================================
// EXCLUIR USUÁRIO
// =======================================

window.excluirUsuario =
    async function(id) {

        // ===================================
        // ADMIN
        // ===================================

        if (!ehAdministrador()) {

            mostrarToast(
                "Somente administradores ativos podem excluir usuários.",
                "erro"
            );

            return;

        }

        const idEmpresa =
            empresaAtual();

        if (!idEmpresa) {

            mostrarToast(
                "Loja atual não identificada.",
                "erro"
            );

            return;

        }

        const usuario =
            usuarios.find(
                u =>
                    u.id ===
                    id
            );

        if (!usuario) {

            mostrarToast(
                "Usuário não encontrado.",
                "erro"
            );

            return;

        }

        // ===================================
        // SEGURANÇA MULTIEMPRESA
        // ===================================

        if (
            usuario.idEmpresa !==
            idEmpresa
        ) {

            mostrarToast(
                "Este usuário não pertence à loja atual.",
                "erro"
            );

            return;

        }

        // ===================================
        // NÃO PERMITIR EXCLUIR A SI MESMO
        // ===================================

        if (
            auth.currentUser?.uid ===
            id
        ) {

            mostrarToast(
                "Você não pode excluir seu próprio usuário.",
                "erro"
            );

            return;

        }

        const confirmar =
            confirm(
                `Deseja realmente excluir o usuário "${usuario.nome || usuario.email}"?`
            );

        if (!confirmar) {

            return;

        }

        try {

            // ===================================
            // EXCLUIR PERFIL FIRESTORE
            // ===================================

            await deleteDoc(

                doc(
                    db,
                    "usuarios",
                    id
                )

            );

            mostrarToast(
                "Usuário removido!"
            );

            await carregarUsuarios();

        } catch (error) {

            console.error(
                "ERRO AO EXCLUIR USUÁRIO:",
                error
            );

            let mensagem =
                "Erro ao excluir usuário.";

            if (
                error?.code ===
                "permission-denied"
            ) {

                mensagem =
                    "Você não tem permissão para excluir este usuário.";

            }

            mostrarToast(
                mensagem,
                "erro"
            );

        }

    };


// =======================================
// PESQUISA
// =======================================

document
    .getElementById(
        "pesquisaUsuario"
    )
    ?.addEventListener(

        "input",

        event => {

            const texto =
                event.target.value
                    .toLowerCase()
                    .trim();

            const filtrados =
                usuarios.filter(
                    u => {

                        return (

                            String(
                                u.nome || ""
                            )
                                .toLowerCase()
                                .includes(
                                    texto
                                )

                            ||

                            String(
                                u.email || ""
                            )
                                .toLowerCase()
                                .includes(
                                    texto
                                )

                            ||

                            String(
                                u.perfil || ""
                            )
                                .toLowerCase()
                                .includes(
                                    texto
                                )

                            ||

                            String(
                                u.status || ""
                            )
                                .toLowerCase()
                                .includes(
                                    texto
                                )

                        );

                    }
                );

            mostrarUsuarios(
                filtrados
            );

        }

    );


// =======================================
// INICIAR
// =======================================

if (
    verificarEmpresa()
) {

    carregarUsuarios();

}