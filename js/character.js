// The portrait reads existing state only; it never alters gameplay or saves.
(function () {
    const atlases = {
        common:  {url: "art/common.webp", cols: 3, rows: 2, label: "Common work"},
        soldier: {url: "art/military-early.webp", cols: 2, rows: 2, label: "Military"},
        knight:  {url: "art/military-late.webp", cols: 2, rows: 2, label: "Military"},
        arcane:  {url: "art/arcane.webp", cols: 3, rows: 2, label: "The Arcane Association"}
    };

    // Position in the atlas: [atlas, column, row]. Names match jobBaseData.
    const portraits = {
        "Beggar": ["common", 0, 0],
        "Farmer": ["common", 1, 0],
        "Fisherman": ["common", 2, 0],
        "Miner": ["common", 0, 1],
        "Blacksmith": ["common", 1, 1],
        "Merchant": ["common", 2, 1],
        "Squire": ["soldier", 0, 0],
        "Footman": ["soldier", 1, 0],
        "Veteran footman": ["soldier", 0, 1],
        "Knight": ["soldier", 1, 1],
        "Veteran knight": ["knight", 0, 0],
        "Elite knight": ["knight", 1, 0],
        "Holy knight": ["knight", 0, 1],
        "Legendary knight": ["knight", 1, 1],
        "Student": ["arcane", 0, 0],
        "Apprentice mage": ["arcane", 1, 0],
        "Mage": ["arcane", 2, 0],
        "Wizard": ["arcane", 0, 1],
        "Master wizard": ["arcane", 1, 1],
        "Chairman": ["arcane", 2, 1]
    };

    const figure = document.getElementById("characterFigure");
    if (!figure) return;
    const sprite = document.createElement("div");
    sprite.className = "character-sprite";
    sprite.setAttribute("aria-hidden", "true");
    figure.appendChild(sprite);

    let lastJob = "";
    let lastLevel = -1;

    function renderCharacter() {
        if (typeof gameData === "undefined" || !gameData.currentJob) return;
        const {name, level} = gameData.currentJob;
        if (name === lastJob && level === lastLevel) return;

        const [atlasName, col, row] = portraits[name] || portraits.Beggar;
        const atlas = atlases[atlasName];
        if (name !== lastJob) {
            sprite.style.backgroundImage = `url("${atlas.url}")`;
            sprite.style.backgroundSize = `${atlas.cols * 100}% ${atlas.rows * 100}%`;
            sprite.style.backgroundPosition = `${col * 100 / (atlas.cols - 1)}% ${row * 100 / (atlas.rows - 1)}%`;
            figure.dataset.family = atlasName === "common" ? "common" : atlasName === "arcane" ? "arcane" : "military";
            document.getElementById("characterJob").textContent = name;
            document.getElementById("characterRank").textContent = atlas.label;
            lastJob = name;
        }

        const currentLevel = Number(level) || 0;
        figure.dataset.tier = currentLevel >= 100 ? "3" : currentLevel >= 25 ? "2" : currentLevel >= 10 ? "1" : "0";
        document.getElementById("characterLevel").textContent = "LV " + currentLevel;
        figure.setAttribute("aria-label", name + ", level " + currentLevel);
        lastLevel = level;
    }

    renderCharacter();
    setInterval(renderCharacter, 250);
})();
