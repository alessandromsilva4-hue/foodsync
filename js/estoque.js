// =======================================
// LOTRIX
// ESTOQUE V2 - FIRESTORE - MULTIEMPRESA
// =======================================

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("ESTOQUE.JS V2 MULTIEMPRESA CARREGADO");


// =======================================
// USUÁRIO / EMPRESA LOGADA
// =======================================

const usuarioLogado =
    JSON.parse(
        localStorage.getItem("usuarioFoodSync")
    );

const idEmpresa =
    usuarioLogado?.idEmpresa || "";

console.log(
    "USUÁRIO LOGADO:",
    usuarioLogado
);

console.log(
    "EMPRESA DO USUÁRIO:",
    idEmpresa
);


// =======================================
// VALIDAR EMPRESA
// =======================================

if (!idEmpresa) {

    console.error(
        "ERRO: usuário não possui idEmpresa."
    );

}


// =======================================
// ELEMENTOS
// =======================================

const estoqueForm =
    document.getElementById("estoqueForm");

const produtoSelect =
    document.getElementById("produtoEstoque");

const listaEstoque =
    document.getElementById("listaEstoque");

const quantidadeInput =
    document.getElementById("quantidadeEstoque");

const minimoInput =
    document.getElementById("estoqueMinimo");

const maximoInput =
    document.getElementById("estoqueMaximo");


const movimentacaoForm =
    document.getElementById("movimentacaoForm");

const produtoMovimentacao =
    document.getElementById("produtoMovimentacao");

const tipoMovimentacao =
    document.getElementById("tipoMovimentacao");

const quantidadeMovimentacao =
    document.getElementById("quantidadeMovimentacao");

const motivoMovimentacao =
    document.getElementById("motivoMovimentacao");

const listaMovimentacoes =
    document.getElementById("listaMovimentacoes");


// =======================================
// VARIÁVEIS
// =======================================

let produtos = [];

let estoqueAtual = [];


// =======================================
// CARREGAR PRODUTOS
// =======================================

async function carregarProdutos() {

    if (!produtoSelect) {

        console.warn(
            "Select de produtos não encontrado."
        );

        return;

    }


    produtoSelect.innerHTML = `
        <option value="">
            Selecione um produto
        </option>
    `;


    if (produtoMovimentacao) {

        produtoMovimentacao.innerHTML = `
            <option value="">
                Selecione um produto
            </option>
        `;

    }


    try {

        const snapshot =
            await getDocs(
                collection(db, "produtos")
            );


        produtos = [];


        snapshot.forEach((item) => {

            const produto = {

                id: item.id,

                ...item.data()

            };


            // =======================================
            // PRODUTOS DISPONÍVEIS
            //
            // Produto pode pertencer:
            //
            // idEmpresa: "empresa1"
            //
            // ou
            //
            // empresas: ["empresa1","empresa2"]
            // =======================================

            let pertenceEmpresa = false;


            if (
                produto.idEmpresa === idEmpresa
            ) {

                pertenceEmpresa = true;

            }


            if (
                Array.isArray(
                    produto.empresas
                )
                &&
                produto.empresas.includes(
                    idEmpresa
                )
            ) {

                pertenceEmpresa = true;

            }


            if (!pertenceEmpresa) {

                return;

            }


            produtos.push(produto);


            produtoSelect.innerHTML += `
                <option value="${produto.id}">
                    ${produto.nome}
                </option>
            `;


            if (produtoMovimentacao) {

                produtoMovimentacao.innerHTML += `
                    <option value="${produto.id}">
                        ${produto.nome}
                    </option>
                `;

            }

        });


        console.log(
            "PRODUTOS DISPONÍVEIS PARA",
            idEmpresa,
            produtos
        );


    }
    catch (error) {

        console.error(
            "Erro carregando produtos:",
            error
        );

    }

}


// =======================================
// CARREGAR ESTOQUE
// SOMENTE DA EMPRESA LOGADA
// =======================================

async function carregarEstoque() {

    if (!listaEstoque) {

        console.error(
            "Tabela #listaEstoque não encontrada."
        );

        return;

    }


    listaEstoque.innerHTML = `
        <tr>
            <td
                colspan="7"
                style="text-align:center;padding:20px"
            >
                Carregando estoque...
            </td>
        </tr>
    `;


    try {

        const snapshot =
            await getDocs(
                collection(db, "estoque")
            );


        estoqueAtual = [];


        snapshot.forEach((item) => {

            const dados =
                item.data();


            // =======================================
            // SOMENTE ESTOQUE DA EMPRESA
            // =======================================

            if (
                dados.idEmpresa !== idEmpresa
            ) {

                return;

            }


            estoqueAtual.push({

                id: item.id,

                ...dados

            });

        });


        console.log(
            "ESTOQUE DA EMPRESA:",
            idEmpresa,
            estoqueAtual
        );


        renderizarEstoque();


    }
    catch (error) {

        console.error(
            "Erro carregando estoque:",
            error
        );


        listaEstoque.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    style="color:red;text-align:center"
                >
                    Erro ao carregar estoque.
                </td>
            </tr>
        `;

    }

}


// =======================================
// STATUS
// =======================================

function verificarStatus(item) {

    const quantidade =
        Number(
            item.quantidade || 0
        );


    const minimo =
        Number(
            item.minimo || 0
        );


    if (
        quantidade <= minimo
    ) {

        return `
            <span
                style="
                    color:#dc2626;
                    font-weight:bold
                "
            >
                🔴 Crítico
            </span>
        `;

    }


    if (
        quantidade <= minimo + 5
    ) {

        return `
            <span
                style="
                    color:#ca8a04;
                    font-weight:bold
                "
            >
                🟡 Atenção
            </span>
        `;

    }


    return `
        <span
            style="
                color:#16a34a;
                font-weight:bold
            "
        >
            🟢 Normal
        </span>
    `;

}


// =======================================
// RENDER ESTOQUE
// =======================================

function renderizarEstoque() {

    if (!listaEstoque) {

        return;

    }


    listaEstoque.innerHTML = "";


    if (
        estoqueAtual.length === 0
    ) {

        listaEstoque.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    style="
                        text-align:center;
                        padding:20px
                    "
                >
                    Nenhum item cadastrado.
                </td>
            </tr>
        `;

        return;

    }


    estoqueAtual.forEach((item) => {

        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td>
                ${item.produto || "-"}
            </td>

            <td>
                ${item.quantidade ?? 0}
            </td>

            <td>
                ${item.unidade || "UN"}
            </td>

            <td>
                ${item.minimo ?? 0}
            </td>

            <td>
                ${item.maximo ?? 0}
            </td>

            <td>
                ${verificarStatus(item)}
            </td>

            <td>

                <button
                    class="btn-danger"
                    onclick="
                        excluirEstoque('${item.id}')
                    "
                >
                    🗑️
                </button>

            </td>

        `;


        listaEstoque.appendChild(tr);

    });


    console.log(
        "LINHAS RENDERIZADAS:",
        listaEstoque.children.length
    );

}


// =======================================
// SALVAR / ATUALIZAR ESTOQUE
// =======================================

if (estoqueForm) {

    estoqueForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            if (!idEmpresa) {

                alert(
                    "Usuário sem empresa vinculada."
                );

                return;

            }


            const produtoId =
                produtoSelect.value;


            const produto =
                produtos.find(
                    p =>
                        p.id === produtoId
                );


            if (!produto) {

                alert(
                    "Selecione um produto."
                );

                return;

            }


            const existente =
                estoqueAtual.find(
                    item =>
                        item.produtoId ===
                        produtoId
                );


            const dados = {

                produtoId:
                    produto.id,

                produto:
                    produto.nome,

                quantidade:
                    Number(
                        quantidadeInput.value
                    ) || 0,

                minimo:
                    Number(
                        minimoInput.value
                    ) || 0,

                maximo:
                    Number(
                        maximoInput.value
                    ) || 0,

                unidade:
                    produto.unidade ||
                    "UN",

                idEmpresa:
                    idEmpresa,

                atualizadoEm:
                    serverTimestamp(),

                usuario:
                    usuarioLogado?.nome ||
                    "Sistema"

            };


            try {

                if (existente) {

                    // =======================================
                    // ATUALIZAR
                    // =======================================

                    await updateDoc(

                        doc(
                            db,
                            "estoque",
                            existente.id
                        ),

                        dados

                    );


                    console.log(
                        "ESTOQUE ATUALIZADO:",
                        existente.id
                    );


                }
                else {

                    // =======================================
                    // NOVO ESTOQUE
                    // =======================================

                    dados.criadoEm =
                        serverTimestamp();


                    await addDoc(

                        collection(
                            db,
                            "estoque"
                        ),

                        dados

                    );


                    console.log(
                        "NOVO ESTOQUE CRIADO"
                    );

                }


                alert(
                    "Estoque salvo com sucesso!"
                );


                estoqueForm.reset();


                await carregarEstoque();

            }
            catch (error) {

                console.error(
                    "Erro salvar estoque:",
                    error
                );


                alert(
                    "Erro ao salvar estoque."
                );

            }

        }
    );

}


// =======================================
// EXCLUIR ESTOQUE
// =======================================

window.excluirEstoque =
    async function (id) {

        if (
            !confirm(
                "Deseja excluir este item?"
            )
        ) {

            return;

        }


        const estoque =
            estoqueAtual.find(
                item =>
                    item.id === id
            );


        if (!estoque) {

            alert(
                "Estoque não encontrado."
            );

            return;

        }


        // =======================================
        // GARANTIR EMPRESA
        // =======================================

        if (
            estoque.idEmpresa !==
            idEmpresa
        ) {

            alert(
                "Este estoque não pertence à empresa atual."
            );

            return;

        }


        try {

            await deleteDoc(

                doc(
                    db,
                    "estoque",
                    id
                )

            );


            await carregarEstoque();


        }
        catch (error) {

            console.error(
                "Erro excluir estoque:",
                error
            );


            alert(
                "Erro ao excluir estoque."
            );

        }

    };


// =======================================
// MOVIMENTAÇÃO DE ESTOQUE
// =======================================

if (movimentacaoForm) {

    movimentacaoForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            if (!idEmpresa) {

                alert(
                    "Usuário sem empresa vinculada."
                );

                return;

            }


            const produtoId =
                produtoMovimentacao.value;


            const produto =
                produtos.find(
                    p =>
                        p.id ===
                        produtoId
                );


            if (!produto) {

                alert(
                    "Selecione um produto."
                );

                return;

            }


            const tipo =
                tipoMovimentacao.value;


            const quantidade =
                Number(
                    quantidadeMovimentacao.value
                );


            if (
                !quantidade ||
                quantidade <= 0
            ) {

                alert(
                    "Informe uma quantidade válida."
                );

                return;

            }


            const motivo =
                motivoMovimentacao.value ||
                "-";


            // =======================================
            // ESTOQUE DA EMPRESA
            // =======================================

            const estoque =
                estoqueAtual.find(
                    item =>
                        item.produtoId ===
                        produtoId
                );


            if (!estoque) {

                alert(
                    "Produto não encontrado no estoque desta empresa."
                );

                return;

            }


            if (
                estoque.idEmpresa !==
                idEmpresa
            ) {

                alert(
                    "Estoque não pertence à empresa atual."
                );

                return;

            }


            let novaQuantidade =
                Number(
                    estoque.quantidade || 0
                );


            if (
                tipo === "ENTRADA"
            ) {

                novaQuantidade +=
                    quantidade;

            }


            if (
                tipo === "SAIDA"
            ) {

                novaQuantidade -=
                    quantidade;

            }


            if (
                novaQuantidade < 0
            ) {

                alert(
                    "Estoque insuficiente."
                );

                return;

            }


            try {

                // =======================================
                // ATUALIZAR SALDO
                // =======================================

                await updateDoc(

                    doc(
                        db,
                        "estoque",
                        estoque.id
                    ),

                    {

                        quantidade:
                            novaQuantidade,

                        atualizadoEm:
                            serverTimestamp()

                    }

                );


                // =======================================
                // REGISTRAR MOVIMENTAÇÃO
                // =======================================

                await addDoc(

                    collection(
                        db,
                        "movimentacoes"
                    ),

                    {

                        produtoId:
                            produto.id,

                        produto:
                            produto.nome,

                        tipo,

                        quantidade,

                        unidade:
                            produto.unidade ||
                            "UN",

                        motivo,

                        idEmpresa:
                            idEmpresa,

                        usuario:
                            usuarioLogado?.nome ||
                            "Sistema",

                        data:
                            serverTimestamp()

                    }

                );


                alert(
                    "Movimentação registrada!"
                );


                movimentacaoForm.reset();


                await carregarEstoque();


                await carregarMovimentacoes();

            }
            catch (error) {

                console.error(
                    "Erro movimentação:",
                    error
                );


                alert(
                    "Erro ao registrar movimentação."
                );

            }

        }
    );

}


// =======================================
// CARREGAR MOVIMENTAÇÕES
// SOMENTE EMPRESA ATUAL
// =======================================

async function carregarMovimentacoes() {

    if (!listaMovimentacoes) {

        return;

    }


    listaMovimentacoes.innerHTML = "";


    try {

        const snapshot =
            await getDocs(

                collection(
                    db,
                    "movimentacoes"
                )

            );


        let quantidadeMovimentacoes =
            0;


        snapshot.forEach((item) => {

            const mov =
                item.data();


            if (
                mov.idEmpresa !==
                idEmpresa
            ) {

                return;

            }


            quantidadeMovimentacoes++;


            const data =
                mov.data?.toDate
                    ?

                    mov.data
                        .toDate()
                        .toLocaleDateString(
                            "pt-BR"
                        )

                    :

                    "-";


            listaMovimentacoes.innerHTML += `

                <tr>

                    <td>
                        ${data}
                    </td>

                    <td>
                        ${mov.produto || "-"}
                    </td>

                    <td>
                        ${mov.tipo || "-"}
                    </td>

                    <td>
                        ${mov.quantidade ?? 0}
                    </td>

                    <td>
                        ${mov.unidade || "UN"}
                    </td>

                    <td>
                        ${mov.motivo || "-"}
                    </td>

                </tr>

            `;

        });


        if (
            quantidadeMovimentacoes === 0
        ) {

            listaMovimentacoes.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        style="
                            text-align:center;
                            padding:20px
                        "
                    >
                        Nenhuma movimentação.
                    </td>
                </tr>
            `;

        }


        console.log(
            "MOVIMENTAÇÕES DA EMPRESA:",
            idEmpresa,
            quantidadeMovimentacoes
        );

    }
    catch (error) {

        console.error(
            "Erro carregando movimentações:",
            error
        );

    }

}


// =======================================
// INICIALIZAÇÃO
// =======================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (!idEmpresa) {

            console.error(
                "Estoque não iniciado: empresa não identificada."
            );

            return;

        }


        await carregarProdutos();

        await carregarEstoque();

        await carregarMovimentacoes();


        console.log(
            "======================================="
        );

        console.log(
            "ESTOQUE MULTIEMPRESA INICIADO"
        );

        console.log(
            "EMPRESA:",
            idEmpresa
        );

        console.log(
            "======================================="

        );

    }
);


// =======================================
// ERROS GLOBAIS
// =======================================

window.addEventListener(
    "error",
    (event) => {

        console.error(
            "Erro global:",
            event.message
        );

    }
);