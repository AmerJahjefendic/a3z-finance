import { saveTransaction, editTransaction, deleteTransaction, getTransactionsForCurrentMonth } from "./transactions.js";
import { recalc } from "./calc.js";


// ============ TOGGLE INPUTS ============
export function toggleInputs() {
    const type = document.getElementById("typeInput").value;

    const catBlock = document.getElementById("catBlock");
    const whoBlock = document.getElementById("whoBlock");

    if (type === "Prihod") {
        catBlock.style.display = "none";
        whoBlock.style.display = "none";
        document.getElementById("whoInput").value = "Firma";
    } else {
        catBlock.style.display = "block";
        whoBlock.style.display = "block";
    }
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
                    <option value="Gorivo">Gorivo</option>
                    <option value="Ostalo">Ostalo</option>
                </select>
            </div>

            <div id="whoBlock">
                <label>Ko je platio</label>
                <select id="whoInput">
                    <option value="Amer">Amer</option>
                    <option value="Emir">Emir</option>
                    <option value="Firma">Firma</option>
                </select>
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
        renderTransactionList();
        recalc();
    });

    document.getElementById("typeInput").addEventListener("change", toggleInputs);

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

        tr.innerHTML = `
            <td>${t.date}</td>
            <td>${t.desc}</td>
            <td>${t.cat}</td>
            <td>${t.amount.toFixed(2)} KM</td>
            <td>${t.type}</td>
            <td>${t.who}</td>
            <td>
                <button class="smallBtn editBtn" data-id="${t.id}">Edit</button>
                <button class="smallBtn delBtn" data-id="${t.id}">X</button>
            </td>
        `;

        list.appendChild(tr);
    });

    // EVENT DELEGATION — moderno i stabilno
    list.addEventListener("click", (e) => {
        if (e.target.classList.contains("editBtn")) {
            editTransaction(e.target.dataset.id);
            renderTransactionList();
            recalc();
        }

        if (e.target.classList.contains("delBtn")) {
            deleteTransaction(e.target.dataset.id);
            renderTransactionList();
            recalc();
        }
    });
}
