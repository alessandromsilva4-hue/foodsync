// =======================================
// LOTRIX - AUTENTICAÇÃO E PERMISSÕES
// MULTIEMPRESA
// =======================================

import "./design-system.js";
import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("LOTRIX AUTH.JS CARREGADO - MULTIEMPRESA");


// =======================================
// CHAVES
// =======================================

const CHAVE_USUARIO = "usuarioFoodSync";
const CHAVE_EMPRESA = "idEmpresa";


// =======================================
// OBTER USUÁRIO LOCAL
// =======================================

function obterUsuarioLocal() {

    try {

        return JSON.parse(
            localStorage.getItem(CHAVE_USUARIO)
        );

    }
    catch (error) {

        console.error(
            "Erro ao ler usuário local:",
            error
        );

        return null;

    }

}


// =======================================
// OBTER ID DA EMPRESA
// =======================================

function obterIdEmpresa() {

    const usuario =
        obterUsuarioLocal();

    return usuario?.idEmpresa || "";

}


// =======================================
// REGISTRAR AUDITORIA
// =======================================

window.registrarAuditoria = async function (
    modulo,
    acao,
    detalhes = ""
) {

    try {

        const usuario =
            obterUsuarioLocal();

        if (!usuario) {

            console.warn(
                "Auditoria ignorada: usuário não encontrado."
            );

            return;

        }


        await addDoc(
            collection(db, "auditoria"),
            {

                usuario:
                    usuario.nome || "Sistema",

                email:
                    usuario.email || "",

                idEmpresa:
                    usuario.idEmpresa || "",

                modulo:
                    modulo,

                acao:
                    acao,

                detalhes:
                    detalhes,

                status:
                    "Sucesso",

                data:
                    serverTimestamp()

            }
        );


        console.log(
            "Auditoria registrada:",
            acao,
            "| Empresa:",
            usuario.idEmpresa
        );

    }
    catch (error) {

        console.error(
            "Erro auditoria:",
            error
        );

    }

};


// =======================================
// LOGIN
// =======================================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const senha =
                document
                    .getElementById("senha")
                    .value;


            const mensagem =
                document.getElementById(
                    "mensagemLogin"
                );


            try {

                // -------------------------------
                // LOGIN FIREBASE
                // -------------------------------

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    senha
                );


                console.log(
                    "LOGIN FIREBASE REALIZADO"
                );


                // -------------------------------
                // CARREGAR PERFIL
                // -------------------------------

                const perfilLogin =
                    await carregarPerfil(
                        auth.currentUser
                    );


                if (!perfilLogin) {

                    await signOut(auth);

                    mensagem.style.color =
                        "#dc2626";

                    mensagem.textContent =
                        "Perfil do usuário não encontrado.";

                    return;

                }


                // -------------------------------
                // VERIFICAR STATUS
                // -------------------------------

                const status =
                    (
                        perfilLogin.status || ""
                    ).toLowerCase();


                if (status === "pendente") {

                    await signOut(auth);

                    mensagem.style.color =
                        "#b45309";

                    mensagem.textContent =
                        "Cadastro recebido. Aguarde a liberação da equipe.";

                    return;

                }


                if (status !== "ativo") {

                    await signOut(auth);

                    mensagem.style.color =
                        "#dc2626";

                    mensagem.textContent =
                        "Usuário não está ativo.";

                    return;

                }


                // -------------------------------
                // VERIFICAR EMPRESA
                // -------------------------------

                if (!perfilLogin.idEmpresa) {

                    console.error(
                        "USUÁRIO SEM EMPRESA:",
                        perfilLogin
                    );

                    await signOut(auth);

                    localStorage.removeItem(
                        CHAVE_USUARIO
                    );

                    localStorage.removeItem(
                        CHAVE_EMPRESA
                    );

                    mensagem.style.color =
                        "#dc2626";

                    mensagem.textContent =
                        "Seu usuário ainda não está vinculado a uma empresa.";

                    return;

                }


                // -------------------------------
                // SALVAR EMPRESA
                // -------------------------------

                localStorage.setItem(
                    CHAVE_EMPRESA,
                    perfilLogin.idEmpresa
                );


                console.log(
                    "================================="
                );

                console.log(
                    "LOTRIX LOGIN"
                );

                console.log(
                    "Usuário:",
                    perfilLogin.nome
                );

                console.log(
                    "E-mail:",
                    perfilLogin.email
                );

                console.log(
                    "Perfil:",
                    perfilLogin.perfil
                );

                console.log(
                    "Empresa:",
                    perfilLogin.idEmpresa
                );

                console.log(
                    "================================="
                );


                // -------------------------------
                // AUDITORIA
                // -------------------------------

                await registrarAuditoria(
                    "Sistema",
                    "LOGIN",
                    "Usuário realizou login no sistema"
                );


                mensagem.style.color =
                    "#16a34a";

                mensagem.textContent =
                    "Login realizado com sucesso!";


                // -------------------------------
                // DASHBOARD
                // -------------------------------

                setTimeout(
                    () => {

                        window.location.href =
                            "dashboard.html";

                    },
                    700
                );

            }
            catch (error) {

                console.error(
                    "Erro login:",
                    error
                );

                mensagem.style.color =
                    "#dc2626";

                mensagem.textContent =
                    "Usuário ou senha inválidos";

            }

        }
    );

}


// =======================================
// MOSTRAR / OCULTAR SENHA
// =======================================

document
    .querySelectorAll(
        "[data-password-toggle]"
    )
    .forEach(
        (botao) => {

            botao.addEventListener(
                "click",
                () => {

                    const campo =
                        document.getElementById(
                            botao.dataset.passwordToggle
                        );

                    if (!campo) {
                        return;
                    }


                    const mostrar =
                        campo.type === "password";


                    campo.type =
                        mostrar
                            ? "text"
                            : "password";


                    botao.setAttribute(
                        "aria-pressed",
                        String(mostrar)
                    );


                    botao.setAttribute(
                        "aria-label",
                        mostrar
                            ? "Ocultar senha"
                            : "Mostrar senha"
                    );

                }
            );

        }
    );


// =======================================
// CADASTRO
// =======================================

const cadastroForm =
    document.getElementById(
        "cadastroForm"
    );

const mostrarCadastro =
    document.getElementById(
        "mostrarCadastro"
    );

const voltarLogin =
    document.getElementById(
        "voltarLogin"
    );

const alterarSenha =
    document.getElementById(
        "alterarSenha"
    );


function exibirCadastro(exibir) {

    if (loginForm) {

        loginForm.hidden =
            exibir;

    }

    if (cadastroForm) {

        cadastroForm.hidden =
            !exibir;

    }

}


mostrarCadastro?.addEventListener(
    "click",
    () => exibirCadastro(true)
);


voltarLogin?.addEventListener(
    "click",
    () => exibirCadastro(false)
);


// =======================================
// ALTERAR SENHA
// =======================================

alterarSenha?.addEventListener(
    "click",
    async () => {

        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const mensagem =
            document.getElementById(
                "mensagemLogin"
            );


        if (!email) {

            mensagem.style.color =
                "#dc2626";

            mensagem.textContent =
                "Informe seu e-mail para alterar a senha.";

            document
                .getElementById("email")
                .focus();

            return;

        }


        try {

            await sendPasswordResetEmail(
                auth,
                email
            );


            mensagem.style.color =
                "#16a34a";

            mensagem.textContent =
                "Enviamos um link para alterar sua senha.";

        }
        catch (error) {

            console.error(
                "Erro ao solicitar alteração de senha:",
                error
            );

            mensagem.style.color =
                "#dc2626";

            mensagem.textContent =
                "Não foi possível enviar o link. Confira o e-mail informado.";

        }

    }
);


// =======================================
// NOVO CADASTRO
// =======================================

cadastroForm?.addEventListener(
    "submit",
    async (evento) => {

        evento.preventDefault();


        const nome =
            document
                .getElementById("nomeCadastro")
                .value
                .trim();


        const email =
            document
                .getElementById("emailCadastro")
                .value
                .trim();


        const senha =
            document
                .getElementById("senhaCadastro")
                .value;


        const confirmarSenha =
            document
                .getElementById(
                    "confirmarSenhaCadastro"
                )
                .value;


        const mensagem =
            document.getElementById(
                "mensagemCadastro"
            );


        if (senha !== confirmarSenha) {

            mensagem.style.color =
                "#dc2626";

            mensagem.textContent =
                "As senhas precisam ser iguais.";

            return;

        }


        let credencial = null;

        let perfilCriado =
            false;


        try {

            credencial =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    senha
                );


            // -------------------------------
            // NOVO USUÁRIO
            // -------------------------------
            //
            // Não recebe empresa automaticamente.
            //
            // O administrador deverá definir:
            //
            // idEmpresa: "empresa1"
            //
            // ou
            //
            // idEmpresa: "empresa2"
            //
            // antes de ativar.
            // -------------------------------

            await setDoc(
                doc(
                    db,
                    "usuarios",
                    credencial.user.uid
                ),
                {

                    nome,

                    email,

                    idEmpresa: "",

                    perfil:
                        "colaborador",

                    status:
                        "pendente",

                    permissoes: {},

                    criadoEm:
                        serverTimestamp()

                }
            );


            perfilCriado =
                true;


            await signOut(
                auth
            );


            mensagem.style.color =
                "#16a34a";

            mensagem.textContent =
                "Cadastro solicitado. Aguarde a liberação da equipe.";


            cadastroForm.reset();

        }
        catch (error) {

            console.error(
                "Erro no cadastro:",
                error
            );


            if (
                credencial?.user
                &&
                !perfilCriado
            ) {

                await deleteUser(
                    credencial.user
                ).catch(
                    (erroLimpeza) => {

                        console.error(
                            "Erro ao cancelar cadastro incompleto:",
                            erroLimpeza
                        );

                    }
                );

            }


            mensagem.style.color =
                "#dc2626";


            mensagem.textContent =
                error.code ===
                "auth/email-already-in-use"

                    ? "Este e-mail já possui cadastro."

                    : "Não foi possível concluir o cadastro. Tente novamente.";

        }

    }
);


// =======================================
// CARREGAR PERFIL
// =======================================

async function carregarPerfil(user) {

    try {

        const referencia =
            doc(
                db,
                "usuarios",
                user.uid
            );


        const resultado =
            await getDoc(
                referencia
            );


        if (!resultado.exists()) {

            console.warn(
                "Perfil não encontrado para UID:",
                user.uid
            );

            return null;

        }


        const dados =
            resultado.data();


        const perfil = {

            id:
                resultado.id,

            nome:
                dados.nome || "",

            email:
                dados.email || user.email,

            idEmpresa:
                dados.idEmpresa || "",

            perfil:
                (
                    dados.perfil || ""
                ).trim(),

            status:
                dados.status || "",

            permissoes:
                dados.permissoes || {}

        };


        // -------------------------------
        // SALVAR PERFIL
        // -------------------------------

        localStorage.setItem(
            CHAVE_USUARIO,
            JSON.stringify(perfil)
        );


        localStorage.setItem(
            CHAVE_EMPRESA,
            perfil.idEmpresa
        );


        console.log(
            "PERFIL CARREGADO:",
            perfil
        );


        console.log(
            "EMPRESA VINCULADA:",
            perfil.idEmpresa
        );


        return perfil;

    }
    catch (error) {

        console.error(
            "Erro perfil:",
            error
        );

        return null;

    }

}


// =======================================
// ATUALIZAR SIDEBAR
// =======================================

function atualizarUsuarioTela(usuario) {

    const nome =
        document.getElementById(
            "nomeUsuarioLogado"
        );


    const perfil =
        document.getElementById(
            "perfilUsuarioLogado"
        );


    if (nome) {

        nome.innerText =
            usuario.nome ||
            "Usuário";

    }


    if (perfil) {

        let textoPerfil =
            usuario.perfil ||
            "";


        textoPerfil =
            textoPerfil
                .charAt(0)
                .toUpperCase()
            +
            textoPerfil.slice(1);


        perfil.innerText =
            textoPerfil;

    }

}


// =======================================
// PÁGINAS PROTEGIDAS
// =======================================

const paginasProtegidas = {

    "produtos.html":
        "produtos",

    "producao.html":
        "producao",

    "etiquetas.html":
        "etiquetas",

    "estoque.html":
        "estoque",

    "relatorios.html":
        "relatorios",

    "auditoria.html":
        "auditoria",

    "usuario.html":
        "usuarios",

    "configuracoes.html":
        "configuracoes",

    "sac.html":
        "sac",

    "sac-admin.html":
        "sacAdmin"

};


// =======================================
// VERIFICAÇÃO DE LOGIN
// =======================================

onAuthStateChanged(
    auth,
    async (user) => {

        const pagina =
            window.location.pathname
                .split("/")
                .pop();


        // ===================================
        // NÃO LOGADO
        // ===================================

        if (!user) {

            localStorage.removeItem(
                CHAVE_USUARIO
            );

            localStorage.removeItem(
                CHAVE_EMPRESA
            );


            if (
                pagina !== "index.html"
                &&
                pagina !== ""
            ) {

                window.location.href =
                    "index.html";

            }

            return;

        }


        // ===================================
        // LOGADO
        // ===================================

        console.log(
            "UID ATUAL:",
            user.uid
        );

        console.log(
            "EMAIL ATUAL:",
            user.email
        );


        const usuario =
            await carregarPerfil(
                user
            );


        if (!usuario) {

            await signOut(auth);

            localStorage.removeItem(
                CHAVE_USUARIO
            );

            localStorage.removeItem(
                CHAVE_EMPRESA
            );

            window.location.href =
                "index.html";

            return;

        }


        // ===================================
        // STATUS
        // ===================================

        const status =
            (
                usuario.status || ""
            ).toLowerCase();


        if (status !== "ativo") {

            await signOut(auth);

            localStorage.removeItem(
                CHAVE_USUARIO
            );

            localStorage.removeItem(
                CHAVE_EMPRESA
            );

            if (pagina !== "index.html") {

                window.location.href =
                    "index.html";

            }

            return;

        }


        // ===================================
// EMPRESA OBRIGATÓRIA
        // ===================================

        if (!usuario.idEmpresa) {

            console.error(
                "USUÁRIO SEM EMPRESA:",
                usuario
            );


            alert(
                "Seu usuário ainda não está vinculado a uma empresa."
            );


            await signOut(auth);


            localStorage.removeItem(
                CHAVE_USUARIO
            );

            localStorage.removeItem(
                CHAVE_EMPRESA
            );


            window.location.href =
                "index.html";


            return;

        }


        // ===================================
        // SIDEBAR
        // ===================================

        atualizarUsuarioTela(
            usuario
        );


        // ===================================
        // AUDITORIA
        // ===================================

        if (
            !sessionStorage.getItem(
                "loginAuditoriaRegistrado"
            )
        ) {

            sessionStorage.setItem(
                "loginAuditoriaRegistrado",
                "true"
            );


            await registrarAuditoria(
                "Sistema",
                "LOGIN",
                "Usuário realizou login no sistema"
            );

        }


        // ===================================
        // PERMISSÃO
        // ===================================

        const permissao =
            paginasProtegidas[
                pagina
            ];


        if (permissao) {

            const perfilUsuario =
                (
                    usuario.perfil || ""
                ).toLowerCase();


            const ehAdministrador =
                perfilUsuario ===
                "administrador";


            if (!ehAdministrador) {

                const temPermissao =
                    usuario.permissoes
                    &&
                    usuario.permissoes[
                        permissao
                    ]
                    === true;


                if (!temPermissao) {

                    alert(
                        "Sem permissão para acessar esta página."
                    );


                    window.location.href =
                        "dashboard.html";


                    return;

                }

            }

        }


        // ===================================
        // CONTROLAR MENU
        // ===================================

        controlarMenu(
            usuario
        );


        // ===================================
        // INDEX -> DASHBOARD
        // ===================================

        if (
            pagina === "index.html"
            ||
            pagina === ""
        ) {

            window.location.href =
                "dashboard.html";

        }

    }
);


// =======================================
// CONTROLAR MENU
// =======================================

function controlarMenu(usuario) {

    const mapa = {

        "dashboard.html":
            "dashboard",

        "produtos.html":
            "produtos",

        "producao.html":
            "producao",

        "etiquetas.html":
            "etiquetas",

        "estoque.html":
            "estoque",

        "relatorios.html":
            "relatorios",

        "auditoria.html":
            "auditoria",

        "usuario.html":
            "usuarios",

        "configuracoes.html":
            "configuracoes",

        "sac.html":
            "sac",

        "sac-admin.html":
            "sacAdmin"

    };


    const perfilUsuario =
        (
            usuario.perfil || ""
        ).toLowerCase();


    const ehAdministrador =
        perfilUsuario ===
        "administrador";


    document
        .querySelectorAll(".menu a")
        .forEach(
            link => {

                const pagina =
                    link.getAttribute(
                        "href"
                    );


                const permissao =
                    mapa[pagina];


                if (!permissao) {
                    return;
                }


                // ADMINISTRADOR
                if (ehAdministrador) {

                    link.style.display =
                        "flex";

                    return;

                }


                // USUÁRIO NORMAL
                const permitido =
                    usuario.permissoes
                    &&
                    usuario.permissoes[
                        permissao
                    ]
                    === true;


                link.style.display =
                    permitido
                        ? "flex"
                        : "none";

            }
        );

}


// =======================================
// LOGOUT
// =======================================

window.logout = async function () {

    try {

        await signOut(
            auth
        );


        localStorage.removeItem(
            CHAVE_USUARIO
        );


        localStorage.removeItem(
            CHAVE_EMPRESA
        );


        sessionStorage.removeItem(
            "loginAuditoriaRegistrado"
        );


        console.log(
            "Logout realizado"
        );


        window.location.href =
            "index.html";

    }
    catch (error) {

        console.error(
            "Erro logout:",
            error
        );

    }

};


// =======================================
// FUNÇÃO GLOBAL
// OUTROS ARQUIVOS USARÃO ISSO
// =======================================

window.obterIdEmpresa = function () {

    return obterIdEmpresa();

};


// =======================================
// DEBUG MULTIEMPRESA
// =======================================

window.debugEmpresa = function () {

    const usuario =
        obterUsuarioLocal();


    console.log(
        "========== LOTRIX MULTIEMPRESA =========="
    );


    console.log(
        "Usuário:",
        usuario?.nome
    );


    console.log(
        "E-mail:",
        usuario?.email
    );


    console.log(
        "Perfil:",
        usuario?.perfil
    );


    console.log(
        "ID EMPRESA:",
        usuario?.idEmpresa
    );


    console.log(
        "Permissµes:",
        usuario?.permissoes
    );


    console.log(
        "=========================================="
    );


    return usuario;

};
