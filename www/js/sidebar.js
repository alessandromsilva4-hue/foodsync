/* ==========================================
   LOTRIX - MENU LATERAL GLOBAL
   Arquivo: www/js/sidebar.js
========================================== */

document.addEventListener("DOMContentLoaded", function () {

    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");
    const sidebarClose = document.getElementById("sidebarClose");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    /* Verifica se a p?gina possui o menu */
    if (!sidebar || !menuToggle || !sidebarClose || !sidebarOverlay) {
        return;
    }


    /* ==========================================
       ABRIR MENU
    ========================================== */

    function abrirMenu() {

        sidebar.classList.add("open");

        sidebarOverlay.classList.add("active");

    }


    /* ==========================================
       FECHAR MENU
    ========================================== */

    function fecharMenu() {

        sidebar.classList.remove("open");

        sidebarOverlay.classList.remove("active");

    }


    /* ==========================================
       BOT?O ?
    ========================================== */

    menuToggle.addEventListener("click", function (event) {

        event.stopPropagation();

        abrirMenu();

    });


    /* ==========================================
       BOT?O ?
    ========================================== */

    sidebarClose.addEventListener("click", function () {

        fecharMenu();

    });


    /* ==========================================
       TOCAR FORA
    ========================================== */

    sidebarOverlay.addEventListener("click", function () {

        fecharMenu();

    });


    /* ==========================================
       CLICAR EM ITEM DO MENU
    ========================================== */

    const links = sidebar.querySelectorAll("a");

    links.forEach(function (link) {

        link.addEventListener("click", function () {

            fecharMenu();

        });

    });


    /* ==========================================
       TECLA ESC
    ========================================== */

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {

            fecharMenu();

        }

    });

});