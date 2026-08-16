// =======================================
// LOTRIX
// ESTOQUE - FIRESTORE - MULTIEMPRESA
// =======================================

console.log("=======================================");
console.log("LOTRIX - ESTOQUE MULTIEMPRESA CARREGANDO...");
console.log("=======================================");

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

let usuarioLogado = null;
let idEmpresa = "";

let produtos = [];
let estoqueAtual = [];

// =======================================
// ELEMENTOS
// =======================================

let estoqueForm = null;
let produtoSelect = null;
let listaEstoque = null;
let quantidadeInput = null;
let minimoInput = null;
let maximoInput = null;

let movimentacaoForm = null;
let produtoMovimentacao = null;
let tipoMovimentacao = null;
let quantidadeMovimentacao = null;
let motivoMovimentacao = null;
let listaMovimentacoes = null;

// =======================================
// OBTER EMPRESA ATUAL
// =======================================

function obterIdEmpresaAtual() {

    // ===================================
    // PRIMEIRA OPÇÃO
    // auth.js
    // ===================================

    if (
        typeof window.obterIdEmpresa === "function"
    ) {

        const empresa =
            window.obterIdEmpresa();

        if (empresa) {

            return String(empresa);

        }

    }

    // ===================================
    // SEGUNDA OPÇÃO
    // localStorage
    // ===================================

    const empresaLocal =
        localStorage.getItem("idEmpresa");

    if (empresaLocal) {

        return String(empresaLocal);

    }

    // ===================================
    // TERCEIRA OPÇÃO
    // USUÁRIO SALVO
    // ===================================

    const chaves = [
        "usuarioLotrix",
        "usuarioFoodSync"
    ];

    for (const chave of chaves) {

        try {

            const dados =
                localStorage.getItem(chave);

            if (!dados) {
                continue;
            }

            const usuario =
                JSON.parse(dados);

            const empresa =
                usuario?.idEmpresa ||
                usuario?.empresaId ||
                usuario?.empresa ||
                "";

            if (empresa) {

                return String(empresa);

            }

        }
        catch (erro) {

            console.error(
                "Erro lendo usuário:",
                erro
            );

        }

    }

    return "";

}

// =======================================
// OBTER USUÁRIO
// =======================================

function obterUsuarioAtual() {

    const chaves = [
        "usuarioLotrix",
        "usuarioFoodSync"
    ];

    for (const chave of chaves) {

        try {

            const dados =
                localStorage.getItem(chave);

            if (!dados) {
                continue;
            }

            const usuario =
                JSON.parse(dados);

            if (usuario) {

                return usuario;

            }

        }
        catch (erro) {

            console.error(
                "Erro lendo usuário:",
                erro
            );

        }

    }

    return null;

}

// =======================================
// VALIDAR EMPRESA
// =======================================

function empresaValida() {

    idEmpresa =
        obterIdEmpresaAtual();

    if (!idEmpresa) {

        console.error(
            "ESTOQUE: empresa não encontrada."
        );

        return false;

    }

    console.log(
        "ESTOQUE - EMPRESA ATUAL:",
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
// INICIALIZAR ELEMENTOS
// =======================================

function iniciarElementos() {

    estoqueForm =
        document.getElementById(
            "estoqueForm"
        );

    produtoSelect =
        document.getElementById(
            "produtoEstoque"
        );

    listaEstoque =
        document.getElementById(
            "listaEstoque"
        );

    quantidadeInput =
        document.getElementById(
            "quantidadeEstoque"
        );

    minimoInput =
        document.getElementById(
            "estoqueMinimo"
        );

    maximoInput =
        document.getElementById(
            "estoqueMaximo"
        );

    movimentacaoForm =
        document.getElementById(
            "movimentacaoForm"
        );

    produtoMovimentacao =
        document.getElementById(
            "produtoMovimentacao"
        );

    tipoMovimentacao =
        document.getElementById(
            "tipoMovimentacao"
        );

    quantidadeMovimentacao =
        document.getElementById(
            "quantidadeMovimentacao"
        );

    motivoMovimentacao =
        document.getElementById(
            "motivoMovimentacao"
        );

    listaMovimentacoes =
        document.getElementById(
            "listaMovimentacoes"
        );

    console.log(
        "ELEMENTOS ESTOQUE:",
        {
            estoqueForm: !!estoqueForm,
            produtoSelect: !!produtoSelect,
            listaEstoque: !!listaEstoque,
            quantidadeInput: !!quantidadeInput,
            minimoInput: !!minimoInput,
            maximoInput: !!maximoInput,
            movimentacaoForm: !!movimentacaoForm,
            produtoMovimentacao: !!produtoMovimentacao,
            tipoMovimentacao: !!tipoMovimentacao,
            quantidadeMovimentacao: !!quantidadeMovimentacao,
            motivoMovimentacao: !!motivoMovimentacao,
            listaMovimentacoes: !!listaMovimentacoes
        }
    );

}

// =======================================
// PRODUTO PERTENCE À EMPRESA
// =======================================

function produtoPertenceEmpresa(dados) {

    if (!dados) {
        return false;
    }

    // Formato principal
    if (
        String(dados.idEmpresa || "") ===
        String(idEmpresa)
    ) {

        return true;

    }

    // Outro formato
    if (
        String(dados.empresaId || "") ===
        String(idEmpresa)
    ) {

        return true;

    }

    // Array de empresas
    if (
        Array.isArray(dados.empresas) &&
        dados.empresas.some(
            empresa =>
                String(empresa) ===
                String(idEmpresa)
        )
    ) {

        return true;

    }

    return false;

}

// =======================================
// CARREGAR PRODUTOS
// =======================================

async function carregarProdutos() {

    if (!empresaValida()) {
        return;
    }

    if (!produtoSelect) {
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

        const snapshot =
            await getDocs(
                consulta
            );

        produtos = [];

        snapshot.forEach(
            documento => {

                const dados =
                    documento.data();

                if (
                    !produtoPertenceEmpresa(
                        dados
                    )
                ) {

                    return;

                }

                const produto = {

                    id:
                        documento.id,

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

                if (
                    produtoMovimentacao
                ) {

                    const optionMov =
                        document.createElement(
                            "option"
                        );

                    optionMov.value =
                        produto.id;

                    optionMov.textContent =
                        produto.nome ||
                        "Produto sem nome";

                    produtoMovimentacao.appendChild(
                        optionMov
                    );

                }

            }
        );

        console.log(
            "ESTOQUE - PRODUTOS DA EMPRESA:",
            idEmpresa,
            produtos.length
        );

    }
    catch (erro) {

        console.error(
            "ERRO AO CARREGAR PRODUTOS:",
            erro
        );

    }

}

// =======================================
// CARREGAR ESTOQUE
// =======================================

async function carregarEstoque() {

    if (!empresaValida()) {
        return;
    }

    if (!listaEstoque) {
        return;
    }

    listaEstoque.innerHTML = `
        <tr>
            <td colspan="7"
                style="text-align:center;padding:20px;">
                Carregando estoque...
            </td>
        </tr>
    `;

    try {

        const consulta =
            query(
                collection(
                    db,
                    "estoque"
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

        estoqueAtual = [];

        snapshot.forEach(
            documento => {

                const dados =
                    documento.data();

                if (
                    String(
                        dados.idEmpresa || ""
                    ) !==
                    String(idEmpresa)
                ) {

                    return;

                }

                estoqueAtual.push({

                    id:
                        documento.id,

                    ...dados

                });

            }
        );

        console.log(
            "ESTOQUE DA EMPRESA:",
            idEmpresa
        );

        console.log(
            "TOTAL ESTOQUE:",
            estoqueAtual.length
        );

        renderizarEstoque();

    }
    catch (erro) {

        console.error(
            "ERRO AO CARREGAR ESTOQUE:",
            erro
        );

        listaEstoque.innerHTML = `
            <tr>
                <td colspan="7"
                    style="text-align:center;padding:20px;color:red;">
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
            <span style="color:#dc2626;font-weight:bold;">
                🔴 Crítico
            </span>
        `;

    }

    if (
        quantidade <=
        minimo + 5
    ) {

        return `
            <span style="color:#ca8a04;font-weight:bold;">
                🟡 Atenção
            </span>
        `;

    }

    return `
        <span style="color:#16a34a;font-weight:bold;">
            🟢 Normal
        </span>
    `;

}

// =======================================
// RENDERIZAR ESTOQUE
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
                <td colspan="7"
                    style="text-align:center;padding:20px;">
                    Nenhum item cadastrado.
                </td>
            </tr>
        `;

        return;

    }

    estoqueAtual.forEach(
        item => {

            const tr =
                document.createElement(
                    "tr"
                );

            tr.innerHTML = `

                <td>
                    ${escaparHTML(
                        item.produto || "-"
                    )}
                </td>

                <td>
                    ${item.quantidade ?? 0}
                </td>

                <td>
                    ${escaparHTML(
                        item.unidade || "UN"
                    )}
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

                <td></td>

            `;

            const botao =
                document.createElement(
                    "button"
                );

            botao.type =
                "button";

            botao.className =
                "btn-danger";

            botao.textContent =
                "🗑️";

            botao.addEventListener(
                "click",
                () => {

                    excluirEstoque(
                        item.id
                    );

                }
            );

            tr.lastElementChild.appendChild(
                botao
            );

            listaEstoque.appendChild(
                tr
            );

        }
    );

}

// =======================================
// SALVAR ESTOQUE
// =======================================

async function salvarEstoque(evento) {

    evento.preventDefault();

    if (!empresaValida()) {
        return;
    }

    const produtoId =
        produtoSelect?.value;

    if (!produtoId) {

        alert(
            "Selecione um produto."
        );

        return;

    }

    const produto =
        produtos.find(
            item =>
                item.id ===
                produtoId
        );

    if (!produto) {

        alert(
            "Produto não encontrado."
        );

        return;

    }

    const quantidade =
        Number(
            quantidadeInput?.value || 0
        );

    const minimo =
        Number(
            minimoInput?.value || 0
        );

    const maximo =
        Number(
            maximoInput?.value || 0
        );

    if (
        quantidade < 0 ||
        minimo < 0 ||
        maximo < 0
    ) {

        alert(
            "Os valores não podem ser negativos."
        );

        return;

    }

    const existente =
        estoqueAtual.find(
            item =>

                String(
                    item.produtoId || ""
                ) ===
                String(produtoId)

                &&

                String(
                    item.idEmpresa || ""
                ) ===
                String(idEmpresa)
        );

    const dados = {

        idEmpresa:
            idEmpresa,

        produtoId:
            produto.id,

        produto:
            produto.nome || "",

        quantidade:
            quantidade,

        minimo:
            minimo,

        maximo:
            maximo,

        unidade:
            produto.unidade ||
            "UN",

        usuario:
            usuarioLogado?.nome ||
            "Sistema",

        atualizadoEm:
            serverTimestamp()

    };

    try {

        if (existente) {

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

        if (estoqueForm) {
            estoqueForm.reset();
        }

        await carregarEstoque();

    }
    catch (erro) {

        console.error(
            "ERRO AO SALVAR ESTOQUE:",
            erro
        );

        alert(
            "Erro ao salvar estoque."
        );

    }

}

// =======================================
// EXCLUIR ESTOQUE
// =======================================

async function excluirEstoque(id) {

    if (!empresaValida()) {
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

    if (
        String(
            estoque.idEmpresa || ""
        ) !==
        String(idEmpresa)
    ) {

        alert(
            "Este estoque não pertence à empresa atual."
        );

        return;

    }

    if (
        !confirm(
            "Deseja excluir este item?"
        )
    ) {

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

        alert(
            "Item excluído com sucesso!"
        );

        await carregarEstoque();

    }
    catch (erro) {

        console.error(
            "ERRO AO EXCLUIR ESTOQUE:",
            erro
        );

        alert(
            "Erro ao excluir estoque."
        );

    }

}

// =======================================
// REGISTRAR MOVIMENTAÇÃO
// =======================================

async function registrarMovimentacao(evento) {

    evento.preventDefault();

    if (!empresaValida()) {
        return;
    }

    const produtoId =
        produtoMovimentacao?.value;

    if (!produtoId) {

        alert(
            "Selecione um produto."
        );

        return;

    }

    const produto =
        produtos.find(
            item =>
                item.id ===
                produtoId
        );

    if (!produto) {

        alert(
            "Produto não encontrado."
        );

        return;

    }

    const tipo =
        tipoMovimentacao?.value;

    if (
        tipo !== "ENTRADA" &&
        tipo !== "SAIDA"
    ) {

        alert(
            "Selecione o tipo de movimentação."
        );

        return;

    }

    const quantidade =
        Number(
            quantidadeMovimentacao?.value || 0
        );

    if (
        quantidade <= 0
    ) {

        alert(
            "Informe uma quantidade válida."
        );

        return;

    }

    const motivo =
        motivoMovimentacao?.value?.trim() ||
        "-";

    const estoque =
        estoqueAtual.find(
            item =>

                String(
                    item.produtoId || ""
                ) ===
                String(produtoId)

                &&

                String(
                    item.idEmpresa || ""
                ) ===
                String(idEmpresa)
        );

    if (!estoque) {

        alert(
            "Este produto ainda não possui estoque cadastrado para esta empresa."
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
                    tipo,

                quantidade:
                    quantidade,

                unidade:
                    produto.unidade ||
                    "UN",

                motivo:
                    motivo,

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

        if (movimentacaoForm) {
            movimentacaoForm.reset();
        }

        await carregarEstoque();

        await carregarMovimentacoes();

    }
    catch (erro) {

        console.error(
            "ERRO NA MOVIMENTAÇÃO:",
            erro
        );

        alert(
            "Erro ao registrar movimentação."
        );

    }

}

// =======================================
// CARREGAR MOVIMENTAÇÕES
// =======================================

async function carregarMovimentacoes() {

    if (!empresaValida()) {
        return;
    }

    if (!listaMovimentacoes) {
        return;
    }

    listaMovimentacoes.innerHTML = `
        <tr>
            <td colspan="6"
                style="text-align:center;padding:20px;">
                Carregando movimentações...
            </td>
        </tr>
    `;

    try {

        const consulta =
            query(

                collection(
                    db,
                    "movimentacoes"
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

        listaMovimentacoes.innerHTML =
            "";

        let total = 0;

        snapshot.forEach(
            documento => {

                const mov =
                    documento.data();

                total++;

                let data = "-";

                if (
                    mov.data &&
                    typeof mov.data.toDate ===
                    "function"
                ) {

                    data =
                        mov.data
                            .toDate()
                            .toLocaleDateString(
                                "pt-BR"
                            );

                }

                const tr =
                    document.createElement(
                        "tr"
                    );

                tr.innerHTML = `

                    <td>
                        ${escaparHTML(data)}
                    </td>

                    <td>
                        ${escaparHTML(
                            mov.produto || "-"
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            mov.tipo || "-"
                        )}
                    </td>

                    <td>
                        ${Number(
                            mov.quantidade || 0
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            mov.unidade || "UN"
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            mov.motivo || "-"
                        )}
                    </td>

                `;

                listaMovimentacoes.appendChild(
                    tr
                );

            }
        );

        if (total === 0) {

            listaMovimentacoes.innerHTML = `
                <tr>
                    <td colspan="6"
                        style="text-align:center;padding:20px;">
                        Nenhuma movimentação.
                    </td>
                </tr>
            `;

        }

        console.log(
            "MOVIMENTAÇÕES:",
            idEmpresa,
            total
        );

    }
    catch (erro) {

        console.error(
            "ERRO AO CARREGAR MOVIMENTAÇÕES:",
            erro
        );

        listaMovimentacoes.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center;padding:20px;color:red;">
                    Erro ao carregar movimentações.
                </td>
            </tr>
        `;

    }

}

// =======================================
// EVENTOS
// =======================================

function configurarEventos() {

    if (estoqueForm) {

        estoqueForm.addEventListener(
            "submit",
            salvarEstoque
        );

    }

    if (movimentacaoForm) {

        movimentacaoForm.addEventListener(
            "submit",
            registrarMovimentacao
        );

    }

}

// =======================================
// INICIAR
// =======================================

async function iniciarEstoque() {

    console.log(
        "======================================="
    );

    console.log(
        "INICIANDO ESTOQUE LOTRIX"
    );

    // Usuário
    usuarioLogado =
        obterUsuarioAtual();

    // Empresa pelo auth.js
    idEmpresa =
        obterIdEmpresaAtual();

    console.log(
        "USUÁRIO:",
        usuarioLogado
    );

    console.log(
        "EMPRESA:",
        idEmpresa
    );

    if (!empresaValida()) {
        return;
    }

    iniciarElementos();

    configurarEventos();

    await carregarProdutos();

    await carregarEstoque();

    await carregarMovimentacoes();

    console.log(
        "ESTOQUE LOTRIX INICIADO"
    );

    console.log(
        "EMPRESA ATUAL:",
        idEmpresa
    );

}

// =======================================
// INICIALIZAÇÃO
// =======================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarEstoque,
        {
            once: true
        }
    );

}
else {

    iniciarEstoque();

}

// =======================================
// FUNÇÃO GLOBAL
// =======================================

window.excluirEstoque =
    excluirEstoque;

// =======================================
// ERRO GLOBAL
// =======================================

window.addEventListener(
    "error",
    evento => {

        console.error(
            "ERRO GLOBAL:",
            evento.message
        );

    }
);
