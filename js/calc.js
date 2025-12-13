import { data } from "./main.js";

export function recalc() {
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
    const netProfit = income - total;

    let msg =
        amer > emir ? `Emir treba dati Ameru: ${diff.toFixed(2)} KM`
        : emir > amer ? `Amer treba dati Emiru: ${diff.toFixed(2)} KM`
        : "Sve izravnato.";
    
    // ===============================================
    // SIGURNOSNE PROVJERE PRIJE AŽURIRANJA UI-a
    // ===============================================

    // 1. Trosak detalji
    const amerPaidEl = document.getElementById("amerPaid");
    if (amerPaidEl) amerPaidEl.innerText = amer.toFixed(2);
    
    const emirPaidEl = document.getElementById("emirPaid");
    if (emirPaidEl) emirPaidEl.innerText = emir.toFixed(2);
    
    const totalExpenseEl = document.getElementById("totalExpense");
    if (totalExpenseEl) totalExpenseEl.innerText = total.toFixed(2);
    
    const expensePerPersonEl = document.getElementById("expensePerPerson");
    if (expensePerPersonEl) expensePerPersonEl.innerText = per.toFixed(2);
    
    const expenseBalanceTextEl = document.getElementById("expenseBalanceText");
    if (expenseBalanceTextEl) expenseBalanceTextEl.innerText = msg;
    
    // 2. Prihod/Profit detalji
    const totalIncomeEl = document.getElementById("totalIncome");
    if (totalIncomeEl) totalIncomeEl.innerText = income.toFixed(2);
    
    const netProfitEl = document.getElementById("netProfit");
    if (netProfitEl) netProfitEl.innerText = netProfit.toFixed(2);
    
    const profitPerPersonEl = document.getElementById("profitPerPerson");
    if (profitPerPersonEl) profitPerPersonEl.innerText = (netProfit/2).toFixed(2);
    
}
