/* Menu lateral retrátil compartilhado por todas as telas. */

document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;

    sidebar.id ||= "sidebar";

    let menuToggle = document.getElementById("menuToggle");
    if (!menuToggle) {
        menuToggle = document.createElement("button");
        menuToggle.id = "menuToggle";
        menuToggle.className = "menu-toggle";
        menuToggle.type = "button";
        menuToggle.setAttribute("aria-label", "Abrir menu");
        menuToggle.textContent = "☰";
        document.body.prepend(menuToggle);
    }

    let sidebarClose = document.getElementById("sidebarClose");
    if (!sidebarClose) {
        sidebarClose = document.createElement("button");
        sidebarClose.id = "sidebarClose";
        sidebarClose.className = "sidebar-close";
        sidebarClose.type = "button";
        sidebarClose.setAttribute("aria-label", "Fechar menu");
        sidebarClose.textContent = "×";
        sidebar.prepend(sidebarClose);
    }

    let sidebarOverlay = document.getElementById("sidebarOverlay");
    if (!sidebarOverlay) {
        sidebarOverlay = document.createElement("div");
        sidebarOverlay.id = "sidebarOverlay";
        sidebarOverlay.className = "sidebar-overlay";
        document.body.append(sidebarOverlay);
    }

    function abrirMenu() {
        sidebar.classList.add("open");
        sidebarOverlay.classList.add("active");
        menuToggle.setAttribute("aria-expanded", "true");
        sidebarClose.focus();
    }

    function fecharMenu() {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
    }

    menuToggle.setAttribute("aria-controls", sidebar.id);
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.addEventListener("click", abrirMenu);
    sidebarClose.addEventListener("click", fecharMenu);
    sidebarOverlay.addEventListener("click", fecharMenu);

    sidebar.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", fecharMenu);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") fecharMenu();
    });
});
