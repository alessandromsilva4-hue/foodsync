// =======================================
// LOTRIX - PRODU??O V7
// MULTIEMPRESA + FIRESTORE
// IMPRESS?O DIRETA ZD220 VIA PRINTER SERVICE
// =======================================

console.log("PRODUCAO.JS V7 CARREGADO");

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
// CONFIGURA??O DA IMPRESSORA
// =======================================

const PRINTER_SERVICE_URL =
    "https://192.168.0.109:9100/print";


// =======================================
// VARI?VEIS
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
// VERIFICAR PRODUTO DA EMPRESA
// =======================================

function produtoPertenceEmpresa(
    dados,
    idEmpresa
) {

    if (
        dados.idEmpresa ===
        idEmpresa
    ) {

        return true;
    }

    if (
        Array.isArray(
            dados.empresas
        ) &&
        dados.empresas.includes(
            idEmpresa
        )
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
        obterElemento(
            "produtoSelect"
        );

    if (!produtoSelect) {

        console.error(
            "Elemento #produtoSelect n?o encontrado."
        );

        return;
    }

    try {

        const idEmpresa =
            empresaAtual();

        if (!idEmpresa) {

            console.error(
                "N?o foi poss?vel identificar a empresa."
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
// ATUALIZAR INFORMA??ES DO PRODUTO
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

            infoValidade.textContent =
                "";
        }


        if (infoTemperatura) {

            infoTemperatura.textContent =
                "";
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
            "N?o informado";
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

        campo.value =
            lote;
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

        console.log(
            "CONSULTANDO ESTOQUE DA EMPRESA:",
            idEmpresa
        );


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


        let estoqueEncontrado =
            null;


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


        if (!estoqueEncontrado) {

            throw new Error(
                `Produto "${produto.nome}" n?o possui estoque cadastrado para esta empresa.`
            );
        }


        const quantidadeAtual =
            Number(
                estoqueEncontrado.quantidade ||
                0
            );


        if (
            quantidadeAtual <
            quantidade
        ) {

            throw new Error(
                `Estoque insuficiente para ${produto.nome}. Dispon?vel: ${quantidadeAtual} ${unidade}.`
            );
        }


        const novaQuantidade =
            quantidadeAtual -
            quantidade;


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
                    "Produ??o",

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
                empresa:
                    idEmpresa,

                produto:
                    produto.nome,

                quantidadeAnterior:
                    quantidadeAtual,

                quantidadeBaixada:
                    quantidade,

                quantidadeNova:
                    novaQuantidade
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
// FORMATAR DATA PARA ETIQUETA
// =======================================

function formatarDataEtiqueta(valor) {

    if (!valor) {

        return "-";
    }


    let data;


    if (
        typeof valor === "string"
    ) {

        data =
            new Date(valor);

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
// GERAR ZPL DA ETIQUETA
// ZD220 - 203 DPI
// 60mm x 60mm
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

    const nome =
        limparZPL(
            produto.nome ||
            "Produto"
        );


    const codigo =
        limparZPL(
            produto.codigo ||
            ""
        );


    const loteLimpo =
        limparZPL(
            lote
        );


    const dataProd =
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


    const temp =
        limparZPL(
            temperatura ||
            "-"
        );


    const resp =
        limparZPL(
            responsavel ||
            "-"
        );


    const codEtiqueta =
        limparZPL(
            codigoEtiqueta
        );


    // ===================================
    // 60mm x 60mm
    // 203 DPI ? 8 dots/mm
    // 480 x 480 dots
    // ===================================

    let zpl = "";

    zpl += "^XA\n";

    zpl += "^CI28\n";

    zpl += "^PW480\n";

    zpl += "^LL480\n";


    // ===================================
    // PRODUTO
    // ===================================

    zpl += "^FO25,20\n";

    zpl += "^A0N,32,32\n";

    zpl += "^FB430,2,0,C,0\n";

    zpl += `^FD${nome}^FS\n`;


    // ===================================
    // LINHA
    // ===================================

    zpl += "^FO25,88\n";

    zpl += "^GB430,2,2^FS\n";


    // ===================================
    // C?DIGO
    // ===================================

    if (codigo) {

        zpl += "^FO25,105\n";

        zpl += "^A0N,22,22\n";

        zpl += `^FDC?digo: ${codigo}^FS\n`;
    }


    // ===================================
    // LOTE
    // ===================================

    zpl += "^FO25,140\n";

    zpl += "^A0N,26,26\n";

    zpl += `^FDLote: ${loteLimpo}^FS\n`;


    // ===================================
    // FABRICA??O
    // ===================================

    zpl += "^FO25,180\n";

    zpl += "^A0N,24,24\n";

    zpl += `^FDProdu??o: ${dataProd}^FS\n`;


    // ===================================
    // VALIDADE
    // ===================================

    zpl += "^FO25,215\n";

    zpl += "^A0N,26,26\n";

    zpl += `^FDValidade: ${dataValidade}^FS\n`;


    // ===================================
    // TEMPERATURA
    // ===================================

    zpl += "^FO25,255\n";

    zpl += "^A0N,24,24\n";

    zpl += `^FDTemp.: ${temp}^FS\n`;


    // ===================================
    // RESPONS?VEL
    // ===================================

    zpl += "^FO25,290\n";

    zpl += "^A0N,22,22\n";

    zpl += `^FDResp.: ${resp}^FS\n`;


    // ===================================
    // C?DIGO DA ETIQUETA
    // ===================================

    zpl += "^FO25,325\n";

    zpl += "^A0N,20,20\n";

    zpl += `^FD${codEtiqueta}^FS\n`;


    // ===================================
    // QR CODE
    // ===================================

    zpl += "^FO345,250\n";

    zpl += "^BQN,2,4\n";

    zpl += `^FDLA,${codEtiqueta}^FS\n`;


    // ===================================
    // FINAL
    // ===================================

    zpl += "^XZ\n";


    return zpl;
}


// =======================================
// IMPRIMIR DIRETAMENTE NA ZD220
// =======================================

async function imprimirEtiquetasDireto(
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
        ) || 1;


    if (
        qtd < 1
    ) {

        throw new Error(
            "Quantidade de etiquetas inv?lida."
        );
    }


    console.log(
        "======================================="
    );


    console.log(
        "PREPARANDO IMPRESS?O DIRETA"
    );


    console.log(
        "Quantidade de etiquetas:",
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


    // ===================================
    // REPETIR A ETIQUETA
    // ===================================

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
        "Tamanho ZPL:",
        new TextEncoder()
            .encode(zplFinal)
            .length,
        "bytes"
    );


    console.log(
        "Enviando para:",
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
            "ERRO AO CONECTAR AO LOTRIX PRINTER SERVICE:",
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
        "======================================="
    );


    console.log(
        "IMPRESS?O ENVIADA COM SUCESSO"
    );


    console.log(
        "ETIQUETAS:",
        qtd
    );


    console.log(
        "======================================="
    );


    return true;
}


// =======================================
// SALVAR PRODU??O
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
                "Empresa n?o identificada."
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
                "Informe uma quantidade v?lida."
            );

            return;
        }


        const qtdEtiquetas =
            Number(
                obterElemento(
                    "qtdEtiquetas"
                )?.value
            ) || 1;


        if (
            qtdEtiquetas <= 0
        ) {

            alert(
                "Informe uma quantidade v?lida de etiquetas."
            );

            return;
        }


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


        // ===================================
        // DADOS DA PRODU??O
        // ===================================

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


        // ===================================
        // PRIMEIRO: BAIXAR ESTOQUE
        // ===================================

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
                "N?o foi poss?vel baixar o estoque: " +
                (
                    error.message ||
                    "permiss?o negada"
                )
            );


            throw error;
        }


        // ===================================
        // SALVAR PRODU??O
        // ===================================

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
                "ERRO FIRESTORE AO SALVAR PRODU??O:",
                error
            );


            throw error;
        }


        // ===================================
        // AUDITORIA PRODU??O
        // ===================================

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
                    "Produ??o",

                acao:
                    "NOVA PRODU??O",

                detalhes:
                    `${produto.nome} - Quantidade: ${quantidade} ${unidade}`,

                status:
                    "Sucesso",

                data:
                    serverTimestamp()

            }

        );


        // ===================================
        // GERAR ETIQUETA
        // ===================================

        const codigoEtiqueta =
            "LOT-" +
            Date.now();


   await addDoc(
    collection(db, "etiquetas"),
    {
        idEmpresa: producao.idEmpresa,

        codigo: codigoEtiqueta,

        produtoId: produtoSelecionado.id,

        produto: producao.produto,

        quantidade: producao.quantidade,

        unidade: producao.unidade || "UN",

        dataProducao: dataSelecionada,

        validade: validade.toISOString().split("T")[0],

        categoria: produtoSelecionado?.categoria || "",

        responsavel:
            producao.responsavel ||
            "N?o informado",

        temperatura:
            produtoSelecionado?.temperatura ||
            "AMBIENTE",

        lote: codigoEtiqueta,

        observacao: "",

        criadoEm: serverTimestamp()
    }
);


        // ===================================
        // AUDITORIA ETIQUETA
        // ===================================

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
                    `${produto.nome} - C?digo: ${codigoEtiqueta} - ${qtdEtiquetas} etiqueta(s)`,

                status:
                    "Sucesso",

                data:
                    serverTimestamp()

            }

        );


        // ===================================
        // IMPRIMIR DIRETAMENTE
        // ===================================

        if (
            imprimirDepoisDeSalvar
        ) {

            console.log(
                "INICIANDO IMPRESS?O DIRETA..."
            );


            try {

                await imprimirEtiquetasDireto(

                    produto,

                    lote,

                    dataProducao,

                    validade,

                    temperatura,

                    responsavel,

                    codigoEtiqueta,

                    qtdEtiquetas

                );


                alert(
                    `Produ??o registrada e ${qtdEtiquetas} etiqueta(s) enviada(s) para a impressora.`
                );


            } catch (error) {

                console.error(
                    "ERRO NA IMPRESS?O:",
                    error
                );


                alert(
                    "A produ??o foi salva, mas n?o foi poss?vel imprimir a etiqueta.\n\n" +
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
                "Produ??o registrada com sucesso!"
            );
        }


        // ===================================
        // LIMPAR FORMUL?RIO
        // ===================================

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


        // ===================================
        // ATUALIZAR TELA
        // ===================================

        await carregarProdutos();

        await carregarProducoes();


        console.log(
            "PRODU??O SALVA COM SUCESSO:",
            producaoRef.id
        );


    } catch (error) {

        console.error(
            "ERRO AO SALVAR PRODU??O:",
            error
        );


        alert(
            error.message ||
            "Erro ao registrar produ??o. Veja o Console."
        );
    }
}


// =======================================
// CARREGAR PRODU??ES
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

                        Nenhuma produ??o registrada.

                    </td>

                </tr>

            `;

            return;
        }


        lista.innerHTML =
            "";


        snapshot.forEach(
            item => {

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
                            ???
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
            "Erro ao carregar produ??es:",
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
// EXCLUIR PRODU??O
// =======================================

async function excluirProducao(id) {

    const confirmar =
        confirm(
            "Deseja excluir esta produ??o?"
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
                    item.id ===
                    id
            );


        if (!pertence) {

            alert(
                "Esta produ??o n?o pertence ? empresa atual."
            );

            return;
        }


        await deleteDoc(
            referencia
        );


        alert(
            "Produ??o exclu?da!"
        );


        await carregarProducoes();


    } catch (error) {

        console.error(
            "Erro ao excluir produ??o:",
            error
        );


        alert(
            "Erro ao excluir produ??o."
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
// INICIALIZA??O
// =======================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "======================================="
        );


        console.log(
            "INICIANDO LOTRIX PRODU??O V7"
        );


        // ===================================
        // EMPRESA
        // ===================================

        if (
            !verificarEmpresa()
        ) {

            return;
        }


        // ===================================
        // DATA
        // ===================================

        preencherDataAtual();


        // ===================================
        // LOTE
        // ===================================

        gerarLote();


        // ===================================
        // PRODUTOS
        // ===================================

        await carregarProdutos();


        // ===================================
        // PRODU??ES
        // ===================================

        await carregarProducoes();


        // ===================================
        // FORMUL?RIO
        // ===================================

        const formulario =
            obterElemento(
                "producaoForm"
            );


        if (formulario) {

            formulario.addEventListener(
                "submit",
                async evento => {

                    evento.preventDefault();


                    imprimirDepoisDeSalvar =
                        false;


                    await salvarProducao();

                }
            );
        }


        // ===================================
        // SALVAR + IMPRIMIR
        // ===================================

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


        // ===================================
        // PRODUTO ALTERADO
        // ===================================

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
            "P?GINA DE PRODU??O V7 PRONTA."
        );


        console.log(
            "EMPRESA:",
            empresaAtual()
        );


        console.log(
            "PRINTER SERVICE:",
            PRINTER_SERVICE_URL
        );


        console.log(
            "======================================="
        );

    }
);


// =======================================
// EXCLUS?O GLOBAL
// =======================================

window.excluirProducao =
    excluirProducao;


// =======================================
// TESTE GLOBAL DE IMPRESS?O
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

                    "-",

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


            if (!resposta.ok) {

                throw new Error(
                    texto
                );
            }


            alert(
                "Teste enviado para a impressora."
            );


        } catch (error) {

            console.error(
                "Erro no teste da impressora:",
                error
            );


            alert(
                error.message ||
                "N?o foi poss?vel testar a impressora."
            );
        }
    };
