import { data, getActiveProject } from "./main.js";
import { exportMonthlyExcel } from "./storage.js";


export function renderMonthsPage() {
    const root = document.getElementById("months");
    const activeProject = getActiveProject();

    // Skupljamo sve mjesece iz datuma
    const months = [...new Set(
        data.transactions
            .filter(t => t.projectId === data.activeProjectId)
            .map(t => t.date.slice(0, 7))
    )];

    root.innerHTML = `
        <div class="card">
            <h2 id="monthsTitle">Pregled mjeseci</h2>

            <label>Odaberi mjesec</label>
            <select id="mSelect"></select>

            <button id="exportMonthExcel" style="margin-top:15px;">Export Excel za mjesec</button>

            <div id="mTable" style="margin-top:20px;"></div>
        </div>
    `;

    const monthsTitle = document.getElementById("monthsTitle");
    if (monthsTitle) {
        monthsTitle.textContent = `Pregled mjeseci - ${activeProject ? activeProject.name : "-"}`;
    }

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
        exportMonthlyExcel(document.getElementById("mSelect").value, data.activeProjectId);
    };

    loadMonthTable();
}

function loadMonthTable() {
    const m = document.getElementById("mSelect").value;
    const table = document.getElementById("mTable");

    table.innerHTML = "";

    const tableEl = document.createElement("table");
    tableEl.className = "transactionsTable";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["Datum", "Opis", "Kategorija", "Iznos", "Tip"].forEach(label => {
        const th = document.createElement("th");
        th.textContent = label;
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);

    const tbody = document.createElement("tbody");
    data.transactions
        .filter(t => t.projectId === data.activeProjectId && t.date.slice(0, 7) === m)
        .forEach(t => {
            const tr = document.createElement("tr");
            tr.className = rowClass(t);
            tr.title = rowTooltip(t);

            const cells = [
                String(t.date ?? ""),
                String(t.desc ?? ""),
                String(t.cat ?? ""),
                `${Number(t.amount).toFixed(2)} KM`,
                String(t.type ?? "")
            ];

            cells.forEach(value => {
                const td = document.createElement("td");
                td.textContent = value;
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

    tableEl.append(thead, tbody);
    table.appendChild(tableEl);
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
