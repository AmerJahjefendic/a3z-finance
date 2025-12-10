import { data } from "./main.js";
import { exportMonthlyExcel } from "./storage.js";


export function renderMonthsPage() {
    const root = document.getElementById("months");

    // Skupljamo sve mjesece iz datuma
    const months = [...new Set(data.transactions.map(t => t.date.slice(0, 7)))];

    root.innerHTML = `
        <div class="card">
            <h2>Pregled mjeseci</h2>

            <label>Odaberi mjesec</label>
            <select id="mSelect"></select>

            <button id="exportMonthExcel" style="margin-top:15px;">Export Excel za mjesec</button>

            <div id="mTable" style="margin-top:20px;"></div>
        </div>
    `;

    const select = document.getElementById("mSelect");

    // Ako nema transakcija
    if (months.length === 0) {
        select.innerHTML = `<option>Nema podataka</option>`;
        document.getElementById("mTable").innerHTML = "";
        return;
    }

    // Popuni dropdown
    months.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m;
        select.appendChild(opt);
    });

    select.addEventListener("change", loadMonthTable);

    document.getElementById("exportMonthExcel").onclick = () => {
    exportMonthlyExcel(document.getElementById("mSelect").value);
};

    loadMonthTable();
}

function loadMonthTable() {
    const m = document.getElementById("mSelect").value;
    const table = document.getElementById("mTable");

    const rows = data.transactions
        .filter(t => t.date.slice(0, 7) === m)
        .map(t => `
            <tr class="${rowClass(t)}" title="${rowTooltip(t)}">
                <td>${t.date}</td>
                <td>${t.desc}</td>
                <td>${t.cat}</td>
                <td>${t.amount.toFixed(2)} KM</td>
                <td>${t.type}</td>
                <td>${t.who}</td>
            </tr>
        `)
        .join("");

    table.innerHTML = `
        <table class="transactionsTable">
            <thead>
                <tr>
                    <th>Datum</th>
                    <th>Opis</th>
                    <th>Kategorija</th>
                    <th>Iznos</th>
                    <th>Tip</th>
                    <th>Ko je platio</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

// =========================================
// Helper: CSS klase za redove
// =========================================
function rowClass(t) {
    if (t.deleted && t.edited) return "edited";
    if (t.deleted) return "deleted";
    return "";
}

// =========================================
// Helper: Hover poruka
// =========================================
function rowTooltip(t) {
    if (t.edited) return "Stara verzija (editovana)";
    if (t.deleted) return "Obrisana transakcija";
    return "";
}
