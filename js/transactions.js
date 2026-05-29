import { data } from "./main.js";
import { OVERHEAD_PROJECT_ID } from "./main.js";
import { saveToLocal } from "./storage.js";
import { renderTransactionList } from "./ui.js";
import { recalc } from "./calc.js";
import {
    getSelectedExpenseCategory,
    isAutoDescriptionCategory,
    parseExpenseCategory,
    UTILITIES_CATEGORY
} from "./expenseCategories.js";

// ===================================
// EDIT MODE CONTROL
// ===================================
let editOriginalId = null;


// ===================================
// SAVE TRANSACTION (NEW OR EDIT) - AŽURIRANO
// ===================================

export function saveTransaction() {
    // Dohvaćamo reference na elemente (koristimo globalne varijable iz ui.js)
    const dateInput = document.getElementById("dateInput");
    const typeInput = document.getElementById("typeInput");
    const descInput = document.getElementById("descInput");
    const amountInput = document.getElementById("amountInput");
    const catInput = document.getElementById("catInput");
    const utilitySubcategoryInput = document.getElementById("utilitySubcategoryInput");

    // Čišćenje prethodnih grešaka
    [dateInput, typeInput, descInput, amountInput, catInput, utilitySubcategoryInput].forEach(el => {
        el.classList.remove("invalid");
    });
    
    // Dohvaćanje vrijednosti
    const date = dateInput.value;
    const type = typeInput.value;
    const rawDesc = descInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const selectedCategory = type === "Trosak"
        ? getSelectedExpenseCategory(catInput.value, utilitySubcategoryInput?.value)
        : "-";
    const desc = type === "Trosak" && isAutoDescriptionCategory(selectedCategory)
        ? selectedCategory
        : rawDesc;

    // Varijable za validaciju
    let isValid = true;

    // A. Provjera da li je datum unesen
    if (!date) {
        dateInput.classList.add("invalid");
        isValid = false;
    }

    // B. Provjera da li je opis unesen
    if (!desc) {
        descInput.classList.add("invalid");
        isValid = false;
    }

    // C. Provjera iznosa: mora biti broj i mora biti pozitivan
    if (isNaN(amount) || amount <= 0) {
        amountInput.classList.add("invalid");
        isValid = false;
    }

    // D. Dodatna provjera za troškove (kategorija i platiša)
    if (type === "Trosak") {
        if (!catInput.value) {
            catInput.classList.add("invalid");
            isValid = false;
        }
        if (catInput.value === UTILITIES_CATEGORY && !utilitySubcategoryInput?.value) {
            utilitySubcategoryInput?.classList.add("invalid");
            isValid = false;
        }
    }
    
    // ZAUSTAVI AKO VALIDACIJA NIJE PROŠLA
    if (!isValid) {
        // Možete dodati vizualnu poruku ovdje umjesto alert-a
        alert("Molimo popunite sva obavezna polja ispravno (Iznos mora biti pozitivan broj).");
        return; 
    }

    // --- LOGIKA SPREMANJA (nepromijenjena) ---

    const cat = selectedCategory;
    const who = "Firma";
    const projectId = data.activeProjectId;

    if (!projectId) {
        alert("Prvo odaberite ili kreirajte projekat.");
        return;
    }

    // CASE 1: EDIT → ARCHIVE OLD + ADD NEW VERSION
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
            projectId,
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

    // CASE 2: NEW ENTRY
    else {
        data.transactions.push({
            id: Date.now(),
            projectId,
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
// EDIT TRANSACTION
//

export function editTransaction(id) {
    const t = data.transactions.find(x => x.id == id);
    if (!t) return;

    // === NOVO: Deklaracija elemenata ===
    const dateInput = document.getElementById("dateInput");
    const typeInput = document.getElementById("typeInput");
    const descInput = document.getElementById("descInput");
    const amountInput = document.getElementById("amountInput");
    const catInput = document.getElementById("catInput");
    const utilitySubcategoryInput = document.getElementById("utilitySubcategoryInput");
    // ===================================
    
    // Popuni formu
    if (dateInput) dateInput.value = t.date;
    if (typeInput) typeInput.value = t.type;
    if (descInput) descInput.value = t.desc;
    if (amountInput) amountInput.value = t.amount;

    if (t.type === "Trosak") {
        const parsedCategory = parseExpenseCategory(t.cat);
        if (catInput) catInput.value = parsedCategory.main;
        if (utilitySubcategoryInput) utilitySubcategoryInput.value = parsedCategory.sub;
    }

    if (typeInput) typeInput.dispatchEvent(new Event("change"));

    // Zapamti ID orginala radi verzionisanja
    editOriginalId = id;
}



// ===================================
// FILTER: CURRENT MONTH (ACTIVE + DELETED)
// ===================================

export function getTransactionsForCurrentMonth() {
    return data.transactions.filter(t => t.projectId === data.activeProjectId);
}

// ===================================
// RESET FORM
// ===================================

function resetForm() {
    // === NOVO: Deklaracija SVIH 6 elemenata ===
    const dateInput = document.getElementById("dateInput");
    const descInput = document.getElementById("descInput");
    const amountInput = document.getElementById("amountInput");
    const typeInput = document.getElementById("typeInput");
    const catInput = document.getElementById("catInput"); 
    const utilitySubcategoryInput = document.getElementById("utilitySubcategoryInput");
    // ===========================================
    
    // Resetovanje osnovnih polja (Provjera je dodana za svaki slučaj)
    if (descInput) descInput.value = "";
    if (amountInput) amountInput.value = "";
    
    // Resetovanje padajućih listi
    if (typeInput) {
        typeInput.value = "Prihod"; // Default na Prihod
        typeInput.dispatchEvent(new Event("change"));
    }
    
    // Resetovanje Trošak polja
    if (catInput) catInput.value = "Materijal"; 
    if (utilitySubcategoryInput) utilitySubcategoryInput.value = "Struja";
    
    // Ostavite datum kako jeste
    // if (dateInput) dateInput.value = new Date().toISOString().substring(0, 10); 
}
