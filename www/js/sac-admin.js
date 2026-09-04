// =======================================
// LOTRIX - SAC ADMIN
// =======================================

console.log("SAC-ADMIN.JS V3 CARREGADO");

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    addDoc,
    serverTimestamp,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =======================================
// ELEMENTOS
// =======================================

const tabela = document.getElementById("listaSACAdmin");

let chamadoAtual = null;


// =======================================
// CARREGAR CHAMADOS
// =======================================

async function carregarSAC() {

    if (!tabela) {
        console.error("Elemento #listaSACAdmin não encontrado.");
        return;
    }

    // Mostra carregamento
    tabela.innerHTML = `
        <tr>
            <td colspan="6">
                Carregando...
            </td>
        </tr>
    `;

    try {

        // =======================================
        // USUÁRIO LOGADO
        // =======================================

        const dadosUsuario =
            localStorage.getItem("usuarioFoodSync");

        if (!dadosUsuario) {

            console.error(
                "usuarioFoodSync não encontrado no localStorage."
            );

            tabela.innerHTML = `
                <tr>
                    <td colspan="6">
                        ⚠️ Usuário não identificado.
                    </td>
                </tr>
            `;

            return;
        }


        let usuario;

        try {

            usuario = JSON.parse(dadosUsuario);

        } catch (erro) {

            console.error(
                "Erro ao interpretar usuarioFoodSync:",
                erro
            );

            tabela.innerHTML = `
                <tr>
                    <td colspan="6">
                        ⚠️ Dados do usuário inválidos.
                    </td>
                </tr>
            `;

            return;
        }


        console.log("Usuário SAC Admin:", usuario);


        // =======================================
        // EMPRESA
        // =======================================

        const idEmpresa = usuario?.idEmpresa;


        if (!idEmpresa) {

            console.error(
                "idEmpresa não encontrado:",
                usuario
            );

            tabela.innerHTML = `
                <tr>
                    <td colspan="6">
                        ⚠️ Empresa do usuário não identificada.
                    </td>
                </tr>
            `;

            return;
        }


        console.log(
            "Carregando SAC da empresa:",
            idEmpresa
        );


        // =======================================
        // CONSULTA FIRESTORE
        // =======================================

        /*
         * Não usamos orderBy() aqui.
         *
         * Isso evita o problema de índice composto
         * do Firestore causado pela combinação:
         *
         * where("idEmpresa", "==", ...)
         * +
         * orderBy("criadoEm", "desc")
         *
         * A ordenação será feita abaixo pelo JavaScript.
         */

        const consulta = query(

            collection(db, "sac"),

            where(
                "idEmpresa",
                "==",
                idEmpresa
            )

        );


        const snapshot =
            await getDocs(consulta);


        console.log(
            "Chamados encontrados:",
            snapshot.size
        );


        // =======================================
        // NENHUM CHAMADO
        // =======================================

        if (snapshot.empty) {

            tabela.innerHTML = `
                <tr>
                    <td colspan="6">
                        Nenhum chamado recebido.
                    </td>
                </tr>
            `;

            return;
        }


        // =======================================
        // TRANSFORMAR DOCUMENTOS EM ARRAY
        // =======================================

        const chamados = [];


        snapshot.forEach(item => {

            chamados.push({

                id: item.id,

                ...item.data()

            });

        });


        // =======================================
        // ORDENAR POR DATA
        // MAIS RECENTE PRIMEIRO
        // =======================================

        chamados.sort((a, b) => {

            const dataA =
                a.criadoEm?.seconds
                    ? a.criadoEm.seconds
                    : 0;

            const dataB =
                b.criadoEm?.seconds
                    ? b.criadoEm.seconds
                    : 0;

            return dataB - dataA;

        });


        // =======================================
        // LIMPAR TABELA
        // =======================================

        tabela.innerHTML = "";


        // =======================================
        // MONTAR TABELA
        // =======================================

        chamados.forEach(chamado => {


            let data = "-";


            if (chamado.criadoEm?.seconds) {

                data =
                    new Date(
                        chamado.criadoEm.seconds * 1000
                    ).toLocaleString(
                        "pt-BR"
                    );

            }


            const tipo =
                escaparHTML(
                    chamado.tipo || "-"
                );


            const assunto =
                escaparHTML(
                    chamado.assunto || "-"
                );


            const prioridade =
                escaparHTML(
                    chamado.prioridade || "-"
                );


            const status =
                escaparHTML(
                    chamado.status || "Aberto"
                );


            const linha = document.createElement("tr");


            linha.innerHTML = `

                <td>
                    ${data}
                </td>

                <td>
                    ${tipo}
                </td>

                <td>
                    ${assunto}
                </td>

                <td>
                    ${prioridade}
                </td>

                <td>
                    ${status}
                </td>

                <td>

                    <button
                        class="btn-primary"
                        type="button"
                        data-id="${chamado.id}"
                    >
                        👁️ Ver
                    </button>

                </td>

            `;


            // =======================================
            // BOTÃO VER
            // =======================================

            const botao =
                linha.querySelector("button");


            botao.addEventListener(
                "click",
                function () {

                    window.verChamado(
                        chamado.id
                    );

                }
            );


            tabela.appendChild(linha);

        });


        console.log(
            "Tabela SAC carregada com sucesso."
        );

    }

    catch (erro) {

        console.error(
            "ERRO AO CARREGAR SAC:",
            erro
        );


        let mensagem =
            "Não foi possível carregar os chamados.";


        if (
            erro?.code ===
            "permission-denied"
        ) {

            mensagem =
                "⚠️ Sem permissão para acessar os chamados do SAC.";

        }


        if (
            erro?.code ===
            "failed-precondition"
        ) {

            mensagem =
                "⚠️ Erro de configuração do Firestore.";

        }


        if (
            erro?.message
        ) {

            console.error(
                "Detalhes:",
                erro.message
            );

        }


        tabela.innerHTML = `

            <tr>

                <td colspan="6">

                    ${mensagem}

                    <br>

                    <small>
                        Verifique o console do navegador
                        para mais detalhes.
                    </small>

                </td>

            </tr>

        `;

    }

}


// =======================================
// ABRIR CHAMADO
// =======================================

window.verChamado = async function (id) {

    try {

        chamadoAtual = id;


        const referencia =
            doc(
                db,
                "sac",
                id
            );


        const documento =
            await getDoc(referencia);


        if (!documento.exists()) {

            alert(
                "Este chamado não foi encontrado."
            );

            return;

        }


        const chamado =
            documento.data();


        // =======================================
        // DADOS DO CHAMADO
        // =======================================

        document.getElementById(
            "dadosChamado"
        ).innerHTML = `

            <p>
                <strong>Tipo:</strong>
                ${escaparHTML(
                    chamado.tipo || "-"
                )}
            </p>

            <p>
                <strong>Assunto:</strong>
                ${escaparHTML(
                    chamado.assunto || "-"
                )}
            </p>

            <p>
                <strong>Descrição:</strong>
                ${escaparHTML(
                    chamado.descricao || "-"
                )}
            </p>

            <p>
                <strong>Prioridade:</strong>
                ${escaparHTML(
                    chamado.prioridade || "-"
                )}
            </p>

        `;


        // =======================================
        // RESPOSTA
        // =======================================

        document.getElementById(
            "respostaSAC"
        ).value =
            chamado.resposta || "";


        // =======================================
        // STATUS
        // =======================================

        document.getElementById(
            "statusSAC"
        ).value =
            chamado.status || "Aberto";


        // =======================================
        // ABRIR MODAL
        // =======================================

        document.getElementById(
            "modalSAC"
        ).style.display = "flex";


    }

    catch (erro) {

        console.error(
            "Erro ao abrir chamado:",
            erro
        );

        alert(
            "Não foi possível abrir este chamado."
        );

    }

};


// =======================================
// FECHAR MODAL
// =======================================

window.fecharModalSAC = function () {

    const modal =
        document.getElementById(
            "modalSAC"
        );


    if (modal) {

        modal.style.display = "none";

    }


    chamadoAtual = null;

};


// =======================================
// SALVAR ATENDIMENTO
// =======================================

window.salvarAtendimentoSAC = async function () {

    if (!chamadoAtual) {

        alert(
            "Nenhum chamado selecionado."
        );

        return;

    }


    try {

        const resposta =
            document.getElementById(
                "respostaSAC"
            ).value.trim();


        const status =
            document.getElementById(
                "statusSAC"
            ).value;


        // =======================================
        // ATUALIZAR CHAMADO
        // =======================================

        await updateDoc(

            doc(
                db,
                "sac",
                chamadoAtual
            ),

            {

                resposta,

                status,

                atualizadoEm:
                    serverTimestamp(),

                atendidoPor:
                    "admin"

            }

        );


        // =======================================
        // AUDITORIA
        // =======================================

        try {

            await addDoc(

                collection(
                    db,
                    "auditoria"
                ),

                {

                    usuario: "admin",

                    modulo: "SAC",

                    acao:
                        "Atendimento SAC",

                    detalhes:
                        chamadoAtual,

                    status:
                        "Sucesso",

                    data:
                        serverTimestamp()

                }

            );

        }

        catch (erroAuditoria) {

            console.warn(
                "Chamado salvo, mas auditoria falhou:",
                erroAuditoria
            );

        }


        alert(
            "Atendimento salvo com sucesso."
        );


        fecharModalSAC();


        // =======================================
        // RECARREGAR TABELA
        // =======================================

        await carregarSAC();

    }

    catch (erro) {

        console.error(
            "Erro ao salvar atendimento:",
            erro
        );


        alert(
            "Não foi possível salvar o atendimento."
        );

    }

};


// =======================================
// ESCAPAR HTML
// =======================================

function escaparHTML(valor) {

    return String(valor)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


// =======================================
// INICIALIZAÇÃO
// =======================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Inicializando SAC Admin..."
        );

        carregarSAC();

    }
);

