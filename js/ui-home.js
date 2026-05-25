import { recalc } from "./calc.js";
import { renderTransactionForm, renderTransactionList } from "./ui.js";
import { addProject, data, getActiveProject, setActiveProject } from "./main.js";
import { saveToLocal } from "./storage.js";
import { createId, normalizeMoney } from "./utils.js";

function preventWheelValueChange(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("wheel", (e) => {
        e.preventDefault();
    }, { passive: false });
}

function getActiveProjectShoppingItems() {
    return (data.shoppingList || [])
        .filter(item => item.projectId === data.activeProjectId)
        .sort((a, b) => {
            if (a.status !== b.status) return a.status === "planned" ? -1 : 1;
            return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
        });
}

function getShoppingSummary(items) {
    const total = items.length;
    const purchased = items.filter(item => item.status === "purchased").length;
    const planned = total - purchased;

    return { total, purchased, planned };
}

function resetShoppingItemForm() {
    const idEl = document.getElementById("shoppingItemId");
    const nameEl = document.getElementById("shoppingItemName");
    const quantityEl = document.getElementById("shoppingItemQuantity");
    const dimensionsEl = document.getElementById("shoppingItemDimensions");
    const noteEl = document.getElementById("shoppingItemNote");
    const submitEl = document.getElementById("saveShoppingItemBtn");
    const titleEl = document.getElementById("shoppingFormTitle");

    if (idEl) idEl.value = "";
    if (nameEl) nameEl.value = "";
    if (quantityEl) quantityEl.value = "";
    if (dimensionsEl) dimensionsEl.value = "";
    if (noteEl) noteEl.value = "";
    if (submitEl) submitEl.textContent = "Dodaj stavku";
    if (titleEl) titleEl.textContent = "Dodaj stavku";
}

function fillShoppingItemForm(item) {
    const idEl = document.getElementById("shoppingItemId");
    const nameEl = document.getElementById("shoppingItemName");
    const quantityEl = document.getElementById("shoppingItemQuantity");
    const dimensionsEl = document.getElementById("shoppingItemDimensions");
    const noteEl = document.getElementById("shoppingItemNote");
    const submitEl = document.getElementById("saveShoppingItemBtn");
    const titleEl = document.getElementById("shoppingFormTitle");

    if (idEl) idEl.value = item.id;
    if (nameEl) nameEl.value = item.name || "";
    if (quantityEl) quantityEl.value = item.quantity || "";
    if (dimensionsEl) dimensionsEl.value = item.dimensions || "";
    if (noteEl) noteEl.value = item.note || "";
    if (submitEl) submitEl.textContent = "Spremi stavku";
    if (titleEl) titleEl.textContent = "Uredi stavku";
}

function renderShoppingListSection() {
    const activeProject = getActiveProject();
    const root = document.getElementById("shoppingListSection");
    if (!root) return;

    if (!activeProject) {
        root.innerHTML = "";
        return;
    }

    const items = getActiveProjectShoppingItems();
    const summary = getShoppingSummary(items);

    root.innerHTML = `
        <div class="card shopping-card-shell">
            <div class="shopping-header">
                <div>
                    <h2>Lista za kupovinu</h2>
                    <p class="shopping-subtitle">Plan kupovine za projekat ${activeProject.name}</p>
                </div>
                <div class="shopping-header-actions">
                    <button id="openShoppingListBtn" type="button" class="secondaryBtn shopping-toggle-btn">Prikaži listu</button>
                    <button id="openShoppingFormBtn" type="button" class="shopping-toggle-btn">Dodaj stavku</button>
                </div>
            </div>

            <div class="shopping-summary-grid">
                <div class="shopping-stat">
                    <span>Ukupno stavki</span>
                    <strong>${summary.total}</strong>
                </div>
                <div class="shopping-stat">
                    <span>Kupljeno</span>
                    <strong>${summary.purchased}</strong>
                </div>
                <div class="shopping-stat">
                    <span>Preostalo</span>
                    <strong>${summary.planned}</strong>
                </div>
            </div>
        </div>

        <div id="shoppingListPopup" class="shopping-popup-backdrop" style="display:none;">
            <div class="shopping-popup-card" role="dialog" aria-modal="true" aria-label="Lista za kupovinu">
                <div class="shopping-popup-head">
                    <h3>Lista za kupovinu</h3>
                    <button id="closeShoppingListPopupBtn" type="button" class="shopping-close-btn" aria-label="Zatvori listu">×</button>
                </div>

                <div class="shopping-toolbar">
                    <select id="shoppingFilterInput">
                        <option value="all">Sve stavke</option>
                        <option value="planned">Planirano</option>
                        <option value="purchased">Kupljeno</option>
                    </select>
                </div>

                <div id="shoppingListItems" class="shopping-items"></div>
            </div>
        </div>

        <div id="shoppingFormPopup" class="shopping-popup-backdrop" style="display:none;">
            <div class="shopping-popup-card" role="dialog" aria-modal="true" aria-label="Dodaj stavku za kupovinu">
                <div class="shopping-popup-head">
                    <h3 id="shoppingFormTitle">Dodaj stavku</h3>
                    <button id="closeShoppingFormPopupBtn" type="button" class="shopping-close-btn" aria-label="Zatvori formu">×</button>
                </div>

                <div class="shopping-form-grid">
                    <input type="hidden" id="shoppingItemId">

                    <div>
                        <label>Stavka</label>
                        <input type="text" id="shoppingItemName" placeholder="npr. Iverica bijela">
                    </div>

                    <div>
                        <label>Količina</label>
                        <input type="text" id="shoppingItemQuantity" placeholder="npr. 4 ploče / 12m2">
                    </div>

                    <div>
                        <label>Dimenzije</label>
                        <input type="text" id="shoppingItemDimensions" placeholder="npr. 2800x2070x18 mm">
                    </div>

                    <div class="shopping-note-block">
                        <label>Napomena</label>
                        <input type="text" id="shoppingItemNote" placeholder="Dobavljač, dimenzije, boja...">
                    </div>
                </div>

                <div class="shopping-form-actions">
                    <button id="saveShoppingItemBtn" type="button">Dodaj stavku</button>
                    <button id="cancelShoppingItemEditBtn" type="button" class="secondaryBtn">Odustani</button>
                </div>
            </div>
        </div>
    `;

    const openListBtn = document.getElementById("openShoppingListBtn");
    const openFormBtn = document.getElementById("openShoppingFormBtn");
    const closeListBtn = document.getElementById("closeShoppingListPopupBtn");
    const closeFormBtn = document.getElementById("closeShoppingFormPopupBtn");
    const listPopup = document.getElementById("shoppingListPopup");
    const formPopup = document.getElementById("shoppingFormPopup");
    const filterEl = document.getElementById("shoppingFilterInput");

    function openListPopup() {
        if (!listPopup) return;
        listPopup.style.display = "flex";
        renderShoppingItems();
    }

    function closeListPopup() {
        if (!listPopup) return;
        listPopup.style.display = "none";
    }

    function openFormPopup() {
        if (!formPopup) return;
        formPopup.style.display = "flex";
    }

    function closeFormPopup() {
        if (!formPopup) return;
        formPopup.style.display = "none";
        resetShoppingItemForm();
    }

    function renderShoppingItems() {
        const itemsRoot = document.getElementById("shoppingListItems");
        if (!itemsRoot) return;

        const filterValue = filterEl?.value || "all";
        const visibleItems = items.filter(item => filterValue === "all" || item.status === filterValue);

        if (visibleItems.length === 0) {
            itemsRoot.innerHTML = `<div class="shopping-empty">Nema stavki za odabrani filter.</div>`;
            return;
        }

        itemsRoot.innerHTML = visibleItems.map(item => {
            return `
                <div class="shopping-item ${item.status === "purchased" ? "is-purchased" : ""}" data-item-id="${item.id}">
                    <div class="shopping-item-top">
                        <div>
                            <h3>${item.name}</h3>
                            <div class="shopping-meta">${item.quantity ? `Količina: ${item.quantity}` : "Bez količine"}</div>
                        </div>
                        <span class="shopping-status ${item.status}">${item.status === "purchased" ? "Kupljeno" : "Planirano"}</span>
                    </div>

                    <div class="shopping-item-body">
                        <div class="shopping-meta-row"><span>Napomena</span><strong>${item.note || "-"}</strong></div>
                        <div class="shopping-meta-row"><span>Dimenzije</span><strong>${item.dimensions || "-"}</strong></div>
                    </div>

                    <div class="shopping-item-actions">
                        <button type="button" class="smallBtn editBtn" data-action="edit">Uredi</button>
                        <button type="button" class="smallBtn" data-action="toggle-status">${item.status === "purchased" ? "Vrati" : "Kupljeno"}</button>
                        <button type="button" class="smallBtn delBtn" data-action="delete">Obriši</button>
                    </div>
                </div>
            `;
        }).join("");
    }

    openListBtn?.addEventListener("click", openListPopup);
    openFormBtn?.addEventListener("click", () => {
        resetShoppingItemForm();
        openFormPopup();
    });
    closeListBtn?.addEventListener("click", closeListPopup);
    closeFormBtn?.addEventListener("click", closeFormPopup);

    listPopup?.addEventListener("click", (e) => {
        if (e.target === listPopup) closeListPopup();
    });

    formPopup?.addEventListener("click", (e) => {
        if (e.target === formPopup) closeFormPopup();
    });

    filterEl?.addEventListener("change", renderShoppingItems);

    document.getElementById("saveShoppingItemBtn")?.addEventListener("click", () => {
        const idEl = document.getElementById("shoppingItemId");
        const nameEl = document.getElementById("shoppingItemName");
        const quantityEl = document.getElementById("shoppingItemQuantity");
        const dimensionsEl = document.getElementById("shoppingItemDimensions");
        const noteEl = document.getElementById("shoppingItemNote");

        const id = idEl.value;
        const name = nameEl.value.trim();
        const quantity = quantityEl.value.trim();
        const dimensions = dimensionsEl.value.trim();
        const note = noteEl.value.trim();

        [nameEl, quantityEl, dimensionsEl, noteEl].forEach(el => el.classList.remove("invalid"));

        let isValid = true;
        if (!name) {
            nameEl.classList.add("invalid");
            isValid = false;
        }
        if (!isValid) {
            alert("Unesite ispravne podatke stavke za kupovinu.");
            return;
        }

        const existingItem = (data.shoppingList || []).find(item => String(item.id) === String(id));
        if (existingItem) {
            existingItem.name = name;
            existingItem.quantity = quantity;
            existingItem.dimensions = dimensions;
            existingItem.note = note;
        } else {
            data.shoppingList.push({
                id: createId(),
                projectId: data.activeProjectId,
                name,
                quantity,
                dimensions,
                note,
                status: "planned",
                createdAt: new Date().toISOString(),
                purchasedAt: null,
                convertedExpenseId: null
            });
        }

        saveToLocal();
        renderHome();
    });

    document.getElementById("cancelShoppingItemEditBtn")?.addEventListener("click", closeFormPopup);

    document.getElementById("shoppingListItems")?.addEventListener("click", (e) => {
        const button = e.target.closest("button[data-action]");
        const itemEl = e.target.closest(".shopping-item[data-item-id]");
        if (!button || !itemEl) return;

        const item = (data.shoppingList || []).find(entry => String(entry.id) === itemEl.dataset.itemId);
        if (!item) return;

        const action = button.dataset.action;

        if (action === "edit") {
            fillShoppingItemForm(item);
            openFormPopup();
            return;
        }

        if (action === "toggle-status") {
            item.status = item.status === "purchased" ? "planned" : "purchased";
            item.purchasedAt = item.status === "purchased" ? new Date().toISOString() : null;
            saveToLocal();
            renderHome();
            return;
        }

        if (action === "delete") {
            data.shoppingList = (data.shoppingList || []).filter(entry => String(entry.id) !== String(item.id));
            saveToLocal();
            renderHome();
        }
    });

    renderShoppingItems();
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

        <div id="shoppingListSection"></div>
        
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
    renderShoppingListSection();
    renderTransactionList();
    recalc();
}