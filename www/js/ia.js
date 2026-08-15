// ==========================================
// LOTRIX AI
// ==========================================

console.log("IA.JS CARREGADO");


// ==========================================
// PERGUNTAR ? IA
// ==========================================

async function perguntarIA(texto = null) {

    const campo = document.getElementById("mensagemIA");
    const resposta = document.getElementById("respostaIA");

    if (!campo) {

        console.error(
            "Campo #mensagemIA n?o encontrado no HTML."
        );

        return;
    }

    if (!resposta) {

        console.error(
            "Elemento #respostaIA n?o encontrado no HTML."
        );

        return;
    }


    // Se veio uma pergunta r?pida
    // coloca ela no campo

    if (texto) {
        campo.value = texto;
    }


    const mensagem = campo.value.trim();


    if (!mensagem) {

        resposta.innerHTML = `
            <div class="ia-resposta">

                <div class="ia-titulo">
                    ?? Lotrix AI
                </div>

                <div class="ia-texto">
                    Digite uma pergunta para continuar.
                </div>

            </div>
        `;

        return;
    }


    // ==========================================
    // CARREGANDO
    // ==========================================

    resposta.innerHTML = `
        <div class="ia-resposta">

            <div class="ia-titulo">
                ?? Lotrix AI
            </div>

            <div class="ia-texto">
                ? Analisando informa??es...
            </div>

        </div>
    `;


    try {

        console.log(
            "Pergunta enviada para Lotrix AI:",
            mensagem
        );


        const retorno = await fetch(
            "https://foodsync-ai.onrender.com/ia",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    mensagem: mensagem
                })
            }
        );


        if (!retorno.ok) {

            throw new Error(
                `Erro HTTP ${retorno.status}`
            );

        }


        const dados = await retorno.json();


        console.log(
            "Resposta da Lotrix AI:",
            dados
        );


        const textoResposta =
            dados.resposta ||
            dados.message ||
            "Sem resposta da IA.";


        resposta.innerHTML = `
            <div class="ia-resposta">

                <div class="ia-titulo">
                    ?? Lotrix AI
                </div>

                <div class="ia-texto">
                    ${textoResposta.replace(/\n/g, "<br>")}
                </div>

            </div>
        `;


        // Limpa o campo depois de enviar

        campo.value = "";


    } catch (erro) {

        console.error(
            "Erro ao conectar com a Lotrix AI:",
            erro
        );


        resposta.innerHTML = `
            <div class="ia-resposta">

                <div class="ia-titulo">
                    ?? Lotrix AI
                </div>

                <div class="ia-texto">
                    ? N?o foi poss?vel conectar ? Lotrix AI.
                </div>

            </div>
        `;

    }

}



// ==========================================
// PERGUNTAS R?PIDAS
// ==========================================

async function perguntaRapida(texto) {

    await perguntarIA(texto);

}



// ==========================================
// DISPON?VEL PARA O HTML
// ==========================================

window.perguntarIA = perguntarIA;
window.perguntaRapida = perguntaRapida;