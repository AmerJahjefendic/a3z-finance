import { data } from "./main.js";
import { exportMonthlyExcel } from "./storage.js";


export function renderMonthsPage() {
    const root = document.getElementById("months");
    const activeTransactions = data.transactions.filter(t => !t.deleted);
    const projectMap = new Map(data.projects.map(p => [p.id, p.name]));

    // Skupljamo sve mjesece iz datuma svih aktivnih transakcija
    const months = [...new Set(
        activeTransactions
            .map(t => t.date.slice(0, 7))
    )];

    root.innerHTML = `
        <div class="card">
            <h2 id="monthsTitle">Pregled prihoda i rashoda po mjesecu</h2>

            <label>Odaberi mjesec</label>
            <select id="mSelect"></select>

            <button id="exportMonthExcel" style="margin-top:15px;">Export Excel za mjesec</button>

            <div id="monthSummary" style="margin-top:15px;"></div>

            <div id="mTable" style="margin-top:20px;"></div>
        </div>
    `;

    const monthsTitle = document.getElementById("monthsTitle");
    if (monthsTitle) {
        monthsTitle.textContent = "Pregled svih prihoda i rashoda po mjesecu";
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
        exportMonthlyExcel(document.getElementById("mSelect").value, null);
    };

    loadMonthTable();

    function loadMonthTable() {
        const m = document.getElementById("mSelect").value;
        const table = document.getElementById("mTable");
        const summary = document.getElementById("monthSummary");

        table.innerHTML = "";

        const monthTransactions = activeTransactions.filter(t => t.date.slice(0, 7) === m);
        const totalIncome = monthTransactions
            .filter(t => t.type === "Prihod")
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const totalExpense = monthTransactions
            .filter(t => t.type === "Trosak")
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const monthNet = totalIncome - totalExpense;

        summary.innerHTML = `
            <p><b>Ukupni prihodi:</b> ${totalIncome.toFixed(2)} KM</p>
            <p><b>Ukupni rashodi:</b> ${totalExpense.toFixed(2)} KM</p>
            <p><b>Saldo mjeseca:</b> ${monthNet.toFixed(2)} KM</p>
        `;

        const tableEl = document.createElement("table");
        tableEl.className = "transactionsTable";

        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");
        ["Datum", "Projekat", "Prihod", "Rashod"].forEach(label => {
            const th = document.createElement("th");
            th.textContent = label;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);

        const byProject = new Map();
        monthTransactions.forEach(t => {
            const key = t.projectId || "-";
            if (!byProject.has(key)) {
                byProject.set(key, { income: 0, expense: 0 });
            }

            const sums = byProject.get(key);
            if (t.type === "Prihod") sums.income += Number(t.amount || 0);
            if (t.type === "Trosak") sums.expense += Number(t.amount || 0);
        });

        const tbody = document.createElement("tbody");
        [...byProject.entries()]
            .sort((a, b) => {
                const nameA = projectMap.get(a[0]) || "-";
                const nameB = projectMap.get(b[0]) || "-";
                return nameA.localeCompare(nameB);
            })
            .forEach(([projectId, sums]) => {
                const tr = document.createElement("tr");

                const cells = [
                    m,
                    projectMap.get(projectId) || "-",
                    sums.income > 0 ? `${sums.income.toFixed(2)} KM` : "-",
                    sums.expense > 0 ? `${sums.expense.toFixed(2)} KM` : "-"
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
}
