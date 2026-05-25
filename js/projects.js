import { activateTab, data, setActiveProject } from "./main.js";
import { saveToLocal } from "./storage.js";

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const [year, month, day] = String(dateStr).slice(0, 10).split("-");
    if (!year || !month || !day) return String(dateStr);
    return `${day}.${month}.${year}.`;
}

function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

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

function getProjectStats(projectId) {
    let income = 0;
    let expense = 0;

    data.transactions
        .filter(t => !t.deleted && t.projectId === projectId)
        .forEach(t => {
            if (t.type === "Prihod") income += Number(t.amount || 0);
            if (t.type === "Trosak") expense += Number(t.amount || 0);
        });

    return {
        income,
        expense,
        profit: income - expense
    };
}

function syncAdvanceTransaction(project) {
    const nextAdvance = Number(project.advance || 0);
    const advanceTx = data.transactions.find(
        t => t.projectId === project.id
            && t.type === "Prihod"
            && !t.deleted
            && (t.source === "advance" || String(t.desc || "").startsWith("Predujam - "))
    );

    if (nextAdvance <= 0) {
        if (advanceTx) advanceTx.deleted = true;
        return;
    }

    if (advanceTx) {
        advanceTx.amount = nextAdvance;
        advanceTx.desc = `Predujam - ${project.name}`;
        return;
    }

    data.transactions.push({
        id: createId(),
        projectId: project.id,
        date: new Date().toISOString().slice(0, 10),
        type: "Prihod",
        desc: `Predujam - ${project.name}`,
        amount: nextAdvance,
        cat: "-",
        who: "Firma",
        source: "advance",
        deleted: false
    });
}

export function renderProjectsPage() {
    const root = document.getElementById("projects");

    root.innerHTML = `
        <div class="card">
            <h2>Aktivni projekti</h2>
            <table class="transactionsTable">
                <thead>
                    <tr>
                        <th>Naziv</th>
                        <th>Datum preuzimanja</th>
                        <th>Ukupna cijena</th>
                        <th>Predujam</th>
                        <th>Prihod</th>
                        <th>Trošak</th>
                        <th>Neto</th>
                        <th>Status</th>
                        <th>Akcije</th>
                    </tr>
                </thead>
                <tbody id="projectsListActive"></tbody>
            </table>
        </div>

        <div class="card">
            <button id="toggleArchivedProjects" type="button" style="margin-bottom: 12px;">+ Prikaži arhivirane projekte</button>
            <div id="archivedProjectsContainer" style="display:none;">
                <h2>Arhivirani projekti</h2>
                <table class="transactionsTable">
                    <thead>
                        <tr>
                            <th>Naziv</th>
                            <th>Datum preuzimanja</th>
                            <th>Ukupna cijena</th>
                            <th>Predujam</th>
                            <th>Prihod</th>
                            <th>Trošak</th>
                            <th>Neto</th>
                            <th>Status</th>
                            <th>Akcije</th>
                        </tr>
                    </thead>
                    <tbody id="projectsListArchived"></tbody>
                </table>
            </div>
        </div>

        <div class="card">
            <h2>Uredi projekat</h2>
            <input type="hidden" id="editProjectId">

            <label>Ime projekta / kupca</label>
            <input type="text" id="editProjectName" placeholder="Odaberi projekat iz tabele">

            <label>Ukupna cijena projekta (KM)</label>
            <input type="number" id="editProjectTotal" min="0" step="0.01">

            <label>Predujam (KM)</label>
            <input type="number" id="editProjectAdvance" min="0" step="0.01">

            <button id="saveProjectChangesBtn">Spremi izmjene</button>
        </div>
    `;

    const listActive = document.getElementById("projectsListActive");
    const listArchived = document.getElementById("projectsListArchived");
    listActive.innerHTML = "";
    listArchived.innerHTML = "";

    const allProjects = data.projects
        .filter(project => !project.system)
        .sort((a, b) => String(b.takeoverDate || "").localeCompare(String(a.takeoverDate || "")));

    const activeProjects = allProjects.filter(p => !p.archived);
    const archivedProjects = allProjects.filter(p => p.archived);

    // Funkcija za renderiranje redova projekta
    function renderProjectRow(project, listContainer) {
        const stats = getProjectStats(project.id);
        const tr = document.createElement("tr");

        const statusText = project.archived ? "Arhiviran" : "Aktivan";

        const cells = [
            project.name,
            formatDate(project.takeoverDate),
            `${Number(project.totalPrice || 0).toFixed(2)} KM`,
            `${Number(project.advance || 0).toFixed(2)} KM`,
            `${stats.income.toFixed(2)} KM`,
            `${stats.expense.toFixed(2)} KM`,
            `${stats.profit.toFixed(2)} KM`,
            statusText
        ];

        cells.forEach(value => {
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
        });

        const actionsTd = document.createElement("td");

        const openBtn = document.createElement("button");
        openBtn.className = "smallBtn";
        openBtn.type = "button";
        openBtn.textContent = "Otvori";
        openBtn.addEventListener("click", () => {
            if (project.archived) {
                alert("Arhivirani projekat prvo vratite iz arhive.");
                return;
            }
            setActiveProject(project.id);
            saveToLocal();
            activateTab("home");
        });

        const editBtn = document.createElement("button");
        editBtn.className = "smallBtn editBtn";
        editBtn.type = "button";
        editBtn.textContent = "Uredi";
        editBtn.addEventListener("click", () => {
            document.getElementById("editProjectId").value = project.id;
            document.getElementById("editProjectName").value = project.name;
            document.getElementById("editProjectTotal").value = Number(project.totalPrice || 0);
            document.getElementById("editProjectAdvance").value = Number(project.advance || 0);
        });

        const archiveBtn = document.createElement("button");
        archiveBtn.className = "smallBtn delBtn";
        archiveBtn.type = "button";
        archiveBtn.textContent = project.archived ? "Vrati" : "Arhiviraj";
        archiveBtn.addEventListener("click", () => {
            if (!project.archived) {
                const activeProjects = data.projects.filter(p => !p.archived && !p.system);
                if (activeProjects.length <= 1) {
                    alert("Nije moguće arhivirati jedini aktivni projekat.");
                    return;
                }
                project.archived = true;

                if (data.activeProjectId === project.id) {
                    const fallback = data.projects.find(
                        p => !p.archived && !p.system && p.id !== project.id
                    );
                    if (fallback) setActiveProject(fallback.id);
                }
            } else {
                project.archived = false;
            }

            saveToLocal();
            renderProjectsPage();
        });

        actionsTd.append(openBtn, editBtn, archiveBtn);
        tr.appendChild(actionsTd);
        listContainer.appendChild(tr);
    }

    // Renderuj aktivne projekte
    activeProjects.forEach(project => {
        renderProjectRow(project, listActive);
    });

    // Renderuj arhivirane projekte
    archivedProjects.forEach(project => {
        renderProjectRow(project, listArchived);
    });

    // Toggle za arhivirane projekte
    const toggleBtn = document.getElementById("toggleArchivedProjects");
    const archivedContainer = document.getElementById("archivedProjectsContainer");

    if (archivedProjects.length === 0) {
        toggleBtn.style.display = "none";
    }

    toggleBtn.addEventListener("click", () => {
        const isHidden = archivedContainer.style.display === "none";
        archivedContainer.style.display = isHidden ? "block" : "none";
        toggleBtn.textContent = isHidden ? "- Sakrij arhivirane projekte" : "+ Prikaži arhivirane projekte";
    });

    const editProjectTotalEl = document.getElementById("editProjectTotal");
    const editProjectAdvanceEl = document.getElementById("editProjectAdvance");
    preventWheelValueChange(editProjectTotalEl);
    preventWheelValueChange(editProjectAdvanceEl);

    document.getElementById("saveProjectChangesBtn").addEventListener("click", () => {
        const id = document.getElementById("editProjectId").value;
        const nameEl = document.getElementById("editProjectName");
        const totalEl = editProjectTotalEl;
        const advanceEl = editProjectAdvanceEl;

        [nameEl, totalEl, advanceEl].forEach(el => el.classList.remove("invalid"));

        const project = data.projects.find(p => p.id === id);
        if (!project) {
            alert("Prvo kliknite Uredi na projektu koji želite izmijeniti.");
            return;
        }

        const name = nameEl.value.trim();
        const total = normalizeMoney(totalEl.value || 0);
        const advance = normalizeMoney(advanceEl.value || 0);

        let isValid = true;
        if (!name) {
            nameEl.classList.add("invalid");
            isValid = false;
        }
        if (!Number.isFinite(total) || total < 0) {
            totalEl.classList.add("invalid");
            isValid = false;
        }
        if (!Number.isFinite(advance) || advance < 0) {
            advanceEl.classList.add("invalid");
            isValid = false;
        }

        if (!isValid) {
            alert("Unesite ispravne podatke projekta.");
            return;
        }

        project.name = name;
        project.totalPrice = total;
        project.advance = advance;

        syncAdvanceTransaction(project);

        saveToLocal();
        renderProjectsPage();
        window.dispatchEvent(new CustomEvent("a3z:dataImported"));
    });
}
