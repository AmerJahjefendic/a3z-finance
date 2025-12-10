import { recalc } from "./calc.js";
import { renderTransactionForm, renderTransactionList } from "./ui.js";

export function renderHome() {
    const root = document.getElementById("home");

    root.innerHTML = `
        <div class="card">
            <h2>Troškovi i Uplate</h2>
            <p>Amer uplatio: <b><span id="amerPaid">0</span> KM</b></p>
            <p>Emir uplatio: <b><span id="emirPaid">0</span> KM</b></p>
            <p>Ukupan trošak: <b><span id="totalExpense">0</span> KM</b></p>
            <p>Trošak po osobi: <b><span id="expensePerPerson">0</span> KM</b></p>
            <p id="expenseBalanceText" class="highlight"></p>
        </div>

        <div class="card">
            <h2>Prihodi i Dobit</h2>
            <p>Prihod: <b><span id="totalIncome">0</span> KM</b></p>
            <p>Razlika (profit): <b><span id="netProfit">0</span> KM</b></p>
            <p>Dobit po osobi: <b><span id="profitPerPerson">0</span> KM</b></p>
        </div>

        <div id="transactionForm"></div>

        <div class="card">
            <h2>Transakcije tekućeg mjeseca</h2>
            <table class="transactionsTable">
                <thead>
                    <tr>
                        <th>Datum</th>
                        <th>Opis</th>
                        <th>Kategorija</th>
                        <th>Iznos</th>
                        <th>Tip</th>
                        <th>Ko je platio</th>
                        <th>Akcije</th>
                    </tr>
                </thead>
                <tbody id="transactionList"></tbody>
            </table>
        </div>
    `;

    renderTransactionForm();
    renderTransactionList();
    recalc();
}
