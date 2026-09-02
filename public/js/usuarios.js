// =======================================
// LOTRIX - USUÁRIOS V6
// FIRESTORE + MULTIEMPRESA
//
// NOVO USUÁRIO:
// SEMPRE PERTENCE À LOJA ATUAL
//
// LISTAGEM:
// SOMENTE USUÁRIOS DA LOJA ATUAL
// =======================================

console.log("=======================================");
console.log("LOTRIX USUARIOS.JS V6 CARREGADO");
console.log("MULTIEMPRESA ATIVO");
console.log("USUÁRIO SEMPRE VINCULADO À LOJA ATUAL");
console.log("=======================================");


// =======================================
// FIREBASE
// =======================================

import { db, auth } from "./firebase.js";

import {
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    mostrarToast
} from "./utils.js";


// =======================================
// ELEMENTOS
// =======================================

const tabelaUsuarios =
    document.getElementById("tabelaUsuarios");

const btnNovoUsuario =
    document.getElementById("btnNovoUsuario");

const modalUsuario =
    document.getElementById("modalUsuario");

const btnCancelar =
    document.getElementById("btnCancelar");

const btnFecharModal =
    document.getElementById("btnFecharModal");

const formUsuario =
    document.getElementById("formUsuario");


// =======================================
// CAMPOS
// =======================================

const nomeUsuario =
    document.getElementById("nomeUsuario");

const emailUsuario =
    document.getElementById("emailUsuario");

const senhaUsuario =
    document.getElementById("senhaUsuario");

const perfilUsuario =
    document.getElementById("perfilUsuario");

const statusUsuario =
    document.getElementById("statusUsuario");


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

        return JSON.parse(dados);

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
// SOMENTE A LOJA ATUAL
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
                    (u.status || "")
                        .toLowerCase() ===
                    "ativo"
            ).length;

    }


    if (admins) {

        admins.innerText =
            usuarios.filter(
                u =>
                    (u.perfil || "")
                        .toLowerCase() ===
                    "administrador"
            ).length;

    }


    if (operadores) {

        operadores.innerText =
            usuarios.filter(
                u =>
                    (u.perfil || "")
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

            tabelaUsuarios.innerHTML += `

                <tr>

                    <td>
                        ${u.nome || "-"}
                    </td>

                    <td>
                        ${u.email || "-"}
                    </td>

                    <td>
                        ${u.perfil || "-"}
                    </td>

                    <td>

                        <span class="status ${u.status || ""}">

                            ${u.status || "-"}

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
// ABRIR NOVO USUÁRIO
// =======================================

btnNovoUsuario?.addEventListener(
    "click",
    () => {

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

    document.getElementById(
        "permDashboard"
    ).checked =
        permissoes.dashboard || false;


    document.getElementById(
        "permProdutos"
    ).checked =
        permissoes.produtos || false;


    document.getElementById(
        "permProducao"
    ).checked =
        permissoes.producao || false;


    document.getElementById(
        "permEtiquetas"
    ).checked =
        permissoes.etiquetas || false;


    document.getElementById(
        "permEstoque"
    ).checked =
        permissoes.estoque || false;


    document.getElementById(
        "permRelatorios"
    ).checked =
        permissoes.relatorios || false;


    document.getElementById(
        "permUsuarios"
    ).checked =
        permissoes.usuarios || false;


    document.getElementById(
        "permConfiguracoes"
    ).checked =
        permissoes.configuracoes || false;

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
            // EMPRESA ATUAL
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


            console.log("=======================================");
            console.log("SALVANDO USUÁRIO");
            console.log(
                "ID EMPRESA:",
                idEmpresa
            );
            console.log("=======================================");


            // ===================================
            // DADOS
            // ===================================

            const nome =
                nomeUsuario.value.trim();


            const email =
                emailUsuario.value.trim();


            const senha =
                senhaUsuario.value;


            const perfil =
                perfilUsuario.value.toLowerCase();


            const status =
                statusUsuario.value.toLowerCase();


            const permissoes =
                pegarPermissoes();


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


                // ===================================
                // CRIAR AUTENTICAÇÃO
                // ===================================

                const credencial =
                    await createUserWithEmailAndPassword(

                        auth,

                        email,

                        senha

                    );


                const uid =
                    credencial.user.uid;


                console.log(
                    "UID NOVO USUÁRIO:",
                    uid
                );


                // ===================================
                // CRIAR DOCUMENTO
                //
                // AQUI ESTÁ A CORREÇÃO PRINCIPAL
                // ===================================

                await setDoc(

                    doc(
                        db,
                        "usuarios",
                        uid
                    ),

                    {

                        nome,

                        email,

                        perfil,

                        status,

                        permissoes,

                        // LOJA ATUAL
                        idEmpresa:
                            idEmpresa,

                        criadoEm:
                            serverTimestamp()

                    }

                );


                console.log(
                    "USUÁRIO CRIADO NA LOJA:",
                    idEmpresa
                );


                mostrarToast(
                    "Usuário criado com sucesso!"
                );

            }


            // ===================================
            // EDITAR
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


                // SEGURANÇA:
                // NÃO PERMITE EDITAR USUÁRIO
                // DE OUTRA EMPRESA

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


            formUsuario.reset();


            usuarioEditando =
                null;


            await carregarUsuarios();


        } catch (error) {

            console.error(
                "ERRO AO SALVAR USUÁRIO:",
                error
            );


            let mensagem =
                "Erro ao salvar usuário.";


            if (
                error?.code ===
                "auth/email-already-in-use"
            ) {

                mensagem =
                    "Este email já está cadastrado.";

            }


            if (
                error?.code ===
                "auth/invalid-email"
            ) {

                mensagem =
                    "Email inválido.";

            }


            if (
                error?.code ===
                "auth/weak-password"
            ) {

                mensagem =
                    "A senha deve ter pelo menos 6 caracteres.";

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

        const usuario =
            usuarios.find(
                u =>
                    u.id ===
                    id
            );


        if (!usuario) {

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
            usuario.permissoes
        );


        modalUsuario.style.display =
            "flex";

    };


// =======================================
// EXCLUIR USUÁRIO
// =======================================

window.excluirUsuario =
    async function(id) {

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


        // SEGURANÇA MULTIEMPRESA

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


        const confirmar =
            confirm(
                "Deseja realmente excluir este usuário?"
            );


        if (!confirmar) {

            return;

        }


        try {

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


            mostrarToast(
                "Erro ao excluir usuário.",
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

                            (u.nome || "")
                                .toLowerCase()
                                .includes(
                                    texto
                                )

                            ||

                            (u.email || "")
                                .toLowerCase()
                                .includes(
                                    texto
                                )

                            ||

                            (u.perfil || "")
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

if (verificarEmpresa()) {

    carregarUsuarios();

}