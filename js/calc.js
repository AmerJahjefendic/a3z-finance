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

    let msg =
        amer > emir ? `Emir treba dati Ameru: ${diff.toFixed(2)} KM`
        : emir > amer ? `Amer treba dati Emiru: ${diff.toFixed(2)} KM`
        : "Sve izravnato.";

    document.getElementById("amerPaid").innerText = amer.toFixed(2);
    document.getElementById("emirPaid").innerText = emir.toFixed(2);
    document.getElementById("totalExpense").innerText = total.toFixed(2);
    document.getElementById("expensePerPerson").innerText = per.toFixed(2);
    document.getElementById("expenseBalanceText").innerText = msg;

    document.getElementById("totalIncome").innerText = income.toFixed(2);
    document.getElementById("netProfit").innerText = (income - total).toFixed(2);
    document.getElementById("profitPerPerson").innerText = ((income - total)/2).toFixed(2);
}
