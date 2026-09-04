/* =========================================================
   LOTRIX — NAVEGAÇÃO GLOBAL
   Sidebar única para todas as telas
   CORREÇÃO DEFINITIVA DO MENU MOBILE/TABLET
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;

    const menuButton = document.getElementById("sidebarMenuToggle");
    const overlay = document.getElementById("sidebarOverlay");
    const optionsButton = document.getElementById("sidebarOptionsToggle");
    const options = document.getElementById("sidebarOptions");
    const refreshButton = document.getElementById("sidebarRefresh");

    /* =====================================================
       DETECTA DESKTOP
    ===================================================== */

    const isDesktop = () =>
        window.matchMedia("(min-width: 901px)").matches;


    /* =====================================================
       BOTÃO MOBILE ☰
    ===================================================== */

    let mobileToggle = document.querySelector(".menu-toggle");

    if (!mobileToggle) {

        mobileToggle = document.createElement("button");

        mobileToggle.type = "button";
        mobileToggle.className = "menu-toggle";

        mobileToggle.setAttribute(
            "aria-label",
            "Abrir menu lateral"
        );

        mobileToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        mobileToggle.title = "Abrir menu";

        mobileToggle.innerHTML =
            '<i data-lucide="menu" aria-hidden="true"></i>';

        document.body.appendChild(mobileToggle);

    } else {

        mobileToggle.type = "button";

        mobileToggle.innerHTML =
            '<i data-lucide="menu" aria-hidden="true"></i>';
    }


    /* =====================================================
       ESTADO DESKTOP
    ===================================================== */

    function setCollapsed(collapsed) {

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
                String(!collapsed)
            );

            menuButton.setAttribute(
                "aria-label",
                collapsed
                    ? "Expandir menu"
                    : "Recolher menu"
            );
        }

        try {

            localStorage.setItem(
                "lotrix_sidebar_collapsed",
                collapsed ? "1" : "0"
            );

        } catch (_) {}
    }


    /* =====================================================
       ABRIR MENU MOBILE
    ===================================================== */

    function openMobile() {

        sidebar.classList.add("open");

        document.body.classList.add(
            "sidebar-open"
        );

        if (overlay) {

            overlay.classList.add("active");

            overlay.setAttribute(
                "aria-hidden",
                "false"
            );
        }

        if (mobileToggle) {

            mobileToggle.setAttribute(
                "aria-expanded",
                "true"
            );

            mobileToggle.setAttribute(
                "aria-label",
                "Fechar menu lateral"
            );

            mobileToggle.title =
                "Fechar menu";
        }
    }


    /* =====================================================
       FECHAR MENU MOBILE
    ===================================================== */

    function closeMobile() {

        sidebar.classList.remove("open");

        document.body.classList.remove(
            "sidebar-open"
        );

        if (overlay) {

            overlay.classList.remove("active");

            overlay.setAttribute(
                "aria-hidden",
                "true"
            );
        }

        if (mobileToggle) {

            mobileToggle.setAttribute(
                "aria-expanded",
                "false"
            );

            mobileToggle.setAttribute(
                "aria-label",
                "Abrir menu lateral"
            );

            mobileToggle.title =
                "Abrir menu";
        }
    }


    /* =====================================================
       ALTERNAR MENU
    ===================================================== */

    function toggleMenu(event) {

        if (event) {

            event.preventDefault();
            event.stopPropagation();
        }

        if (isDesktop()) {

            setCollapsed(
                !sidebar.classList.contains(
                    "collapsed"
                )
            );

            return;
        }

        if (
            sidebar.classList.contains("open")
        ) {

            closeMobile();

        } else {

            openMobile();
        }
    }


    /* =====================================================
       CLIQUE NO ☰ MOBILE
    ===================================================== */

    if (mobileToggle) {

        mobileToggle.addEventListener(
            "click",
            toggleMenu,
            false
        );

        mobileToggle.addEventListener(
            "touchend",
            (event) => {

                event.preventDefault();

                toggleMenu(event);

            },
            {
                passive: false
            }
        );
    }


    /* =====================================================
       BOTÃO DA SIDEBAR DESKTOP
    ===================================================== */

    if (menuButton) {

        menuButton.type = "button";

        menuButton.addEventListener(
            "click",
            (event) => {

                event.preventDefault();
                event.stopPropagation();

                toggleMenu(event);
            }
        );
    }


    /* =====================================================
       OVERLAY
    ===================================================== */

    if (overlay) {

        overlay.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                closeMobile();
            }
        );
    }


    /* =====================================================
       TECLA ESC
    ===================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Escape") {

                closeMobile();
                closeOptions();
            }
        }
    );


    /* =====================================================
       OPÇÕES ⋮
    ===================================================== */

    function closeOptions() {

        if (!options || !optionsButton) {
            return;
        }

        options.hidden = true;

        optionsButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }


    if (optionsButton) {

        optionsButton.addEventListener(
            "click",
            (event) => {

                event.preventDefault();
                event.stopPropagation();

                if (!options) {
                    return;
                }

                const open =
                    options.hidden;

                options.hidden = !open;

                optionsButton.setAttribute(
                    "aria-expanded",
                    String(open)
                );

                if (open) {

                    requestAnimationFrame(() => {

                        options
                            .querySelector(
                                "a, button"
                            )
                            ?.focus();

                    });
                }
            }
        );
    }


    if (options) {

        options.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();
            }
        );
    }


    document.addEventListener(
        "click",
        () => {

            closeOptions();
        }
    );


    /* =====================================================
       ATUALIZAR
    ===================================================== */

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            () => {

                window.location.reload();
            }
        );
    }


    /* =====================================================
       MARCAR PÁGINA ATUAL
    ===================================================== */

    const current =
        location.pathname
            .split("/")
            .pop()
            .toLowerCase()
        || "dashboard.html";


    sidebar
        .querySelectorAll(
            ".menu a[data-page]"
        )
        .forEach((link) => {

            link.classList.toggle(
                "active",
                link.dataset.page
                    .toLowerCase() === current
            );
        });


    /* =====================================================
       FECHAR AO NAVEGAR
    ===================================================== */

    sidebar
        .querySelectorAll(
            ".menu a, .sidebar-brand, .sidebar-options a"
        )
        .forEach((link) => {

            link.addEventListener(
                "click",
                () => {

                    if (!isDesktop()) {
                        closeMobile();
                    }
                }
            );
        });


    /* =====================================================
       ESTADO INICIAL
    ===================================================== */

    if (isDesktop()) {

        try {

            setCollapsed(
                localStorage.getItem(
                    "lotrix_sidebar_collapsed"
                ) === "1"
            );

        } catch (_) {}

    } else {

        closeMobile();
    }


    /* =====================================================
       RESIZE
    ===================================================== */

    window.addEventListener(
        "resize",
        () => {

            if (isDesktop()) {

                closeMobile();

                try {

                    setCollapsed(
                        localStorage.getItem(
                            "lotrix_sidebar_collapsed"
                        ) === "1"
                    );

                } catch (_) {}

            }
        }
    );


    /* =====================================================
       LUCIDE
    ===================================================== */

    if (window.lucide) {

        window.lucide.createIcons();
    }

});