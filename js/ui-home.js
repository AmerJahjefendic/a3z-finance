import { recalc } from "./calc.js";
import { renderTransactionForm, renderTransactionList } from "./ui.js";


export function renderHome() {
    const root = document.getElementById("home");

    root.innerHTML = `
        <h2>Finansijski pregled</h2>
        
        <div class="dashboard-grid">
            
            <div class="card summary-card income-bg">
                <h3>Prihod</h3>
                <p>Ukupno:</p>
                <h1 id="totalIncome">0 KM</h1>
            </div>

            <div class="card summary-card expense-bg">
                <h3>Trošak</h3>
                <p>Ukupno:</p>
                <h1 id="totalExpense">0 KM</h1>
            </div>

            <div class="card summary-card profit-bg">
                <h3>Neto Profit</h3>
                <p>Razlika:</p>
                <h1 id="netProfit">0 KM</h1>
            </div>
        </div>

        <div class="card details-card">
            <h4>Troškovi po osobi</h4>
            <p>Amer uplatio: <b><span id="amerPaid">0</span> KM</b></p>
            <p>Emir uplatio: <b><span id="emirPaid">0</span> KM</b></p>
            <p>Trošak po osobi: <b><span id="expensePerPerson">0</span> KM</b></p>
        </div>

        <p id="expenseBalanceText" class="balance-highlight"></p>
        
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