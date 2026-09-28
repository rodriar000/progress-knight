// Show existing job, skill and item descriptions on demand without overlays.
(function () {
    let openButton = null;
    let openRow = null;
    let descriptionIndex = 0;

    function closeDescription() {
        if (!openButton) return;
        openButton.setAttribute("aria-expanded", "false");
        openRow.remove();
        openButton = null;
        openRow = null;
    }

    document.querySelectorAll("#jobTable tr, #skillTable tr, #itemTable tr").forEach(row => {
        const tooltip = row.querySelector(".tooltipText");
        const entry = row.querySelector(".tooltip");
        if (!tooltip || !entry) return;

        const description = tooltip.textContent.trim();
        const name = row.querySelector(".name").textContent.trim();
        tooltip.remove();
        entry.classList.remove("tooltip");
        row.classList.add("has-info");

        const button = document.createElement("button");
        button.type = "button";
        button.className = "info-button";
        button.textContent = "i";
        button.setAttribute("aria-label", "Information about " + name);
        button.setAttribute("aria-expanded", "false");
        const descriptionId = "description-" + ++descriptionIndex;
        button.setAttribute("aria-controls", descriptionId);
        entry.insertAdjacentElement("afterend", button);

        button.addEventListener("click", event => {
            event.stopPropagation();
            if (openButton === button) {
                closeDescription();
                return;
            }
            closeDescription();
            const details = document.createElement("tr");
            details.className = "description-row";
            const cell = document.createElement("td");
            cell.id = descriptionId;
            cell.colSpan = row.cells.length;
            cell.textContent = description;
            details.appendChild(cell);
            row.insertAdjacentElement("afterend", details);
            button.setAttribute("aria-expanded", "true");
            openButton = button;
            openRow = details;
        });
    });

    document.addEventListener("click", event => {
        if (openButton && !event.target.closest(".description-row")) closeDescription();
    });
    document.addEventListener("keydown", event => {
        if (event.key !== "Escape" || !openButton) return;
        const button = openButton;
        closeDescription();
        button.focus();
    });
})();
