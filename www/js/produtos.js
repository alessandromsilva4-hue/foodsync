console.log("PRODUTOS.JS V9 MULTIEMPRESA CARREGADO");

// =======================================
// FOODSYNC V9
// PRODUTOS - FIRESTORE
// MULTIEMPRESA
//
// Estrutura:
// empresas: ["empresa1"]
// empresas: ["empresa1", "empresa2"]
// empresas: ["empresa1", "empresa2", "empresa3", "empresa4"]
//
// IMPORTANTE:
// - Produto pode pertencer a várias empresas
// - Cada empresa vê somente seus produtos
// - Editar preserva todas as empresas
// - Excluir remove somente a empresa atual
// - Produto só é apagado quando não houver empresas
// =======================================

import { db } from "./firebase.js";

import {
    mostrarToast
} from "./utils.js";

import {
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    serverTimestamp,
    query,
    where,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =======================================
// USUÁRIO LOGADO
// =======================================

function obterUsuarioLogado() {

    try {

        const dados =
            localStorage.getItem("usuarioFoodSync");

        if (!dados) {

            console.warn(
                "USUÁRIO NÃO ENCONTRADO NO LOCALSTORAGE"
            );

            return null;
        }

        const usuario =
            JSON.parse(dados);

        console.log(
            "USUÁRIO LOCALSTORAGE:",
            usuario
        );

        return usuario;

    } catch (error) {

        console.error(
            "ERRO AO LER USUÁRIO:",
            error
        );

        return null;
    }
}


// =======================================
// EMPRESA ATUAL
// =======================================

function obterIdEmpresa() {

    const usuario =
        obterUsuarioLogado();

    const empresa =
        usuario?.idEmpresa || "";

    console.log(
        "ID EMPRESA OBTIDO DO LOCALSTORAGE:",
        empresa
    );

    return empresa;
}


// =======================================
// VARIÁVEIS
// =======================================

let idEmpresa = "";

let paginaPronta = false;

let produtos = [];

let produtoEditando = null;


// =======================================
// ELEMENTOS
// =======================================

const formulario =
    document.getElementById(
        "produtoForm"
    );

const pesquisa =
    document.getElementById(
        "pesquisaProduto"
    );


// =======================================
// ABRIR MODAL
// =======================================

window.abrirModalProduto = function () {

    const modal =
        document.getElementById(
            "modalProduto"
        );

    if (!modal) {

        console.error(
            "MODAL PRODUTO NÃO ENCONTRADO"
        );

        return;
    }

    modal.classList.add(
        "active"
    );
};


// =======================================
// FECHAR MODAL
// =======================================

window.fecharModalProduto = function () {

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
// NORMALIZAR EMPRESAS
// =======================================

function obterEmpresasProduto(produto) {

    if (
        Array.isArray(
            produto?.empresas
        )
    ) {

        return [
            ...new Set(
                produto.empresas
            )
        ];
    }

    return [];
}


// =======================================
// VERIFICAR PRODUTO DA EMPRESA
// =======================================

function produtoPertenceEmpresa(
    produto
) {

    const empresasProduto =
        obterEmpresasProduto(
            produto
        );

    return empresasProduto.includes(
        idEmpresa
    );
}


// =======================================
// CARREGAR PRODUTOS
// SOMENTE EMPRESA ATUAL
// =======================================

async function carregarProdutos() {

    console.log(
        "======================================="
    );

    console.log(
        "CARREGANDO PRODUTOS"
    );

    console.log(
        "EMPRESA:",
        idEmpresa
    );


    if (!idEmpresa) {

        console.error(
            "EMPRESA NÃO IDENTIFICADA"
        );

        produtos = [];

        mostrarProdutos([]);

        return;
    }


    try {

        // =================================
        // CONSULTA MULTIEMPRESA
        // =================================

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
            "PRODUTOS ENCONTRADOS:",
            snapshot.size
        );


        produtos = [];


        snapshot.forEach(
            (docSnap) => {

                const dados =
                    docSnap.data();


                produtos.push({

                    id:
                        docSnap.id,

                    ...dados

                });

            }
        );


        console.log(
            "PRODUTOS DA EMPRESA:",
            produtos
        );


        mostrarProdutos(
            produtos
        );


    } catch (error) {

        console.error(
            "ERRO AO CARREGAR PRODUTOS:",
            error
        );


        if (
            error?.code ===
            "permission-denied"
        ) {

            mostrarToast(
                "Sem permissão para acessar os produtos desta empresa.",
                "erro"
            );

        } else {

            mostrarToast(
                "Erro ao carregar produtos.",
                "erro"
            );
        }
    }
}


// =======================================
// MOSTRAR PRODUTOS
// =======================================

function mostrarProdutos(lista) {

    const tabela =
        document.getElementById(
            "listaProdutos"
        );


    if (!tabela) {

        console.error(
            "TABELA listaProdutos NÃO ENCONTRADA"
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
                        ${p.codigo || ""}
                    </td>

                    <td>
                        ${p.nome || ""}
                    </td>

                    <td>
                        ${p.categoria || ""}
                    </td>

                    <td>
                        ${p.grupo || ""}
                    </td>

                    <td>
                        ${p.unidade || ""}
                    </td>

                    <td>
                        ${p.validadeDias || 0}
                    </td>

                    <td>
                        ${status}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="editarProduto('${p.id}')"
                            title="Editar produto"
                        >
                            ✏️
                        </button>

                        <button
                            type="button"
                            onclick="excluirProduto('${p.id}')"
                            title="Excluir produto"
                        >
                            🗑️
                        </button>

                    </td>

                </tr>

            `;
        }
    );
}


// =======================================
// LER VALOR DE ELEMENTO
// EVITA ERRO SE CAMPO NÃO EXISTIR
// =======================================

function obterValor(id) {

    const elemento =
        document.getElementById(id);

    if (!elemento) {

        console.warn(
            "CAMPO NÃO ENCONTRADO:",
            id
        );

        return "";
    }

    return elemento.value;
}


// =======================================
// SALVAR PRODUTO
// =======================================

if (formulario) {

    formulario.addEventListener(

        "submit",

        async (e) => {

            e.preventDefault();


            if (!idEmpresa) {

                mostrarToast(
                    "Usuário sem empresa vinculada.",
                    "erro"
                );

                return;
            }


            console.log(
                "SALVANDO PRODUTO PARA EMPRESA:",
                idEmpresa
            );


            // =================================
            // DADOS DO PRODUTO
            // =================================

            const dados = {

                codigo:
                    obterValor(
                        "codigoProduto"
                    )
                    .trim(),

                nome:
                    obterValor(
                        "nomeProduto"
                    )
                    .trim(),

                categoria:
                    obterValor(
                        "categoriaProduto"
                    ),

                grupo:
                    obterValor(
                        "grupoProduto"
                    ),

                unidade:
                    obterValor(
                        "unidadeProduto"
                    ),

                validadeDias:
                    Number(
                        obterValor(
                            "validadeProduto"
                        )
                    ) || 0,

                temperatura:
                    obterValor(
                        "temperaturaProduto"
                    ),

                setor:
                    obterValor(
                        "setorProduto"
                    ),

                estoqueMinimo:
                    Number(
                        obterValor(
                            "estoqueMinimoProduto"
                        )
                    ) || 0,

                status:
                    obterValor(
                        "statusProduto"
                    ) || "ativo",

                observacao:
                    obterValor(
                        "observacaoProduto"
                    )
                    .trim(),

                atualizadoEm:
                    serverTimestamp()

            };


            try {

                // =================================
                // EDITAR PRODUTO
                // =================================

                if (produtoEditando) {

                    const produto =
                        produtos.find(
                            p =>
                                p.id ===
                                produtoEditando
                        );


                    if (!produto) {

                        mostrarToast(
                            "Produto não encontrado.",
                            "erro"
                        );

                        return;
                    }


                    // =================================
                    // SEGURANÇA
                    // =================================

                    if (
                        !produtoPertenceEmpresa(
                            produto
                        )
                    ) {

                        mostrarToast(
                            "Este produto não pertence à empresa atual.",
                            "erro"
                        );

                        return;
                    }


                    // =================================
                    // PRESERVAR EMPRESAS
                    // =================================

                    const empresasProduto =
                        obterEmpresasProduto(
                            produto
                        );


                    if (
                        empresasProduto.length === 0
                    ) {

                        mostrarToast(
                            "Produto sem empresas vinculadas.",
                            "erro"
                        );

                        return;
                    }


                    dados.empresas =
                        empresasProduto;


                    await updateDoc(

                        doc(
                            db,
                            "produtos",
                            produtoEditando
                        ),

                        dados

                    );


                    console.log(
                        "PRODUTO ATUALIZADO:",
                        produtoEditando
                    );


                    mostrarToast(
                        "Produto atualizado com sucesso!"
                    );

                }


                // =================================
                // NOVO PRODUTO
                // =================================

                else {

                    dados.empresas =
                        [
                            idEmpresa
                        ];


                    dados.criadoEm =
                        serverTimestamp();


                    await addDoc(

                        collection(
                            db,
                            "produtos"
                        ),

                        dados

                    );


                    console.log(
                        "NOVO PRODUTO CRIADO:"
                    );

                    console.log(
                        dados
                    );


                    mostrarToast(
                        "Produto cadastrado com sucesso!"
                    );
                }


                // =================================
                // FECHAR MODAL
                // =================================

                fecharModalProduto();


                // =================================
                // RECARREGAR
                // =================================

                await carregarProdutos();


            } catch (error) {

                console.error(
                    "ERRO AO SALVAR PRODUTO:",
                    error
                );


                if (
                    error?.code ===
                    "permission-denied"
                ) {

                    mostrarToast(
                        "Sem permissão para salvar este produto.",
                        "erro"
                    );

                } else {

                    mostrarToast(
                        "Erro ao salvar produto.",
                        "erro"
                    );
                }
            }
        }
    );
}


// =======================================
// EDITAR PRODUTO
// =======================================

window.editarProduto = function (id) {

    const produto =
        produtos.find(
            p =>
                p.id === id
        );


    if (!produto) {

        mostrarToast(
            "Produto não encontrado.",
            "erro"
        );

        return;
    }


    // =================================
    // SEGURANÇA MULTIEMPRESA
    // =================================

    if (
        !produtoPertenceEmpresa(
            produto
        )
    ) {

        mostrarToast(
            "Produto não pertence à empresa atual.",
            "erro"
        );

        return;
    }


    produtoEditando =
        id;


    // =================================
    // PREENCHER FORMULÁRIO
    // =================================

    const codigo =
        document.getElementById(
            "codigoProduto"
        );

    if (codigo) {

        codigo.value =
            produto.codigo || "";
    }


    const nome =
        document.getElementById(
            "nomeProduto"
        );

    if (nome) {

        nome.value =
            produto.nome || "";
    }


    const categoria =
        document.getElementById(
            "categoriaProduto"
        );

    if (categoria) {

        categoria.value =
            produto.categoria || "";
    }


    const grupo =
        document.getElementById(
            "grupoProduto"
        );

    if (grupo) {

        grupo.value =
            produto.grupo || "";
    }


    const unidade =
        document.getElementById(
            "unidadeProduto"
        );

    if (unidade) {

        unidade.value =
            produto.unidade || "";
    }


    const validade =
        document.getElementById(
            "validadeProduto"
        );

    if (validade) {

        validade.value =
            produto.validadeDias || 1;
    }


    const temperatura =
        document.getElementById(
            "temperaturaProduto"
        );

    if (temperatura) {

        temperatura.value =
            produto.temperatura || "";
    }


    const setor =
        document.getElementById(
            "setorProduto"
        );

    if (setor) {

        setor.value =
            produto.setor || "";
    }


    const estoqueMinimo =
        document.getElementById(
            "estoqueMinimoProduto"
        );

    if (estoqueMinimo) {

        estoqueMinimo.value =
            produto.estoqueMinimo || 1;
    }


    const status =
        document.getElementById(
            "statusProduto"
        );

    if (status) {

        status.value =
            produto.status || "ativo";
    }


    const observacao =
        document.getElementById(
            "observacaoProduto"
        );

    if (observacao) {

        observacao.value =
            produto.observacao || "";
    }


    abrirModalProduto();
};


// =======================================
// EXCLUIR PRODUTO
//
// IMPORTANTE:
// Se produto:
// empresas: ["empresa1", "empresa2"]
//
// Empresa1 exclui:
// empresas: ["empresa2"]
//
// O produto continua para empresa2.
//
// Se ficar:
// empresas: []
//
// aí o documento é excluído.
// =======================================

window.excluirProduto = async function (id) {

    if (
        !confirm(
            "Deseja remover este produto da empresa atual?"
        )
    ) {

        return;
    }


    if (!idEmpresa) {

        mostrarToast(
            "Empresa atual não identificada.",
            "erro"
        );

        return;
    }


    const produto =
        produtos.find(
            p =>
                p.id === id
        );


    if (!produto) {

        mostrarToast(
            "Produto não encontrado.",
            "erro"
        );

        return;
    }


    // =================================
    // SEGURANÇA
    // =================================

    if (
        !produtoPertenceEmpresa(
            produto
        )
    ) {

        mostrarToast(
            "Este produto não pertence à empresa atual.",
            "erro"
        );

        return;
    }


    try {

        const empresasProduto =
            obterEmpresasProduto(
                produto
            );


        // =================================
        // REMOVER EMPRESA ATUAL
        // =================================

        const novasEmpresas =
            empresasProduto.filter(
                empresa =>
                    empresa !==
                    idEmpresa
            );


        console.log(
            "EMPRESAS ANTES:",
            empresasProduto
        );


        console.log(
            "EMPRESAS DEPOIS:",
            novasEmpresas
        );


        // =================================
        // SE NÃO SOBROU EMPRESA
        // =================================

        if (
            novasEmpresas.length === 0
        ) {

            await deleteDoc(

                doc(
                    db,
                    "produtos",
                    id
                )

            );


            console.log(
                "PRODUTO EXCLUÍDO DEFINITIVAMENTE:",
                id
            );


            mostrarToast(
                "Produto excluído com sucesso!"
            );

        }


        // =================================
        // AINDA EXISTEM EMPRESAS
        // =================================

        else {

            await updateDoc(

                doc(
                    db,
                    "produtos",
                    id
                ),

                {

                    empresas:
                        novasEmpresas,

                    atualizadoEm:
                        serverTimestamp()

                }

            );


            console.log(
                "EMPRESA REMOVIDA DO PRODUTO:",
                idEmpresa
            );


            mostrarToast(
                "Produto removido da empresa atual."
            );
        }


        await carregarProdutos();


    } catch (error) {

        console.error(
            "ERRO AO EXCLUIR PRODUTO:",
            error
        );


        if (
            error?.code ===
            "permission-denied"
        ) {

            mostrarToast(
                "Sem permissão para remover este produto.",
                "erro"
            );

        } else {

            mostrarToast(
                "Erro ao excluir produto.",
                "erro"
            );
        }
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

                            (
                                p.nome ||
                                ""
                            )
                            .toLowerCase()
                            .includes(
                                texto
                            )

                            ||

                            (
                                p.codigo ||
                                ""
                            )
                            .toLowerCase()
                            .includes(
                                texto
                            )

                            ||

                            (
                                p.categoria ||
                                ""
                            )
                            .toLowerCase()
                            .includes(
                                texto
                            )

                            ||

                            (
                                p.grupo ||
                                ""
                            )
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
// INICIALIZAÇÃO
// =======================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        paginaPronta = true;


        console.log(
            "PRODUTOS: DOM CARREGADO"
        );


        // =================================
        // OBTER EMPRESA DO LOCALSTORAGE
        // =================================

        idEmpresa =
            obterIdEmpresa();


        console.log(
            "EMPRESA NO INÍCIO:",
            idEmpresa
        );


        if (
            idEmpresa
        ) {

            console.log(
                "EMPRESA ENCONTRADA:",
                idEmpresa
            );


            carregarProdutos();

        } else {

            console.log(
                "AGUARDANDO PERFIL..."
            );


            mostrarProdutos([]);
        }
    }
);


// =======================================
// EVENTO DO AUTH
// =======================================

window.addEventListener(

    "foodsync:perfil-carregado",

    (event) => {

        window.foodsyncPerfilPronto =
            true;


        const empresaEvento =
            event.detail?.idEmpresa || "";


        if (
            empresaEvento
        ) {

            idEmpresa =
                empresaEvento;

        } else {

            idEmpresa =
                obterIdEmpresa();

        }


        console.log(
            "EMPRESA RECEBIDA DO AUTH:",
            idEmpresa
        );


        if (!idEmpresa) {

            console.error(
                "EMPRESA NÃO IDENTIFICADA"
            );


            mostrarProdutos([]);


            return;
        }


        if (
            paginaPronta
        ) {

            carregarProdutos();
        }
    }
);


// =======================================
// DEBUG GLOBAL
// =======================================

window.debugProdutos = function () {

    console.log(
        "======================================="
    );

    console.log(
        "DEBUG PRODUTOS"
    );

    console.log(
        "EMPRESA ATUAL:",
        idEmpresa
    );

    console.log(
        "TOTAL PRODUTOS:",
        produtos.length
    );

    console.log(
        "PRODUTOS:",
        produtos
    );

    console.log(
        "======================================="
    );
};


console.log(
    "PRODUTOS.JS V9 PRONTO"
);