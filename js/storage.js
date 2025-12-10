import { data } from "./main.js";

export function initStorage() {
    const saved = localStorage.getItem("A3Z_finance");
    if (saved) Object.assign(data, JSON.parse(saved));
}

export function saveToLocal() {
    localStorage.setItem("A3Z_finance", JSON.stringify(data));
}

// =====================
//  FILE SYSTEM ACCESS API
// =====================
let fileHandle = null;

// RESET HANDLE (korisnik može izabrati novi folder)
export function resetFileHandle() {
    fileHandle = null;
}

// =====================
// EXPORT JSON (SAVE AS)
// =====================
export async function exportJSON(jsonData = data) {
    try {
        // Fallback za Firefox/Safari
        if (!window.showSaveFilePicker) {
            const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "A3Z_finance.json";
            a.click();
            return;
        }

        // Ako nije izabran fajl
        if (!fileHandle) {
            fileHandle = await window.showSaveFilePicker({
                suggestedName: "A3Z_finance.json",
                types: [{
                    description: "JSON File",
                    accept: { "application/json": [".json"] }
                }]
            });
        }

        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(jsonData, null, 2));
        await writable.close();

        alert("JSON uspješno sačuvan!");
    }
    catch (err) {
        console.error(err);
        alert("Greška pri snimanju JSON fajla.");
    }
}

// =====================
// IMPORT JSON
// =====================
export function importJSON(file) {
    const reader = new FileReader();
    reader.onload = e => {
        Object.assign(data, JSON.parse(e.target.result));
        saveToLocal();

        alert("JSON učitan!");
        location.reload();
    };
    reader.readAsText(file);
}

// =====================
// EXPORT EXCEL — cijeli sistem
// =====================
export function exportExcel() {
    const rows = [
        ["Datum", "Opis", "Kategorija", "Iznos", "Tip", "Platio", "Obrisano"]
    ];

    data.transactions.forEach(t => {
        rows.push([
            t.date,
            t.desc,
            t.cat,
            t.amount,
            t.type,
            t.who,
            t.deleted ? "DA" : "NE"
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transakcije");

    XLSX.writeFile(wb, "A3Z_finansije.xlsx");
}

// =====================
// EXPORT EXCEL — pojedinačni mjesec
// =====================
export function exportMonthlyExcel(month) {
    const rows = [
        ["Datum", "Opis", "Kategorija", "Iznos", "Tip", "Platio", "Obrisano"]
    ];

    data.transactions
        .filter(t => t.date.slice(0, 7) === month)
        .forEach(t => {
            rows.push([
                t.date,
                t.desc,
                t.cat,
                t.amount,
                t.type,
                t.who,
                t.deleted ? "DA" : "NE"
            ]);
        });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, month);

    XLSX.writeFile(wb, `A3Z_finansije_${month}.xlsx`);
}
