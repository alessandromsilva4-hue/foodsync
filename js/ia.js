async function perguntarIA() {

    const mensagem =
        document.getElementById("mensagemIA").value.trim();

    const resposta =
        document.getElementById("respostaIA");

    if (!mensagem) {

        resposta.innerHTML = `
        <div class="ia-resposta">
            <div class="ia-titulo">
                🤖 Lotrix AI
            </div>

            <div class="ia-texto">
                Digite uma pergunta para continuar.
            </div>
        </div>
        `;

        return;

    }

    resposta.innerHTML = `
    <div class="ia-resposta">
        <div class="ia-titulo">
            🤖 Lotrix AI
        </div>

        <div class="ia-texto">
            ⏳ Analisando informações...
        </div>
    </div>
    `;

    try {

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

        const dados = await retorno.json();

        resposta.innerHTML = `
        <div class="ia-resposta">
            <div class="ia-titulo">
                🤖 Lotrix AI
            </div>

            <div class="ia-texto">
                ${(dados.resposta || "Sem resposta da IA.").replace(/\n/g, "<br>")}
            </div>
        </div>
        `;

    } catch (erro) {

        console.error(erro);

        resposta.innerHTML = `
        <div class="ia-resposta">
            <div class="ia-titulo">
                🤖 Lotrix AI
            </div>

            <div class="ia-texto">
                ❌ Não foi possível conectar à Lotrix AI.
            </div>
        </div>
        `;

    }

}



async function perguntaRapida(texto){

    const campo = document.getElementById("mensagemIA");

    campo.value = texto;

    await perguntarIA();

}



// deixa disponível para os botões HTML
window.perguntaRapida = perguntaRapida;
window.perguntarIA = perguntarIA;