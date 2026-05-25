import { activateTab, data, OVERHEAD_PROJECT_ID, setActiveProject } from "./main.js";
import { saveToLocal } from "./storage.js";
import { createId, normalizeMoney } from "./utils.js";
import {
    getSelectedExpenseCategory,
    isAutoDescriptionCategory,
    parseExpenseCategory,
    UTILITIES_CATEGORY
} from "./expenseCategories.js";

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const [year, month, day] = String(dateStr).slice(0, 10).split("-");
    if (!year || !month || !day) return String(dateStr);
    return `${day}.${month}.${year}.`;
}

function preventWheelValueChange(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("wheel", (e) => {
        e.preventDefault();
    }, { passive: false });
}

function getCompanyExpenses() {
    return data.transactions
        .filter(t => !t.deleted && t.projectId === OVERHEAD_PROJECT_ID && t.type === "Trosak")
        .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function getSelectedCompanyExpenseCategory() {
    const catInput = document.getElementById("editCompanyExpenseCategory");
    const utilitySubcategoryInput = document.getElementById("editCompanyExpenseUtilitySubcategory");
    return getSelectedExpenseCategory(catInput?.value, utilitySubcategoryInput?.value);
}

function syncCompanyExpenseUtilitySubcategory() {
    const catInput = document.getElementById("editCompanyExpenseCategory");
    const utilitySubcategoryBlock = document.getElementById("editCompanyExpenseUtilityBlock");
    const utilitySubcategoryInput = document.getElementById("editCompanyExpenseUtilitySubcategory");

    if (!catInput || !utilitySubcategoryBlock || !utilitySubcategoryInput) return;

    const shouldShow = catInput.value === UTILITIES_CATEGORY;
    utilitySubcategoryBlock.style.display = shouldShow ? "block" : "none";

    if (shouldShow && !utilitySubcategoryInput.value) {
        utilitySubcategoryInput.value = "Struja";
    }
}

function syncCompanyExpenseDescription() {
    const descInput = document.getElementById("editCompanyExpenseDescription");
    if (!descInput) return;

    const selectedCategory = getSelectedCompanyExpenseCategory();
    if (isAutoDescriptionCategory(selectedCategory)) {
        descInput.value = selectedCategory;
        descInput.disabled = true;
        descInput.placeholder = "Opis se unosi automatski";
        return;
    }

    if (descInput.disabled) {
        descInput.value = "";
    }

    descInput.disabled = false;
    descInput.placeholder = "";
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

function getShoppingListStats(projectId) {
    const items = (data.shoppingList || []).filter(item => item.projectId === projectId);
    const total = items.length;
    const purchased = items.filter(item => item.status === "purchased").length;

    return {
        total,
        purchased
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
                        <th>Kupovina</th>
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
                            <th>Kupovina</th>
                            <th>Status</th>
                            <th>Akcije</th>
                        </tr>
                    </thead>
                    <tbody id="projectsListArchived"></tbody>
                </table>
            </div>
        </div>

        <div class="card">
            <h2>Troškovi firme</h2>
            <table class="transactionsTable">
                <thead>
                    <tr>
                        <th>Datum</th>
                        <th>Kategorija</th>
                        <th>Opis</th>
                        <th>Iznos</th>
                        <th>Akcije</th>
                    </tr>
                </thead>
                <tbody id="companyExpensesList"></tbody>
            </table>
        </div>

        <div id="editProjectPopup" class="shopping-popup-backdrop" style="display:none;">
            <div class="shopping-popup-card" role="dialog" aria-modal="true" aria-label="Uredi projekat">
                <div class="shopping-popup-head">
                    <h3>Uredi projekat</h3>
                    <button id="closeEditProjectPopupBtn" type="button" class="shopping-close-btn" aria-label="Zatvori">×</button>
                </div>

                <input type="hidden" id="editProjectId">

                <label>Ime projekta / kupca</label>
                <input type="text" id="editProjectName" placeholder="Odaberi projekat iz tabele">

                <label>Ukupna cijena projekta (KM)</label>
                <input type="number" id="editProjectTotal" min="0" step="0.01">

                <label>Predujam (KM)</label>
                <input type="number" id="editProjectAdvance" min="0" step="0.01">

                <div class="shopping-form-actions">
                    <button id="saveProjectChangesBtn" type="button">Spremi izmjene</button>
                    <button id="cancelEditProjectPopupBtn" type="button" class="secondaryBtn">Odustani</button>
                </div>
            </div>
        </div>

        <div id="editCompanyExpensePopup" class="shopping-popup-backdrop" style="display:none;">
            <div class="shopping-popup-card" role="dialog" aria-modal="true" aria-label="Uredi trošak firme">
                <div class="shopping-popup-head">
                    <h3>Uredi trošak firme</h3>
                    <button id="closeEditCompanyExpensePopupBtn" type="button" class="shopping-close-btn" aria-label="Zatvori">×</button>
                </div>

                <input type="hidden" id="editCompanyExpenseId">

                <label>Datum</label>
                <input type="date" id="editCompanyExpenseDate">

                <label>Kategorija</label>
                <select id="editCompanyExpenseCategory">
                    <option value="Materijal">Materijal</option>
                    <option value="Alat">Alat</option>
                    <option value="Prevoz">Prevoz</option>
                    <option value="Kirija">Kirija</option>
                    <option value="Režije">Režije</option>
                    <option value="Ostalo">Ostalo</option>
                </select>

                <div id="editCompanyExpenseUtilityBlock" style="display:none;">
                    <label>Podkategorija režija</label>
                    <select id="editCompanyExpenseUtilitySubcategory">
                        <option value="Struja">Struja</option>
                        <option value="Voda">Voda</option>
                    </select>
                </div>

                <label>Opis</label>
                <input type="text" id="editCompanyExpenseDescription" placeholder="Odaberi trošak iz tabele">

                <label>Iznos (KM)</label>
                <input type="number" id="editCompanyExpenseAmount" min="0" step="0.01">

                <div class="shopping-form-actions">
                    <button id="saveCompanyExpenseChangesBtn" type="button">Spremi izmjene troška</button>
                    <button id="cancelEditCompanyExpensePopupBtn" type="button" class="secondaryBtn">Odustani</button>
                </div>
            </div>
        </div>
    `;

    const listActive = document.getElementById("projectsListActive");
    const listArchived = document.getElementById("projectsListArchived");
    const companyExpensesList = document.getElementById("companyExpensesList");
    const editProjectPopup = document.getElementById("editProjectPopup");
    const editCompanyExpensePopup = document.getElementById("editCompanyExpensePopup");
    listActive.innerHTML = "";
    listArchived.innerHTML = "";
    companyExpensesList.innerHTML = "";

    function openEditProjectPopup() {
        if (editProjectPopup) editProjectPopup.style.display = "flex";
    }

    function closeEditProjectPopup() {
        if (editProjectPopup) editProjectPopup.style.display = "none";
    }

    function openEditCompanyExpensePopup() {
        if (editCompanyExpensePopup) editCompanyExpensePopup.style.display = "flex";
    }

    function closeEditCompanyExpensePopup() {
        if (editCompanyExpensePopup) editCompanyExpensePopup.style.display = "none";
    }

    const allProjects = data.projects
        .filter(project => !project.system)
        .sort((a, b) => String(b.takeoverDate || "").localeCompare(String(a.takeoverDate || "")));

    const activeProjects = allProjects.filter(p => !p.archived);
    const archivedProjects = allProjects.filter(p => p.archived);

    // Funkcija za renderiranje redova projekta
    function renderProjectRow(project, listContainer) {
        const stats = getProjectStats(project.id);
        const shoppingStats = getShoppingListStats(project.id);
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
            shoppingStats.total > 0 ? `${shoppingStats.purchased}/${shoppingStats.total}` : "-",
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
            openEditProjectPopup();
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

    getCompanyExpenses().forEach(expense => {
        const tr = document.createElement("tr");

        [
            formatDate(expense.date),
            expense.cat || "-",
            expense.desc || "-",
            `${Number(expense.amount || 0).toFixed(2)} KM`
        ].forEach(value => {
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
        });

        const actionsTd = document.createElement("td");

        const editBtn = document.createElement("button");
        editBtn.className = "smallBtn editBtn";
        editBtn.type = "button";
        editBtn.textContent = "Uredi";
        editBtn.addEventListener("click", () => {
            const parsedCategory = parseExpenseCategory(expense.cat, "Materijal");
            document.getElementById("editCompanyExpenseId").value = expense.id;
            document.getElementById("editCompanyExpenseDate").value = String(expense.date || "").slice(0, 10);
            document.getElementById("editCompanyExpenseCategory").value = parsedCategory.main;
            document.getElementById("editCompanyExpenseUtilitySubcategory").value = parsedCategory.sub;
            document.getElementById("editCompanyExpenseDescription").value = expense.desc || "";
            document.getElementById("editCompanyExpenseAmount").value = Number(expense.amount || 0);
            syncCompanyExpenseUtilitySubcategory();
            syncCompanyExpenseDescription();
            openEditCompanyExpensePopup();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "smallBtn delBtn";
        deleteBtn.type = "button";
        deleteBtn.textContent = "Obriši";
        deleteBtn.addEventListener("click", () => {
            expense.deleted = true;
            saveToLocal();
            renderProjectsPage();
            window.dispatchEvent(new CustomEvent("a3z:dataImported"));
        });

        actionsTd.append(editBtn, deleteBtn);
        tr.appendChild(actionsTd);
        companyExpensesList.appendChild(tr);
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
    const editCompanyExpenseAmountEl = document.getElementById("editCompanyExpenseAmount");
    preventWheelValueChange(editProjectTotalEl);
    preventWheelValueChange(editProjectAdvanceEl);
    preventWheelValueChange(editCompanyExpenseAmountEl);

    document.getElementById("closeEditProjectPopupBtn")?.addEventListener("click", closeEditProjectPopup);
    document.getElementById("cancelEditProjectPopupBtn")?.addEventListener("click", closeEditProjectPopup);
    document.getElementById("closeEditCompanyExpensePopupBtn")?.addEventListener("click", closeEditCompanyExpensePopup);
    document.getElementById("cancelEditCompanyExpensePopupBtn")?.addEventListener("click", closeEditCompanyExpensePopup);

    editProjectPopup?.addEventListener("click", (e) => {
        if (e.target === editProjectPopup) closeEditProjectPopup();
    });

    editCompanyExpensePopup?.addEventListener("click", (e) => {
        if (e.target === editCompanyExpensePopup) closeEditCompanyExpensePopup();
    });

    document.getElementById("editCompanyExpenseCategory").addEventListener("change", () => {
        syncCompanyExpenseUtilitySubcategory();
        syncCompanyExpenseDescription();
    });
    document.getElementById("editCompanyExpenseUtilitySubcategory").addEventListener("change", syncCompanyExpenseDescription);
    syncCompanyExpenseUtilitySubcategory();
    syncCompanyExpenseDescription();

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

        closeEditProjectPopup();
        saveToLocal();
        renderProjectsPage();
        window.dispatchEvent(new CustomEvent("a3z:dataImported"));
    });

    document.getElementById("saveCompanyExpenseChangesBtn").addEventListener("click", () => {
        const id = document.getElementById("editCompanyExpenseId").value;
        const dateEl = document.getElementById("editCompanyExpenseDate");
        const categoryEl = document.getElementById("editCompanyExpenseCategory");
        const utilityEl = document.getElementById("editCompanyExpenseUtilitySubcategory");
        const descriptionEl = document.getElementById("editCompanyExpenseDescription");
        const amountEl = editCompanyExpenseAmountEl;

        [dateEl, categoryEl, utilityEl, descriptionEl, amountEl].forEach(el => el?.classList.remove("invalid"));

        const expense = data.transactions.find(t => String(t.id) === String(id) && !t.deleted && t.projectId === OVERHEAD_PROJECT_ID);
        if (!expense) {
            alert("Prvo kliknite Uredi na trošku firme koji želite izmijeniti.");
            return;
        }

        const date = dateEl.value;
        const category = getSelectedCompanyExpenseCategory();
        const amount = normalizeMoney(amountEl.value || 0);
        const description = isAutoDescriptionCategory(category)
            ? category
            : descriptionEl.value.trim();

        let isValid = true;
        if (!date) {
            dateEl.classList.add("invalid");
            isValid = false;
        }
        if (!categoryEl.value) {
            categoryEl.classList.add("invalid");
            isValid = false;
        }
        if (categoryEl.value === UTILITIES_CATEGORY && !utilityEl.value) {
            utilityEl.classList.add("invalid");
            isValid = false;
        }
        if (!description) {
            descriptionEl.classList.add("invalid");
            isValid = false;
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            amountEl.classList.add("invalid");
            isValid = false;
        }

        if (!isValid) {
            alert("Unesite ispravne podatke troška firme.");
            return;
        }

        expense.date = date;
        expense.cat = category;
        expense.desc = description;
        expense.amount = amount;

        closeEditCompanyExpensePopup();
        saveToLocal();
        renderProjectsPage();
        window.dispatchEvent(new CustomEvent("a3z:dataImported"));
    });
}
