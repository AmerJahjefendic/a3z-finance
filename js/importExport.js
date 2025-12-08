import { exportJSON, importJSON, exportExcel } from "./storage.js";

export function renderImportExportPage() {
    const root = document.getElementById("importExport");

    root.innerHTML = `
        <div class="card">
            <h2>Import / Export podataka</h2>

            <button id="btnExportJson">Export JSON</button>
            <button id="btnExportExcel">Export Excel</button>
            
            <hr>

            <label>Uvezi JSON:</label>
            <input type="file" id="jsonFile" accept=".json">
            <button id="btnImportJson">Import JSON</button>
        </div>
    `;

    // EVENT LISTENERS
    document.getElementById("btnExportJson").onclick = exportJSON;
    document.getElementById("btnExportExcel").onclick = exportExcel;

    document.getElementById("btnImportJson").onclick = () => {
        const file = document.getElementById("jsonFile").files[0];
        if (!file) {
            alert("Odaberi JSON fajl.");
            return;
        }
        importJSON(file);
    };
}
