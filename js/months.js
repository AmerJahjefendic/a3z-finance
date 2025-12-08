import { data } from "./main.js";

export function renderMonthsPage() {
    const root = document.getElementById("months");

    const months = [...new Set(data.transactions.map(t => t.date.slice(0,7)))];

    root.innerHTML = `
        <h2>Pregled mjeseci</h2>
        <select id="mSelect"></select>
        <div id="mTable"></div>
    `;

    const select = document.getElementById("mSelect");
    months.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m;
        select.appendChild(opt);
    });

    select.onchange = loadMonthTable;

    loadMonthTable();
}

function loadMonthTable() {
    const m = mSelect.value;
    const table = document.getElementById("mTable");

    let html = `
        <table>
            <tr>
                <th>Datum</th>
                <th>Opis</th>
                <th>Kategorija</th>
                <th>Iznos</th>
                <th>Tip</th>
                <th>Ko je platio</th>
            </tr>
    `;

    data.transactions
        .filter(t => t.date.slice(0,7) === m)
        .forEach(t => {
            html += `
                <tr class="${t.deleted?'deleted':''}">
                    <td>${t.date}</td>
                    <td>${t.desc}</td>
                    <td>${t.cat}</td>
                    <td>${t.amount} KM</td>
                    <td>${t.type}</td>
                    <td>${t.who}</td>
                </tr>
            `;
        });

    html += `</table>`;

    table.innerHTML = html;
}
