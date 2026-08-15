
console.log("PRODUTOS.JS CARREGADO - MULTIEMPRESA");

// =======================================
// LOTRIX
// PRODUTOS - FIRESTORE - MULTIEMPRESA
// =======================================

import { db } from "./firebase.js";

import {
    mostrarToast
} from "./utils.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    deleteDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =======================================
// ELEMENTOS
// =======================================

const formulario =
    document.getElementById("produtoForm");

const tabela =
    document.getElementById("listaProdutos");

const pesquisa =
    document.getElementById("pesquisaProduto");

let produtos = [];

let produtoEditando = null;


// =======================================
// PEGAR EMPRESA ATUAL
// =======================================

function obterIdEmpresaAtual() {

    // Tenta pegar pelo auth.js
    if (typeof window.obterIdEmpresa === "function") {

        const idEmpresa =
            window.obterIdEmpresa();

        if (idEmpresa) {
            return idEmpresa;
        }
    }

    // Fallback pelo localStorage
    const idEmpresa =
        localStorage.getItem("idEmpresa");

    return idEmpresa || "";
}


// =======================================
// VALIDAR EMPRESA
// =======================================

function verificarEmpresa() {

    const idEmpresa =
        obterIdEmpresaAtual();

    if (!idEmpresa) {

        console.error(
            "PRODUTOS: usu?rio sem empresa."
        );

        mostrarToast(
            "Usu?rio n?o est? vinculado a uma empresa.",
            "erro"
        );

        return null;
    }

    console.log(
        "EMPRESA ATUAL DOS PRODUTOS:",
        idEmpresa
    );

    return idEmpresa;
}


// =======================================
// ABRIR MODAL
// =======================================

window.abrirModalProduto =
    function () {

        const modal =
            document.getElementById(
                "modalProduto"
            );

        if (!modal) {
            return;
        }

        modal.classList.add("active");
    };


// =======================================
// FECHAR MODAL
// =======================================

window.fecharModalProduto =
    function () {

        const modal =
            document.getElementById(
                "modalProduto"
            );

        if (modal) {

            modal.classList.remove(
                "active"
            );
        }

        produtoEditando = null;

        if (formulario) {
            formulario.reset();
        }
    };


// =======================================
// CARREGAR PRODUTOS DA EMPRESA
// =======================================

async function carregarProdutos() {

    try {

        const idEmpresa =
            verificarEmpresa();

        if (!idEmpresa) {

            produtos = [];

            mostrarProdutos([]);

            return;
        }

        console.log(
            "BUSCANDO PRODUTOS DA EMPRESA:",
            idEmpresa
        );

        // Busca produtos onde a empresa
        // est? dentro do array empresas[]
        const consulta =
            query(
                collection(
                    db,
                    "produtos"
                ),
                where(
                    "empresas",
                    "array-contains",
                    idEmpresa
                )
            );

        const snapshot =
            await getDocs(
                consulta
            );

        console.log(
            "TOTAL PRODUTOS DA EMPRESA:",
            snapshot.size
        );

        produtos = [];

        snapshot.forEach(
            (documento) => {

                const dados =
                    documento.data();

                console.log(
                    "PRODUTO ENCONTRADO:",
                    dados
                );

                produtos.push({

                    id:
                        documento.id,

                    ...dados

                });
            }
        );

        console.log(
            "LISTA FINAL:",
            produtos
        );

        mostrarProdutos(
            produtos
        );

    }
    catch (error) {

        console.error(
            "Erro carregar produtos:",
            error
        );

        mostrarToast(
            "Erro ao carregar produtos.",
            "erro"
        );
    }
}


// =======================================
// MOSTRAR PRODUTOS
// =======================================

function mostrarProdutos(lista) {

    console.log(
        "DADOS PARA TABELA:",
        lista
    );

    const tabela =
        document.getElementById(
            "listaProdutos"
        );

    if (!tabela) {

        console.error(
            "Tabela listaProdutos n?o encontrada."
        );

        return;
    }

    tabela.innerHTML = "";

    if (
        !lista ||
        lista.length === 0
    ) {

        tabela.innerHTML = `
            <tr>
                <td colspan="8">
                    Nenhum produto cadastrado
                </td>
            </tr>
        `;

        return;
    }

    lista.forEach(
        (p) => {

            const status =
                p.status === "ativo"
                    ?
                    `<span class="status-ativo">
                        Ativo
                    </span>`
                    :
                    `<span class="status-inativo">
                        Inativo
                    </span>`;

            tabela.innerHTML += `

                <tr>

                    <td>
                        ${p.codigo || "-"}
                    </td>

                    <td>
                        ${p.nome || "-"}
                    </td>

                    <td>
                        ${p.categoria || "-"}
                    </td>

                    <td>
                        ${p.grupo || "-"}
                    </td>

                    <td>
                        ${p.unidade || "-"}
                    </td>

                    <td>
                        ${p.validadeDias || 0} dias
                    </td>

                    <td>
                        ${status}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="editarProduto('${p.id}')"
                            title="Editar"
                        >
                            ??
                        </button>

                        <button
                            type="button"
                            onclick="excluirProduto('${p.id}')"
                            title="Excluir"
                        >
                            ???
                        </button>

                    </td>

                </tr>

            `;
        }
    );
}


// =======================================
// SALVAR PRODUTO
// =======================================

if (formulario) {

    formulario.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            const idEmpresa =
                verificarEmpresa();

            if (!idEmpresa) {
                return;
            }

            console.log(
                "SALVANDO PRODUTO PARA EMPRESA:",
                idEmpresa
            );


            // ===================================
            // NOVO PRODUTO
            // ===================================

            if (!produtoEditando) {

                const dados = {

                    // MULTIEMPRESA
                    empresas: [
                        idEmpresa
                    ],

                    codigo:
                        document
                            .getElementById(
                                "codigoProduto"
                            )
                            .value
                            .trim(),

                    nome:
                        document
                            .getElementById(
                                "nomeProduto"
                            )
                            .value
                            .trim(),

                    categoria:
                        document
                            .getElementById(
                                "categoriaProduto"
                            )
                            .value,

                    grupo:
                        document
                            .getElementById(
                                "grupoProduto"
                            )
                            .value,

                    unidade:
                        document
                            .getElementById(
                                "unidadeProduto"
                            )
                            .value,

                    validadeDias:
                        Number(
                            document
                                .getElementById(
                                    "validadeProduto"
                                )
                                .value
                        ),

                    temperatura:
                        document
                            .getElementById(
                                "temperaturaProduto"
                            )
                            .value,

                    setor:
                        document
                            .getElementById(
                                "setorProduto"
                            )
                            .value,

                    estoqueMinimo:
                        Number(
                            document
                                .getElementById(
                                    "estoqueMinimoProduto"
                                )
                                .value
                        ),

                    status:
                        document
                            .getElementById(
                                "statusProduto"
                            )
                            .value,

                    observacao:
                        document
                            .getElementById(
                                "observacaoProduto"
                            )
                            .value
                            .trim(),

                    criadoEm:
                        serverTimestamp(),

                    atualizadoEm:
                        serverTimestamp()
                };


                try {

                    await addDoc(
                        collection(
                            db,
                            "produtos"
                        ),
                        dados
                    );

                    mostrarToast(
                        "Produto cadastrado com sucesso!"
                    );

                    fecharModalProduto();

                    await carregarProdutos();

                }
                catch (error) {

                    console.error(
                        "Erro cadastrar produto:",
                        error
                    );

                    mostrarToast(
                        "Erro ao cadastrar produto.",
                        "erro"
                    );
                }

                return;
            }


            // ===================================
            // EDITAR PRODUTO
            // ===================================

            const produtoAtual =
                produtos.find(
                    p =>
                        p.id ===
                        produtoEditando
                );

            if (!produtoAtual) {

                mostrarToast(
                    "Produto n?o encontrado.",
                    "erro"
                );

                return;
            }


            // ===================================
            // SEGURAN?A MULTIEMPRESA
            // ===================================

            const empresasProduto =
                Array.isArray(
                    produtoAtual.empresas
                )
                    ?
                    produtoAtual.empresas
                    :
                    [];


            if (
                !empresasProduto.includes(
                    idEmpresa
                )
            ) {

                console.error(
                    "Tentativa de editar produto de outra empresa."
                );

                mostrarToast(
                    "Voc? n?o pode editar este produto.",
                    "erro"
                );

                return;
            }


            const dadosAtualizacao = {

                codigo:
                    document
                        .getElementById(
                            "codigoProduto"
                        )
                        .value
                        .trim(),

                nome:
                    document
                        .getElementById(
                            "nomeProduto"
                        )
                        .value
                        .trim(),

                categoria:
                    document
                        .getElementById(
                            "categoriaProduto"
                        )
                        .value,

                grupo:
                    document
                        .getElementById(
                            "grupoProduto"
                        )
                        .value,

                unidade:
                    document
                        .getElementById(
                            "unidadeProduto"
                        )
                        .value,

                validadeDias:
                    Number(
                        document
                            .getElementById(
                                "validadeProduto"
                            )
                            .value
                    ),

                temperatura:
                    document
                        .getElementById(
                            "temperaturaProduto"
                        )
                        .value,

                setor:
                    document
                        .getElementById(
                            "setorProduto"
                        )
                        .value,

                estoqueMinimo:
                    Number(
                        document
                            .getElementById(
                                "estoqueMinimoProduto"
                            )
                            .value
                    ),

                status:
                    document
                        .getElementById(
                            "statusProduto"
                        )
                        .value,

                observacao:
                    document
                        .getElementById(
                            "observacaoProduto"
                        )
                        .value
                        .trim(),

                atualizadoEm:
                    serverTimestamp()
            };


            try {

                await updateDoc(

                    doc(
                        db,
                        "produtos",
                        produtoEditando
                    ),

                    dadosAtualizacao
                );

                mostrarToast(
                    "Produto atualizado com sucesso!"
                );

                fecharModalProduto();

                await carregarProdutos();

            }
            catch (error) {

                console.error(
                    "Erro atualizar produto:",
                    error
                );

                mostrarToast(
                    "Erro ao atualizar produto.",
                    "erro"
                );
            }

        }
    );
}


// =======================================
// EDITAR PRODUTO
// =======================================

window.editarProduto =
    function (id) {

        const produto =
            produtos.find(
                p =>
                    p.id === id
            );

        if (!produto) {

            mostrarToast(
                "Produto n?o encontrado.",
                "erro"
            );

            return;
        }

        const idEmpresa =
            verificarEmpresa();

        if (!idEmpresa) {
            return;
        }

        const empresasProduto =
            Array.isArray(
                produto.empresas
            )
                ?
                produto.empresas
                :
                [];

        if (
            !empresasProduto.includes(
                idEmpresa
            )
        ) {

            mostrarToast(
                "Voc? n?o pode editar este produto.",
                "erro"
            );

            return;
        }

        produtoEditando =
            id;

        document.getElementById(
            "codigoProduto"
        ).value =
            produto.codigo || "";

        document.getElementById(
            "nomeProduto"
        ).value =
            produto.nome || "";

        document.getElementById(
            "categoriaProduto"
        ).value =
            produto.categoria || "";

        document.getElementById(
            "grupoProduto"
        ).value =
            produto.grupo || "";

        document.getElementById(
            "unidadeProduto"
        ).value =
            produto.unidade || "";

        document.getElementById(
            "validadeProduto"
        ).value =
            produto.validadeDias || 1;

        document.getElementById(
            "temperaturaProduto"
        ).value =
            produto.temperatura || "";

        document.getElementById(
            "setorProduto"
        ).value =
            produto.setor || "";

        document.getElementById(
            "estoqueMinimoProduto"
        ).value =
            produto.estoqueMinimo || 1;

        document.getElementById(
            "statusProduto"
        ).value =
            produto.status || "ativo";

        document.getElementById(
            "observacaoProduto"
        ).value =
            produto.observacao || "";

        abrirModalProduto();
    };


// =======================================
// EXCLUIR PRODUTO
// =======================================

window.excluirProduto =
    async function (id) {

        if (
            !confirm(
                "Deseja excluir este produto?"
            )
        ) {
            return;
        }

        const idEmpresa =
            verificarEmpresa();

        if (!idEmpresa) {
            return;
        }

        const produto =
            produtos.find(
                p =>
                    p.id === id
            );

        if (!produto) {

            mostrarToast(
                "Produto n?o encontrado.",
                "erro"
            );

            return;
        }

        const empresasProduto =
            Array.isArray(
                produto.empresas
            )
                ?
                produto.empresas
                :
                [];

        if (
            !empresasProduto.includes(
                idEmpresa
            )
        ) {

            mostrarToast(
                "Voc? n?o pode excluir este produto.",
                "erro"
            );

            return;
        }

        try {

            await deleteDoc(
                doc(
                    db,
                    "produtos",
                    id
                )
            );

            mostrarToast(
                "Produto exclu?do com sucesso!"
            );

            await carregarProdutos();

        }
        catch (error) {

            console.error(
                "Erro excluir produto:",
                error
            );

            mostrarToast(
                "Erro ao excluir produto.",
                "erro"
            );
        }
    };


// =======================================
// PESQUISA
// =======================================

if (pesquisa) {

    pesquisa.addEventListener(
        "input",
        () => {

            const texto =
                pesquisa.value
                    .trim()
                    .toLowerCase();

            if (
                texto === ""
            ) {

                mostrarProdutos(
                    produtos
                );

                return;
            }

            const resultado =
                produtos.filter(
                    p => {

                        return (
                            p.nome &&
                            p.nome
                                .toLowerCase()
                                .includes(
                                    texto
                                )
                        );

                    }
                );

            mostrarProdutos(
                resultado
            );
        }
    );
}


// =======================================
// INICIAR
// =======================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        carregarProdutos();

    }
);
