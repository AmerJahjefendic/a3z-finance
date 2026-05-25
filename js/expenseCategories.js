export const AUTO_DESC_CATEGORIES = new Set(["Prevoz", "Kirija"]);
export const UTILITIES_CATEGORY = "Režije";

export function getSelectedExpenseCategory(mainCategory, utilitySubcategory) {
    if (mainCategory !== UTILITIES_CATEGORY) return String(mainCategory || "");
    if (!utilitySubcategory) return "";
    return `${UTILITIES_CATEGORY} - ${utilitySubcategory}`;
}

export function isAutoDescriptionCategory(category) {
    return AUTO_DESC_CATEGORIES.has(category)
        || String(category).startsWith(`${UTILITIES_CATEGORY} - `);
}

export function parseExpenseCategory(category, fallbackMain = "") {
    const categoryText = String(category || "");
    if (categoryText.startsWith(`${UTILITIES_CATEGORY} - `)) {
        return {
            main: UTILITIES_CATEGORY,
            sub: categoryText.slice(`${UTILITIES_CATEGORY} - `.length) || "Struja"
        };
    }

    return {
        main: categoryText || fallbackMain,
        sub: "Struja"
    };
}
