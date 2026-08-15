// =======================================
// LOTRIX - USU?RIOS V6
// FIRESTORE + MULTIEMPRESA
//
// NOVO USU?RIO:
// SEMPRE PERTENCE ? LOJA ATUAL
//
// LISTAGEM:
// SOMENTE USU?RIOS DA LOJA ATUAL
// =======================================

console.log("=======================================");
console.log("LOTRIX USUARIOS.JS V6 CARREGADO");
console.log("MULTIEMPRESA ATIVO");
console.log("USU?RIO SEMPRE VINCULADO ? LOJA ATUAL");
console.log("=======================================");


// =======================================
// FIREBASE
// =======================================

import {
    db,
    authCadastro
} from "./firebase.js";

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
// VARI?VEIS
// =======================================

let usuarios = [];

let usuarioEditando = null;


// =======================================
// USU?RIO LOGADO
// =======================================

function usuarioAtual() {

    try {

        const dados =
            localStorage.getItem(
                "usuarioFoodSync"
            );

        if (!dados) {

            console.error(
                "usuarioFoodSync n?o encontrado."
            );

            return null;

        }

        return JSON.parse(dados);

    } catch (error) {

        console.error(
            "Erro ao ler usu?rio logado:",
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
            "Usu?rio logado n?o encontrado."
        );

        return null;

    }

    if (!usuario.idEmpresa) {

        console.error(
            "Usu?rio logado n?o possui idEmpresa:",
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
            "N?o foi poss?vel identificar a empresa atual."
        );

        mostrarToast(
            "N?o foi poss?vel identificar a loja atual.",
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
// PERMISS?ES
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
// CARREGAR USU?RIOS
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

                    N?o foi poss?vel identificar a loja atual.

                </td>

            </tr>

        `;

        return;

    }

    try {

        console.log("=======================================");
        console.log("CARREGANDO USU?RIOS");
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

                // SEGURAN?A EXTRA
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
            "USU?RIOS DA LOJA:",
            usuarios.length
        );


        mostrarUsuarios(
            usuarios
        );


        atualizarCards();


    } catch (error) {

        console.error(
            "ERRO AO CARREGAR USU?RIOS:",
            error
        );

        mostrarToast(
            "Erro ao carregar usu?rios.",
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

                    Nenhum usu?rio cadastrado nesta loja.

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

                            ??

                        </button>


                        <button
                            type="button"
                            onclick="excluirUsuario('${u.id}')">

                            ???

                        </button>

                    </td>

                </tr>

            `;

        }
    );

}


// =======================================
// ABRIR NOVO USU?RIO
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
            "?? Novo Usu?rio";


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
// CARREGAR PERMISS?ES
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
// SALVAR USU?RIO
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
                    "N?o foi poss?vel identificar a loja atual.",
                    "erro"
                );

                return;

            }


            console.log("=======================================");
            console.log("SALVANDO USU?RIO");
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
            // NOVO USU?RIO
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
                // CRIAR AUTENTICA??O
                // ===================================

                const credencial =
                await createUserWithEmailAndPassword(

    authCadastro,

    email,

    senha

);


                const uid =
                    credencial.user.uid;


                console.log(
                    "UID NOVO USU?RIO:",
                    uid
                );


                // ===================================
                // CRIAR DOCUMENTO
                //
                // AQUI EST? A CORRE??O PRINCIPAL
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
                    "USU?RIO CRIADO NA LOJA:",
                    idEmpresa
                );


                mostrarToast(
                    "Usu?rio criado com sucesso!"
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
                        "Usu?rio n?o encontrado.",
                        "erro"
                    );

                    return;

                }


                // SEGURAN?A:
                // N?O PERMITE EDITAR USU?RIO
                // DE OUTRA EMPRESA

                if (
                    usuario.idEmpresa !==
                    idEmpresa
                ) {

                    mostrarToast(
                        "Este usu?rio n?o pertence ? loja atual.",
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
                    "Usu?rio atualizado!"
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
                "ERRO AO SALVAR USU?RIO:",
                error
            );


            let mensagem =
                "Erro ao salvar usu?rio.";


            if (
                error?.code ===
                "auth/email-already-in-use"
            ) {

                mensagem =
                    "Este email j? est? cadastrado.";

            }


            if (
                error?.code ===
                "auth/invalid-email"
            ) {

                mensagem =
                    "Email inv?lido.";

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
// EDITAR USU?RIO
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
                "Este usu?rio n?o pertence ? loja atual.",
                "erro"
            );

            return;

        }


        usuarioEditando =
            id;


        document.getElementById(
            "tituloModal"
        ).innerHTML =
            "?? Editar Usu?rio";


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
// EXCLUIR USU?RIO
// =======================================

window.excluirUsuario =
    async function(id) {

        const idEmpresa =
            empresaAtual();


        if (!idEmpresa) {

            mostrarToast(
                "Loja atual n?o identificada.",
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
                "Usu?rio n?o encontrado.",
                "erro"
            );

            return;

        }


        // SEGURAN?A MULTIEMPRESA

        if (
            usuario.idEmpresa !==
            idEmpresa
        ) {

            mostrarToast(
                "Este usu?rio n?o pertence ? loja atual.",
                "erro"
            );

            return;

        }


        const confirmar =
            confirm(
                "Deseja realmente excluir este usu?rio?"
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
                "Usu?rio removido!"
            );


            await carregarUsuarios();


        } catch (error) {

            console.error(
                "ERRO AO EXCLUIR USU?RIO:",
                error
            );


            mostrarToast(
                "Erro ao excluir usu?rio.",
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