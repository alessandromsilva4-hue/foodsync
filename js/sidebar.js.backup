/* =========================================================
   LOTRIX — NAVEGAÇÃO GLOBAL
   Uma única Sidebar para todas as telas.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;

    const menuButton = document.getElementById("sidebarMenuToggle");
    const overlay = document.getElementById("sidebarOverlay");
    const optionsButton = document.getElementById("sidebarOptionsToggle");
    const options = document.getElementById("sidebarOptions");
    const refreshButton = document.getElementById("sidebarRefresh");

    // No aplicativo/tablet a Sidebar é um drawer. Algumas páginas antigas
    // não possuem o botão externo; criamos um automaticamente.
    let mobileToggle = document.querySelector(".menu-toggle");
    if (!mobileToggle) {
        mobileToggle = document.createElement("button");
        mobileToggle.type = "button";
        mobileToggle.className = "menu-toggle";
        mobileToggle.setAttribute("aria-label", "Abrir menu lateral");
        mobileToggle.setAttribute("aria-expanded", "false");
        mobileToggle.title = "Abrir menu";
        mobileToggle.innerHTML = '<i data-lucide="menu" aria-hidden="true"></i>';
        document.body.appendChild(mobileToggle);
    } else {
        // O botão antigo do Dashboard usava "more-vertical"; padroniza para menu.
        mobileToggle.innerHTML = '<i data-lucide="menu" aria-hidden="true"></i>';
    }

    const desktop = () => window.matchMedia("(min-width: 901px)").matches;

    function setCollapsed(collapsed) {
        sidebar.classList.toggle("collapsed", collapsed);
        if (menuButton) {
            menuButton.setAttribute("aria-expanded", String(!collapsed));
            menuButton.setAttribute("aria-label", collapsed ? "Expandir menu" : "Recolher menu");
        }
        document.body.classList.toggle("sidebar-collapsed", collapsed);
        try { localStorage.setItem("lotrix_sidebar_collapsed", collapsed ? "1" : "0"); } catch (_) {}
    }

    function openMobile() {
        sidebar.classList.add("open");
        overlay?.classList.add("active");
        document.body.classList.add("sidebar-open");
        overlay?.setAttribute("aria-hidden", "false");
        syncMobileToggle();
    }

    function closeMobile() {
        sidebar.classList.remove("open");
        overlay?.classList.remove("active");
        document.body.classList.remove("sidebar-open");
        overlay?.setAttribute("aria-hidden", "true");
        syncMobileToggle();
    }

    function syncMobileToggle() {
        if (!mobileToggle) return;
        const opened = sidebar.classList.contains("open");
        mobileToggle.setAttribute("aria-expanded", String(opened));
        mobileToggle.setAttribute("aria-label", opened ? "Fechar menu lateral" : "Abrir menu lateral");
    }

    mobileToggle?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (sidebar.classList.contains("open")) {
            closeMobile();
        } else {
            openMobile();
        }
        syncMobileToggle();
    });

    menuButton?.addEventListener("click", () => {
        if (desktop()) {
            setCollapsed(!sidebar.classList.contains("collapsed"));
        } else {
            sidebar.classList.contains("open") ? closeMobile() : openMobile();
        }
    });

    overlay?.addEventListener("click", closeMobile);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMobile();
            if (options && !options.hidden) closeOptions();
        }
    });

    function closeOptions() {
        if (!options || !optionsButton) return;
        options.hidden = true;
        optionsButton.setAttribute("aria-expanded", "false");
    }

    optionsButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!options) return;
        options.hidden = !options.hidden;
        optionsButton.setAttribute("aria-expanded", String(!options.hidden));
        if (!options.hidden) options.querySelector("a, button")?.focus();
    });

    options?.addEventListener("click", event => event.stopPropagation());
    document.addEventListener("click", closeOptions);
    refreshButton?.addEventListener("click", () => window.location.reload());

    // Marca automaticamente a página atual.
    const current = location.pathname.split("/").pop().toLowerCase() || "dashboard.html";
    sidebar.querySelectorAll(".menu a[data-page]").forEach(link => {
        link.classList.toggle("active", link.dataset.page.toLowerCase() === current);
    });

    // Fecha o drawer ao navegar no celular.
    sidebar.querySelectorAll(".menu a, .sidebar-brand, .sidebar-options a").forEach(link => {
        link.addEventListener("click", closeMobile);
    });

    // Estado salvo apenas para desktop.
    try {
        if (desktop()) setCollapsed(localStorage.getItem("lotrix_sidebar_collapsed") === "1");
    } catch (_) {}

    window.addEventListener("resize", () => {
        if (desktop()) {
            closeMobile();
            try {
                setCollapsed(localStorage.getItem("lotrix_sidebar_collapsed") === "1");
            } catch (_) {}
        }
    });

    if (window.lucide) window.lucide.createIcons();
});