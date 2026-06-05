import {
    getSelectedExpenseCategory,
    isAutoDescriptionCategory,
    UTILITIES_CATEGORY
} from "./expenseCategories.js";

export function preventWheelValueChange(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("wheel", (e) => {
        e.preventDefault();
    }, { passive: false });
}

export function syncExpenseInputGroup({
    categoryInputId,
    utilityBlockId,
    utilityInputId,
    descriptionInputId = "",
    defaultUtility = "Struja"
}) {
    const categoryInput = document.getElementById(categoryInputId);
    const utilityBlock = document.getElementById(utilityBlockId);
    const utilityInput = document.getElementById(utilityInputId);

    if (!categoryInput || !utilityBlock || !utilityInput) return;

    const shouldShowUtility = categoryInput.value === UTILITIES_CATEGORY;
    utilityBlock.style.display = shouldShowUtility ? "block" : "none";

    if (shouldShowUtility && !utilityInput.value) {
        utilityInput.value = defaultUtility;
    }

    if (!descriptionInputId) return;

    const descriptionInput = document.getElementById(descriptionInputId);
    if (!descriptionInput) return;

    const selectedCategory = getSelectedExpenseCategory(categoryInput.value, utilityInput.value);
    if (isAutoDescriptionCategory(selectedCategory)) {
        descriptionInput.value = selectedCategory;
        descriptionInput.disabled = true;
        descriptionInput.placeholder = "Opis se unosi automatski";
        return;
    }

    if (descriptionInput.disabled) {
        descriptionInput.value = "";
    }

    descriptionInput.disabled = false;
    descriptionInput.placeholder = "";
}