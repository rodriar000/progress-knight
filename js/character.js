// The portrait reads existing state only; it never alters gameplay or saves.
(function () {
    const atlases = {
        common:  {url: "art/common.webp", cols: 3, rows: 2, label: "Common work"},
        soldier: {url: "art/military-early.webp", cols: 2, rows: 2, label: "Military"},
        knight:  {url: "art/military-late.webp", cols: 2, rows: 2, label: "Military"},
        arcane:  {url: "art/arcane.webp", cols: 3, rows: 2, label: "The Arcane Association"}
    };

    // Jobs share a few locations as their careers advance. This reads the
    // existing currentJob only; locations are never stored in the save.
    const scenes = {
        Beggar: ["street", "Old quarter"],
        Farmer: ["farmland", "Farmland"],
        Fisherman: ["harbor", "Fishing harbor"],
        Miner: ["mine", "The mine"],
        Blacksmith: ["forge", "The forge"],
        Merchant: ["market", "Market square"],
        Squire: ["training", "Training yard"],
        Footman: ["training", "Training yard"],
        "Veteran footman": ["battlements", "The battlements"],
        Knight: ["battlements", "The battlements"],
        "Veteran knight": ["highcourt", "The high court"],
        "Elite knight": ["highcourt", "The high court"],
        "Holy knight": ["sanctuary", "The sanctuary"],
        "Legendary knight": ["sanctuary", "The sanctuary"],
        Student: ["study", "Apprentice's study"],
        "Apprentice mage": ["study", "Apprentice's study"],
        Mage: ["academy", "Arcane academy"],
        Wizard: ["academy", "Arcane academy"],
        "Master wizard": ["tower", "Astral tower"],
        Chairman: ["tower", "Astral tower"]
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
    const sceneLayers = [document.createElement("div"), document.createElement("div")];
    sceneLayers.forEach(layer => {
        layer.className = "character-scene";
        layer.setAttribute("aria-hidden", "true");
        figure.appendChild(layer);
    });
    const sprite = document.createElement("div");
    sprite.className = "character-sprite";
    sprite.setAttribute("aria-hidden", "true");
    figure.appendChild(sprite);

    let lastJob = "";
    let lastLevel = -1;
    let sceneRequest = 0;
    let activeScene = -1;
    let visibleScene = "";

    function showScene(name) {
        const request = ++sceneRequest;
        if (name === visibleScene) return;
        const url = `art/scenes/${name}.webp`;
        const preload = new Image();
        preload.onload = () => {
            if (request !== sceneRequest) return;
            const next = activeScene === 0 ? 1 : 0;
            sceneLayers[next].style.backgroundImage = `url("${url}")`;
            sceneLayers[next].classList.add("is-visible");
            if (activeScene !== -1) sceneLayers[activeScene].classList.remove("is-visible");
            activeScene = next;
            visibleScene = name;
        };
        preload.src = url;
    }

    function renderCharacter() {
        if (typeof gameData === "undefined" || !gameData.currentJob) return;
        const {name, level} = gameData.currentJob;
        if (name === lastJob && level === lastLevel) return;

        const [atlasName, col, row] = portraits[name] || portraits.Beggar;
        const atlas = atlases[atlasName];
        if (name !== lastJob) {
            const [scene, location] = scenes[name] || scenes.Beggar;
            showScene(scene);
            sprite.style.backgroundImage = `url("${atlas.url}")`;
            sprite.style.backgroundSize = `${atlas.cols * 100}% ${atlas.rows * 100}%`;
            sprite.style.backgroundPosition = `${col * 100 / (atlas.cols - 1)}% ${row * 100 / (atlas.rows - 1)}%`;
            figure.dataset.family = atlasName === "common" ? "common" : atlasName === "arcane" ? "arcane" : "military";
            document.getElementById("characterJob").textContent = name;
            document.getElementById("characterRank").textContent = atlas.label;
            document.getElementById("characterLocation").textContent = location;
            if (lastJob) {
                sprite.classList.remove("character-sprite--arriving");
                void sprite.offsetWidth;
                sprite.classList.add("character-sprite--arriving");
            }
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
