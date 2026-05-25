import { exportJSON, importJSON} from "./storage.js";

export function renderImportExportPage() {
    const root = document.getElementById("importExport");

    root.innerHTML = `
        <div class="card">
            <h2>Import / Export podataka</h2>

            <button id="btnExportJson">Export JSON</button>
            
            <hr>

            <label>Uvezi JSON:</label>
            <input type="file" id="jsonFile" accept=".json">
            <button id="btnImportJson">Import JSON</button>

            <hr>

            <h3>Test alati (privremeno)</h3>
            <button id="btnResetAllData" class="delBtn">Obriši sve podatke</button>
        </div>
    `;

    // EVENT LISTENERS
    document.getElementById("btnExportJson").onclick = () => exportJSON();
    

    document.getElementById("btnImportJson").onclick = () => {
        const file = document.getElementById("jsonFile").files[0];
        if (!file) {
            alert("Odaberi JSON fajl.");
            return;
        }
        importJSON(file);
    };

    document.getElementById("btnResetAllData").onclick = () => {
        const ok = window.confirm("Da li ste sigurni da želite obrisati sve lokalne podatke (projekti i transakcije)?");
        if (!ok) return;

        localStorage.removeItem("A3Z_finance");
        location.reload();
    };
}
