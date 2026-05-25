import { data, DEFAULT_PROJECT_ID, OVERHEAD_PROJECT_ID } from "./main.js";

function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

function normalizeMoney(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.round(num * 100) / 100;
}

function normalizeTransaction(item) {
    if (!item || typeof item !== "object") return null;

    const amount = Number(item.amount);
    if (!Number.isFinite(amount) || amount <= 0) return null;

    const date = typeof item.date === "string" ? item.date.slice(0, 10) : "";
    const type = item.type === "Trosak" ? "Trosak" : "Prihod";

    const tx = {
        id: item.id ?? createId(),
        projectId: item.projectId,
        date,
        type,
        desc: typeof item.desc === "string" ? item.desc.trim() : "",
        amount,
        cat: type === "Trosak"
            ? (typeof item.cat === "string" && item.cat.trim() ? item.cat : "Ostalo")
            : "-",
        who: "Firma",
        deleted: Boolean(item.deleted)
    };

    if (typeof item.source === "string") tx.source = item.source;

    if (item.edited) tx.edited = true;
    if (item.editedFrom != null) tx.editedFrom = item.editedFrom;

    return tx;
}

function normalizeProject(item) {
    if (!item || typeof item !== "object") return null;

    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (!name) return null;

    const fallbackDate = item.createdAt ? String(item.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10);

    return {
        id: item.id ?? createId(),
        name,
        takeoverDate: typeof item.takeoverDate === "string" && item.takeoverDate
            ? item.takeoverDate.slice(0, 10)
            : fallbackDate,
        totalPrice: Math.max(0, normalizeMoney(item.totalPrice)),
        advance: Math.max(0, normalizeMoney(item.advance)),
        archived: Boolean(item.archived),
        system: Boolean(item.system),
        createdAt: item.createdAt || new Date().toISOString()
    };
}

function ensureSystemProjects(projects) {
    const normalized = [...projects];

    if (!normalized.some(p => p.id === DEFAULT_PROJECT_ID)) {
        normalized.push({
            id: DEFAULT_PROJECT_ID,
            name: "Opšti projekat",
            takeoverDate: new Date().toISOString().slice(0, 10),
            totalPrice: 0,
            advance: 0,
            archived: false,
            system: false,
            createdAt: new Date().toISOString()
        });
    }

    if (!normalized.some(p => p.id === OVERHEAD_PROJECT_ID)) {
        normalized.push({
            id: OVERHEAD_PROJECT_ID,
            name: "Fiksni troškovi firme",
            takeoverDate: new Date().toISOString().slice(0, 10),
            totalPrice: 0,
            advance: 0,
            archived: false,
            system: true,
            createdAt: new Date().toISOString()
        });
    }

    return normalized.map(p => ({
        ...p,
        system: p.id === OVERHEAD_PROJECT_ID ? true : Boolean(p.system)
    }));
}

function parseFinanceData(rawText) {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== "object") {
        throw new Error("Neispravan format JSON podataka.");
    }

    const rawProjects = Array.isArray(parsed.projects) ? parsed.projects : [];
    let projects = rawProjects
        .map(normalizeProject)
        .filter(Boolean);

    if (projects.length === 0) {
        projects = [{
            id: DEFAULT_PROJECT_ID,
            name: "Opšti projekat",
            totalPrice: 0,
            advance: 0,
            archived: false,
            system: false,
            createdAt: new Date().toISOString()
        }];
    }

    projects = ensureSystemProjects(projects);

    const projectIds = new Set(projects.map(p => p.id));
    const fallbackProject = projects.find(p => !p.archived && !p.system)
        || projects.find(p => !p.archived)
        || projects[0];
    const fallbackProjectId = fallbackProject.id;

    const rawTransactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
    const transactions = rawTransactions
        .map(normalizeTransaction)
        .filter(Boolean)
        .map(t => ({
            ...t,
            projectId: projectIds.has(t.projectId) ? t.projectId : fallbackProjectId
        }));

    const parsedActiveProject = projects.find(
        p => p.id === parsed.activeProjectId && !p.archived && !p.system
    );
    const activeProjectId = parsedActiveProject ? parsedActiveProject.id : fallbackProjectId;

    return { projects, activeProjectId, transactions };
}

export function initStorage() {
    const saved = localStorage.getItem("A3Z_finance");
    if (!saved) return;

    try {
        Object.assign(data, parseFinanceData(saved));
    } catch (err) {
        console.error("Neuspjelo učitavanje lokalnih podataka:", err);
    }
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
        try {
            Object.assign(data, parseFinanceData(e.target.result));
            saveToLocal();

            alert("JSON učitan!");
            window.dispatchEvent(new CustomEvent("a3z:dataImported"));
        } catch (err) {
            console.error(err);
            alert("Greška: JSON nije validan ili ima neispravne transakcije.");
        }
    };
    reader.readAsText(file);
}

// =====================
// EXPORT EXCEL — cijeli sistem
// =====================
export function exportExcel() {
    const projectMap = new Map(data.projects.map(p => [p.id, p.name]));
    const rows = [
        ["Projekat", "Datum", "Opis", "Kategorija", "Iznos", "Tip", "Obrisano"]
    ];

    data.transactions.forEach(t => {
        rows.push([
            projectMap.get(t.projectId) || "-",
            t.date,
            t.desc,
            t.cat,
            t.amount,
            t.type,
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
export function exportMonthlyExcel(month, projectId = null) {
    const projectMap = new Map(data.projects.map(p => [p.id, p.name]));
    const rows = [
        ["Projekat", "Datum", "Opis", "Kategorija", "Iznos", "Tip", "Obrisano"]
    ];

    data.transactions
        .filter(t => t.date.slice(0, 7) === month && (!projectId || t.projectId === projectId))
        .forEach(t => {
            rows.push([
                projectMap.get(t.projectId) || "-",
                t.date,
                t.desc,
                t.cat,
                t.amount,
                t.type,
                t.deleted ? "DA" : "NE"
            ]);
        });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, month);

    XLSX.writeFile(wb, `A3Z_finansije_${month}.xlsx`);
}
