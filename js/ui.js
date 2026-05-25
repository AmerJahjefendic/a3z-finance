import { saveTransaction, editTransaction, deleteTransaction, getTransactionsForCurrentMonth } from "./transactions.js";
import { recalc } from "./calc.js";
import { getSelectedExpenseCategory, isAutoDescriptionCategory, UTILITIES_CATEGORY } from "./expenseCategories.js";

function toText(value) {
    return value == null ? "" : String(value);
}

function syncUtilitySubcategory() {
    const typeInput = document.getElementById("typeInput");
    const catInput = document.getElementById("catInput");
    const utilitySubcategoryBlock = document.getElementById("utilitySubcategoryBlock");
    const utilitySubcategoryInput = document.getElementById("utilitySubcategoryInput");

    if (!typeInput || !catInput || !utilitySubcategoryBlock || !utilitySubcategoryInput) return;

    const showUtilitySubcategory = typeInput.value === "Trosak" && catInput.value === UTILITIES_CATEGORY;
    utilitySubcategoryBlock.style.display = showUtilitySubcategory ? "block" : "none";

    if (showUtilitySubcategory && !utilitySubcategoryInput.value) {
        utilitySubcategoryInput.value = "Struja";
    }
}

function syncDescriptionInput() {
    const typeInput = document.getElementById("typeInput");
    const descInput = document.getElementById("descInput");

    if (!typeInput || !descInput) return;

    const catInput = document.getElementById("catInput");
    const utilitySubcategoryInput = document.getElementById("utilitySubcategoryInput");
    const selectedCategory = getSelectedExpenseCategory(catInput?.value, utilitySubcategoryInput?.value);
    const shouldAutoFill = typeInput.value === "Trosak" && isAutoDescriptionCategory(selectedCategory);

    if (shouldAutoFill) {
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


// ============ TOGGLE INPUTS ============
export function toggleInputs() {
    const type = document.getElementById("typeInput").value;

    const catBlock = document.getElementById("catBlock");
    const utilitySubcategoryBlock = document.getElementById("utilitySubcategoryBlock");
    const overheadBlock = document.getElementById("overheadBlock");

    if (type === "Prihod") {
        catBlock.style.display = "none";
        if (utilitySubcategoryBlock) utilitySubcategoryBlock.style.display = "none";
        overheadBlock.style.display = "none";
    } else {
        catBlock.style.display = "block";
        overheadBlock.style.display = "block";
    }

    syncUtilitySubcategory();
    syncDescriptionInput();
}


// ============ RENDER FORM ============
export function renderTransactionForm() {
    const root = document.getElementById("transactionForm");

    root.innerHTML = `
        <div class="card">
            <h2>Dodaj transakciju</h2>

            <label>Datum</label>
            <input type="date" id="dateInput">

            <label>Tip</label>
            <select id="typeInput">
                <option value="Prihod">Prihod</option>
                <option value="Trosak">Trosak</option>
            </select>

            <div id="catBlock">
                <label>Kategorija</label>
                <select id="catInput">
                    <option value="Materijal">Materijal</option>
                    <option value="Alat">Alat</option>
                    <option value="Prevoz">Prevoz</option>
                    <option value="Kirija">Kirija</option>
                    <option value="Režije">Režije</option>
                    <option value="Ostalo">Ostalo</option>
                </select>
            </div>

            <div id="utilitySubcategoryBlock" style="display:none;">
                <label>Podkategorija režija</label>
                <select id="utilitySubcategoryInput">
                    <option value="Struja">Struja</option>
                    <option value="Voda">Voda</option>
                </select>
            </div>

            <div id="overheadBlock">
                <label style="display:flex; align-items:center; gap:8px; margin:8px 0;">
                    <input type="checkbox" id="isOverheadInput" style="width:auto; margin:0;">
                    Opšti trošak firme (nije vezan za projekat)
                </label>
            </div>

            <label>Opis</label>
            <input type="text" id="descInput">

            <label>Iznos (KM)</label>
            <input type="number" id="amountInput">

            <button id="saveBtn">Spremi</button>
        </div>
    `;

    // EVENT LISTENERS
    document.getElementById("saveBtn").addEventListener("click", () => {
        saveTransaction();
    });

    document.getElementById("typeInput").addEventListener("change", toggleInputs);
    document.getElementById("catInput").addEventListener("change", () => {
        syncUtilitySubcategory();
        syncDescriptionInput();
    });
    document.getElementById("utilitySubcategoryInput").addEventListener("change", syncDescriptionInput);

    toggleInputs();
}

// ============ RENDER TRANSACTIONS LIST ============

export function renderTransactionList() {
    const list = document.getElementById("transactionList");
    const transactions = getTransactionsForCurrentMonth();

    list.innerHTML = "";

    transactions.forEach(t => {
        const tr = document.createElement("tr");
        if (t.deleted) tr.classList.add("deleted");
        
        // Dodavanje klase tipa (Prihod/Trosak) **
        tr.classList.add(t.type); 
        // CSS u style.css će koristiti ovu klasu (npr. tr.Prihod ili tr.Trosak)
        
        const dateTd = document.createElement("td");
        dateTd.textContent = toText(t.date);

        const descTd = document.createElement("td");
        descTd.textContent = toText(t.desc);

        const catTd = document.createElement("td");
        catTd.textContent = toText(t.cat);

        const amountTd = document.createElement("td");
        amountTd.textContent = `${Number(t.amount).toFixed(2)} KM`;

        const typeTd = document.createElement("td");
        typeTd.textContent = toText(t.type);

        const actionsTd = document.createElement("td");
        const editBtn = document.createElement("button");
        editBtn.className = "smallBtn editBtn";
        editBtn.dataset.id = toText(t.id);
        editBtn.type = "button";
        editBtn.textContent = "✏️";

        const delBtn = document.createElement("button");
        delBtn.className = "smallBtn delBtn";
        delBtn.dataset.id = toText(t.id);
        delBtn.type = "button";
        delBtn.textContent = "🗑️";

        actionsTd.append(editBtn, delBtn);
        tr.append(dateTd, descTd, catTd, amountTd, typeTd, actionsTd);

        list.appendChild(tr);
    });

    if (!list.dataset.boundClick) {
        list.addEventListener("click", (e) => {
            const btn = e.target.closest("button");
            if (!btn || !btn.dataset.id) return;

            if (btn.classList.contains("editBtn")) {
                editTransaction(btn.dataset.id);
                const transactionPopup = document.getElementById("transactionFormPopup");
                if (transactionPopup) transactionPopup.style.display = "flex";
                renderTransactionList();
                recalc();
            }

            if (btn.classList.contains("delBtn")) {
                deleteTransaction(btn.dataset.id);
                renderTransactionList();
                recalc();
            }
        });

        list.dataset.boundClick = "1";
    }
}
