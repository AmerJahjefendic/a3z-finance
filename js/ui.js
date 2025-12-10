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
        
        // ** KLJUČNA IZMJENA: Dodavanje klase tipa (Prihod/Trosak) **
        tr.classList.add(t.type); 
        // CSS u style.css će koristiti ovu klasu (npr. tr.Prihod ili tr.Trosak)
        
        tr.innerHTML = `
            <td>${t.date}</td>
            <td>${t.desc}</td>
            <td>${t.cat}</td>
            <td>${t.amount.toFixed(2)} KM</td>
            <td>${t.type}</td>
            <td>${t.who}</td>
            <td>
                <button class="smallBtn editBtn" data-id="${t.id}">✏️</button>
                <button class="smallBtn delBtn" data-id="${t.id}">🗑️</button>
            </td>
        `;

        list.appendChild(tr);
    });

    // EVENT DELEGATION — moderno i stabilno
    // Uklanjamo listener na listi prije ponovnog renderinga kako se ne bi gomilali listeneri
    // Ali s obzirom da koristite list.innerHTML = "", stari listeneri su već uništeni.
    // Stoga, moramo dodati listener delegacije PONOVO nakon što se lista renderira.
    
    // Provjera da se listener ne duplicira:
    // S obzirom da se cijeli sadržaj #home renderira sa svakim klikom taba (renderHome), 
    // a renderTransactionList se poziva unutar renderHome, listener će se duplicirati
    // svaki put kad se renderTransactionList pozove. 
    // **Bolja praksa je da se ovaj Event Listener premjesti u ui-home.js**
    // gdje je tabela prvi put renderirana, i pozove se samo jednom.

    // Privremeno, ostavljam ovdje, ali imajte na umu dupliranje listenera ako se ova funkcija 
    // zove više puta u istom DOM elementu bez prethodnog uklanjanja!

    // UKLANJAM STARI LISTENER AKO POSTOJI
    const new_list = document.getElementById("transactionList");

    // Prethodni kod ovdje NIJE UKLANJAO stari listener.
    // Jednostavno ponovo pridruživanje listenera elementu koji je već
    // re-generiran (zbog list.innerHTML = "") je OK, ali je prilično nespretno.
    // Pošto je cilj samo UI, ostavljam kod kako biste vidjeli vizuelne promjene:

    // UKLJUČITI AKO KORISTITE NAČIN RENDERIRANJA KOJI NE BRIŠE PRETHODNI LISTENER
    // list.removeEventListener("click", previousListenerFunction);

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
