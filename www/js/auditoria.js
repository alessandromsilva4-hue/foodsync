// =======================================
// LOTRIX - AUDITORIA
// =======================================

console.log("AUDITORIA.JS V2 CARREGADO");

import { auth, db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =======================================
// ELEMENTOS
// =======================================

const tabela =
    document.getElementById("listaAuditoria");

const filtroModulo =
    document.getElementById("filtroModulo");

const filtroData =
    document.getElementById("filtroData");


// =======================================
// DADOS
// =======================================

let dadosAuditoria = [];


// =======================================
// OBTER EMPRESA DO USUÁRIO
// =======================================

async function obterIdEmpresa() {

    await auth.authStateReady();

    const usuarioAtual =
        auth.currentUser;


    if (!usuarioAtual) {

        throw new Error(
            "Usuário não autenticado."
        );

    }


    console.log(
        "Usuário autenticado:",
        usuarioAtual.uid
    );


    // =======================================
    // TENTAR PERFIL DO FIRESTORE PRIMEIRO
    // =======================================

    try {

        const perfilRef =
            doc(
                db,
                "usuarios",
                usuarioAtual.uid
            );


        const perfilSnapshot =
            await getDoc(perfilRef);


        if (perfilSnapshot.exists()) {

            const perfil =
                perfilSnapshot.data();


            console.log(
                "Perfil encontrado:",
                perfil
            );


            if (perfil.idEmpresa) {

                console.log(
                    "ID empresa pelo perfil:",
                    perfil.idEmpresa
                );


                return perfil.idEmpresa;

            }

        }

    }

    catch (erro) {

        console.warn(
            "Não foi possível consultar o perfil:",
            erro
        );

    }


    // =======================================
    // FALLBACK LOCALSTORAGE
    // =======================================

    const dadosUsuario =
        localStorage.getItem(
            "usuarioFoodSync"
        );


    if (dadosUsuario) {

        try {

            const usuario =
                JSON.parse(
                    dadosUsuario
                );


            if (usuario?.idEmpresa) {

                console.log(
                    "ID empresa pelo usuarioFoodSync:",
                    usuario.idEmpresa
                );


                return usuario.idEmpresa;

            }

        }

        catch (erro) {

            console.warn(
                "usuarioFoodSync inválido:",
                erro
            );

        }

    }


    // =======================================
    // ÚLTIMO FALLBACK
    // =======================================

    const empresaAtiva =
        localStorage.getItem(
            "empresaAtivaLotrix"
        );


    if (empresaAtiva) {

        console.log(
            "Empresa pelo empresaAtivaLotrix:",
            empresaAtiva
        );


        return empresaAtiva;

    }


    throw new Error(
        "Empresa ativa não encontrada."
    );

}


// =======================================
// CARREGAR AUDITORIA
// =======================================

async function carregarAuditoria() {

    if (!tabela) {

        console.error(
            "Elemento listaAuditoria não encontrado."
        );

        return;

    }


    tabela.innerHTML = `

        <tr>

            <td
                colspan="6"
                style="
                    padding:30px;
                    text-align:center;
                "
            >

                Carregando...

            </td>

        </tr>

    `;


    try {

        // =======================================
        // EMPRESA
        // =======================================

        const idEmpresa =
            await obterIdEmpresa();


        console.log(
            "Carregando auditoria da empresa:",
            idEmpresa
        );


        if (!idEmpresa) {

            throw new Error(
                "ID da empresa vazio."
            );

        }


        // =======================================
        // CONSULTA FIRESTORE
        // =======================================

        const consulta =
            query(

                collection(
                    db,
                    "auditoria"
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


        console.log(
            "Registros de auditoria encontrados:",
            snapshot.size
        );


        dadosAuditoria = [];


        snapshot.forEach(item => {

            dadosAuditoria.push({

                id: item.id,

                ...item.data()

            });

        });


        // =======================================
        // ORDENAR
        // =======================================

        dadosAuditoria.sort(
            (a, b) => {

                return obterTimestamp(
                    b.data
                ) -
                obterTimestamp(
                    a.data
                );

            }
        );


        // =======================================
        // RENDERIZAR
        // =======================================

        renderizarTabela(
            dadosAuditoria
        );


    }

    catch (error) {

        console.error(
            "================================"
        );

        console.error(
            "ERRO AO CARREGAR AUDITORIA"
        );

        console.error(
            error
        );

        console.error(
            "Código:",
            error?.code
        );

        console.error(
            "Mensagem:",
            error?.message
        );

        console.error(
            "================================"
        );


        let mensagem =
            "Erro ao carregar auditoria.";


        if (
            error?.code ===
            "permission-denied"
        ) {

            mensagem =
                "Sem permissão para acessar a auditoria.";

        }


        else if (
            error?.code ===
            "unauthenticated"
        ) {

            mensagem =
                "Usuário não autenticado.";

        }


        else if (
            error?.message
        ) {

            mensagem =
                error.message;

        }


        tabela.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        padding:30px;
                        text-align:center;
                    "
                >

                    ⚠️ ${escaparHTML(
                        mensagem
                    )}

                </td>

            </tr>

        `;

    }

}


// =======================================
// RENDERIZAR TABELA
// =======================================

function renderizarTabela(lista) {

    if (!tabela)
        return;


    tabela.innerHTML = "";


    if (
        !lista ||
        lista.length === 0
    ) {

        tabela.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        padding:30px;
                        text-align:center;
                    "
                >

                    Nenhuma ação registrada.

                </td>

            </tr>

        `;

        return;

    }


    lista.forEach(a => {

        const linha =
            document.createElement(
                "tr"
            );


        linha.innerHTML = `

            <td>
                ${formatarData(a.data)}
            </td>

            <td>
                ${escaparHTML(
                    a.usuario || "-"
                )}
            </td>

            <td>
                ${escaparHTML(
                    a.modulo || "-"
                )}
            </td>

            <td>
                ${escaparHTML(
                    a.acao || "-"
                )}
            </td>

            <td>
                ${escaparHTML(
                    a.detalhes || "-"
                )}
            </td>

            <td>
                ${escaparHTML(
                    a.status || "-"
                )}
            </td>

        `;


        tabela.appendChild(
            linha
        );

    });

}


// =======================================
// TIMESTAMP
// =======================================

function obterTimestamp(data) {

    if (!data)
        return 0;


    if (
        typeof data.toMillis ===
        "function"
    ) {

        return data.toMillis();

    }


    if (
        typeof data.toDate ===
        "function"
    ) {

        return data.toDate().getTime();

    }


    if (
        typeof data.seconds ===
        "number"
    ) {

        return data.seconds * 1000;

    }


    if (data instanceof Date) {

        return data.getTime();

    }


    return 0;

}


// =======================================
// FORMATAR DATA
// =======================================

function formatarData(data) {

    const timestamp =
        obterTimestamp(data);


    if (!timestamp)
        return "-";


    return new Date(
        timestamp
    ).toLocaleString(
        "pt-BR"
    );

}


// =======================================
// ESCAPAR HTML
// =======================================

function escaparHTML(valor) {

    return String(valor)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// =======================================
// FILTRAR
// =======================================

window.filtrarAuditoria =
function () {

    let resultado =
        [...dadosAuditoria];


    // =======================================
    // FILTRO MÓDULO
    // =======================================

    if (
        filtroModulo &&
        filtroModulo.value
    ) {

        resultado =
            resultado.filter(
                a =>
                    a.modulo ===
                    filtroModulo.value
            );

    }


    // =======================================
    // FILTRO DATA
    // =======================================

    if (
        filtroData &&
        filtroData.value
    ) {

        const dataSelecionada =
            filtroData.value;


        resultado =
            resultado.filter(
                a => {

                    const timestamp =
                        obterTimestamp(
                            a.data
                        );


                    if (!timestamp)
                        return false;


                    const data =
                        new Date(
                            timestamp
                        );


                    const ano =
                        data.getFullYear();


                    const mes =
                        String(
                            data.getMonth() + 1
                        ).padStart(
                            2,
                            "0"
                        );


                    const dia =
                        String(
                            data.getDate()
                        ).padStart(
                            2,
                            "0"
                        );


                    const dataFormatada =
                        `${ano}-${mes}-${dia}`;


                    return (
                        dataFormatada ===
                        dataSelecionada
                    );

                }
            );

    }


    renderizarTabela(
        resultado
    );

};


// =======================================
// EXPORTAR EXCEL
// =======================================

window.exportarExcel =
function () {

    if (
        !dadosAuditoria.length
    ) {

        alert(
            "Não existem registros para exportar."
        );

        return;

    }


    if (
        typeof XLSX ===
        "undefined"
    ) {

        alert(
            "A biblioteca Excel não foi carregada."
        );

        return;

    }


    const dados =
        dadosAuditoria.map(
            a => ({

                Data:
                    formatarData(
                        a.data
                    ),

                Usuário:
                    a.usuario || "-",

                Módulo:
                    a.modulo || "-",

                Ação:
                    a.acao || "-",

                Detalhes:
                    a.detalhes || "-",

                Status:
                    a.status || "-"

            })
        );


    const ws =
        XLSX.utils.json_to_sheet(
            dados
        );


    const wb =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Auditoria"
    );


    XLSX.writeFile(
        wb,
        "auditoria-lotrix.xlsx"
    );

};


// =======================================
// IMPRIMIR
// =======================================

window.imprimirAuditoria =
function () {

    window.print();

};


// =======================================
// INICIALIZAÇÃO
// =======================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        carregarAuditoria
    );

}

else {

    carregarAuditoria();

}
