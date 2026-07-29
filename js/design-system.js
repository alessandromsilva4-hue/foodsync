/* Design system visual compartilhado: ícones Lucide para navegação e cartões. */

const sidebarIcons = {
    "dashboard.html": "layout-dashboard", "producao.html": "utensils-crossed",
    "produtos.html": "package", "etiquetas.html": "tags", "estoque.html": "clipboard-list",
    "relatorios.html": "chart-no-axes-combined", "auditoria.html": "file-search", "historico.html": "history",
    "usuario.html": "users-round", "configuracoes.html": "settings-2", "ajuda.html": "circle-help",
    "sac.html": "headset", "sac-admin.html": "shield-check"
};

const cardIcons = ["package-check", "calendar-clock", "badge-alert", "chart-no-axes-combined"];

function currentTheme() {
    return localStorage.getItem("lotrix-theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("lotrix-theme", theme);
    const toggle = document.querySelector(".theme-toggle");
    if (toggle) {
        const isDark = theme === "dark";
        toggle.setAttribute("aria-pressed", String(isDark));
        toggle.setAttribute("aria-label", isDark ? "Ativar tema claro" : "Ativar tema escuro");
        toggle.innerHTML = `<i data-lucide="${isDark ? "sun" : "moon"}" aria-hidden="true"></i><span>${isDark ? "Tema claro" : "Tema escuro"}</span>`;
        window.lucide?.createIcons();
    }
}

function installThemeToggle() {
    const footer = document.querySelector(".sidebar-footer");
    if (!footer || footer.querySelector(".theme-toggle")) return;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "theme-toggle";
    toggle.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
    footer.prepend(toggle);
    applyTheme(document.documentElement.dataset.theme || currentTheme());
}

function installIconMarkup() {
    document.querySelectorAll(".sidebar .menu a").forEach((link) => {
        const page = link.getAttribute("href")?.split("/").pop();
        const icon = sidebarIcons[page];
        if (!icon) return;
        const label = link.textContent.trim();
        link.setAttribute("aria-label", label);
        link.innerHTML = `<i data-lucide="${icon}" aria-hidden="true"></i><span class="nav-label">${label}</span>`;
    });

    document.querySelectorAll(".card-icon").forEach((card, index) => {
        const icon = cardIcons[index];
        if (icon) card.innerHTML = `<i data-lucide="${icon}" aria-hidden="true"></i>`;
    });

    const logoutButton = document.querySelector(".sidebar-footer button");
    if (logoutButton) logoutButton.innerHTML = '<i data-lucide="log-out" aria-hidden="true"></i><span>Sair</span>';
    window.lucide?.createIcons();
}

function loadLucide() {
    if (window.lucide) return installIconMarkup();
    const script = document.createElement("script");
    script.src = "https://unpkg.com/lucide@latest";
    script.defer = true;
    script.onload = installIconMarkup;
    document.head.appendChild(script);
}

function enableMicroInteractions() {
    document.documentElement.classList.add("design-ready");
    document.addEventListener("click", (event) => {
        const button = event.target.closest("button, .button");
        if (!button || button.disabled) return;
        const bounds = button.getBoundingClientRect();
        const ripple = document.createElement("span");
        ripple.className = "button-ripple";
        ripple.style.left = `${event.clientX - bounds.left}px`;
        ripple.style.top = `${event.clientY - bounds.top}px`;
        button.appendChild(ripple);
        ripple.addEventListener("animationend", () => ripple.remove());
    });
}

applyTheme(currentTheme());
enableMicroInteractions();
installThemeToggle();
if (document.querySelector(".sidebar") || document.querySelector(".card-icon")) loadLucide();
