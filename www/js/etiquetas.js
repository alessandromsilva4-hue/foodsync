// =======================================
// LOTRIX - ETIQUETAS V14
// FIRESTORE + MULTIEMPRESA ISOLADO
//
// COMPAT?VEL COM etiquetas.html
//
// ETIQUETAS INDEPENDENTES
// N?O PASSA POR PRODU??O
// N?O PASSA POR ESTOQUE
// N?O BAIXA ESTOQUE
// N?O CRIA MOVIMENTA??O
//
// IMPRESS?O RAW ZPL - ZD220
// LOTRIX PRINTER SERVICE
//
// V14
// AJUSTE DE LAYOUT DA ETIQUETA
// =======================================

console.log("=======================================");
console.log("LOTRIX ETIQUETAS V14 CARREGADO");
console.log("Firestore: MULTIEMPRESA ISOLADO");
console.log("Etiquetas: INDEPENDENTES");
console.log("Produ??o: N?O UTILIZADA");
console.log("Estoque: N?O UTILIZADO");
console.log("Movimenta??es: N?O UTILIZADAS");
console.log("Impress?o: ZPL RAW");
console.log("Printer Service: HTTPS 192.168.0.109:9100");
console.log("Layout: PADR?O DEFINITIVO");
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
// CONFIGURA??O DA IMPRESSORA
// =======================================

const PRINTER_SERVICE_URL =
    "https://192.168.0.109:9100/print";

// =======================================
// VARI?VEIS
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
// USU?RIO ATUAL
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
            "Erro ao carregar usu?rio:",
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
            "Usu?rio n?o encontrado."
        );

        return null;

    }

    if (!usuario.idEmpresa) {

        console.error(
            "ID da empresa n?o encontrado:",
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
            "N?o foi poss?vel identificar a empresa deste usu?rio."
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
// PRODUTO PERTENCE ? EMPRESA
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
// GERAR C?DIGO DA ETIQUETA
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
// CORRE??O V14:
// Esta fun??o fica fora de salvarEtiqueta()
// para poder ser utilizada pela pr?via,
// gerarZPL() e demais fun??es.
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
            "Empresa n?o identificada."
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
                "Documento da empresa n?o encontrado:",
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
// ATUALIZAR EMPRESA NA PR?VIA
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
// N?O CONSULTA ESTOQUE
// N?O CONSULTA PRODU??O
// =======================================

async function carregarProdutos() {

    const produtoSelect =
        obterElemento(
            "produtoEtiqueta"
        );

    if (!produtoSelect) {

        console.error(
            "Elemento #produtoEtiqueta n?o encontrado."
        );

        return;

    }

    const idEmpresa =
        empresaAtual();

    if (!idEmpresa) {

        console.error(
            "Empresa n?o identificada."
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
// ATUALIZAR PR?VIA DO PRODUTO
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
// FORMATAR DATA PARA EXIBI??O
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
            "Campo #dataProducao n?o encontrado."
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
// ATUALIZAR DATAS DA PR?VIA
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
// ATUALIZAR RESPONS?VEL NA PR?VIA
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
        "N?o informado";

}

// =======================================
// ATUALIZAR TEMPERATURA NA PR?VIA
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
// ATUALIZAR PR?VIA COMPLETA
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
// PADR?O DEFINITIVO
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
// RESPONS?VEL
// EMPRESA
// CNPJ
// ENDERE?O
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
            "N?o informado"
        );

    const codigo =
        limparZPL(
            codigoEtiqueta ||
            ""
        );

    // ===================================
    // CONFIGURA??O ZPL
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
    // RESPONS?VEL
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
    // ENDERE?O
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
    gerarURLConsultaEtiqueta(
        codigo
    );

if (codigo && urlConsulta) {

    zpl += "^FO350,335\n";
    zpl += "^BQN,3,3\n";
    zpl += `^FDLA,${urlConsulta}^FS\n`;

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
            "Quantidade de etiquetas inv?lida."
        );

    }

    console.log("=======================================");
    console.log("PREPARANDO IMPRESS?O DIRETA");

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
            "N?o foi poss?vel conectar ao LOTRIX PRINTER SERVICE. Verifique se o server.js est? aberto no computador da impressora."
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
        "IMPRESS?O ENVIADA COM SUCESSO"
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
// N?O USA:
// produ??o
// estoque
// movimenta??es
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
                "Empresa n?o identificada."
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
        // SEGURAN?A MULTIEMPRESA
        // ===================================

        if (
            !produtoPertenceEmpresa(
                produto,
                idEmpresa
            )
        ) {

            alert(
                "Este produto n?o pertence ? empresa atual."
            );

            return;

        }

        // ===================================
        // USU?RIO
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
                "Campo de quantidade n?o encontrado."
            );

            console.error(
                "Elemento #quantidadeProducao n?o encontrado."
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
                "Informe uma quantidade v?lida de etiquetas."
            );

            campoQuantidade.focus();

            return;

        }

        // ===================================
        // DATA DE PRODU??O
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
                "Informe a data de produ??o."
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
                "N?o foi poss?vel calcular a validade do produto."
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
        // RESPONS?VEL
        // ===================================

        const responsavel =
            usuario?.nome ||
            "N?o informado";

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
        // C?DIGO
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
            "C?DIGO:",
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
// CRIAR CONSULTA P?BLICA DO QR
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
        // GUARDAR ?LTIMA ETIQUETA
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
                        `${produto.nome} - C?digo: ${codigoEtiqueta} - ${quantidade} etiqueta(s)`,

                    status:
                        "Sucesso",

                    data:
                        serverTimestamp()

                }

            );

        } catch (error) {

            console.warn(
                "N?o foi poss?vel registrar auditoria:",
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
                    "ERRO NA IMPRESS?O:",
                    error
                );

                alert(
                    "A etiqueta foi salva, mas n?o foi poss?vel imprimir.\n\n" +
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
        // LIMPAR FORMUL?RIO
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
        // RECARREGAR HIST?RICO
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
                            ???
                        </button>

                        <button
                            type="button"
                            class="btn-delete-etiqueta"
                            data-id="${escaparHTML(
                                etiqueta.id
                            )}">
                            ???
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
                "Etiqueta n?o encontrada."
            );

            return;

        }

        const etiqueta =
            snapshot.data();

        // ===================================
        // SEGURAN?A MULTIEMPRESA
        // ===================================

        if (
            etiqueta.idEmpresa !==
            idEmpresa
        ) {

            alert(
                "Esta etiqueta n?o pertence ? empresa atual."
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
                "N?o informado",

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
// BOT?O IMPRIMIR DA PR?VIA
// =======================================

async function imprimirEtiqueta() {

    if (
        !ultimaEtiquetaGerada
    ) {

        alert(
            "Nenhuma etiqueta foi gerada para impress?o."
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
            "ERRO AO IMPRIMIR PR?VIA:",
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
                "Etiqueta n?o encontrada."
            );

            return;

        }

        const dados =
            snapshot.data();

        // ===================================
        // SEGURAN?A MULTIEMPRESA
        // ===================================

        if (
            dados.idEmpresa !==
            idEmpresa
        ) {

            alert(
                "Esta etiqueta n?o pertence ? empresa atual."
            );

            return;

        }

        await deleteDoc(
            referencia
        );

        alert(
            "Etiqueta exclu?da!"
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
// LIMPAR HIST?RICO DE ETIQUETAS
// SOMENTE EMPRESA ATUAL
// =======================================

async function limparHistoricoEtiquetas() {

    const idEmpresa =
        empresaAtual();

    if (!idEmpresa) {

        alert(
            "N?o foi poss?vel identificar a empresa atual."
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
                "N?o existem etiquetas no hist?rico desta empresa."
            );

            return;

        }

        const quantidade =
            snapshot.size;

        const confirmar =
            confirm(

                `?? ATEN??O!\n\n` +
                `Existem ${quantidade} etiqueta(s) no hist?rico.\n\n` +
                `Todas as etiquetas desta empresa ser?o apagadas.\n\n` +
                `Esta a??o n?o poder? ser desfeita.\n\n` +
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
                "? Apagando...";

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
        // ATUALIZAR HIST?RICO
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
                        "HIST?RICO DE ETIQUETAS LIMPO",

                    detalhes:
                        `${quantidade} etiqueta(s) exclu?da(s) do hist?rico.`,

                    status:
                        "Sucesso",

                    data:
                        serverTimestamp()

                }

            );

        } catch (error) {

            console.warn(
                "N?o foi poss?vel registrar auditoria:",
                error
            );

        }

        alert(
            `${quantidade} etiqueta(s) foram removidas do hist?rico.`
        );

    } catch (error) {

        console.error(
            "ERRO AO LIMPAR HIST?RICO:",
            error
        );

        alert(
            error.message ||
            "Erro ao limpar o hist?rico de etiquetas."
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
                "??? Limpar hist?rico";

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
                "N?o foi poss?vel testar a impressora."
            );

        }

    };

// =======================================
// FUN??ES GLOBAIS
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
// INICIALIZA??O
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
            // PR?VIA
            // ===================================

            atualizarInformacoesProduto();

            atualizarResponsavelPrevia();

            gerarLote();

            // ===================================
            // ETIQUETAS
            // ===================================

            await carregarEtiquetas();

            // ===================================
            // FORMUL?RIO
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
// BOT?O LIMPAR HIST?RICO
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
                "M?DULO LOTRIX ETIQUETAS V14 PRONTO"
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
                "ERRO NA INICIALIZA??O:",
                error
            );

        }

    }

);