import { data } from "./main.js";

export function initStorage() {
    const saved = localStorage.getItem("A3Z_finance");
    if (saved) {
        Object.assign(data, JSON.parse(saved));
    }
}

export function saveToLocal() {
    localStorage.setItem("A3Z_finance", JSON.stringify(data));
}

// EXPORT JSON
export function exportJSON() {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "a3z_finance.json";
    a.click();
}

// IMPORT JSON
export function importJSON(file) {
    const reader = new FileReader();
    reader.onload = e => {
        Object.assign(data, JSON.parse(e.target.result));
        saveToLocal();
        alert("JSON učitan.");
    };
    reader.readAsText(file);
}
export function exportExcel() {
    import("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js")
        .then(XLSX => {
            const rows = [
                ["Datum", "Opis", "Kategorija", "Iznos", "Tip", "Platio", "Obrisano"]
            ];

            data.transactions.forEach(t => {
                rows.push([
                    t.date, t.desc, t.cat, t.amount, t.type, t.who, t.deleted ? "DA" : "NE"
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(rows);
            const wb = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(wb, ws, "Transakcije");
            XLSX.writeFile(wb, "A3Z_finansije.xlsx");
        });
}

