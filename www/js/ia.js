// ==========================================
// LOTRIX AI
// ==========================================

console.log("IA.JS CARREGADO");

const LIMITE_CARACTERES_IA = 2_000;
const TEMPO_LIMITE_IA_MS = 20_000;

function exibirRespostaIA(elemento, texto) {
    elemento.replaceChildren();

    const cartao = document.createElement("div");
    cartao.className = "ia-resposta";

    const titulo = document.createElement("div");
    titulo.className = "ia-titulo";
    titulo.textContent = "🤖 Lotrix AI";

    const conteudo = document.createElement("div");
    conteudo.className = "ia-texto";
    conteudo.style.whiteSpace = "pre-wrap";
    conteudo.textContent = texto;

    cartao.append(titulo, conteudo);
    elemento.append(cartao);
}


// ==========================================
// PERGUNTAR À IA
// ==========================================

async function perguntarIA(texto = null) {

    const campo = document.getElementById("mensagemIA");
    const resposta = document.getElementById("respostaIA");

    if (!campo) {

        console.error(
            "Campo #mensagemIA não encontrado no HTML."
        );

        return;
    }

    if (!resposta) {

        console.error(
            "Elemento #respostaIA não encontrado no HTML."
        );

        return;
    }


    // Se veio uma pergunta rápida
    // coloca ela no campo

    if (texto) {
        campo.value = texto;
    }


    const mensagem = campo.value.trim();


    if (!mensagem) {
        exibirRespostaIA(resposta, "Digite uma pergunta para continuar.");

        return;
    }

    if (mensagem.length > LIMITE_CARACTERES_IA) {
        exibirRespostaIA(
            resposta,
            `A pergunta deve ter no máximo ${LIMITE_CARACTERES_IA} caracteres.`
        );

        return;
    }


    // ==========================================
    // CARREGANDO
    // ==========================================

    exibirRespostaIA(resposta, "⏳ Analisando informações...");


    try {

        console.log(
            "Pergunta enviada para Lotrix AI:",
            mensagem
        );


        const controlador = new AbortController();
        const limiteTempo = setTimeout(
            () => controlador.abort(),
            TEMPO_LIMITE_IA_MS
        );

        let retorno;

        try {
            retorno = await fetch(
            "https://foodsync-ai.onrender.com/ia",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    mensagem: mensagem
                }),

                signal: controlador.signal
            }
            );
        } finally {
            clearTimeout(limiteTempo);
        }


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


        exibirRespostaIA(resposta, textoResposta);


        // Limpa o campo depois de enviar

        campo.value = "";


    } catch (erro) {

        console.error(
            "Erro ao conectar com a Lotrix AI:",
            erro
        );


        const mensagemErro = erro.name === "AbortError"
            ? "❌ A consulta demorou demais. Tente novamente."
            : "❌ Não foi possível conectar à Lotrix AI.";

        exibirRespostaIA(resposta, mensagemErro);

    }

}



// ==========================================
// PERGUNTAS RÁPIDAS
// ==========================================

async function perguntaRapida(texto) {

    await perguntarIA(texto);

}



// ==========================================
// DISPONÍVEL PARA O HTML
// ==========================================

window.perguntarIA = perguntarIA;
window.perguntaRapida = perguntaRapida;
