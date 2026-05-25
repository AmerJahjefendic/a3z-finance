import { renderHome } from "./ui-home.js";
import { renderMonthsPage } from "./months.js";
import { initStorage } from "./storage.js";
import { renderImportExportPage } from "./importExport.js";
import { renderProjectsPage } from "./projects.js";
import { createId, normalizeMoney } from "./utils.js";

export const DEFAULT_PROJECT_ID = "default-project";
export const OVERHEAD_PROJECT_ID = "company-overhead";

function createDefaultProject() {
    return {
        id: DEFAULT_PROJECT_ID,
        name: "Opšti projekat",
        takeoverDate: new Date().toISOString().slice(0, 10),
        totalPrice: 0,
        advance: 0,
        archived: false,
        system: false,
        createdAt: new Date().toISOString()
    };
}

function createOverheadProject() {
    return {
        id: OVERHEAD_PROJECT_ID,
        name: "Fiksni troškovi firme",
        takeoverDate: new Date().toISOString().slice(0, 10),
        totalPrice: 0,
        advance: 0,
        archived: false,
        system: true,
        createdAt: new Date().toISOString()
    };
}

// GLOBAL STATE
export let data = {
    projects: [createDefaultProject(), createOverheadProject()],
    activeProjectId: DEFAULT_PROJECT_ID,
    transactions: [],
    shoppingList: []
};

// INIT STORAGE (JSON load + LocalStorage backup)
initStorage();

function getPreferredActiveProjectId() {
    const firstActive = data.projects.find(p => !p.archived && !p.system);
    return firstActive ? firstActive.id : (data.projects[0] ? data.projects[0].id : null);
}

if (!Array.isArray(data.projects) || data.projects.length === 0) {
    data.projects = [createDefaultProject(), createOverheadProject()];
}

if (!data.projects.some(p => p.id === OVERHEAD_PROJECT_ID)) {
    data.projects.push(createOverheadProject());
}

if (!data.projects.some(p => p.id === DEFAULT_PROJECT_ID)) {
    data.projects.push(createDefaultProject());
}

if (!data.activeProjectId || !data.projects.some(p => p.id === data.activeProjectId)) {
    data.activeProjectId = getPreferredActiveProjectId();
}

const activeProject = data.projects.find(p => p.id === data.activeProjectId);
if (activeProject?.archived) {
    data.activeProjectId = getPreferredActiveProjectId();
}

export function getActiveProject() {
    return data.projects.find(p => p.id === data.activeProjectId) || null;
}

export function addProject({ name, totalPrice, advance, takeoverDate }) {
    const project = {
        id: createId(),
        name: String(name || "").trim(),
        takeoverDate: takeoverDate || new Date().toISOString().slice(0, 10),
        totalPrice: normalizeMoney(totalPrice),
        advance: normalizeMoney(advance),
        archived: false,
        system: false,
        createdAt: new Date().toISOString()
    };

    data.projects.push(project);
    data.activeProjectId = project.id;
    return project;
}

export function setActiveProject(projectId) {
    if (!data.projects.some(p => p.id === projectId && !p.archived && !p.system)) return;
    data.activeProjectId = projectId;
}

export function activateTab(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

    const pageEl = document.getElementById(page);
    const tabEl = document.querySelector(`.tab[data-page="${page}"]`);

    if (!pageEl || !tabEl) return;

    pageEl.classList.add("active");
    tabEl.classList.add("active");

    renderActivePage();
}

function renderActivePage() {
    const activeTab = document.querySelector(".tab.active");
    const page = activeTab ? activeTab.dataset.page : "home";

    if (page === "home") renderHome();
    if (page === "months") renderMonthsPage();
    if (page === "projects") renderProjectsPage();
    if (page === "importExport") renderImportExportPage();
}

// TAB CLICK HANDLER
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        activateTab(tab.dataset.page);
    });
});

window.addEventListener("a3z:dataImported", () => {
    renderActivePage();
});

// DEFAULT PAGE
renderHome();
