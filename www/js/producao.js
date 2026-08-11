// =======================================
// LOTRIX - PRODUÇÃO V6
// MULTIEMPRESA + FIRESTORE
// COMPATÍVEL COM ESTOQUE V6
// =======================================

console.log("PRODUCAO.JS V6 CARREGADO");F

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =======================================
// VARIÁVEIS
// =======================================

let produtos = [];
let imprimirDepoisDeSalvar = false;


// =======================================
// ELEMENTOS
// =======================================

function obterElemento(id) {
    return document.getElementById(id);
}


// =======================================
// USUÁRIO ATUAL
// =======================================

function usuarioAtual() {

    try {

        const dados =
            localStorage.getItem("usuarioFoodSync");

        if (!dados) {
            return null;
        }

        return JSON.parse(dados);

    } catch (error) {

        console.error(
            "Erro ao carregar usuário:",
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
            "Usuário não encontrado."
        );

        return null;
    }

    if (!usuario.idEmpresa) {

        console.error(
            "ID da empresa não encontrado:",
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

        alert(
            "Não foi possível identificar a empresa deste usuário."
        );

        return false;
    }

    console.log(
        "EMPRESA ATUAL:",
        idEmpresa
    );

    return true;
}


// =======================================
// ESCAPAR HTML
// =======================================

function escaparHTML(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =======================================
// VERIFICAR SE PRODUTO PERTENCE À EMPRESA
// =======================================

function produtoPertenceEmpresa(
    dados,
    idEmpresa
) {

    // FORMATO PRINCIPAL
    if (
        dados.idEmpresa ===
        idEmpresa
    ) {

        return true;
    }

    // COMPATIBILIDADE COM empresas[]
    if (
        Array.isArray(dados.empresas) &&
        dados.empresas.includes(idEmpresa)
    ) {

        return true;
    }

    return false;
}


// =======================================
// CARREGAR PRODUTOS
// SOMENTE EMPRESA ATUAL
// =======================================

async function carregarProdutos() {

    const produtoSelect =
        obterElemento("produtoSelect");

    if (!produtoSelect) {

        console.error(
            "Elemento #produtoSelect não encontrado."
        );

        return;
    }

    try {

        const idEmpresa =
            empresaAtual();

        if (!idEmpresa) {

            console.error(
                "Não foi possível identificar a empresa."
            );

            return;
        }

        produtos = [];

        produtoSelect.innerHTML =
            '<option value="">Selecione um produto</option>';

        console.log(
            "CARREGANDO PRODUTOS DA EMPRESA:",
            idEmpresa
        );

        const consulta =
            query(
                collection(
                    db,
                    "produtos"
                ),
                where(
                    "idEmpresa",
                    "==",
                    idEmpresa
                )
            );

        let snapshot;

        try {

            snapshot =
                await getDocs(
                    consulta
                );

        } catch (error) {

            console.error(
                "ERRO FIRESTORE AO CARREGAR PRODUTOS:",
                error
            );

            console.error(
                "Empresa utilizada:",
                idEmpresa
            );

            throw error;
        }

        snapshot.forEach(
            (item) => {

                const dados =
                    item.data();

                if (
                    dados.idEmpresa !==
                    idEmpresa
                ) {

                    return;
                }

                const produto = {

                    id:
                        item.id,

                    ...dados

                };

                produtos.push(
                    produto
                );

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    produto.id;

                option.textContent =
                    produto.nome ||
                    "Produto sem nome";

                produtoSelect.appendChild(
                    option
                );

            }
        );

        console.log(
            "PRODUTOS CARREGADOS:",
            produtos.length
        );

        console.log(
            "EMPRESA DOS PRODUTOS:",
            idEmpresa
        );

        if (
            produtos.length === 0
        ) {

            console.warn(
                "Nenhum produto encontrado para a empresa:",
                idEmpresa
            );
        }

    } catch (error) {

        console.error(
            "ERRO AO CARREGAR PRODUTOS:",
            error
        );

        alert(
            "Erro ao carregar os produtos."
        );
    }
}


// =======================================
// PRODUTO SELECIONADO
// =======================================

function produtoSelecionado() {

    const select =
        obterElemento(
            "produtoSelect"
        );

    if (!select) {
        return null;
    }

    return produtos.find(
        produto =>
            produto.id ===
            select.value
    ) || null;
}


// =======================================
// ATUALIZAR INFORMAÇÕES DO PRODUTO
// =======================================

function atualizarInformacoesProduto() {

    const produto =
        produtoSelecionado();


    const infoValidade =
        obterElemento(
            "infoValidade"
        );


    const infoTemperatura =
        obterElemento(
            "infoTemperatura"
        );


    if (!produto) {

        if (infoValidade) {
            infoValidade.textContent = "";
        }

        if (infoTemperatura) {
            infoTemperatura.textContent = "";
        }

        return;
    }


    if (infoValidade) {

        infoValidade.textContent =
            `${produto.validadeDias || 0} dias`;
    }


    if (infoTemperatura) {

        infoTemperatura.textContent =
            produto.temperatura || "-";
    }


    const temperatura =
        obterElemento(
            "temperaturaProducao"
        );


    if (temperatura) {

        temperatura.value =
            produto.temperatura || "-";
    }


    const unidade =
        obterElemento(
            "unidadeProducao"
        );


    if (unidade) {

        unidade.value =
            produto.unidade || "UN";
    }


    const responsavel =
        obterElemento(
            "responsavelProducao"
        );


    if (
        responsavel &&
        !responsavel.value
    ) {

        const usuario =
            usuarioAtual();

        responsavel.value =
            usuario?.nome ||
            "Não informado";
    }


    const dataProducao =
        obterElemento(
            "dataProducao"
        );


    if (
        dataProducao &&
        dataProducao.value
    ) {

        calcularValidade(
            produto.validadeDias || 0
        );
    }
}


// =======================================
// CALCULAR VALIDADE
// =======================================

function calcularValidade(dias) {

    const campo =
        obterElemento(
            "dataProducao"
        );


    const validade =
        obterElemento(
            "validadeProducao"
        );


    if (
        !campo ||
        !validade ||
        !campo.value
    ) {

        return;
    }


    const data =
        new Date(
            campo.value
        );


    data.setDate(
        data.getDate() +
        Number(dias || 0)
    );


    const resultado =
        new Date(
            data.getTime() -
            data.getTimezoneOffset() *
            60000
        )
        .toISOString()
        .slice(0, 16);


    validade.value =
        resultado;
}


// =======================================
// GERAR LOTE
// =======================================

function gerarLote() {

    const agora =
        new Date();


    const lote =
        "LOT-" +
        agora.getFullYear() +
        String(
            agora.getMonth() + 1
        ).padStart(2, "0") +
        String(
            agora.getDate()
        ).padStart(2, "0") +
        "-" +
        String(
            Date.now()
        ).slice(-5);


    const campo =
        obterElemento(
            "loteProducao"
        );


    if (campo) {
        campo.value = lote;
    }


    return lote;
}


// =======================================
// DATA/HORA ATUAL
// =======================================

function preencherDataAtual() {

    const campo =
        obterElemento(
            "dataProducao"
        );


    if (!campo) {
        return;
    }


    const agora =
        new Date();


    const valor =
        new Date(
            agora.getTime() -
            agora.getTimezoneOffset() *
            60000
        )
        .toISOString()
        .slice(0, 16);


    campo.value =
        valor;


    const produto =
        produtoSelecionado();


    if (produto) {

        calcularValidade(
            produto.validadeDias || 0
        );
    }
}


// =======================================
// BAIXAR ESTOQUE
// SOMENTE EMPRESA ATUAL
// =======================================

async function baixarEstoque(
    idEmpresa,
    produto,
    quantidade,
    unidade,
    usuario
) {

    try {
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

let snapshot;

try {

    snapshot =
        await getDocs(
            consulta
        );

} catch (error) {

    console.error(
        "ERRO FIRESTORE AO CONSULTAR ESTOQUE:",
        error
    );

    console.error(
        "Empresa utilizada no estoque:",
        idEmpresa
    );

    throw error;
}


        let estoqueEncontrado =
            null;


        // ---------------------------------------
        // LOCALIZAR ESTOQUE
        // ---------------------------------------

        for (
            const item of snapshot.docs
        ) {

            const estoque =
                item.data();


            const mesmoProduto =
                estoque.produtoId ===
                produto.id;


            const nomeEstoque =
                String(
                    estoque.produto || ""
                )
                .trim()
                .toLowerCase();


            const nomeProduto =
                String(
                    produto.nome || ""
                )
                .trim()
                .toLowerCase();


            const mesmoNome =
                nomeEstoque ===
                nomeProduto;


            if (
                mesmoProduto ||
                mesmoNome
            ) {

                estoqueEncontrado = {

                    id:
                        item.id,

                    ...estoque

                };

                break;
            }
        }


        // ---------------------------------------
        // ESTOQUE NÃO ENCONTRADO
        // ---------------------------------------

        if (!estoqueEncontrado) {

            throw new Error(
                `Produto "${produto.nome}" não possui estoque cadastrado para esta empresa.`
            );
        }


        const quantidadeAtual =
            Number(
                estoqueEncontrado.quantidade ||
                0
            );


        // ---------------------------------------
        // VERIFICAR ESTOQUE SUFICIENTE
        // ---------------------------------------

        if (
            quantidadeAtual <
            quantidade
        ) {

            throw new Error(
                `Estoque insuficiente para ${produto.nome}. Disponível: ${quantidadeAtual} ${unidade}.`
            );
        }


        const novaQuantidade =
            quantidadeAtual -
            quantidade;


        // ---------------------------------------
        // ATUALIZAR ESTOQUE
        // ---------------------------------------

        await updateDoc(

            doc(
                db,
                "estoque",
                estoqueEncontrado.id
            ),

            {

                quantidade:
                    novaQuantidade,

                produtoId:
                    produto.id,

                produto:
                    produto.nome || "",

                unidade:
                    unidade,

                idEmpresa:
                    idEmpresa,

                atualizadoEm:
                    serverTimestamp()

            }

        );


        // ---------------------------------------
        // REGISTRAR MOVIMENTAÇÃO
        // ---------------------------------------

        await addDoc(

            collection(
                db,
                "movimentacoes"
            ),

            {

                idEmpresa:
                    idEmpresa,

                produtoId:
                    produto.id,

                produto:
                    produto.nome || "",

                tipo:
                    "SAIDA",

                quantidade:
                    quantidade,

                unidade:
                    unidade,

                motivo:
                    "Produção",

                usuario:
                    usuario?.nome ||
                    "Sistema",

                data:
                    serverTimestamp()

            }

        );


        console.log(
            "ESTOQUE BAIXADO:",
            {
                empresa: idEmpresa,
                produto: produto.nome,
                quantidadeAnterior: quantidadeAtual,
                quantidadeBaixada: quantidade,
                quantidadeNova: novaQuantidade
            }
        );


        return true;

    } catch (error) {

        console.error(
            "Erro ao baixar estoque:",
            error
        );

        throw error;
    }
}


// =======================================
// SALVAR PRODUÇÃO
// =======================================

async function salvarProducao() {

    const formulario =
        obterElemento(
            "producaoForm"
        );


    if (!formulario) {
        return;
    }


    try {

        const idEmpresa =
            empresaAtual();


        if (!idEmpresa) {

            alert(
                "Empresa não identificada."
            );

            return;
        }


        const produto =
            produtoSelecionado();


        if (!produto) {

            alert(
                "Selecione um produto."
            );

            return;
        }


        // ---------------------------------------
        // GARANTIR QUE PRODUTO É DA EMPRESA
        // ---------------------------------------

        if (
            !produtoPertenceEmpresa(
                produto,
                idEmpresa
            )
        ) {

            alert(
                "Este produto não pertence à empresa atual."
            );

            return;
        }


        const usuario =
            usuarioAtual();


        const quantidade =
            Number(
                obterElemento(
                    "quantidadeProducao"
                )?.value
            ) || 1;


        if (
            quantidade <= 0
        ) {

            alert(
                "Informe uma quantidade válida."
            );

            return;
        }


        const qtdEtiquetas =
            Number(
                obterElemento(
                    "qtdEtiquetas"
                )?.value
            ) || 1;


        const unidade =
            produto.unidade ||
            obterElemento(
                "unidadeProducao"
            )?.value ||
            "UN";


        const dataProducao =
            obterElemento(
                "dataProducao"
            )?.value ||
            "";


        const validade =
            obterElemento(
                "validadeProducao"
            )?.value ||
            "";


        const temperatura =
            obterElemento(
                "temperaturaProducao"
            )?.value ||
            "";


        const responsavel =
            obterElemento(
                "responsavelProducao"
            )?.value ||
            usuario?.nome ||
            "Sistema";


        const status =
            obterElemento(
                "statusProducao"
            )?.value ||
            "Finalizado";


        const lote =
            gerarLote();


        // ---------------------------------------
        // DADOS DA PRODUÇÃO
        // ---------------------------------------

        const dados = {

            idEmpresa:

                idEmpresa,

            produtoId:

                produto.id,

            produto:

                produto.nome || "",

            codigo:

                produto.codigo || "",

            quantidade:

                quantidade,

            unidade:

                unidade,

            qtdEtiquetas:

                qtdEtiquetas,

            dataProducao:

                dataProducao,

            validade:

                validade,

            temperatura:

                temperatura,

            responsavel:

                responsavel,

            status:

                status,

            lote:

                lote,

            usuarioId:

                usuario?.id || "",

            usuario:

                usuario?.nome || "",

            criadoEm:

                serverTimestamp()

        };


        // ---------------------------------------
        // PRIMEIRO: BAIXAR ESTOQUE
        // ---------------------------------------
        // Assim não cria produção se não houver
        // estoque suficiente.

        try {

    await baixarEstoque(
        idEmpresa,
        produto,
        quantidade,
        unidade,
        usuario
    );

} catch (error) {

    console.error(
        "ERRO NA BAIXA DE ESTOQUE:",
        error
    );

    alert(
        "Não foi possível baixar o estoque: " +
        (error.message || "permissão negada")
    );

    throw error;
}

        // ---------------------------------------
        // SALVAR PRODUÇÃO
        // ---------------------------------------
let producaoRef;

try {

    producaoRef =
        await addDoc(
            collection(
                db,
                "producoes"
            ),
            dados
        );

} catch (error) {

    console.error(
        "ERRO FIRESTORE AO SALVAR PRODUÇÃO:",
        error
    );

    console.error(
        "Dados da produção:",
        dados
    );

    throw error;
}


        // ---------------------------------------
        // AUDITORIA PRODUÇÃO
        // ---------------------------------------

        await addDoc(

            collection(
                db,
                "auditoria"
            ),

            {

                idEmpresa:

                    idEmpresa,

                usuario:

                    usuario?.nome ||
                    "Sistema",

                email:

                    usuario?.email ||
                    "",

                modulo:

                    "Produção",

                acao:

                    "NOVA PRODUÇÃO",

                detalhes:

                    `${produto.nome} - Quantidade: ${quantidade} ${unidade}`,

                status:

                    "Sucesso",

                data:

                    serverTimestamp()

            }

        );


        // ---------------------------------------
        // GERAR ETIQUETA
        // ---------------------------------------

        const codigoEtiqueta =
            "LOT-" +
            Date.now();


        await addDoc(

            collection(
                db,
                "etiquetas"
            ),

            {

                idEmpresa:

                    idEmpresa,

                codigoEtiqueta:

                    codigoEtiqueta,

                producaoId:

                    producaoRef.id,

                produtoId:

                    produto.id,

                produto:

                    produto.nome || "",

                codigo:

                    produto.codigo || "",

                quantidade:

                    quantidade,

                unidade:

                    unidade,

                qtdEtiquetas:

                    qtdEtiquetas,

                dataProducao:

                    dataProducao,

                validade:

                    validade,

                temperatura:

                    temperatura,

                responsavel:

                    responsavel,

                lote:

                    lote,

                status:

                    "ativa",

                criadoEm:

                    serverTimestamp()

            }

        );


        // ---------------------------------------
        // AUDITORIA ETIQUETA
        // ---------------------------------------

        await addDoc(

            collection(
                db,
                "auditoria"
            ),

            {

                idEmpresa:

                    idEmpresa,

                usuario:

                    usuario?.nome ||
                    "Sistema",

                email:

                    usuario?.email ||
                    "",

                modulo:

                    "Etiquetas",

                acao:

                    "ETIQUETA GERADA",

                detalhes:

                    `${produto.nome} - Código: ${codigoEtiqueta}`,

                status:

                    "Sucesso",

                data:

                    serverTimestamp()

            }

        );


        // ---------------------------------------
        // IMPRIMIR
        // ---------------------------------------

        if (
            imprimirDepoisDeSalvar
        ) {

            const url =
                `etiqueta.html?codigo=${encodeURIComponent(codigoEtiqueta)}&qtd=${qtdEtiquetas}`;


            window.open(
                url,
                "_blank"
            );


            imprimirDepoisDeSalvar =
                false;
        }


        alert(
            "Produção registrada com sucesso!"
        );


        // ---------------------------------------
        // LIMPAR FORMULÁRIO
        // ---------------------------------------

        formulario.reset();


        preencherDataAtual();


        gerarLote();


        const qtdCampo =
            obterElemento(
                "qtdEtiquetas"
            );


        if (qtdCampo) {

            qtdCampo.value =
                "1";
        }


        const responsavelCampo =
            obterElemento(
                "responsavelProducao"
            );


        if (responsavelCampo) {

            responsavelCampo.value =
                usuario?.nome ||
                "";
        }


        const temperaturaCampo =
            obterElemento(
                "temperaturaProducao"
            );


        if (temperaturaCampo) {

            temperaturaCampo.value =
                "";
        }


        const validadeCampo =
            obterElemento(
                "validadeProducao"
            );


        if (validadeCampo) {

            validadeCampo.value =
                "";
        }


        const unidadeCampo =
            obterElemento(
                "unidadeProducao"
            );


        if (unidadeCampo) {

            unidadeCampo.value =
                "";
        }


        // ---------------------------------------
        // ATUALIZAR TELA
        // ---------------------------------------

        await carregarProdutos();

        await carregarProducoes();


        console.log(
            "PRODUÇÃO SALVA COM SUCESSO:",
            producaoRef.id
        );


    } catch (error) {

        console.error(
            "ERRO AO SALVAR PRODUÇÃO:",
            error
        );


        alert(
            error.message ||
            "Erro ao registrar produção. Veja o Console."
        );
    }
}


// =======================================
// CARREGAR PRODUÇÕES
// SOMENTE EMPRESA ATUAL
// =======================================

async function carregarProducoes() {

    const lista =
        obterElemento(
            "listaProducoes"
        );


    if (!lista) {
        return;
    }


    try {

        const idEmpresa =
            empresaAtual();


        if (!idEmpresa) {
            return;
        }


        const consulta =
            query(

                collection(
                    db,
                    "producoes"
                ),

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


        if (
            snapshot.empty
        ) {

            lista.innerHTML = `

                <tr>

                    <td colspan="8">

                        Nenhuma produção registrada.

                    </td>

                </tr>

            `;

            return;
        }


        lista.innerHTML =
            "";


        snapshot.forEach(
            (item) => {

                const producao =
                    item.data();


                const tr =
                    document.createElement(
                        "tr"
                    );


                tr.innerHTML = `

                    <td>
                        ${escaparHTML(
                            producao.produto || "-"
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            producao.lote || "-"
                        )}
                    </td>

                    <td>
                        ${producao.quantidade || 0}
                        ${escaparHTML(
                            producao.unidade || ""
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            formatarData(
                                producao.dataProducao
                            )
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            formatarData(
                                producao.validade
                            )
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            producao.responsavel || "-"
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            producao.status || "-"
                        )}
                    </td>

                    <td>

                        <button
                            type="button"
                            class="btn-delete"
                            data-id="${item.id}">
                            🗑️
                        </button>

                    </td>

                `;


                const botao =
                    tr.querySelector(
                        ".btn-delete"
                    );


                if (botao) {

                    botao.addEventListener(
                        "click",
                        () => {

                            excluirProducao(
                                item.id
                            );

                        }
                    );
                }


                lista.appendChild(
                    tr
                );

            }
        );


        aplicarBusca();


    } catch (error) {

        console.error(
            "Erro ao carregar produções:",
            error
        );
    }
}


// =======================================
// FORMATAR DATA
// =======================================

function formatarData(data) {

    if (!data) {
        return "-";
    }


    if (
        typeof data === "object" &&
        data.seconds
    ) {

        return new Date(
            data.seconds * 1000
        ).toLocaleString(
            "pt-BR"
        );
    }


    if (
        typeof data === "string"
    ) {

        const dt =
            new Date(data);


        if (
            !isNaN(
                dt.getTime()
            )
        ) {

            return dt.toLocaleString(
                "pt-BR"
            );
        }
    }


    return String(data);
}


// =======================================
// EXCLUIR PRODUÇÃO
// =======================================

async function excluirProducao(id) {

    const confirmar =
        confirm(
            "Deseja excluir esta produção?"
        );


    if (!confirmar) {
        return;
    }


    try {

        const idEmpresa =
            empresaAtual();


        if (!idEmpresa) {
            return;
        }


        const referencia =
            doc(
                db,
                "producoes",
                id
            );


        const documento =
            await getDocs(

                query(

                    collection(
                        db,
                        "producoes"
                    ),

                    where(
                        "idEmpresa",
                        "==",
                        idEmpresa
                    )

                )

            );


        const pertence =
            documento.docs.some(
                item =>
                    item.id === id
            );


        if (!pertence) {

            alert(
                "Esta produção não pertence à empresa atual."
            );

            return;
        }


        await deleteDoc(
            referencia
        );


        alert(
            "Produção excluída!"
        );


        await carregarProducoes();


    } catch (error) {

        console.error(
            "Erro ao excluir produção:",
            error
        );


        alert(
            "Erro ao excluir produção."
        );
    }
}


// =======================================
// BUSCA
// =======================================

function aplicarBusca() {

    const campo =
        obterElemento(
            "buscarProducao"
        );


    if (!campo) {
        return;
    }


    campo.oninput =
        function () {

            const termo =
                this.value
                    .trim()
                    .toLowerCase();


            document
                .querySelectorAll(
                    "#listaProducoes tr"
                )
                .forEach(
                    (linha) => {

                        const texto =
                            linha.innerText
                                .toLowerCase();


                        linha.style.display =
                            texto.includes(
                                termo
                            )
                                ? ""
                                : "none";

                    }
                );
        };
}


// =======================================
// INICIALIZAÇÃO
// =======================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "======================================="
        );

        console.log(
            "INICIANDO LOTRIX PRODUÇÃO V6"
        );


        // ---------------------------------------
        // EMPRESA
        // ---------------------------------------

        if (
            !verificarEmpresa()
        ) {

            return;
        }


        // ---------------------------------------
        // DATA
        // ---------------------------------------

        preencherDataAtual();


        // ---------------------------------------
        // LOTE
        // ---------------------------------------

        gerarLote();


        // ---------------------------------------
        // PRODUTOS
        // ---------------------------------------

        await carregarProdutos();


        // ---------------------------------------
        // PRODUÇÕES
        // ---------------------------------------

        await carregarProducoes();


        // ---------------------------------------
        // FORMULÁRIO
        // ---------------------------------------

        const formulario =
            obterElemento(
                "producaoForm"
            );


        if (formulario) {

            formulario.addEventListener(
                "submit",
                async (evento) => {

                    evento.preventDefault();


                    imprimirDepoisDeSalvar =
                        false;


                    await salvarProducao();

                }
            );
        }


        // ---------------------------------------
        // SALVAR + IMPRIMIR
        // ---------------------------------------

        const botao =
            obterElemento(
                "btnSalvarImprimir"
            );


        if (botao) {

            botao.addEventListener(
                "click",
                async () => {

                    imprimirDepoisDeSalvar =
                        true;


                    const formularioAtual =
                        obterElemento(
                            "producaoForm"
                        );


                    if (
                        formularioAtual
                    ) {

                        formularioAtual.requestSubmit();

                    }

                }
            );
        }


        // ---------------------------------------
        // PRODUTO ALTERADO
        // ---------------------------------------

        const select =
            obterElemento(
                "produtoSelect"
            );


        if (select) {

            select.addEventListener(
                "change",
                () => {

                    atualizarInformacoesProduto();

                }
            );
        }


        // ---------------------------------------
        // DATA ALTERADA
        // ---------------------------------------

        const campoData =
            obterElemento(
                "dataProducao"
            );


        if (campoData) {

            campoData.addEventListener(
                "change",
                () => {

                    const produto =
                        produtoSelecionado();


                    if (produto) {

                        calcularValidade(
                            produto.validadeDias || 0
                        );

                    }

                }
            );
        }


        console.log(
            "PÁGINA DE PRODUÇÃO V6 PRONTA."
        );

        console.log(
            "EMPRESA:",
            empresaAtual()
        );

        console.log(
            "======================================="
        );

    }
);


// =======================================
// EXCLUSÃO GLOBAL
// =======================================

window.excluirProducao =
    excluirProducao;