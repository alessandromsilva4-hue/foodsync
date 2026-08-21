// =======================================
// LOTRIX - AUTENTICAÇÃO E PERMISSÕES
// V11 - MULTIEMPRESA 4 EMPRESAS
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
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    setDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


console.log("=======================================");
console.log("AUTH.JS V11 LOTRIX CARREGADO");
console.log("MULTIEMPRESA - 4 EMPRESAS");
console.log("=======================================");


// =======================================
// EMPRESAS LOTRIX
// =======================================

const EMPRESAS_LOTRIX = [

    {
        idEmpresa: "empresa1",
        nome: "Izu Oeste",
        nomeFantasia: "Izu Oeste",
        razaoSocial: "Izu Japanese",
        cnpj: "23212652000195"
    },

    {
        idEmpresa: "empresa2",
        nome: "Engenho",
        nomeFantasia: "Engenho",
        razaoSocial: "Engenho Restaurante",
        cnpj: "55875514000182"
    },

    {
        idEmpresa: "empresa3",
        nome: "Izu Jd. Goiás",
        nomeFantasia: "Izu Jd. Goiás",
        razaoSocial: "Izu Japanese",
        cnpj: "23.212.652/0002-76"
    },

    {
        idEmpresa: "empresa4",
        nome: "Izu Eldorado",
        nomeFantasia: "Izu Eldorado",
        razaoSocial: "Izu Japanese",
        cnpj: "23.212.652/0005-19"
    }

];


// =======================================
// BUSCAR EMPRESA
// =======================================

function obterDadosEmpresa(idEmpresa) {

    return EMPRESAS_LOTRIX.find(
        empresa =>
            empresa.idEmpresa === idEmpresa
    ) || null;

}


// =======================================
// EMPRESA ATIVA
// =======================================
// A empresa NÃO pode ser trocada pela tela.
// Ela vem do perfil salvo no Firestore.
// =======================================

window.definirEmpresaAtiva = function () {

    console.warn(
        "ALTERAÇÃO DE EMPRESA BLOQUEADA."
    );

};


// =======================================
// MOSTRAR EMPRESA DO USUÁRIO
// =======================================

function mostrarEmpresaAtiva(usuario) {

    const existente =
        document.getElementById(
            "seletorEmpresaLotrix"
        );

    if (existente) {
        existente.remove();
    }


    const logoArea =
        document.querySelector(
            ".logo-area"
        );

    if (!logoArea) {

        console.warn(
            "LOGO AREA NÃO ENCONTRADA."
        );

        return;

    }


    const idEmpresa =
        usuario?.idEmpresa || "";


    if (!idEmpresa) {

        console.error(
            "USUÁRIO SEM ID EMPRESA:",
            usuario
        );

        return;

    }


    const empresa =
        obterDadosEmpresa(
            idEmpresa
        );


    if (!empresa) {

        console.error(
            "EMPRESA NÃO ENCONTRADA:",
            idEmpresa
        );

        return;

    }


    const container =
        document.createElement(
            "div"
        );


    container.id =
        "seletorEmpresaLotrix";


    container.style.margin =
        "8px 15px 12px";


    container.style.padding =
        "8px";


    container.style.borderRadius =
        "8px";


    container.style.background =
        "rgba(255,255,255,0.08)";


    container.innerHTML = `

        <div style="
            font-size:10px;
            opacity:.65;
            margin-bottom:3px;
            letter-spacing:.5px;
        ">
            EMPRESA
        </div>

        <strong style="
            font-size:13px;
        ">
            ${empresa.nomeFantasia || empresa.nome}
        </strong>

    `;


    logoArea.after(
        container
    );


    console.log(
        "EMPRESA DO USUÁRIO:",
        empresa.nome
    );


    console.log(
        "ID EMPRESA DO USUÁRIO:",
        usuario.idEmpresa
    );

}


// =======================================
// AUDITORIA
// =======================================

window.registrarAuditoria =
async function (
    modulo,
    acao,
    detalhes = ""
) {

    try {

        const usuario =
            JSON.parse(
                localStorage.getItem(
                    "usuarioFoodSync"
                )
            );


        await addDoc(
            collection(
                db,
                "auditoria"
            ),
            {

                usuario:
                    usuario?.nome ||
                    "Sistema",

                email:
                    usuario?.email ||
                    "",

                idEmpresa:
                    usuario?.idEmpresa ||
                    "",

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
            acao
        );


    } catch (error) {

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
    document.getElementById(
        "loginForm"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            const email =
                document
                    .getElementById(
                        "email"
                    )
                    .value
                    .trim();


            const senha =
                document
                    .getElementById(
                        "senha"
                    )
                    .value;


            const mensagem =
                document.getElementById(
                    "mensagemLogin"
                );


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    senha
                );


                const perfilLogin =
                    await carregarPerfil(
                        auth.currentUser
                    );


                // =================================
                // PERFIL NÃO ENCONTRADO
                // =================================

                if (!perfilLogin) {

                    await signOut(
                        auth
                    );


                    mensagem.style.color =
                        "#dc2626";


                    mensagem.textContent =
                        "Perfil do usuário não encontrado.";


                    return;

                }


                // =================================
                // CADASTRO PENDENTE
                // =================================

                if (
                    perfilLogin?.status
                        ?.toLowerCase() ===
                    "pendente"
                ) {

                    await signOut(
                        auth
                    );


                    mensagem.style.color =
                        "#b45309";


                    mensagem.textContent =
                        "Cadastro recebido. Aguarde a liberação da equipe.";


                    return;

                }


                // =================================
                // USUÁRIO SEM EMPRESA
                // =================================

                if (
                    !perfilLogin.idEmpresa
                ) {

                    await signOut(
                        auth
                    );


                    mensagem.style.color =
                        "#dc2626";


                    mensagem.textContent =
                        "Usuário sem empresa vinculada. Procure o administrador.";


                    return;

                }


                // =================================
                // AUDITORIA LOGIN
                // =================================

                await addDoc(
                    collection(
                        db,
                        "auditoria"
                    ),
                    {

                        usuario:
                            perfilLogin.nome ||
                            email,

                        email:
                            email,

                        idEmpresa:
                            perfilLogin.idEmpresa ||
                            "",

                        modulo:
                            "Sistema",

                        acao:
                            "LOGIN",

                        detalhes:
                            "Usuário realizou login no sistema",

                        status:
                            "Sucesso",

                        data:
                            serverTimestamp()

                    }
                );


                mensagem.style.color =
                    "#16a34a";


                mensagem.innerHTML =
                    "Login realizado com sucesso!";


                setTimeout(
                    () => {

                        window.location.href =
                            "dashboard.html";

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "Erro login:",
                    error
                );


                mensagem.style.color =
                    "#dc2626";


                if (
                    error.code ===
                    "auth/invalid-credential"
                ) {

                    mensagem.textContent =
                        "Usuário ou senha inválidos.";

                }

                else if (
                    error.code ===
                    "auth/user-not-found"
                ) {

                    mensagem.textContent =
                        "Usuário ou senha inválidos.";

                }

                else if (
                    error.code ===
                    "auth/wrong-password"
                ) {

                    mensagem.textContent =
                        "Usuário ou senha inválidos.";

                }

                else {

                    mensagem.textContent =
                        "Não foi possível realizar o login.";

                }

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
                        campo.type ===
                        "password";


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


function exibirCadastro(
    exibir
) {

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
    () =>
        exibirCadastro(true)
);


voltarLogin?.addEventListener(
    "click",
    () =>
        exibirCadastro(false)
);


// =======================================
// ALTERAR SENHA
// =======================================

alterarSenha?.addEventListener(
    "click",
    async () => {

        const email =
            document
                .getElementById(
                    "email"
                )
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
                .getElementById(
                    "email"
                )
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


        } catch (error) {

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
// CADASTRO DE USUÁRIO
// =======================================

cadastroForm?.addEventListener(
    "submit",
    async (evento) => {

        evento.preventDefault();


        // =================================
        // CAMPOS
        // =================================

        const nome =
            document
                .getElementById(
                    "nomeCadastro"
                )
                .value
                .trim();


        const email =
            document
                .getElementById(
                    "emailCadastro"
                )
                .value
                .trim();


        const senha =
            document
                .getElementById(
                    "senhaCadastro"
                )
                .value;


        const confirmarSenha =
            document
                .getElementById(
                    "confirmarSenhaCadastro"
                )
                .value;


        const campoEmpresaCadastro =
            document.getElementById(
                "empresaCadastro"
            );


        const idEmpresaCadastro =
            campoEmpresaCadastro?.value ||
            "";


        const mensagem =
            document.getElementById(
                "mensagemCadastro"
            );


        // =================================
        // VALIDAR NOME
        // =================================

        if (!nome) {

            mensagem.style.color =
                "#dc2626";


            mensagem.textContent =
                "Informe seu nome.";


            document
                .getElementById(
                    "nomeCadastro"
                )
                .focus();


            return;

        }


        // =================================
        // VALIDAR EMPRESA
        // =================================

        if (!idEmpresaCadastro) {

            mensagem.style.color =
                "#dc2626";


            mensagem.textContent =
                "Selecione a empresa para continuar.";


            campoEmpresaCadastro?.focus();


            return;

        }


        // =================================
        // VALIDAR EMPRESA EXISTENTE
        // =================================

        const empresaCadastro =
            obterDadosEmpresa(
                idEmpresaCadastro
            );


        if (!empresaCadastro) {

            console.error(
                "EMPRESA INVÁLIDA:",
                idEmpresaCadastro
            );


            mensagem.style.color =
                "#dc2626";


            mensagem.textContent =
                "A empresa selecionada não é válida.";


            return;

        }


        // =================================
        // VALIDAR SENHAS
        // =================================

        if (
            senha !==
            confirmarSenha
        ) {

            mensagem.style.color =
                "#dc2626";


            mensagem.textContent =
                "As senhas precisam ser iguais.";


            return;

        }


        // =================================
        // VALIDAR SENHA
        // =================================

        if (
            senha.length < 6
        ) {

            mensagem.style.color =
                "#dc2626";


            mensagem.textContent =
                "A senha deve ter pelo menos 6 caracteres.";


            return;

        }


        console.log(
            "======================================="
        );


        console.log(
            "NOVO CADASTRO"
        );


        console.log(
            "NOME:",
            nome
        );


        console.log(
            "E-MAIL:",
            email
        );


        console.log(
            "EMPRESA:",
            empresaCadastro.nome
        );


        console.log(
            "ID EMPRESA:",
            idEmpresaCadastro
        );


        console.log(
            "======================================="
        );


        let credencial =
            null;


        let perfilCriado =
            false;


        try {

            // =================================
            // CRIAR AUTENTICAÇÃO
            // =================================

            credencial =
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


            // =================================
            // CRIAR PERFIL FIRESTORE
            // =================================

            await setDoc(

                doc(
                    db,
                    "usuarios",
                    uid
                ),

                {

                    nome:
                        nome,

                    email:
                        email,

                    // NOVO USUÁRIO
                    // SEMPRE COLABORADOR
                    perfil:
                        "colaborador",

                    // AGUARDA APROVAÇÃO
                    status:
                        "pendente",

                    permissoes:
                        {},

                    // EMPRESA ESCOLHIDA NO CADASTRO
                    idEmpresa:
                        idEmpresaCadastro,

                    // INFORMAÇÕES DA EMPRESA
                    nomeEmpresa:
                        empresaCadastro.nome,

                    nomeFantasia:
                        empresaCadastro.nomeFantasia,

                    criadoEm:
                        serverTimestamp()

                }

            );


            perfilCriado =
                true;


            console.log(
                "USUÁRIO CRIADO COM SUCESSO"
            );


            console.log(
                "UID:",
                uid
            );


            console.log(
                "EMPRESA:",
                empresaCadastro.nome
            );


            console.log(
                "ID EMPRESA:",
                idEmpresaCadastro
            );


            // =================================
            // SAIR APÓS CADASTRO
            // =================================

            await signOut(
                auth
            );


            // =================================
            // MENSAGEM
            // =================================

            mensagem.style.color =
                "#16a34a";


            mensagem.textContent =
                "Cadastro solicitado. Aguarde a liberação da equipe.";


            cadastroForm.reset();


        } catch (error) {

            console.error(
                "Erro no cadastro:",
                error
            );


            // =================================
            // CANCELAR AUTH SE FIRESTORE FALHAR
            // =================================

            if (
                credencial?.user &&
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


            // =================================
            // MENSAGENS DE ERRO
            // =================================

            mensagem.style.color =
                "#dc2626";


            if (
                error.code ===
                "auth/email-already-in-use"
            ) {

                mensagem.textContent =
                    "Este e-mail já possui cadastro.";

            }

            else if (
                error.code ===
                "auth/invalid-email"
            ) {

                mensagem.textContent =
                    "E-mail inválido.";

            }

            else if (
                error.code ===
                "auth/weak-password"
            ) {

                mensagem.textContent =
                    "A senha deve ter pelo menos 6 caracteres.";

            }

            else if (
                error.code ===
                "permission-denied"
            ) {

                mensagem.textContent =
                    "Sem permissão para criar o perfil. Procure o administrador.";

            }

            else {

                mensagem.textContent =
                    "Não foi possível concluir o cadastro. Tente novamente.";

            }

        }

    }
);


// =======================================
// CARREGAR PERFIL FIRESTORE
// =======================================

async function carregarPerfil(
    user
) {

    try {

        if (!user) {
            return null;
        }


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


        if (
            !resultado.exists()
        ) {

            console.warn(
                "PERFIL NÃO ENCONTRADO"
            );


            return null;

        }


        const dados =
            resultado.data();


        const perfilTipo =
            (
                dados.perfil ||
                ""
            )
                .trim()
                .toLowerCase();


        // =================================
        // EMPRESA VEM DO FIRESTORE
        // =================================

        const idEmpresa =
            dados.idEmpresa ||
            "";


        // =================================
        // BUSCAR EMPRESA
        // =================================

        const empresa =
            obterDadosEmpresa(
                idEmpresa
            );


        // =================================
        // SEGURANÇA
        // =================================

        if (
            !empresa
        ) {

            console.error(
                "USUÁRIO SEM EMPRESA VÁLIDA:",
                idEmpresa
            );

        }


        // =================================
        // PERFIL FINAL
        // =================================

        const perfil = {

            id:
                resultado.id,

            nome:
                dados.nome ||
                "",

            email:
                dados.email ||
                user.email,

            perfil:
                (dados.perfil || "")
                    .trim(),

            status:
                dados.status ||
                "pendente",

            idEmpresa:
                idEmpresa,

            nomeEmpresa:
                empresa?.nome ||
                "",

            nomeFantasia:
                empresa?.nomeFantasia ||
                "",

            razaoSocial:
                empresa?.razaoSocial ||
                "",

            cnpj:
                empresa?.cnpj ||
                "",

            permissoes:
                dados.permissoes ||
                {}

        };


        // =================================
        // SALVAR PERFIL LOCAL
        // =================================

        localStorage.setItem(
            "usuarioFoodSync",
            JSON.stringify(
                perfil
            )
        );


        console.log(
            "======================================="
        );


        console.log(
            "PERFIL CARREGADO:",
            perfil
        );


        console.log(
            "ID EMPRESA:",
            perfil.idEmpresa
        );


        console.log(
            "NOME EMPRESA:",
            perfil.nomeEmpresa
        );


        console.log(
            "NOME FANTASIA:",
            perfil.nomeFantasia
        );


        console.log(
            "PERFIL:",
            perfil.perfil
        );


        console.log(
            "STATUS:",
            perfil.status
        );


        console.log(
            "======================================="
        );


        return perfil;


    } catch (error) {

        console.error(
            "ERRO AO CARREGAR PERFIL:",
            error
        );


        return null;

    }

}


// =======================================
// ATUALIZAR USUÁRIO NA SIDEBAR
// =======================================

function atualizarUsuarioTela(
    usuario
) {

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
            textoPerfil.charAt(0)
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


        console.log(
            "PÁGINA ATUAL:",
            pagina
        );


        // =================================
        // USUÁRIO LOGADO
        // =================================

        if (user) {

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


            // =================================
            // PERFIL NÃO ENCONTRADO
            // =================================

            if (!usuario) {

                console.error(
                    "PERFIL DO USUÁRIO NÃO ENCONTRADO."
                );


                await signOut(
                    auth
                );


                localStorage.removeItem(
                    "usuarioFoodSync"
                );


                if (
                    pagina !==
                    "index.html" &&
                    pagina !==
                    ""
                ) {

                    window.location.href =
                        "index.html";

                }


                return;

            }


            // =================================
            // CADASTRO PENDENTE
            // =================================

            if (
                (
                    usuario.status ||
                    ""
                )
                    .toLowerCase() ===
                "pendente"
            ) {

                console.warn(
                    "USUÁRIO PENDENTE."
                );


                await signOut(
                    auth
                );


                localStorage.removeItem(
                    "usuarioFoodSync"
                );


                if (
                    pagina !==
                    "index.html" &&
                    pagina !==
                    ""
                ) {

                    window.location.href =
                        "index.html";

                }


                return;

            }


            // =================================
            // ATUALIZAR TELA
            // =================================

            atualizarUsuarioTela(
                usuario
            );


            mostrarEmpresaAtiva(
                usuario
            );


            // =================================
            // EVENTO PERFIL CARREGADO
            // =================================

            window.dispatchEvent(
                new CustomEvent(
                    "foodsync:perfil-carregado",
                    {
                        detail:
                            usuario
                    }
                )
            );


            // =================================
            // AUDITORIA
            // =================================

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


            // =================================
            // PERMISSÕES
            // =================================

            const permissao =
                paginasProtegidas[
                    pagina
                ];


            if (permissao) {

                const perfil =
                    (
                        usuario.perfil ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                // ADMINISTRADOR
                // ACESSO TOTAL

                if (
                    perfil !==
                    "administrador"
                ) {

                    const temPermissao =
                        usuario.permissoes?.[
                            permissao
                        ] === true;


                    if (
                        !temPermissao
                    ) {

                        alert(
                            "Sem permissão para acessar esta página."
                        );


                        window.location.href =
                            "dashboard.html";


                        return;

                    }

                }

            }


            // =================================
            // CONTROLAR MENU
            // =================================

            controlarMenu(
                usuario
            );


            // =================================
            // INDEX → DASHBOARD
            // =================================

            if (
                pagina ===
                "index.html"
                ||
                pagina ===
                ""
            ) {

                window.location.href =
                    "dashboard.html";

            }


        }

        // =================================
        // USUÁRIO NÃO LOGADO
        // =================================

        else {

            localStorage.removeItem(
                "usuarioFoodSync"
            );


            if (
                pagina !==
                "index.html"
                &&
                pagina !==
                ""
            ) {

                window.location.href =
                    "index.html";

            }

        }

    }
);


// =======================================
// CONTROLAR MENU POR PERMISSÃO
// =======================================

function controlarMenu(
    usuario
) {

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
            "sacAdmin",

        "ajuda.html":
            "ajuda"

    };


    const perfil =
        (
            usuario?.perfil ||
            ""
        )
            .trim()
            .toLowerCase();


    // =================================
    // ADMINISTRADOR
    // =================================

    if (
        perfil ===
        "administrador"
    ) {

        document
            .querySelectorAll(
                ".menu a"
            )
            .forEach(
                link => {

                    link.hidden =
                        false;

                    link.style.removeProperty(
                        "display"
                    );

                }
            );


        document
            .querySelectorAll(
                ".menu-section"
            )
            .forEach(
                section => {

                    section.hidden =
                        false;

                    section.style.removeProperty(
                        "display"
                    );

                }
            );


        console.log(
            "MENU ADMINISTRADOR: TUDO LIBERADO"
        );


        return;

    }


    // =================================
    // COLABORADOR / USUÁRIO
    // =================================

    const permissoes =
        usuario?.permissoes ||
        {};


    // =================================
    // CONTROLAR LINKS
    // =================================

    document
        .querySelectorAll(
            ".menu a"
        )
        .forEach(
            link => {

                const href =
                    link.getAttribute(
                        "href"
                    );


                const pagina =
                    href
                        ?.split("/")
                        .pop()
                        .split("?")[0]
                        .split("#")[0];


                const permissao =
                    mapa[pagina];


                // LINK NÃO MAPEADO
                if (!permissao) {

                    link.hidden =
                        false;

                    link.style.removeProperty(
                        "display"
                    );

                    return;

                }


                // AJUDA LIBERADA
                // PARA TODOS

                if (
                    permissao ===
                    "ajuda"
                ) {

                    link.hidden =
                        false;

                    link.style.removeProperty(
                        "display"
                    );

                    return;

                }


                const temPermissao =
                    permissoes[
                        permissao
                    ] === true;


                if (
                    temPermissao
                ) {

                    link.hidden =
                        false;

                    link.style.removeProperty(
                        "display"
                    );

                }

                else {

                    link.hidden =
                        true;

                    link.style.setProperty(
                        "display",
                        "none",
                        "important"
                    );

                }

            }
        );


    // =================================
    // GESTÃO
    // SOMENTE ADMINISTRADOR
    // =================================

    document
        .querySelectorAll(
            ".menu-section"
        )
        .forEach(
            section => {

                const titulo =
                    section
                        .querySelector(
                            ".menu-title"
                        )
                        ?.textContent
                        .trim()
                        .toLowerCase();


                if (
                    titulo &&
                    titulo.includes(
                        "gest"
                    )
                ) {

                    section.hidden =
                        true;

                    section.style.setProperty(
                        "display",
                        "none",
                        "important"
                    );

                }

            }
        );


    // =================================
    // ESCONDER SEÇÕES VAZIAS
    // =================================

    document
        .querySelectorAll(
            ".menu-section"
        )
        .forEach(
            section => {

                if (
                    section.hidden
                ) {

                    return;

                }


                const links =
                    section.querySelectorAll(
                        "a"
                    );


                const linksVisiveis =
                    section.querySelectorAll(
                        "a:not([hidden])"
                    );


                if (
                    links.length > 0 &&
                    linksVisiveis.length === 0
                ) {

                    section.hidden =
                        true;

                    section.style.setProperty(
                        "display",
                        "none",
                        "important"
                    );

                }

            }
        );


    console.log(
        "MENU FILTRADO POR PERMISSÕES:",
        permissoes
    );

}


// =======================================
// LOGOUT
// =======================================

window.logout =
async function () {

    try {

        await signOut(
            auth
        );


        localStorage.removeItem(
            "usuarioFoodSync"
        );


        localStorage.removeItem(
            "empresaAtivaLotrix"
        );


        sessionStorage.removeItem(
            "loginAuditoriaRegistrado"
        );


        console.log(
            "Logout realizado"
        );


        window.location.href =
            "index.html";


    } catch (error) {

        console.error(
            "Erro logout:",
            error
        );

    }

};


// =======================================
// BOTÃO SAIR
// =======================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const btnLogout =
            document.getElementById(
                "btnLogout"
            );


        if (!btnLogout) {

            console.log(
                "BOTÃO SAIR NÃO ENCONTRADO NESTA PÁGINA"
            );

            return;

        }


        btnLogout.addEventListener(
            "click",
            async () => {

                console.log(
                    "BOTÃO SAIR CLICADO"
                );


                await window.logout();

            }
        );


        console.log(
            "BOTÃO SAIR CONFIGURADO"
        );

    }
);


console.log(
    "======================================="
);

console.log(
    "AUTH.JS V11 PRONTO"
);

console.log(
    "======================================="
);