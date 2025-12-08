import { renderHome } from "./ui.js";
import { renderMonthsPage } from "./months.js";
import { initStorage } from "./storage.js";
import { renderImportExportPage } from "./importExport.js";

// GLOBAL STATE
export let data = { transactions: [] };

// INIT STORAGE (JSON load + LocalStorage backup)
initStorage();

// TAB CLICK HANDLER
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        const page = tab.dataset.page;

        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

        document.getElementById(page).classList.add("active");
        tab.classList.add("active");

        if (page === "home") renderHome();
        if (page === "months") renderMonthsPage();
        if (page === "importExport") renderImportExportPage();

    });
});

// DEFAULT PAGE
renderHome();
