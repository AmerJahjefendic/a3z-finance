import { data } from "./main.js";
import { recalc } from "./calc.js";
import { saveToLocal } from "./storage.js";

export function renderTransactionForm() {
    document.getElementById("transactionForm").innerHTML = `
        <div class="card">
            <h2>Dodaj transakciju</h2>

            <label>Datum</label>
            <input id="tDate" type="date">

            <label>Tip</label>
            <select id="tType" onchange="toggleInputs()">
                <option value="Prihod">Prihod</option>
                <option value="Trosak">Trosak</option>
            </select>

            <label>Opis</label>
            <input id="tDesc" type="text">

            <div id="catWrap">
                <label>Kategorija</label>
                <select id="tCat">
                    <option value="Materijal">Materijal</option>
                    <option value="Najam">Najam</option>
                    <option value="Alat">Alat</option>
                    <option value="Ostalo">Ostalo</option>
                </select>
            </div>

            <div id="whoWrap">
                <label>Ko je platio</label>
                <select id="tWho">
                    <option value="Amer">Amer</option>
                    <option value="Emir">Emir</option>
                </select>
            </div>

            <label>Iznos (KM)</label>
            <input id="tAmount" type="number">

            <button onclick="saveTransaction()">Spasi</button>
        </div>
    `;

    window.toggleInputs = function () {
        const type = document.getElementById("tType").value;
        document.getElementById("catWrap").style.display = type === "Trosak" ? "block" : "none";
        document.getElementById("whoWrap").style.display = type === "Trosak" ? "block" : "none";
    };

    window.saveTransaction = function () {
        const date = tDate.value;
        const type = tType.value;
        const desc = tDesc.value.trim();
        const amount = parseFloat(tAmount.value);
        const cat = tCat.value;
        const who = tWho.value;

        if (!date || !desc || !amount) {
            alert("Popuni sva polja.");
            return;
        }

        data.transactions.push({
            id: Date.now(),
            date,
            type,
            desc,
            amount,
            cat: type === "Trosak" ? cat : "-",
            who: type === "Trosak" ? who : "Firma",
            deleted: false
        });

        tDate.value = "";
        tDesc.value = "";
        tAmount.value = "";
        tType.value = "Prihod";

        saveToLocal();
        renderTransactionList();
        recalc();
    };
}


export function renderTransactionList() {
    const tbody = document.getElementById("transactionList");
    const month = new Date().toISOString().slice(0,7);

    tbody.innerHTML = "";

    data.transactions
        .filter(t => !t.deleted && t.date.slice(0,7) === month)
        .forEach(t => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${t.date}</td>
                <td>${t.desc}</td>
                <td>${t.cat}</td>
                <td>${t.amount} KM</td>
                <td>${t.type}</td>
                <td>${t.who}</td>
                <td>
                    <button onclick="deleteTransaction(${t.id})">X</button>
                </td>
            `;

            tbody.appendChild(tr);
        });
}

window.deleteTransaction = function (id) {
    const t = data.transactions.find(x => x.id === id);
    if (!t) return;

    t.deleted = true;
    saveToLocal();
    renderTransactionList();
    recalc();
};
