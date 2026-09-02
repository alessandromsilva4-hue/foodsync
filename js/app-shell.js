/* Recursos compartilhados que deixam o sistema mais confiável no navegador e no app. */

(() => {
    function atualizarConexao() {
        const status = document.getElementById("connectionStatus");
        if (status) status.hidden = navigator.onLine;
    }

    function instalarStatusDeConexao() {
        let status = document.getElementById("connectionStatus");
        if (!status) {
            status = document.createElement("div");
            status.id = "connectionStatus";
            status.className = "connection-status";
            status.setAttribute("role", "status");
            status.setAttribute("aria-live", "polite");
            status.textContent = "Você está sem conexão. Algumas informações podem estar desatualizadas.";
            document.body.append(status);
        }

        atualizarConexao();
        window.addEventListener("online", atualizarConexao);
        window.addEventListener("offline", atualizarConexao);
    }

    function instalarAtalhoDeConteudo() {
        const destino = document.querySelector("main, .content");
        if (!destino || document.querySelector(".skip-to-content")) return;

        destino.id ||= "conteudo-principal";
        const atalho = document.createElement("a");
        atalho.className = "skip-to-content";
        atalho.href = `#${destino.id}`;
        atalho.textContent = "Ir para o conteúdo principal";
        document.body.prepend(atalho);
    }

    function iniciar() {
        instalarStatusDeConexao();
        instalarAtalhoDeConteudo();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar, { once: true });
    } else {
        iniciar();
    }
})();
