// =======================================
// LOTRIX - ETIQUETAS V14
// FIRESTORE + MULTIEMPRESA ISOLADO
//
// COMPATÍVEL COM etiquetas.html
//
// ETIQUETAS INDEPENDENTES
// NÃO PASSA POR PRODUÇÃO
// NÃO PASSA POR ESTOQUE
// NÃO BAIXA ESTOQUE
// NÃO CRIA MOVIMENTAÇÃO
//
// IMPRESSÃO RAW ZPL - ZD220
// LOTRIX PRINTER SERVICE
//
// V14
// AJUSTE DE LAYOUT DA ETIQUETA
// =======================================

console.log("=======================================");
console.log("LOTRIX ETIQUETAS V14 CARREGADO");
console.log("Firestore: MULTIEMPRESA ISOLADO");
console.log("Etiquetas: INDEPENDENTES");
console.log("Produção: NÃO UTILIZADA");
console.log("Estoque: NÃO UTILIZADO");
console.log("Movimentações: NÃO UTILIZADAS");
console.log("Impressão: ZPL RAW");
console.log("Printer Service: HTTPS 192.168.0.109:9100");
console.log("Layout: PADRÃO DEFINITIVO");
console.log("=======================================");

// =======================================
// FIREBASE
// =======================================

import { db } from "./firebase.js";

import {
    collection,
getDocs,
getDoc,
addDoc,
setDoc,
deleteDoc,
doc,
query,
where,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =======================================
// CONFIGURAÇÃO DA IMPRESSORA
// =======================================

const PRINTER_SERVICE_URL =
    "https://192.168.0.109:9100/print";

// =======================================
// VARIÁVEIS
// =======================================

let produtos = [];

let etiquetas = [];

let empresaAtualDados = null;

let imprimirDepoisDeSalvar = false;

let ultimaEtiquetaGerada = null;

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
            localStorage.getItem(
                "usuarioFoodSync"
            );

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
// LIMPAR TEXTO PARA ZPL
// =======================================

function limparZPL(valor) {

    return String(valor ?? "")
        .replace(/[\r\n]+/g, " ")
        .replace(/\^/g, "")
        .replace(/~/g, "")
        .trim();

}

// =======================================
// PRODUTO PERTENCE À EMPRESA
// =======================================

function produtoPertenceEmpresa(
    produto,
    idEmpresa
) {

    if (!produto) {

        return false;

    }

    if (
        produto.idEmpresa ===
        idEmpresa
    ) {

        return true;

    }

    if (
        Array.isArray(
            produto.empresas
        ) &&
        produto.empresas.includes(
            idEmpresa
        )
    ) {

        return true;

    }

    return false;

}

// =======================================
// FORMATAR CNPJ
// =======================================

function formatarCNPJ(cnpj) {

    const numeros =
        String(
            cnpj || ""
        ).replace(
            /\D/g,
            ""
        );

    if (
        numeros.length !== 14
    ) {

        return cnpj || "";

    }

    return numeros.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        "$1.$2.$3/$4-$5"
    );

}

// =======================================
// GERAR CÓDIGO DA ETIQUETA
// =======================================

function gerarCodigoEtiqueta() {

    return (
        "LOT-" +
        Date.now()
    );

}

// =======================================
// GERAR URL DO QR CODE
//
// CORREÇÃO V14:
// Esta função fica fora de salvarEtiqueta()
// para poder ser utilizada pela prévia,
// gerarZPL() e demais funções.
// =======================================

function gerarURLConsultaEtiqueta(
    codigoEtiqueta
) {

    const codigo =
        limparZPL(
            codigoEtiqueta || ""
        );

    if (!codigo) {

        return "";

    }

    return (
        "https://foodsync-43a7e.web.app/consulta.html?codigo=" +
        encodeURIComponent(
            codigo
        )
    );

}

// =======================================
// CARREGAR DADOS DA EMPRESA
// =======================================

async function carregarDadosEmpresa() {

    const idEmpresa =
        empresaAtual();

    if (!idEmpresa) {

        throw new Error(
            "Empresa não identificada."
        );

    }

    try {

        const referencia =
            doc(
                db,
                "empresas",
                idEmpresa
            );

        const snapshot =
            await getDoc(
                referencia
            );

        if (!snapshot.exists()) {

            console.warn(
                "Documento da empresa não encontrado:",
                idEmpresa
            );

            empresaAtualDados = {

                id:
                    idEmpresa,

                idEmpresa:
                    idEmpresa,

                nomeFantasia:
                    idEmpresa,

                nome:
                    idEmpresa

            };

            atualizarInformacoesEmpresa();

            return empresaAtualDados;

        }

        const dados =
            snapshot.data();

        empresaAtualDados = {

            id:
                idEmpresa,

            idEmpresa:
                idEmpresa,

            ...dados

        };

        console.log("=======================================");
        console.log("EMPRESA ATUAL:");
        console.log("ID:", idEmpresa);

        console.log(
            "NOME:",
            dados.nomeFantasia ||
            dados.nome ||
            "-"
        );

        console.log(
            "DADOS:",
            empresaAtualDados
        );

        console.log("=======================================");

        atualizarInformacoesEmpresa();

        return empresaAtualDados;

    } catch (error) {

        console.error(
            "Erro ao carregar empresa:",
            error
        );

        throw error;

    }

}

// =======================================
// ATUALIZAR EMPRESA NA PRÉVIA
// =======================================

function atualizarInformacoesEmpresa() {

    if (!empresaAtualDados) {

        return;

    }

    const nome =
        empresaAtualDados.nomeFantasia ||
        empresaAtualDados.nome ||
        "EMPRESA";

    const razao =
        empresaAtualDados.razaoSocial ||
        empresaAtualDados.razao ||
        "--";

    const cnpj =
        limparZPL(
            formatarCNPJ(
                empresaAtualDados.cnpj || ""
            )
        );

    const endereco =
        empresaAtualDados.endereco ||
        "--";

    const nomeEmpresa =
        obterElemento(
            "nomeEmpresaEtiqueta"
        );

    if (nomeEmpresa) {

        nomeEmpresa.textContent =
            nome;

    }

    const razaoElemento =
        obterElemento(
            "razaoSocialEmpresaEtiqueta"
        );

    if (razaoElemento) {

        razaoElemento.textContent =
            razao;

    }

    const cnpjElemento =
        obterElemento(
            "cnpjEmpresaEtiqueta"
        );

    if (cnpjElemento) {

        cnpjElemento.textContent =
            cnpj;

    }

    const enderecoElemento =
        obterElemento(
            "enderecoEmpresaEtiqueta"
        );

    if (enderecoElemento) {

        enderecoElemento.textContent =
            endereco;

    }

}

// =======================================
// CARREGAR PRODUTOS
// SOMENTE EMPRESA LOGADA
//
// NÃO CONSULTA ESTOQUE
// NÃO CONSULTA PRODUÇÃO
// =======================================

async function carregarProdutos() {

    const produtoSelect =
        obterElemento(
            "produtoEtiqueta"
        );

    if (!produtoSelect) {

        console.error(
            "Elemento #produtoEtiqueta não encontrado."
        );

        return;

    }

    const idEmpresa =
        empresaAtual();

    if (!idEmpresa) {

        console.error(
            "Empresa não identificada."
        );

        return;

    }

    try {

        console.log("=======================================");
        console.log("CARREGANDO PRODUTOS");
        console.log(
            "EMPRESA:",
            idEmpresa
        );
        console.log("=======================================");

        produtos = [];

        produtoSelect.innerHTML =
            '<option value="">Selecione o produto</option>';

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

        snapshot.forEach(
            item => {

                const dados =
                    item.data();

                if (
                    !produtoPertenceEmpresa(
                        dados,
                        idEmpresa
                    )
                ) {

                    return;

                }

                produtos.push({

                    id:
                        item.id,

                    ...dados

                });

            }
        );

        produtos.sort(
            (a, b) =>
                String(
                    a.nome || ""
                ).localeCompare(
                    String(
                        b.nome || ""
                    ),
                    "pt-BR"
                )
        );

        produtos.forEach(
            produto => {

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
            "PRODUTOS DA EMPRESA:",
            idEmpresa
        );

        console.log(
            "TOTAL:",
            produtos.length
        );

        console.log(
            "PRODUTOS:",
            produtos
        );

    } catch (error) {

        console.error(
            "ERRO AO CARREGAR PRODUTOS:",
            error
        );

        alert(
            "Erro ao carregar os produtos da empresa."
        );

        throw error;

    }

}

// =======================================
// PRODUTO SELECIONADO
// =======================================

function produtoSelecionado() {

    const select =
        obterElemento(
            "produtoEtiqueta"
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
// ATUALIZAR PRÉVIA DO PRODUTO
// =======================================

function atualizarInformacoesProduto() {

    const produto =
        produtoSelecionado();

    const nomeEtiqueta =
        obterElemento(
            "nomeEtiqueta"
        );

    const temperaturaEtiqueta =
        obterElemento(
            "temperaturaEtiqueta"
        );

    if (!produto) {

        if (nomeEtiqueta) {

            nomeEtiqueta.textContent =
                "PRODUTO";

        }

        if (temperaturaEtiqueta) {

            temperaturaEtiqueta.textContent =
                "--";

        }

        calcularValidadeProduto();

        return;

    }

    if (nomeEtiqueta) {

        nomeEtiqueta.textContent =
            produto.nome ||
            "PRODUTO";

    }

    if (temperaturaEtiqueta) {

        temperaturaEtiqueta.textContent =
            produto.temperatura ||
            "AMBIENTE";

    }

    calcularValidadeProduto();

}

// =======================================
// FORMATAR DATA PARA INPUT DATE
// yyyy-MM-dd
// =======================================

function formatarDataInputDate(data) {

    if (!data) {

        return "";

    }

    const dataObj =
        data instanceof Date
            ? data
            : new Date(data);

    if (
        isNaN(
            dataObj.getTime()
        )
    ) {

        return "";

    }

    const ano =
        dataObj.getFullYear();

    const mes =
        String(
            dataObj.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const dia =
        String(
            dataObj.getDate()
        ).padStart(
            2,
            "0"
        );

    return (
        `${ano}-${mes}-${dia}`
    );

}

// =======================================
// FORMATAR DATA PARA EXIBIÇÃO
// =======================================

function formatarDataEtiqueta(valor) {

    if (!valor) {

        return "-";

    }

    let data;

    if (
        typeof valor === "string"
    ) {

        if (
            /^\d{4}-\d{2}-\d{2}$/.test(
                valor
            )
        ) {

            const partes =
                valor.split("-");

            data =
                new Date(
                    Number(partes[0]),
                    Number(partes[1]) - 1,
                    Number(partes[2])
                );

        } else {

            data =
                new Date(valor);

        }

    } else if (
        typeof valor === "object" &&
        valor.seconds
    ) {

        data =
            new Date(
                valor.seconds * 1000
            );

    } else {

        data =
            new Date(valor);

    }

    if (
        isNaN(
            data.getTime()
        )
    ) {

        return String(valor);

    }

    return data.toLocaleDateString(
        "pt-BR"
    );

}

// =======================================
// PREENCHER DATA ATUAL
// =======================================

function preencherDataAtual() {

    const campo =
        obterElemento(
            "dataProducao"
        );

    if (!campo) {

        console.warn(
            "Campo #dataProducao não encontrado."
        );

        return;

    }

    if (!campo.value) {

        campo.value =
            formatarDataInputDate(
                new Date()
            );

    }

    calcularValidadeProduto();

    atualizarPreviaDatas();

}

// =======================================
// CALCULAR VALIDADE
// =======================================

function calcularValidadeProduto() {

    const produto =
        produtoSelecionado();

    const campoData =
        obterElemento(
            "dataProducao"
        );

    if (
        !produto ||
        !campoData ||
        !campoData.value
    ) {

        const validade =
            obterElemento(
                "validadeEtiqueta"
            );

        if (validade) {

            validade.textContent =
                "--";

        }

        return "";

    }

    const dias =
        Number(
            produto.validadeDias ||
            0
        );

    const data =
        new Date(
            `${campoData.value}T00:00:00`
        );

    if (
        isNaN(
            data.getTime()
        )
    ) {

        return "";

    }

    data.setDate(
        data.getDate() +
        dias
    );

    const validade =
        formatarDataInputDate(
            data
        );

    const validadeElemento =
        obterElemento(
            "validadeEtiqueta"
        );

    if (validadeElemento) {

        validadeElemento.textContent =
            formatarDataEtiqueta(
                validade
            );

    }

    return validade;

}

// =======================================
// ATUALIZAR DATAS DA PRÉVIA
// =======================================

function atualizarPreviaDatas() {

    const campoData =
        obterElemento(
            "dataProducao"
        );

    const dataElemento =
        obterElemento(
            "dataEtiqueta"
        );

    if (dataElemento) {

        dataElemento.textContent =
            campoData?.value
                ? formatarDataEtiqueta(
                    campoData.value
                )
                : "--";

    }

    calcularValidadeProduto();

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
        ).padStart(
            2,
            "0"
        ) +
        String(
            agora.getDate()
        ).padStart(
            2,
            "0"
        ) +
        "-" +
        String(
            Date.now()
        ).slice(
            -5
        );

    const loteElemento =
        obterElemento(
            "loteEtiqueta"
        );

    if (loteElemento) {

        loteElemento.textContent =
            lote;

    }

    return lote;

}

// =======================================
// ATUALIZAR RESPONSÁVEL NA PRÉVIA
// =======================================

function atualizarResponsavelPrevia() {

    const usuario =
        usuarioAtual();

    const elemento =
        obterElemento(
            "responsavelEtiqueta"
        );

    if (!elemento) {

        return;

    }

    elemento.textContent =
        usuario?.nome ||
        "Não informado";

}

// =======================================
// ATUALIZAR TEMPERATURA NA PRÉVIA
// =======================================

function atualizarTemperaturaPrevia() {

    const produto =
        produtoSelecionado();

    const elemento =
        obterElemento(
            "temperaturaEtiqueta"
        );

    if (!elemento) {

        return;

    }

    elemento.textContent =
        produto?.temperatura ||
        "AMBIENTE";

}

// =======================================
// ATUALIZAR PRÉVIA COMPLETA
// =======================================

function atualizarPrevia() {

    const produto =
        produtoSelecionado();

    const nomeElemento =
        obterElemento(
            "nomeEtiqueta"
        );

    if (nomeElemento) {

        nomeElemento.textContent =
            produto?.nome ||
            "PRODUTO";

    }

    atualizarTemperaturaPrevia();

    atualizarPreviaDatas();

    atualizarResponsavelPrevia();

    const lote =
        gerarLote();

    const qrElemento =
        obterElemento(
            "qrcodeEtiqueta"
        );

    if (qrElemento) {

        qrElemento.innerHTML =
            "";

        if (produto) {

            const codigoPreview =
                gerarCodigoEtiqueta();

            const urlConsulta =
                gerarURLConsultaEtiqueta(
                    codigoPreview
                );

            if (
                typeof QRCode !==
                "undefined"
            ) {

                new QRCode(
                    qrElemento,
                    {

                        text:
                            urlConsulta,

                        width:
                            90,

                        height:
                            90

                    }
                );

            }

        }

    }

    return lote;

}
// =======================================
// GERAR ZPL - ETIQUETA OFICIAL LOTRIX
//
// PADRÃO DEFINITIVO
//
// 480 x 480 DOTS
// 60mm x 60mm
// ZD220 - 203 DPI
//
// ESTRUTURA OFICIAL:
// PRODUTO
// TEMPERATURA
// PRODUZIDO
// VALIDADE
// RESPONSÁVEL
// EMPRESA
// CNPJ
// ENDEREÇO
// LOTE
// QR CODE
// =======================================

function gerarZPL(
    produto,
    lote,
    dataProducao,
    validade,
    temperatura,
    responsavel,
    codigoEtiqueta
) {

    // ===================================
    // DADOS DO PRODUTO
    // ===================================

    const nome =
        limparZPL(
            produto?.nome ||
            "PRODUTO"
        );

    const temp =
        limparZPL(
            temperatura ||
            produto?.temperatura ||
            "AMBIENTE"
        );

    // ===================================
    // DADOS DA EMPRESA
    // ===================================

    const empresa =
        empresaAtualDados || {};

    const nomeEmpresa =
        limparZPL(
            empresa.nomeFantasia ||
            empresa.nome ||
            "EMPRESA"
        );

    const cnpj =
        limparZPL(
            formatarCNPJ(
                empresa.cnpj ||
                ""
            )
        );

    const endereco =
        limparZPL(
            empresa.endereco ||
            ""
        );

    // ===================================
    // DADOS DA ETIQUETA
    // ===================================

    const loteLimpo =
        limparZPL(
            lote ||
            ""
        );

    const dataProduzido =
        limparZPL(
            formatarDataEtiqueta(
                dataProducao
            )
        );

    const dataValidade =
        limparZPL(
            formatarDataEtiqueta(
                validade
            )
        );

    const resp =
        limparZPL(
            responsavel ||
            "Não informado"
        );

    const codigo =
        limparZPL(
            codigoEtiqueta ||
            ""
        );

    // ===================================
    // CONFIGURAÇÃO ZPL
    // ===================================

    let zpl = "";

    zpl += "^XA\n";

    // UTF-8
    zpl += "^CI28\n";

    // TAMANHO
    zpl += "^PW480\n";
    zpl += "^LL480\n";

    // ===================================
    // BORDA EXTERNA
    // ===================================

    zpl += "^FO8,8\n";
    zpl += "^GB464,464,3\n";
    zpl += "^FS\n";


    // ===================================
    // PRODUTO
    // ===================================

    zpl += "^FO25,24\n";
    zpl += "^A0N,30,30\n";
    zpl += "^FB430,1,0,L,0\n";
    zpl += `^FD${nome}^FS\n`;


    // ===================================
    // TEMPERATURA
    // ===================================

    zpl += "^FO25,57\n";
    zpl += "^A0N,20,20\n";
    zpl += "^FB430,1,0,L,0\n";
    zpl += `^FD${temp}^FS\n`;


    // ===================================
    // PRIMEIRA LINHA
    // ===================================

    zpl += "^FO20,86\n";
    zpl += "^GB440,2,2\n";
    zpl += "^FS\n";


    // ===================================
    // PRODUZIDO
    // ===================================

    zpl += "^FO25,104\n";
    zpl += "^A0N,21,21\n";
    zpl += "^FDPRODUZIDO:^FS\n";

    zpl += "^FO275,102\n";
    zpl += "^A0N,24,24\n";
    zpl += `^FD${dataProduzido}^FS\n`;


    // ===================================
    // VALIDADE
    // ===================================

    zpl += "^FO25,136\n";
    zpl += "^A0N,21,21\n";
    zpl += "^FDVALIDADE:^FS\n";

    zpl += "^FO275,134\n";
    zpl += "^A0N,24,24\n";
    zpl += `^FD${dataValidade}^FS\n`;


    // ===================================
    // SEGUNDA LINHA
    // ===================================

    zpl += "^FO20,168\n";
    zpl += "^GB440,2,2\n";
    zpl += "^FS\n";


    // ===================================
    // RESPONSÁVEL
    // ===================================

    zpl += "^FO25,184\n";
    zpl += "^A0N,20,20\n";
    zpl += "^FB430,1,0,L,0\n";
    zpl += `^FDRESP.: ${resp}^FS\n`;


    // ===================================
    // NOME FANTASIA
    // ===================================

    zpl += "^FO25,211\n";
    zpl += "^A0N,22,22\n";
    zpl += "^FB430,1,0,L,0\n";
    zpl += `^FD${nomeEmpresa}^FS\n`;


    // ===================================
    // CNPJ
    // ===================================

    if (cnpj) {

        zpl += "^FO25,239\n";
        zpl += "^A0N,18,18\n";
        zpl += "^FB430,1,0,L,0\n";
        zpl += `^FDCNPJ: ${cnpj}^FS\n`;

    }


    // ===================================
    // ENDEREÇO
    // ===================================

    if (endereco) {

        zpl += "^FO25,264\n";
        zpl += "^A0N,17,17\n";
        zpl += "^FB305,2,0,L,0\n";
        zpl += `^FD${endereco}^FS\n`;

    }


    // ===================================
    // LOTE
    //
    // CANTO INFERIOR ESQUERDO
    // ===================================

    zpl += "^FO25,385\n";
    zpl += "^A0N,19,19\n";
    zpl += "^FB300,1,0,L,0\n";
    zpl += `^FDLOTE: ${loteLimpo}^FS\n`;


// ===================================
// QR CODE
// CANTO INFERIOR DIREITO
// ===================================

const urlConsulta =
    new URL(
        "consulta.html",
        window.location.href
    );

urlConsulta.searchParams.set(
    "codigo",
    codigo
);

if (codigo) {

    zpl += "^FO350,335\n";
    zpl += "^BQN,3,3\n";
    zpl += `^FDLA,${urlConsulta.href}^FS\n`;

}

    // ===================================
    // FINAL
    // ===================================

    zpl += "^XZ\n";

    return zpl;

}

// =======================================
// IMPRIMIR DIRETAMENTE
// =======================================

async function imprimirEtiquetaDireto(
    produto,
    lote,
    dataProducao,
    validade,
    temperatura,
    responsavel,
    codigoEtiqueta,
    quantidade
) {

    const qtd =
        Number(
            quantidade
        );

    if (
        !Number.isInteger(qtd) ||
        qtd < 1
    ) {

        throw new Error(
            "Quantidade de etiquetas inválida."
        );

    }

    console.log("=======================================");
    console.log("PREPARANDO IMPRESSÃO DIRETA");

    console.log(
        "PRODUTO:",
        produto.nome
    );

    console.log(
        "QUANTIDADE:",
        qtd
    );

    const zplEtiqueta =
        gerarZPL(

            produto,

            lote,

            dataProducao,

            validade,

            temperatura,

            responsavel,

            codigoEtiqueta

        );

    let zplFinal =
        "";

    for (
        let i = 0;
        i < qtd;
        i++
    ) {

        zplFinal +=
            zplEtiqueta;

    }

    console.log(
        "ETIQUETAS ZPL GERADAS:",
        qtd
    );

    console.log(
        "TAMANHO ZPL:",
        new TextEncoder()
            .encode(
                zplFinal
            )
            .length,
        "bytes"
    );

    console.log(
        "ENVIANDO PARA:",
        PRINTER_SERVICE_URL
    );

    let resposta;

    try {

        resposta =
            await fetch(
                PRINTER_SERVICE_URL,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "text/plain"

                    },

                    body:
                        zplFinal

                }
            );

    } catch (error) {

        console.error(
            "ERRO AO CONECTAR AO PRINTER SERVICE:",
            error
        );

        throw new Error(
            "Não foi possível conectar ao LOTRIX PRINTER SERVICE. Verifique se o server.js está aberto no computador da impressora."
        );

    }

    const retorno =
        await resposta.text();

    console.log(
        "RESPOSTA DO PRINTER SERVICE:",
        retorno
    );

    if (
        !resposta.ok
    ) {

        throw new Error(
            retorno ||
            "Erro ao enviar etiqueta para a impressora."
        );

    }

    console.log(
        "IMPRESSÃO ENVIADA COM SUCESSO"
    );

    console.log(
        "ETIQUETAS:",
        qtd
    );

    console.log("=======================================");

    return true;

}

// =======================================
// SALVAR ETIQUETA
//
// SOMENTE /etiquetas
//
// NÃO USA:
// produção
// estoque
// movimentações
// baixarEstoque()
// =======================================

async function salvarEtiqueta() {

    const formulario =
        obterElemento(
            "etiquetaForm"
        );

    try {

        const idEmpresa =
            empresaAtual();

        if (!idEmpresa) {

            alert(
                "Empresa não identificada."
            );

            return;

        }

        // ===================================
        // PRODUTO
        // ===================================

        const produto =
            produtoSelecionado();

        if (!produto) {

            alert(
                "Selecione um produto."
            );

            return;

        }

        // ===================================
        // SEGURANÇA MULTIEMPRESA
        // ===================================

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

        // ===================================
        // USUÁRIO
        // ===================================

        const usuario =
            usuarioAtual();

        // ===================================
        // QUANTIDADE
        // ===================================

        const campoQuantidade =
            obterElemento(
                "quantidadeProducao"
            );

        if (!campoQuantidade) {

            alert(
                "Campo de quantidade não encontrado."
            );

            console.error(
                "Elemento #quantidadeProducao não encontrado."
            );

            return;

        }

        const quantidade =
            parseInt(
                campoQuantidade.value,
                10
            );

        if (
            !Number.isInteger(
                quantidade
            ) ||
            quantidade < 1
        ) {

            alert(
                "Informe uma quantidade válida de etiquetas."
            );

            campoQuantidade.focus();

            return;

        }

        // ===================================
        // DATA DE PRODUÇÃO
        // ===================================

        const campoData =
            obterElemento(
                "dataProducao"
            );

        if (
            !campoData ||
            !campoData.value
        ) {

            alert(
                "Informe a data de produção."
            );

            return;

        }

        const dataProducao =
            campoData.value;

        // ===================================
        // VALIDADE
        // ===================================

        const validade =
            calcularValidadeProduto();

        if (!validade) {

            alert(
                "Não foi possível calcular a validade do produto."
            );

            return;

        }

        // ===================================
        // TEMPERATURA
        // ===================================

        const temperatura =
            produto.temperatura ||
            "AMBIENTE";

        // ===================================
        // RESPONSÁVEL
        // ===================================

        const responsavel =
            usuario?.nome ||
            "Não informado";

        // ===================================
        // UNIDADE
        // ===================================

        const unidade =
            produto.unidade ||
            "UN";

        // ===================================
        // LOTE
        // ===================================

        const lote =
            gerarLote();

        // ===================================
        // CÓDIGO
        // ===================================

        const codigoEtiqueta =
            gerarCodigoEtiqueta();

        // ===================================
        // DADOS DA ETIQUETA
        // ===================================

        const dadosEtiqueta = {

            idEmpresa:
                idEmpresa,

            codigo:
                codigoEtiqueta,

            produtoId:
                produto.id,

            produto:
                produto.nome || "",

            codigoProduto:
                produto.codigo || "",

            quantidade:
                quantidade,

            unidade:
                unidade,

            dataProducao:
                dataProducao,

            validade:
                validade,

            categoria:
                produto.categoria || "",

            grupo:
                produto.grupo || "",

            temperatura:
                temperatura,

            responsavel:
                responsavel,

            lote:
                lote,

            observacao:
                "",

            usuarioId:
                usuario?.id || "",

            usuario:
                usuario?.nome || "",

            email:
                usuario?.email || "",

            criadoEm:
                serverTimestamp()

        };

        console.log("=======================================");
        console.log("CRIANDO ETIQUETA");

        console.log(
            "EMPRESA:",
            idEmpresa
        );

        console.log(
            "PRODUTO:",
            produto.nome
        );

        console.log(
            "CÓDIGO:",
            codigoEtiqueta
        );

        console.log(
            "QUANTIDADE:",
            quantidade
        );

        console.log(
            "DATA:",
            dataProducao
        );

        console.log(
            "VALIDADE:",
            validade
        );

        console.log(
            "LOTE:",
            lote
        );

        console.log("=======================================");

        // ===================================
        // SALVAR NO FIRESTORE
        // ===================================

        const etiquetaRef =
            await addDoc(

                collection(
                    db,
                    "etiquetas"
                ),

                dadosEtiqueta

            );

        console.log(
            "ETIQUETA SALVA:",
            etiquetaRef.id
        );
// ===================================
// CRIAR CONSULTA PÚBLICA DO QR
// ===================================

await setDoc(
    doc(
        db,
        "consultasPublicas",
        codigoEtiqueta
    ),
    {
        codigo: codigoEtiqueta,

        idEmpresa: idEmpresa,

        produto:
            dadosEtiqueta.produto || "",

        temperatura:
            dadosEtiqueta.temperatura || "",

        dataProducao:
            dadosEtiqueta.dataProducao || null,

        validade:
            dadosEtiqueta.validade || null,

        lote:
            dadosEtiqueta.lote || "",

        responsavel:
            dadosEtiqueta.responsavel || "",

        quantidade:
            dadosEtiqueta.quantidade || "",

        unidade:
            dadosEtiqueta.unidade || "",

        observacao:
            dadosEtiqueta.observacao || "",

        criadoEm:
            serverTimestamp()
    }
);
        // ===================================
        // GUARDAR ÚLTIMA ETIQUETA
        // ===================================

        ultimaEtiquetaGerada = {

            id:
                etiquetaRef.id,

            ...dadosEtiqueta

        };

        // ===================================
        // AUDITORIA
        // ===================================

        try {

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
                        `${produto.nome} - Código: ${codigoEtiqueta} - ${quantidade} etiqueta(s)`,

                    status:
                        "Sucesso",

                    data:
                        serverTimestamp()

                }

            );

        } catch (error) {

            console.warn(
                "Não foi possível registrar auditoria:",
                error
            );

        }

        // ===================================
        // IMPRIMIR
        // ===================================

        if (
            imprimirDepoisDeSalvar
        ) {

            try {

                await imprimirEtiquetaDireto(

                    produto,

                    lote,

                    dataProducao,

                    validade,

                    temperatura,

                    responsavel,

                    codigoEtiqueta,

                    quantidade

                );

                alert(
                    `Etiqueta criada e ${quantidade} etiqueta(s) enviada(s) para a impressora.`
                );

            } catch (error) {

                console.error(
                    "ERRO NA IMPRESSÃO:",
                    error
                );

                alert(
                    "A etiqueta foi salva, mas não foi possível imprimir.\n\n" +
                    (
                        error.message ||
                        "Verifique o LOTRIX PRINTER SERVICE."
                    )
                );

            }

            imprimirDepoisDeSalvar =
                false;

        } else {

            alert(
                "Etiqueta criada com sucesso!"
            );

        }

        // ===================================
        // LIMPAR FORMULÁRIO
        // ===================================

        if (formulario) {

            formulario.reset();

        }

        // ===================================
        // RESTAURAR CAMPOS
        // ===================================

        preencherDataAtual();

        if (campoQuantidade) {

            campoQuantidade.value =
                "1";

        }

        atualizarInformacoesProduto();

        atualizarResponsavelPrevia();

        gerarLote();

        // ===================================
        // RECARREGAR HISTÓRICO
        // ===================================

        await carregarEtiquetas();

        console.log(
            "ETIQUETA CRIADA COM SUCESSO:",
            etiquetaRef.id
        );

    } catch (error) {

        console.error(
            "ERRO AO SALVAR ETIQUETA:",
            error
        );

        alert(
            error.message ||
            "Erro ao criar etiqueta. Veja o Console."
        );

    }

}

// =======================================
// CARREGAR ETIQUETAS
// SOMENTE EMPRESA ATUAL
// =======================================

async function carregarEtiquetas() {

    const lista =
        obterElemento(
            "listaEtiquetas"
        );

    if (!lista) {

        return;

    }

    const idEmpresa =
        empresaAtual();

    if (!idEmpresa) {

        return;

    }

    try {

        console.log(
            "CARREGANDO ETIQUETAS DA EMPRESA:",
            idEmpresa
        );

        const consulta =
            query(

                collection(
                    db,
                    "etiquetas"
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

        etiquetas = [];

        snapshot.forEach(
            item => {

                const dados =
                    item.data();

                if (
                    dados.idEmpresa !==
                    idEmpresa
                ) {

                    return;

                }

                etiquetas.push({

                    id:
                        item.id,

                    ...dados

                });

            }
        );

        etiquetas.sort(
            (a, b) => {

                const dataA =
                    a.criadoEm?.seconds ||
                    0;

                const dataB =
                    b.criadoEm?.seconds ||
                    0;

                return dataB - dataA;

            }
        );

        lista.innerHTML =
            "";

        if (
            etiquetas.length === 0
        ) {

            lista.innerHTML = `

                <tr>

                    <td colspan="7">

                        Nenhuma etiqueta registrada.

                    </td>

                </tr>

            `;

            return;

        }

        etiquetas.forEach(
            etiqueta => {

                const tr =
                    document.createElement(
                        "tr"
                    );

                tr.innerHTML = `

                    <td>
                        ${escaparHTML(
                            etiqueta.codigo ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            etiqueta.produto ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            etiqueta.quantidade ??
                            1
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            formatarDataEtiqueta(
                                etiqueta.dataProducao
                            )
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            formatarDataEtiqueta(
                                etiqueta.validade
                            )
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            etiqueta.responsavel ||
                            "-"
                        )}
                    </td>

                    <td>

                        <button
                            type="button"
                            class="btn-imprimir-etiqueta"
                            data-id="${escaparHTML(
                                etiqueta.id
                            )}">
                            🖨️
                        </button>

                        <button
                            type="button"
                            class="btn-delete-etiqueta"
                            data-id="${escaparHTML(
                                etiqueta.id
                            )}">
                            🗑️
                        </button>

                    </td>

                `;

                const imprimir =
                    tr.querySelector(
                        ".btn-imprimir-etiqueta"
                    );

                if (imprimir) {

                    imprimir.addEventListener(
                        "click",
                        () => {

                            imprimirEtiquetaExistente(
                                etiqueta.id
                            );

                        }
                    );

                }

                const excluir =
                    tr.querySelector(
                        ".btn-delete-etiqueta"
                    );

                if (excluir) {

                    excluir.addEventListener(
                        "click",
                        () => {

                            excluirEtiqueta(
                                etiqueta.id
                            );

                        }
                    );

                }

                lista.appendChild(
                    tr
                );

            }
        );

        aplicarBuscaEtiquetas();

        console.log(
            "ETIQUETAS CARREGADAS:",
            etiquetas.length
        );

    } catch (error) {

        console.error(
            "ERRO AO CARREGAR ETIQUETAS:",
            error
        );

    }

}

// =======================================
// IMPRIMIR ETIQUETA EXISTENTE
// =======================================

async function imprimirEtiquetaExistente(
    id
) {

    try {

        const idEmpresa =
            empresaAtual();

        if (!idEmpresa) {

            return;

        }

        const referencia =
            doc(
                db,
                "etiquetas",
                id
            );

        const snapshot =
            await getDoc(
                referencia
            );

        if (
            !snapshot.exists()
        ) {

            alert(
                "Etiqueta não encontrada."
            );

            return;

        }

        const etiqueta =
            snapshot.data();

        // ===================================
        // SEGURANÇA MULTIEMPRESA
        // ===================================

        if (
            etiqueta.idEmpresa !==
            idEmpresa
        ) {

            alert(
                "Esta etiqueta não pertence à empresa atual."
            );

            return;

        }

        const produto = {

            nome:
                etiqueta.produto ||
                "Produto",

            codigo:
                etiqueta.codigoProduto ||
                ""

        };

        const quantidade =
            Number(
                etiqueta.quantidade
            ) || 1;

        await imprimirEtiquetaDireto(

            produto,

            etiqueta.lote ||
                "",

            etiqueta.dataProducao ||
                "",

            etiqueta.validade ||
                "",

            etiqueta.temperatura ||
                "AMBIENTE",

            etiqueta.responsavel ||
                "Não informado",

            etiqueta.codigo ||
                "",

            quantidade

        );

        alert(
            `${quantidade} etiqueta(s) enviada(s) para a impressora.`
        );

    } catch (error) {

        console.error(
            "ERRO AO IMPRIMIR ETIQUETA:",
            error
        );

        alert(
            error.message ||
            "Erro ao imprimir etiqueta."
        );

    }

}

// =======================================
// BOTÃO IMPRIMIR DA PRÉVIA
// =======================================

async function imprimirEtiqueta() {

    if (
        !ultimaEtiquetaGerada
    ) {

        alert(
            "Nenhuma etiqueta foi gerada para impressão."
        );

        return;

    }

    try {

        const produto = {

            nome:
                ultimaEtiquetaGerada.produto ||
                "Produto",

            codigo:
                ultimaEtiquetaGerada.codigoProduto ||
                ""

        };

        await imprimirEtiquetaDireto(

            produto,

            ultimaEtiquetaGerada.lote,

            ultimaEtiquetaGerada.dataProducao,

            ultimaEtiquetaGerada.validade,

            ultimaEtiquetaGerada.temperatura,

            ultimaEtiquetaGerada.responsavel,

            ultimaEtiquetaGerada.codigo,

            ultimaEtiquetaGerada.quantidade

        );

        alert(
            `${ultimaEtiquetaGerada.quantidade} etiqueta(s) enviada(s) para a impressora.`
        );

    } catch (error) {

        console.error(
            "ERRO AO IMPRIMIR PRÉVIA:",
            error
        );

        alert(
            error.message ||
            "Erro ao imprimir etiqueta."
        );

    }

}

// =======================================
// EXCLUIR ETIQUETA
// =======================================

async function excluirEtiqueta(
    id
) {

    const confirmar =
        confirm(
            "Deseja excluir esta etiqueta?"
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
                "etiquetas",
                id
            );

        const snapshot =
            await getDoc(
                referencia
            );

        if (
            !snapshot.exists()
        ) {

            alert(
                "Etiqueta não encontrada."
            );

            return;

        }

        const dados =
            snapshot.data();

        // ===================================
        // SEGURANÇA MULTIEMPRESA
        // ===================================

        if (
            dados.idEmpresa !==
            idEmpresa
        ) {

            alert(
                "Esta etiqueta não pertence à empresa atual."
            );

            return;

        }

        await deleteDoc(
            referencia
        );

        alert(
            "Etiqueta excluída!"
        );

        await carregarEtiquetas();

    } catch (error) {

        console.error(
            "ERRO AO EXCLUIR ETIQUETA:",
            error
        );

        alert(
            "Erro ao excluir etiqueta."
        );

    }

}

// =======================================
// LIMPAR HISTÓRICO DE ETIQUETAS
// SOMENTE EMPRESA ATUAL
// =======================================

async function limparHistoricoEtiquetas() {

    const idEmpresa =
        empresaAtual();

    if (!idEmpresa) {

        alert(
            "Não foi possível identificar a empresa atual."
        );

        return;

    }

    try {

        const consulta =
            query(

                collection(
                    db,
                    "etiquetas"
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

            alert(
                "Não existem etiquetas no histórico desta empresa."
            );

            return;

        }

        const quantidade =
            snapshot.size;

        const confirmar =
            confirm(

                `⚠️ ATENÇÃO!\n\n` +
                `Existem ${quantidade} etiqueta(s) no histórico.\n\n` +
                `Todas as etiquetas desta empresa serão apagadas.\n\n` +
                `Esta ação não poderá ser desfeita.\n\n` +
                `Deseja realmente continuar?`

            );

        if (!confirmar) {

            return;

        }

        const botao =
            obterElemento(
                "btnLimparHistorico"
            );

        if (botao) {

            botao.disabled =
                true;

            botao.textContent =
                "⏳ Apagando...";

        }

        // ===================================
        // APAGAR ETIQUETAS DA EMPRESA
        // ===================================

        for (
            const item
            of snapshot.docs
        ) {

            await deleteDoc(

                doc(
                    db,
                    "etiquetas",
                    item.id
                )

            );

        }

        // ===================================
        // LIMPAR ARRAY LOCAL
        // ===================================

        etiquetas = [];

        // ===================================
        // ATUALIZAR HISTÓRICO
        // ===================================

        await carregarEtiquetas();

        // ===================================
        // AUDITORIA
        // ===================================

        const usuario =
            usuarioAtual();

        try {

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
                        "HISTÓRICO DE ETIQUETAS LIMPO",

                    detalhes:
                        `${quantidade} etiqueta(s) excluída(s) do histórico.`,

                    status:
                        "Sucesso",

                    data:
                        serverTimestamp()

                }

            );

        } catch (error) {

            console.warn(
                "Não foi possível registrar auditoria:",
                error
            );

        }

        alert(
            `${quantidade} etiqueta(s) foram removidas do histórico.`
        );

    } catch (error) {

        console.error(
            "ERRO AO LIMPAR HISTÓRICO:",
            error
        );

        alert(
            error.message ||
            "Erro ao limpar o histórico de etiquetas."
        );

    } finally {

        const botao =
            obterElemento(
                "btnLimparHistorico"
            );

        if (botao) {

            botao.disabled =
                false;

            botao.textContent =
                "🗑️ Limpar histórico";

        }

    }

}

// =======================================
// BUSCA DE ETIQUETAS
// =======================================

function aplicarBuscaEtiquetas() {

    const campo =
        obterElemento(
            "buscarEtiqueta"
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
                    "#listaEtiquetas tr"
                )
                .forEach(
                    linha => {

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
// TESTAR IMPRESSORA
// =======================================

window.testarImpressoraLotrix =
    async function () {

        try {

            const produtoTeste = {

                nome:
                    "LOTRIX TESTE",

                codigo:
                    "TESTE"

            };

            const zpl =
                gerarZPL(

                    produtoTeste,

                    "TESTE",

                    new Date(),

                    new Date(),

                    "AMBIENTE",

                    "Lotrix",

                    "LOT-TESTE"

                );

            const resposta =
                await fetch(
                    PRINTER_SERVICE_URL,
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "text/plain"

                        },

                        body:
                            zpl

                    }
                );

            const texto =
                await resposta.text();

            console.log(
                "TESTE IMPRESSORA:",
                texto
            );

            if (
                !resposta.ok
            ) {

                throw new Error(
                    texto ||
                    "Erro no Printer Service."
                );

            }

            alert(
                "Teste enviado para a impressora."
            );

        } catch (error) {

            console.error(
                "ERRO NO TESTE DA IMPRESSORA:",
                error
            );

            alert(
                error.message ||
                "Não foi possível testar a impressora."
            );

        }

    };

// =======================================
// FUNÇÕES GLOBAIS
// =======================================

window.salvarEtiqueta =
    salvarEtiqueta;

window.carregarEtiquetas =
    carregarEtiquetas;

window.carregarProdutosEtiquetas =
    carregarProdutos;

window.imprimirEtiquetaExistente =
    imprimirEtiquetaExistente;

window.imprimirEtiqueta =
    imprimirEtiqueta;

window.excluirEtiqueta =
    excluirEtiqueta;

window.gerarLoteEtiqueta =
    gerarLote;

window.limparHistoricoEtiquetas =
    limparHistoricoEtiquetas;

// =======================================
// INICIALIZAÇÃO
// =======================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log("=======================================");
        console.log(
            "INICIANDO LOTRIX ETIQUETAS V14"
        );
        console.log("=======================================");

        try {

            // ===================================
            // EMPRESA
            // ===================================

            if (
                !verificarEmpresa()
            ) {

                return;

            }

            const idEmpresa =
                empresaAtual();

            console.log(
                "ID EMPRESA LOGADA:",
                idEmpresa
            );

            // ===================================
            // DADOS EMPRESA
            // ===================================

            await carregarDadosEmpresa();

            // ===================================
            // DATA
            // ===================================

            preencherDataAtual();

            // ===================================
            // PRODUTOS
            // ===================================

            await carregarProdutos();

            // ===================================
            // PRÉVIA
            // ===================================

            atualizarInformacoesProduto();

            atualizarResponsavelPrevia();

            gerarLote();

            // ===================================
            // ETIQUETAS
            // ===================================

            await carregarEtiquetas();

            // ===================================
            // FORMULÁRIO
            // ===================================

            const formulario =
                obterElemento(
                    "etiquetaForm"
                );

            if (formulario) {

                formulario.addEventListener(
                    "submit",
                    async evento => {

                        evento.preventDefault();

                        imprimirDepoisDeSalvar =
                            true;

                        await salvarEtiqueta();

                    }
                );

            }

            // ===================================
            // PRODUTO ALTERADO
            // ===================================

            const select =
                obterElemento(
                    "produtoEtiqueta"
                );

            if (select) {

                select.addEventListener(
                    "change",
                    () => {

                        atualizarInformacoesProduto();

                        atualizarTemperaturaPrevia();

                        calcularValidadeProduto();

                        atualizarPrevia();

                    }
                );

            }

            // ===================================
            // DATA ALTERADA
            // ===================================

            const campoData =
                obterElemento(
                    "dataProducao"
                );

            if (campoData) {

                campoData.addEventListener(
                    "change",
                    () => {

                        atualizarPreviaDatas();

                        atualizarPrevia();

                    }
                );

            }

            // ===================================
            // QUANTIDADE
            // ===================================

            const campoQuantidade =
                obterElemento(
                    "quantidadeProducao"
                );

            if (campoQuantidade) {

                campoQuantidade.addEventListener(
                    "input",
                    () => {

                        const valor =
                            parseInt(
                                campoQuantidade.value,
                                10
                            );

                        console.log(
                            "QUANTIDADE ATUAL:",
                            valor
                        );

                    }
                );

            }
// ===================================
// BOTÃO LIMPAR HISTÓRICO
// ===================================

const btnLimparHistorico =
    obterElemento(
        "btnLimparHistorico"
    );

if (btnLimparHistorico) {

    btnLimparHistorico.addEventListener(
        "click",
        async () => {

            await limparHistoricoEtiquetas();

        }
    );

}
            // ===================================
            // FINAL
            // ===================================

            console.log("=======================================");
            console.log(
                "MÓDULO LOTRIX ETIQUETAS V14 PRONTO"
            );

            console.log(
                "EMPRESA:",
                empresaAtual()
            );

            console.log(
                "EMPRESA:",
                empresaAtualDados?.nomeFantasia ||
                empresaAtualDados?.nome ||
                "-"
            );

            console.log(
                "PRODUTOS:",
                produtos.length
            );

            console.log(
                "ETIQUETAS:",
                etiquetas.length
            );

            console.log(
                "PRINTER SERVICE:",
                PRINTER_SERVICE_URL
            );

            console.log("=======================================");

        } catch (error) {

            console.error(
                "ERRO NA INICIALIZAÇÃO:",
                error
            );

        }

    }

);