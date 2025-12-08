// Globalni podaci
export let data = { transactions: [] };

// Funkcija za prikaz HOME stranice
function renderHome() {
    const home = document.getElementById("home");

    home.innerHTML = `
        <div class="card">
            <h2>Troškovi — sa izračunom</h2>
            <p><b>Amer uplatio:</b> <span id="amerPaid">0.00</span> KM</p>
            <p><b>Emir uplatio:</b> <span id="emirPaid">0.00</span> KM</p>
            <p><b>Ukupan trošak:</b> <span id="totalExpense">0.00</span> KM</p>
            <p><b>Trošak po osobi:</b> <span id="expensePerPerson">0.00</span> KM</p>
            <p id="expenseBalanceText"><i>Još nema dovoljno podataka.</i></p>
        </div>

        <div class="card">
            <h2>Prihodi — sa izračunom</h2>
            <p><b>Ukupan prihod:</b> <span id="totalIncome">0.00</span> KM</p>
            <p><b>Razlika prihodi – troškovi:</b> <span id="netProfit">0.00</span> KM</p>
            <p><b>Dobit po osobi:</b> <span id="profitPerPerson">0.00</span> KM</p>
        </div>

        <div class="card">
            <h2>Dodaj transakciju</h2>

            <label>Datum</label>
            <input type="date" id="dateInput">

            <label>Tip</label>
            <select id="typeInput">
                <option value="Prihod">Prihod</option>
                <option value="Trosak">Trošak</option>
            </select>

            <div id="catBlock">
                <label>Kategorija</label>
                <select id="catInput">
                    <option value="Materijal">Materijal</option>
                    <option value="Okovi">Okovi</option>
                    <option value="Režije">Režije</option>
                    <option value="Najam">Najam</option>
                    <option value="Alat">Alat</option>
                    <option value="Gorivo">Gorivo</option>
                    <option value="Drugo">Drugo</option>
                </select>
            </div>

            <label>Opis</label>
            <input type="text" id="descInput">

            <label>Iznos (KM)</label>
            <input type="number" id="amountInput">

            <div id="whoBlock">
                <label>Ko je platio?</label>
                <select id="whoInput">
                    <option value="Amer">Amer</option>
                    <option value="Emir">Emir</option>
                    <option value="Firma">Firma</option>
                </select>
            </div>

            <button id="saveBtn">Spremi</button>
        </div>

        <div class="card">
            <h2>Transakcije — tekući mjesec</h2>
            <table>
                <thead>
                    <tr>
                        <th>Datum</th>
                        <th>Opis</th>
                        <th>Kategorija</th>
                        <th>Iznos</th>
                        <th>Tip</th>
                        <th>Platio</th>
                    </tr>
                </thead>
                <tbody id="transTable"></tbody>
            </table>
        </div>
    `;

    // Dodajemo handler za dugme "Spremi"
    document.getElementById("saveBtn").addEventListener("click", saveTransaction);
    toggleInputs(); // inicijalno stanje polja
    recalc();
    renderTransactions();
}

// Prebacivanje tabova
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", (e) => {
        const pageId = tab.dataset.page;

        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
        document.getElementById(pageId).classList.add("active");

        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        e.target.classList.add("active");

        if (pageId === "home") renderHome();
        // Za "months" i "importExport" kasnije ćemo napisati render funkcije
    });
});

// LOGIKA ZA POLJA, SPREMANJE, PRIKAZ – minimalna verzija

function toggleInputs() {
    const type = document.getElementById("typeInput").value;
    const catBlock = document.getElementById("catBlock");
    const whoBlock = document.getElementById("whoBlock");

    if (type === "Prihod") {
        catBlock.style.display = "none";
        whoBlock.style.display = "none";
    } else {
        catBlock.style.display = "block";
        whoBlock.style.display = "block";
    }

    document.getElementById("typeInput").addEventListener("change", toggleInputs);
}

function saveTransaction() {
    const date = document.getElementById("dateInput").value;
    const type = document.getElementById("typeInput").value;
    const desc = document.getElementById("descInput").value.trim();
    const amount = parseFloat(document.getElementById("amountInput").value);
    const cat = document.getElementById("catInput").value;
    const who = document.getElementById("whoInput").value;

    if (!date || !desc || !amount) {
        alert("Popuni sva polja.");
        return;
    }

    const t = {
        id: Date.now(),
        date,
        type,
        desc,
        amount,
        cat: type === "Trosak" ? cat : "-",
        who: type === "Trosak" ? who : "Firma",
        deleted: false
    };

    data.transactions.push(t);

    // Reset polja
    document.getElementById("dateInput").value = "";
    document.getElementById("descInput").value = "";
    document.getElementById("amountInput").value = "";
    document.getElementById("typeInput").value = "Prihod";
    toggleInputs();

    renderTransactions();
    recalc();
}

function renderTransactions() {
    const tbody = document.getElementById("transTable");
    if (!tbody) return; // ako nismo na home
    tbody.innerHTML = "";

    const month = new Date().toISOString().slice(0,7);

    data.transactions
        .filter(t => t.date.slice(0,7) === month && !t.deleted)
        .forEach(t => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${t.date}</td>
                <td>${t.desc}</td>
                <td>${t.cat}</td>
                <td>${t.amount}</td>
                <td>${t.type}</td>
                <td>${t.who}</td>
            `;
            tbody.appendChild(tr);
        });
}

function recalc() {
    const amerSpan = document.getElementById("amerPaid");
    if (!amerSpan) return; // ako nije renderovan home još

    let amer = 0, emir = 0, income = 0;
    const month = new Date().toISOString().slice(0,7);

    data.transactions
        .filter(t => !t.deleted && t.date.slice(0,7) === month)
        .forEach(t => {
            if (t.type === "Trosak") {
                if (t.who === "Amer") amer += t.amount;
                if (t.who === "Emir") emir += t.amount;
            } else {
                income += t.amount;
            }
        });

    const total = amer + emir;
    const per = total / 2;
    const diff = Math.abs(amer - emir) / 2;

    let balans =
        amer > emir ? `Emir treba nadoknaditi Ameru: ${diff.toFixed(2)} KM`
        : amer < emir ? `Amer treba nadoknaditi Emiru: ${diff.toFixed(2)} KM`
        : "Uplate su jednake — nema nadoknade.";

    document.getElementById("amerPaid").innerText = amer.toFixed(2);
    document.getElementById("emirPaid").innerText = emir.toFixed(2);
    document.getElementById("totalExpense").innerText = total.toFixed(2);
    document.getElementById("expensePerPerson").innerText = per.toFixed(2);
    document.getElementById("expenseBalanceText").innerText = balans;

    document.getElementById("totalIncome").innerText = income.toFixed(2);
    const net = income - total;
    document.getElementById("netProfit").innerText = net.toFixed(2);
    document.getElementById("profitPerPerson").innerText = (net / 2).toFixed(2);
}

// Inicijalno renderovanje
renderHome();
