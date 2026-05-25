import { recalc } from "./calc.js";
import { renderTransactionForm, renderTransactionList } from "./ui.js";
import { addProject, data, getActiveProject, setActiveProject } from "./main.js";
import { saveToLocal } from "./storage.js";

function normalizeMoney(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.round(num * 100) / 100;
}

function preventWheelValueChange(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("wheel", (e) => {
        e.preventDefault();
    }, { passive: false });
}

export function renderHome() {
    const root = document.getElementById("home");
    const now = new Date();
    const monthLabel = `${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`;

    root.innerHTML = `
        <h2>Finansijski pregled</h2>

        <div class="card">
            <h2>Poslovanje tekućeg mjeseca (${monthLabel})</h2>

            <div class="dashboard-grid">
                <div class="card summary-card income-bg">
                    <h3>Prihod</h3>
                    <p>Ukupno:</p>
                    <h1 id="totalIncome">0 KM</h1>
                </div>

                <div class="card summary-card expense-bg">
                    <h3>Projektni trošak</h3>
                    <p>Ukupno:</p>
                    <h1 id="projectExpense">0 KM</h1>
                </div>

                <div class="card summary-card expense-bg">
                    <h3>Opšti trošak firme</h3>
                    <p>Ukupno:</p>
                    <h1 id="overheadExpense">0 KM</h1>
                </div>

                <div class="card summary-card profit-bg">
                    <h3>Neto Profit</h3>
                    <p>Razlika:</p>
                    <h1 id="netProfit">0 KM</h1>
                </div>
            </div>
        </div>

        <div class="card">
            <label>Aktivni projekat</label>
            <select id="projectSelect"></select>
        </div>

        <div class="card">
            <button id="toggleNewProjectBtn" type="button">Novi projekat</button>

            <div id="newProjectPanel" style="display:none; margin-top:12px;">
                <label>Ime projekta / kupca</label>
                <input type="text" id="projectNameInput" placeholder="npr. Kuhinja - Porodica Hodzic">

                <label>Datum preuzimanja projekta</label>
                <input type="date" id="projectTakeoverDateInput">

                <label>Ukupna cijena projekta (KM)</label>
                <input type="number" id="projectTotalInput" min="0" step="0.01" placeholder="0.00">

                <label>Predujam (KM)</label>
                <input type="number" id="projectAdvanceInput" min="0" step="0.01" placeholder="0.00">

                <button id="saveProjectBtn">Kreiraj projekat</button>
            </div>
        </div>

        <div class="card">
            <h2>Sažetak aktivnog projekta</h2>
            <p>Projekat: <b id="activeProjectName">-</b></p>
            <p>Datum preuzimanja: <b><span id="projectTakeoverDate">-</span></b></p>
            <p>Ukupna cijena: <b><span id="projectTotalPrice">0</span> KM</b></p>
            <p>Predujam: <b><span id="projectAdvance">0</span> KM</b></p>
            <p>Naplaceno kroz prihode: <b><span id="projectCollected">0</span> KM</b></p>
            <p>Troškovi projekta: <b><span id="projectExpenseAmount">0</span> KM</b></p>
            <p>Preostalo za naplatu: <b><span id="projectRemaining">0</span> KM</b></p>
        </div>
        
        <div id="transactionForm"></div>

        <div class="card">
            <h2>Transakcije aktivnog projekta</h2>
            <table class="transactionsTable">
                <thead>
                    <tr>
                        <th>Datum</th>
                        <th>Opis</th>
                        <th>Kategorija</th>
                        <th>Iznos</th>
                        <th>Tip</th>
                        <th>Akcije</th>
                    </tr>
                </thead>
                <tbody id="transactionList"></tbody>
            </table>
        </div>
    `;

    const projectSelect = document.getElementById("projectSelect");
    const activeProjects = data.projects.filter(project => !project.archived && !project.system);
    activeProjects.forEach(project => {
        const opt = document.createElement("option");
        opt.value = project.id;
        opt.textContent = project.name;
        if (project.id === data.activeProjectId) opt.selected = true;
        projectSelect.appendChild(opt);
    });

    if (activeProjects.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Nema aktivnih projekata";
        projectSelect.appendChild(opt);
        projectSelect.disabled = true;
    }

    const activeProject = getActiveProject();
    const activeProjectNameEl = document.getElementById("activeProjectName");
    if (activeProjectNameEl) {
        activeProjectNameEl.textContent = activeProject ? activeProject.name : "-";
    }

    projectSelect.addEventListener("change", () => {
        setActiveProject(projectSelect.value);
        saveToLocal();
        renderHome();
    });

    const toggleNewProjectBtn = document.getElementById("toggleNewProjectBtn");
    const newProjectPanel = document.getElementById("newProjectPanel");
    const projectTakeoverDateInput = document.getElementById("projectTakeoverDateInput");
    const projectTotalInputEl = document.getElementById("projectTotalInput");
    const projectAdvanceInputEl = document.getElementById("projectAdvanceInput");
    if (projectTakeoverDateInput) {
        projectTakeoverDateInput.value = new Date().toISOString().slice(0, 10);
    }
    preventWheelValueChange(projectTotalInputEl);
    preventWheelValueChange(projectAdvanceInputEl);

    toggleNewProjectBtn.addEventListener("click", () => {
        const isOpen = newProjectPanel.style.display === "block";
        newProjectPanel.style.display = isOpen ? "none" : "block";
    });

    document.getElementById("saveProjectBtn").addEventListener("click", () => {
        const nameInput = document.getElementById("projectNameInput");
        const takeoverDateInput = document.getElementById("projectTakeoverDateInput");
        const totalInput = document.getElementById("projectTotalInput");
        const advanceInput = document.getElementById("projectAdvanceInput");

        const name = nameInput.value.trim();
        const takeoverDate = takeoverDateInput.value;
        const totalPrice = normalizeMoney(totalInput.value || 0);
        const advance = normalizeMoney(advanceInput.value || 0);

        [nameInput, takeoverDateInput, totalInput, advanceInput].forEach(el => el.classList.remove("invalid"));

        let isValid = true;
        if (!name) {
            nameInput.classList.add("invalid");
            isValid = false;
        }
        if (!takeoverDate) {
            takeoverDateInput.classList.add("invalid");
            isValid = false;
        }
        if (!Number.isFinite(totalPrice) || totalPrice < 0) {
            totalInput.classList.add("invalid");
            isValid = false;
        }
        if (!Number.isFinite(advance) || advance < 0) {
            advanceInput.classList.add("invalid");
            isValid = false;
        }

        if (!isValid) {
            alert("Unesite ispravne podatke projekta.");
            return;
        }

        const project = addProject({ name, totalPrice, advance, takeoverDate });

        if (advance > 0) {
            data.transactions.push({
                id: Date.now(),
                projectId: project.id,
                date: new Date().toISOString().slice(0, 10),
                type: "Prihod",
                desc: `Predujam - ${project.name}`,
                amount: advance,
                cat: "-",
                who: "Firma",
                source: "advance",
                deleted: false
            });
        }

        saveToLocal();
        renderHome();
    });

    renderTransactionForm();
    renderTransactionList();
    recalc();
}