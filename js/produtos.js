console.log("PRODUTOS.JS CARREGADO");

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
    doc,
    deleteDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =======================================
// USUÁRIO / EMPRESA LOGADA
// =======================================

const usuarioLogado = JSON.parse(
    localStorage.getItem("usuarioFoodSync")
);

const idEmpresa = usuarioLogado?.idEmpresa;

console.log("USUÁRIO LOGADO:", usuarioLogado);
console.log("EMPRESA DO USUÁRIO:", idEmpresa);


// =======================================
// VALIDAR EMPRESA
// =======================================

if (!idEmpresa) {

    console.error(
        "ERRO: Usuário não possui idEmpresa."
    );

}


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
// ABRIR MODAL
// =======================================

window.abrirModalProduto = function () {

    const modal =
        document.getElementById("modalProduto");

    if (modal) {
        modal.classList.add("active");
    }

};


// =======================================
// FECHAR MODAL
// =======================================

window.fecharModalProduto = function () {

    const modal =
        document.getElementById("modalProduto");

    if (modal) {
        modal.classList.remove("active");
    }

    produtoEditando = null;

    if (formulario) {
        formulario.reset();
    }

};


// =======================================
// CARREGAR PRODUTOS
// EMPRESA LOGADA + COMPARTILHADOS
// =======================================

async function carregarProdutos() {

    if (!idEmpresa) {

        console.error(
            "Não foi possível carregar produtos: idEmpresa não encontrado."
        );

        mostrarProdutos([]);

        return;
    }


    try {

        const snapshot =
            await getDocs(
                collection(db, "produtos")
            );


        console.log(
            "TOTAL PRODUTOS FIREBASE:",
            snapshot.size
        );


        produtos = [];


        snapshot.forEach((docSnap) => {

            const dados = docSnap.data();


            console.log(
                "PRODUTO ENCONTRADO:",
                dados
            );


            // =======================================
            // EMPRESAS DO PRODUTO
            // =======================================

            const empresas =
                Array.isArray(dados.empresas)
                    ? dados.empresas
                    : (
                        dados.idEmpresa
                            ? [dados.idEmpresa]
                            : []
                    );


            // =======================================
            // VERIFICAR SE PERTENCE À EMPRESA
            // =======================================

            if (
                empresas.includes(idEmpresa)
            ) {

                produtos.push({

                    id: docSnap.id,

                    ...dados,

                    empresas: empresas

                });

            }

        });


        console.log(
            "PRODUTOS DA EMPRESA:",
            produtos
        );


        mostrarProdutos(produtos);


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
// MOSTRAR NA TABELA
// =======================================

function mostrarProdutos(lista) {

    console.log(
        "DADOS PARA TABELA:",
        lista,
        "Quantidade:",
        lista ? lista.length : "sem lista"
    );


    const tabela =
        document.getElementById("listaProdutos");


    if (!tabela) {

        console.error(
            "Tabela listaProdutos não encontrada."
        );

        return;
    }


    tabela.innerHTML = "";


    if (!lista || lista.length === 0) {

        tabela.innerHTML = `

            <tr>

                <td colspan="8">

                    Nenhum produto cadastrado

                </td>

            </tr>

        `;

        return;
    }


    lista.forEach((p) => {

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
                    >
                        ✏️
                    </button>


                    <button
                        type="button"
                        onclick="excluirProduto('${p.id}')"
                    >
                        🗑️
                    </button>

                </td>

            </tr>

        `;

    });

}


// =======================================
// SALVAR PRODUTO
// =======================================

if (formulario) {

    formulario.addEventListener(

        "submit",

        async (e) => {

            e.preventDefault();


            // =======================================
            // VERIFICAR EMPRESA
            // =======================================

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


            const dados = {

                codigo:
                    document
                        .getElementById("codigoProduto")
                        .value
                        .trim(),


                nome:
                    document
                        .getElementById("nomeProduto")
                        .value
                        .trim(),


                categoria:
                    document
                        .getElementById("categoriaProduto")
                        .value,


                grupo:
                    document
                        .getElementById("grupoProduto")
                        .value,


                unidade:
                    document
                        .getElementById("unidadeProduto")
                        .value,


                validadeDias:
                    Number(
                        document
                            .getElementById("validadeProduto")
                            .value
                    ),


                temperatura:
                    document
                        .getElementById("temperaturaProduto")
                        .value,


                setor:
                    document
                        .getElementById("setorProduto")
                        .value,


                estoqueMinimo:
                    Number(
                        document
                            .getElementById("estoqueMinimoProduto")
                            .value
                    ),


                status:
                    document
                        .getElementById("statusProduto")
                        .value,


                observacao:
                    document
                        .getElementById("observacaoProduto")
                        .value
                        .trim(),


                atualizadoEm:
                    serverTimestamp()

            };


            try {

                // =======================================
                // EDITAR PRODUTO
                // =======================================

                if (produtoEditando) {

                    const produto =
                        produtos.find(
                            p => p.id === produtoEditando
                        );


                    if (!produto) {

                        mostrarToast(
                            "Produto não encontrado.",
                            "erro"
                        );

                        return;
                    }


                    const empresas =
                        Array.isArray(produto.empresas)
                            ? [...produto.empresas]
                            : [idEmpresa];


                    // Garante que a empresa atual
                    // continue vinculada

                    if (!empresas.includes(idEmpresa)) {

                        empresas.push(idEmpresa);

                    }


                    dados.empresas = empresas;


                    await updateDoc(

                        doc(
                            db,
                            "produtos",
                            produtoEditando
                        ),

                        dados

                    );


                    mostrarToast(
                        "Produto atualizado com sucesso!"
                    );

                }


                // =======================================
                // NOVO PRODUTO
                // =======================================

                else {

                    dados.empresas = [
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
                        "NOVO PRODUTO VINCULADO À EMPRESA:",
                        idEmpresa
                    );


                    mostrarToast(
                        "Produto cadastrado com sucesso!"
                    );

                }


                fecharModalProduto();


                await carregarProdutos();


            }
            catch (error) {

                console.error(
                    "Erro salvar produto:",
                    error
                );


                mostrarToast(
                    "Erro ao salvar produto.",
                    "erro"
                );

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
            p => p.id === id
        );


    if (!produto) {

        mostrarToast(
            "Produto não encontrado.",
            "erro"
        );

        return;
    }


    // =======================================
    // GARANTIR EMPRESA CORRETA
    // =======================================

    const empresas =
        Array.isArray(produto.empresas)
            ? produto.empresas
            : [];


    if (
        !empresas.includes(idEmpresa)
    ) {

        mostrarToast(
            "Produto não pertence à empresa atual.",
            "erro"
        );

        return;
    }


    produtoEditando = id;


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

window.excluirProduto = async function (id) {

    if (
        !confirm(
            "Deseja excluir este produto?"
        )
    ) {

        return;
    }


    const produto =
        produtos.find(
            p => p.id === id
        );


    if (!produto) {

        mostrarToast(
            "Produto não encontrado.",
            "erro"
        );

        return;
    }


    const empresas =
        Array.isArray(produto.empresas)
            ? [...produto.empresas]
            : [];


    if (
        !empresas.includes(idEmpresa)
    ) {

        mostrarToast(
            "Produto não pertence à empresa atual.",
            "erro"
        );

        return;
    }


    try {

        // =======================================
        // PRODUTO COMPARTILHADO
        // =======================================

        if (empresas.length > 1) {

            const novasEmpresas =
                empresas.filter(
                    empresa =>
                        empresa !== idEmpresa
                );


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


            mostrarToast(
                "Produto removido da empresa atual."
            );

        }


        // =======================================
        // PRODUTO EXCLUSIVO
        // =======================================

        else {

            await deleteDoc(

                doc(
                    db,
                    "produtos",
                    id
                )

            );


            mostrarToast(
                "Produto excluído com sucesso!"
            );

        }


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


            if (texto === "") {

                mostrarProdutos(produtos);

                return;
            }


            const resultado =

                produtos.filter(
                    p => {

                        return (

                            p.nome &&

                            p.nome
                                .toLowerCase()
                                .includes(texto)

                        );

                    }
                );


            mostrarProdutos(resultado);

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