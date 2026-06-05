import { data, OVERHEAD_PROJECT_ID } from "./main.js";

function getCurrentLocalMonthKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
}

export function recalc() {
    let monthlyProjectExpense = 0;
    let monthlyOverheadExpense = 0;
    let monthlyIncome = 0;
    let projectIncome = 0;
    let projectExpense = 0;
    const activeProject = data.projects.find(p => p.id === data.activeProjectId) || null;
    const monthKey = getCurrentLocalMonthKey();

    data.transactions
        .filter(t => !t.deleted)
        .forEach(t => {
            if (t.date.slice(0, 7) === monthKey) {
                if (t.type === "Trosak") {
                    if (t.projectId === OVERHEAD_PROJECT_ID) {
                        monthlyOverheadExpense += t.amount;
                    } else {
                        monthlyProjectExpense += t.amount;
                    }
                } else {
                    monthlyIncome += t.amount;
                }
            }

            if (t.projectId === data.activeProjectId && t.type === "Prihod") {
                projectIncome += t.amount;
            }

            if (t.projectId === data.activeProjectId && t.type === "Trosak") {
                projectExpense += t.amount;
            }
        });

    const monthlyNetProfit = monthlyIncome - monthlyProjectExpense - monthlyOverheadExpense;
    const totalPrice = Number(activeProject?.totalPrice || 0);
    const advance = Number(activeProject?.advance || 0);
    const projectProfit = projectIncome - projectExpense;
    const remaining = totalPrice - projectIncome;
    
    // ===============================================
    // SIGURNOSNE PROVJERE PRIJE AŽURIRANJA UI-a
    // ===============================================

    const projectExpenseEl = document.getElementById("projectExpense");
    if (projectExpenseEl) projectExpenseEl.innerText = monthlyProjectExpense.toFixed(2);

    const overheadExpenseEl = document.getElementById("overheadExpense");
    if (overheadExpenseEl) overheadExpenseEl.innerText = monthlyOverheadExpense.toFixed(2);
    
    // 2. Prihod/Profit detalji
    const totalIncomeEl = document.getElementById("totalIncome");
    if (totalIncomeEl) totalIncomeEl.innerText = monthlyIncome.toFixed(2);
    
    const netProfitEl = document.getElementById("netProfit");
    if (netProfitEl) netProfitEl.innerText = monthlyNetProfit.toFixed(2);

    const activeProjectNameEl = document.getElementById("activeProjectName");
    if (activeProjectNameEl) activeProjectNameEl.innerText = activeProject?.name || "-";

    const projectTakeoverDateEl = document.getElementById("projectTakeoverDate");
    if (projectTakeoverDateEl) projectTakeoverDateEl.innerText = activeProject?.takeoverDate || "-";

    const projectTotalPriceEl = document.getElementById("projectTotalPrice");
    if (projectTotalPriceEl) projectTotalPriceEl.innerText = totalPrice.toFixed(2);

    const projectAdvanceEl = document.getElementById("projectAdvance");
    if (projectAdvanceEl) projectAdvanceEl.innerText = advance.toFixed(2);

    const projectProfitAmountEl = document.getElementById("projectProfitAmount");
    if (projectProfitAmountEl) projectProfitAmountEl.innerText = projectProfit.toFixed(2);

    const projectRemainingEl = document.getElementById("projectRemaining");
    if (projectRemainingEl) projectRemainingEl.innerText = remaining.toFixed(2);

    const projectExpenseAmountEl = document.getElementById("projectExpenseAmount");
    if (projectExpenseAmountEl) projectExpenseAmountEl.innerText = projectExpense.toFixed(2);
    
}
