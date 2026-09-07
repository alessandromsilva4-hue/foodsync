// =======================================
// LOTRIX - SIDEBAR / NAVEGAÇÃO GLOBAL
// V17 - CORREÇÃO DEFINITIVA MENU
// =======================================
//
// - Botão mobile permanece visível
// - Botão desktop independente do botão mobile
// - Evita conflito entre touch + click
// - Sidebar abre/fecha corretamente
// - Overlay funciona
// - Desktop preservado
// - Estado collapsed salvo no localStorage
// =======================================

(function () {

    "use strict";

    // =======================================
    // ELEMENTOS PRINCIPAIS
    // =======================================

    const sidebar = document.querySelector(".sidebar");

    if (!sidebar) {
        console.warn("LOTRIX: Sidebar não encontrada.");
        return;
    }

    const menuButton = document.getElementById("sidebarMenuToggle");

    const overlay = document.getElementById("sidebarOverlay");

    const optionsButton = document.getElementById("sidebarOptionsToggle");

    const options = document.getElementById("sidebarOptions");

    const refreshButton = document.getElementById("sidebarRefresh");

    // =======================================
    // IDENTIFICA DESKTOP
    // =======================================

    const isDesktop = () => {
        return window.matchMedia("(min-width: 901px)").matches;
    };

    // =======================================
    // BOTÃO MOBILE
    //
    // IMPORTANTE:
    // NÃO pode pegar o #sidebarMenuToggle
    // =======================================

    let mobileToggle = document.querySelector(
        ".menu-toggle:not(#sidebarMenuToggle)"
    );

    // =======================================
    // CRIA BOTÃO MOBILE CASO NÃO EXISTA
    // =======================================

    if (!mobileToggle) {

        mobileToggle = document.createElement("button");

        mobileToggle.className = "menu-toggle";

        mobileToggle.type = "button";

        mobileToggle.setAttribute(
            "aria-label",
            "Abrir menu"
        );

        mobileToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        mobileToggle.innerHTML = `
            <i data-lucide="menu"></i>
        `;

        document.body.appendChild(mobileToggle);
    }

    // =======================================
    // GARANTE QUE BOTÃO MOBILE FIQUE FORA
    // DA SIDEBAR
    // =======================================

    if (
        mobileToggle &&
        mobileToggle.parentElement !== document.body
    ) {
        document.body.appendChild(mobileToggle);
    }

    // =======================================
    // ESTADO DA SIDEBAR
    // =======================================

    let isMobileOpen = false;

    // =======================================
    // STORAGE
    // =======================================

    const STORAGE_KEY = "lotrix_sidebar_collapsed";

    // =======================================
    // LÊ ESTADO SALVO
    // =======================================

    function getSavedCollapsed() {

        try {

            return (
                localStorage.getItem(STORAGE_KEY) === "true"
            );

        } catch (error) {

            return false;
        }
    }

    // =======================================
    // SALVA ESTADO
    // =======================================

    function saveCollapsed(value) {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                value ? "true" : "false"
            );

        } catch (error) {

            console.warn(
                "LOTRIX: Não foi possível salvar estado da sidebar."
            );
        }
    }

    // =======================================
    // APLICA ESTADO COLLAPSED
    // DESKTOP
    // =======================================

    function setCollapsed(collapsed) {

        if (!sidebar) {
            return;
        }

        sidebar.classList.toggle(
            "collapsed",
            collapsed
        );

        document.body.classList.toggle(
            "sidebar-collapsed",
            collapsed
        );

        if (menuButton) {

            menuButton.setAttribute(
                "aria-expanded",
                collapsed ? "false" : "true"
            );
        }

        saveCollapsed(collapsed);
    }

    // =======================================
    // ABRIR MENU MOBILE
    // =======================================

    function openMobile() {

        if (!sidebar) {
            return;
        }

        sidebar.classList.add("open");

        document.body.classList.add(
            "sidebar-open"
        );

        if (overlay) {

            overlay.classList.add("active");
        }

        isMobileOpen = true;

        if (mobileToggle) {

            mobileToggle.setAttribute(
                "aria-expanded",
                "true"
            );

            mobileToggle.setAttribute(
                "aria-label",
                "Fechar menu"
            );

            // ===================================
            // GARANTIA DO BOTÃO MOBILE
            // ===================================

            mobileToggle.style.position = "fixed";

            mobileToggle.style.zIndex = "110000";

            mobileToggle.style.pointerEvents = "auto";

            mobileToggle.style.transform = "none";
        }

        // ===================================
        // GARANTE QUE SIDEBAR NÃO FIQUE
        // ATRÁS DO BOTÃO
        // ===================================

        sidebar.style.zIndex = "100000";
    }

    // =======================================
    // FECHAR MENU MOBILE
    // =======================================

    function closeMobile() {

        if (!sidebar) {
            return;
        }

        sidebar.classList.remove("open");

        document.body.classList.remove(
            "sidebar-open"
        );

        if (overlay) {

            overlay.classList.remove("active");
        }

        isMobileOpen = false;

        if (mobileToggle) {

            mobileToggle.setAttribute(
                "aria-expanded",
                "false"
            );

            mobileToggle.setAttribute(
                "aria-label",
                "Abrir menu"
            );

            // ===================================
            // GARANTIA DO BOTÃO MOBILE
            // ===================================

            mobileToggle.style.position = "fixed";

            mobileToggle.style.zIndex = "110000";

            mobileToggle.style.pointerEvents = "auto";

            mobileToggle.style.transform = "none";
        }
    }

    // =======================================
    // TOGGLE PRINCIPAL
    // =======================================

    function toggleMenu(event) {

        if (event) {

            event.preventDefault();

            event.stopPropagation();
        }

        // ===================================
        // DESKTOP
        // ===================================

        if (isDesktop()) {

            const collapsed =
                sidebar.classList.contains("collapsed");

            setCollapsed(!collapsed);

            return;
        }

        // ===================================
        // MOBILE
        // ===================================

        if (isMobileOpen) {

            closeMobile();

        } else {

            openMobile();
        }
    }

    // =======================================
    // BOTÃO DESKTOP
    // =======================================

    if (menuButton) {

        menuButton.addEventListener(
            "click",
            function (event) {

                toggleMenu(event);

            },
            false
        );

        menuButton.addEventListener(
            "touchstart",
            function (event) {

                // Não executar ação duplicada
                event.stopPropagation();

            },
            {
                passive: true
            }
        );
    }

    // =======================================
    // BOTÃO MOBILE
    // =======================================

    if (mobileToggle) {

        mobileToggle.addEventListener(
            "click",
            function (event) {

                toggleMenu(event);

            },
            false
        );
    }

    // =======================================
    // OVERLAY
    // =======================================

    if (overlay) {

        overlay.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                closeMobile();

            },
            false
        );
    }

    // =======================================
    // ESC FECHA MENU
    // =======================================

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                if (!isDesktop() && isMobileOpen) {

                    closeMobile();
                }

                if (
                    options &&
                    options.classList.contains("open")
                ) {

                    options.classList.remove("open");
                }
            }
        },
        false
    );

    // =======================================
    // BOTÃO DE OPÇÕES
    // =======================================

    if (optionsButton && options) {

        optionsButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                options.classList.toggle("open");

            },
            false
        );
    }

    // =======================================
    // FECHAR OPÇÕES CLICANDO FORA
    // =======================================

    document.addEventListener(
        "click",
        function (event) {

            if (
                options &&
                options.classList.contains("open")
            ) {

                if (
                    !options.contains(event.target) &&
                    !(
                        optionsButton &&
                        optionsButton.contains(event.target)
                    )
                ) {

                    options.classList.remove("open");
                }
            }
        },
        false
    );

    // =======================================
    // ATUALIZAR PÁGINA
    // =======================================

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                window.location.reload();

            },
            false
        );
    }

    // =======================================
    // PÁGINA ATUAL
    // =======================================

    function markCurrentPage() {

        const currentPage =
            window.location.pathname
                .split("/")
                .pop();

        if (!currentPage) {
            return;
        }

        const links =
            sidebar.querySelectorAll(
                "a[href]"
            );

        links.forEach(function (link) {

            const href =
                link.getAttribute("href");

            if (!href) {
                return;
            }

            const linkPage =
                href
                    .split("/")
                    .pop()
                    .split("?")[0]
                    .split("#")[0];

            if (
                linkPage &&
                linkPage === currentPage
            ) {

                link.classList.add("active");

            } else {

                link.classList.remove("active");
            }
        });
    }

    // =======================================
    // LINKS DA SIDEBAR
    // =======================================

    const sidebarLinks =
        sidebar.querySelectorAll(
            "a[href]"
        );

    sidebarLinks.forEach(function (link) {

        link.addEventListener(
            "click",
            function () {

                // ===================================
                // MOBILE
                // ===================================

                if (!isDesktop()) {

                    closeMobile();
                }
            },
            false
        );
    });

    // =======================================
    // ESTADO INICIAL
    // =======================================

    function initializeSidebar() {

        if (isDesktop()) {

            // ===================================
            // DESKTOP
            // ===================================

            const saved =
                getSavedCollapsed();

            setCollapsed(saved);

            closeMobile();

        } else {

            // ===================================
            // MOBILE
            // ===================================

            sidebar.classList.remove(
                "collapsed"
            );

            document.body.classList.remove(
                "sidebar-collapsed"
            );

            closeMobile();
        }

        markCurrentPage();
    }

    // =======================================
    // RESIZE
    // =======================================

    let resizeTimer = null;

    window.addEventListener(
        "resize",
        function () {

            clearTimeout(resizeTimer);

            resizeTimer = setTimeout(
                function () {

                    if (isDesktop()) {

                        // ===================================
                        // ENTROU NO DESKTOP
                        // ===================================

                        closeMobile();

                        const saved =
                            getSavedCollapsed();

                        setCollapsed(saved);

                    } else {

                        // ===================================
                        // ENTROU NO MOBILE
                        // ===================================

                        closeMobile();

                        sidebar.classList.remove(
                            "collapsed"
                        );

                        document.body.classList.remove(
                            "sidebar-collapsed"
                        );
                    }

                },
                150
            );
        },
        false
    );

    // =======================================
    // INICIALIZA
    // =======================================

    initializeSidebar();

    // =======================================
    // LUCIDE ICONS
    // =======================================

    function refreshIcons() {

        try {

            if (
                typeof lucide !== "undefined" &&
                typeof lucide.createIcons === "function"
            ) {

                lucide.createIcons();

            }

        } catch (error) {

            console.warn(
                "LOTRIX: Erro ao carregar ícones Lucide.",
                error
            );
        }
    }

    // =======================================
    // PRIMEIRA CARGA
    // =======================================

    refreshIcons();

    // =======================================
    // PEQUENO ATRASO PARA ELEMENTOS
    // CRIADOS DINAMICAMENTE
    // =======================================

    setTimeout(
        function () {

            refreshIcons();

        },
        100
    );

    // =======================================
    // GARANTIA FINAL DO BOTÃO MOBILE
    // =======================================

    if (mobileToggle) {

        mobileToggle.style.position = "fixed";

        mobileToggle.style.zIndex = "110000";

        mobileToggle.style.pointerEvents = "auto";

        mobileToggle.style.transform = "none";
    }

    // =======================================
    // OBSERVADOR PARA EVITAR QUE ALGUM
    // SCRIPT MOVA O BOTÃO MOBILE
    // =======================================

    if (mobileToggle) {

        const buttonObserver =
            new MutationObserver(
                function () {

                    if (!mobileToggle) {
                        return;
                    }

                    if (
                        !isDesktop()
                    ) {

                        mobileToggle.style.position =
                            "fixed";

                        mobileToggle.style.zIndex =
                            "110000";

                        mobileToggle.style.pointerEvents =
                            "auto";

                        mobileToggle.style.transform =
                            "none";
                    }
                }
            );

        buttonObserver.observe(
            mobileToggle,
            {
                attributes: true,
                attributeFilter: [
                    "style",
                    "class"
                ]
            }
        );
    }

    // =======================================
    // FIM
    // =======================================

})();