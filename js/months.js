import { data } from "./main.js";
import { exportMonthlyExcel } from "./storage.js";

const monthsFilterState = {
    year: String(new Date().getFullYear()),
    month: String(new Date().getMonth() + 1).padStart(2, "0")
};

function renderMonthButtons() {
    const months = [
        ["01", "Jan"],
        ["02", "Feb"],
        ["03", "Mar"],
        ["04", "Apr"],
        ["05", "Maj"],
        ["06", "Jun"],
        ["07", "Jul"],
        ["08", "Avg"],
        ["09", "Sep"],
        ["10", "Okt"],
        ["11", "Nov"],
        ["12", "Dec"]
    ];

    return months.map(([monthValue, monthLabel]) => {
        const isActive = monthsFilterState.month === monthValue;
        return `<button type="button" class="calendar-month-btn${isActive ? " active" : ""}" data-month="${monthValue}">${monthLabel}</button>`;
    }).join("");
}

function getMonthLabel(monthKey) {
    const labels = {
        "01": "Januar",
        "02": "Februar",
        "03": "Mart",
        "04": "April",
        "05": "Maj",
        "06": "Juni",
        "07": "Juli",
        "08": "August",
        "09": "Septembar",
        "10": "Oktobar",
        "11": "Novembar",
        "12": "Decembar"
    };
    return labels[monthKey] || monthKey;
}

export function renderMonthsPage() {
    const root = document.getElementById("months");
    const activeTransactions = data.transactions.filter(t => !t.deleted);
    const userProjects = data.projects.filter(p => !p.system);
    const projectMap = new Map(data.projects.map(p => [p.id, p.name]));
    const projectPriceMap = new Map(data.projects.map(p => [p.id, Number(p.totalPrice || 0)]));

    if (!/^\d{4}$/.test(monthsFilterState.year)) {
        monthsFilterState.year = String(new Date().getFullYear());
    }

    if (!/^\d{2}$/.test(monthsFilterState.month)) {
        monthsFilterState.month = String(new Date().getMonth() + 1).padStart(2, "0");
    }

    root.innerHTML = `
        <div class="card">
            <h2 id="monthsTitle">Pregled projekata po kalendaru</h2>

            <div class="calendar-filter-shell">
                <div class="calendar-year-row">
                    <button id="monthsPrevYearBtn" type="button" class="calendar-nav-btn" aria-label="Prethodna godina">‹</button>
                    <button id="monthsYearToggleBtn" type="button" class="calendar-year-btn" data-year="${monthsFilterState.year}" aria-label="Prikaz cijele godine">${monthsFilterState.year}.</button>
                    <button id="monthsNextYearBtn" type="button" class="calendar-nav-btn" aria-label="Sljedeća godina">›</button>
                </div>
                <div id="monthsMonthGrid" class="calendar-month-grid">${renderMonthButtons()}</div>
            </div>

            <p id="monthsPeriodLabel" class="shopping-subtitle" style="margin:0 0 12px 0;"></p>

            <button id="exportMonthExcel" style="margin-top:8px;">Export Excel za period</button>

            <div id="monthSummary" style="margin-top:15px;"></div>

            <div id="mTable" style="margin-top:20px;"></div>
        </div>
    `;

    const monthsPrevYearBtn = document.getElementById("monthsPrevYearBtn");
    const monthsNextYearBtn = document.getElementById("monthsNextYearBtn");
    const monthsYearToggleBtn = document.getElementById("monthsYearToggleBtn");
    const monthsMonthGrid = document.getElementById("monthsMonthGrid");

    monthsPrevYearBtn?.addEventListener("click", () => {
        monthsFilterState.year = String(Number(monthsFilterState.year) - 1);
        if (monthsYearToggleBtn) {
            monthsYearToggleBtn.dataset.year = monthsFilterState.year;
            monthsYearToggleBtn.textContent = `${monthsFilterState.year}.`;
        }
        loadPeriodTable();
    });

    monthsNextYearBtn?.addEventListener("click", () => {
        monthsFilterState.year = String(Number(monthsFilterState.year) + 1);
        if (monthsYearToggleBtn) {
            monthsYearToggleBtn.dataset.year = monthsFilterState.year;
            monthsYearToggleBtn.textContent = `${monthsFilterState.year}.`;
        }
        loadPeriodTable();
    });

    monthsYearToggleBtn?.addEventListener("click", () => {
        monthsFilterState.month = "all";
        monthsYearToggleBtn.classList.add("active");
        monthsMonthGrid?.querySelectorAll(".calendar-month-btn").forEach(btn => btn.classList.remove("active"));
        loadPeriodTable();
    });

    monthsMonthGrid?.addEventListener("click", (e) => {
        const monthBtn = e.target.closest(".calendar-month-btn[data-month]");
        if (!monthBtn) return;

        monthsFilterState.month = monthBtn.dataset.month;
        monthsMonthGrid.querySelectorAll(".calendar-month-btn").forEach(btn => btn.classList.remove("active"));
        monthBtn.classList.add("active");
        monthsYearToggleBtn?.classList.remove("active");
        loadPeriodTable();
    });

    document.getElementById("exportMonthExcel").onclick = () => {
        const exportMonth = monthsFilterState.month === "all"
            ? `${monthsFilterState.year}-01`
            : `${monthsFilterState.year}-${monthsFilterState.month}`;
        exportMonthlyExcel(exportMonth, null);
    };

    loadPeriodTable();

    function loadPeriodTable() {
        const selectedYear = monthsFilterState.year;
        const selectedMonth = monthsFilterState.month;
        const table = document.getElementById("mTable");
        const summary = document.getElementById("monthSummary");
        const periodLabel = document.getElementById("monthsPeriodLabel");

        table.innerHTML = "";

        const periodTransactions = activeTransactions.filter(t => {
            const txYear = String(t.date || "").slice(0, 4);
            const txMonth = String(t.date || "").slice(5, 7);
            return txYear === selectedYear && (selectedMonth === "all" || txMonth === selectedMonth);
        });

        const monthProjects = userProjects.filter(project => {
            const projectYear = String(project.takeoverDate || "").slice(0, 4);
            const projectMonth = String(project.takeoverDate || "").slice(5, 7);
            return projectYear === selectedYear && (selectedMonth === "all" || projectMonth === selectedMonth);
        });

        const periodCompanyExpenses = periodTransactions.filter(t => t.projectId === "company-overhead" && t.type === "Trosak");
        const companyExpenseTotal = periodCompanyExpenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const byProject = new Map();
        monthProjects.forEach(project => {
            byProject.set(project.id, { income: 0, expense: 0, takeoverDate: project.takeoverDate || `${selectedYear}-${selectedMonth === "all" ? "01" : selectedMonth}-01` });
        });

        activeTransactions
            .filter(t => byProject.has(t.projectId))
            .forEach(t => {
                const sums = byProject.get(t.projectId);
                if (t.type === "Prihod") sums.income += Number(t.amount || 0);
                if (t.type === "Trosak") sums.expense += Number(t.amount || 0);
            });

        const totals = [...byProject.values()].reduce((acc, sums) => {
            acc.income += sums.income;
            acc.expense += sums.expense;
            return acc;
        }, { income: 0, expense: 0 });

        const totalIncome = totals.income;
        const projectExpenseTotal = totals.expense;
        const totalExpense = projectExpenseTotal + companyExpenseTotal;
        const periodNet = totalIncome - totalExpense;

        periodLabel.textContent = selectedMonth === "all"
            ? `Prikaz perioda: cijela ${selectedYear}. godina`
            : `Prikaz perioda: ${getMonthLabel(selectedMonth)} ${selectedYear}.`;

        summary.innerHTML = `
            <p><b>Projekata preuzetih u periodu:</b> ${monthProjects.length}</p>
            <p><b>Ukupni prihodi:</b> ${totalIncome.toFixed(2)} KM</p>
            <p><b>Troškovi projekata:</b> ${projectExpenseTotal.toFixed(2)} KM</p>
            <p><b>Troškovi firme:</b> ${companyExpenseTotal.toFixed(2)} KM</p>
            <p><b>Ukupni rashodi:</b> ${totalExpense.toFixed(2)} KM</p>
            <p><b>Saldo perioda:</b> ${periodNet.toFixed(2)} KM</p>
        `;

        const tableEl = document.createElement("table");
        tableEl.className = "transactionsTable";

        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");
        ["Datum preuzimanja", "Projekat", "Ugovorena cijena", "Prihod", "Rashod", "Dobit"].forEach(label => {
            const th = document.createElement("th");
            th.textContent = label;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);

        const tbody = document.createElement("tbody");
        [...byProject.entries()]
            .sort((a, b) => {
                const nameA = projectMap.get(a[0]) || "-";
                const nameB = projectMap.get(b[0]) || "-";
                return nameA.localeCompare(nameB);
            })
            .forEach(([projectId, sums]) => {
                const tr = document.createElement("tr");
                const profit = sums.income - sums.expense;

                const cells = [
                    String(sums.takeoverDate || "").slice(0, 10),
                    projectMap.get(projectId) || "-",
                    `${Number(projectPriceMap.get(projectId) || 0).toFixed(2)} KM`,
                    sums.income > 0 ? `${sums.income.toFixed(2)} KM` : "-",
                    sums.expense > 0 ? `${sums.expense.toFixed(2)} KM` : "-",
                    `${profit.toFixed(2)} KM`
                ];

                cells.forEach(value => {
                    const td = document.createElement("td");
                    td.textContent = value;
                    tr.appendChild(td);
                });

                tbody.appendChild(tr);
            });

        if (companyExpenseTotal > 0 || monthProjects.length === 0) {
            const companyRow = document.createElement("tr");
            const companyProfit = -companyExpenseTotal;
            const companyCells = [
                "-",
                "Troškovi firme",
                "-",
                "-",
                companyExpenseTotal > 0 ? `${companyExpenseTotal.toFixed(2)} KM` : "-",
                `${companyProfit.toFixed(2)} KM`
            ];

            companyCells.forEach(value => {
                const td = document.createElement("td");
                td.textContent = value;
                companyRow.appendChild(td);
            });

            tbody.appendChild(companyRow);
        }

        if (tbody.children.length === 0) {
            table.innerHTML = `<div class="shopping-empty">Nema podataka za odabrani period.</div>`;
            return;
        }

        tableEl.append(thead, tbody);
        table.appendChild(tableEl);
    }
}
