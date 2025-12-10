import { data } from "./main.js";
import { saveToLocal } from "./storage.js";
import { renderTransactionList } from "./ui.js";
import { recalc } from "./calc.js";

// ===================================
// EDIT MODE CONTROL
// ===================================
let editOriginalId = null;


// ===================================
// SAVE TRANSACTION (NEW OR EDIT)
// ===================================

export function saveTransaction() {
    const date = dateInput.value;
    const type = typeInput.value;
    const desc = descInput.value.trim();
    const amount = parseFloat(amountInput.value);

    const cat = type === "Trosak" ? catInput.value : "-";
    const who = type === "Trosak" ? whoInput.value : "Firma";

    if (!date || !desc || !amount) {
        alert("Popuni sva polja.");
        return;
    }

    // ====================================================
    // CASE 1: EDIT → ARCHIVE OLD + ADD NEW VERSION
    // ====================================================
    if (editOriginalId !== null) {
        const old = data.transactions.find(x => x.id == editOriginalId);

        if (old) {
            // Arhiviraj staru verziju
            old.deleted = true;
            old.edited = true;
        }

        // Dodaj potpuno novi zapis
        data.transactions.push({
            id: Date.now(),
            date,
            type,
            desc,
            amount,
            cat,
            who,
            deleted: false,
            editedFrom: editOriginalId
        });

        editOriginalId = null; // reset
    }

    // ====================================================
    // CASE 2: NEW ENTRY
    // ====================================================
    else {
        data.transactions.push({
            id: Date.now(),
            date,
            type,
            desc,
            amount,
            cat,
            who,
            deleted: false
        });
    }

    saveToLocal();
    renderTransactionList();
    recalc();
    resetForm();
}



// ===================================
// DELETE = SOFT DELETE
// ===================================

export function deleteTransaction(id) {
    const t = data.transactions.find(x => x.id == id);
    if (!t) return;

    t.deleted = true;

    saveToLocal();
    renderTransactionList();
    recalc();
}



// ===================================
// EDIT = LOAD OLD VALUES INTO FORM
// ===================================

export function editTransaction(id) {
    const t = data.transactions.find(x => x.id == id);
    if (!t) return;

    // Popuni formu
    dateInput.value = t.date;
    typeInput.value = t.type;
    descInput.value = t.desc;
    amountInput.value = t.amount;

    if (t.type === "Trosak") {
        catInput.value = t.cat;
        whoInput.value = t.who;
    }

    typeInput.dispatchEvent(new Event("change"));

    // Zapamti ID orginala radi verzionisanja
    editOriginalId = id;
}



// ===================================
// FILTER: CURRENT MONTH (ACTIVE + DELETED)
// ===================================

export function getTransactionsForCurrentMonth() {
    const month = new Date().toISOString().slice(0, 7);
    return data.transactions.filter(t => t.date.slice(0, 7) === month);
}



// ===================================
// RESET FORM
// ===================================

function resetForm() {
    dateInput.value = "";
    descInput.value = "";
    amountInput.value = "";
    typeInput.value = "Prihod";
    typeInput.dispatchEvent(new Event("change"));
}
