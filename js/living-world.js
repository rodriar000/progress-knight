// A visual companion to the existing simulation. It reads the current tasks,
// age and pause state; it never changes progression or the saved game.
(function () {
    const stage = document.getElementById("livingWorld");
    const canvas = document.getElementById("livingWorldCanvas");
    if (!stage || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const view = document.getElementById("livingWorldView");
    const chapter = document.getElementById("worldChapter");
    const action = document.getElementById("worldAction");
    const location = document.getElementById("worldLocation");
    const jobText = document.getElementById("worldJob");
    const skillText = document.getElementById("worldSkill");
    const ageText = document.getElementById("worldAge");
    const markers = [document.getElementById("worldWorkMarker"), document.getElementById("worldSkillMarker")];
    const backgrounds = Array.from(view.querySelectorAll(".living-world__backdrop"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const actions = {
        Beggar: ["beg", "street", "Old quarter", "Searching for a living"],
        Farmer: ["farm", "farmland", "Farmland", "Tending the fields"],
        Fisherman: ["fish", "harbor", "Fishing harbor", "Casting a line"],
        Miner: ["mine", "mine", "The mine", "Working the ore"],
        Blacksmith: ["forge", "forge", "The forge", "Forging steel"],
        Merchant: ["trade", "market", "Market square", "Making a trade"],
        Squire: ["train", "training", "Training yard", "Practising swordwork"],
        Footman: ["train", "training", "Training yard", "Practising swordwork"],
        "Veteran footman": ["duel", "battlements", "The battlements", "Sparring with a rival"],
        Knight: ["duel", "battlements", "The battlements", "Sparring with a rival"],
        "Veteran knight": ["duel", "highcourt", "The high court", "Sparring with a rival"],
        "Elite knight": ["duel", "highcourt", "The high court", "Sparring with a rival"],
        "Holy knight": ["duel", "sanctuary", "The sanctuary", "Sparring with a rival"],
        "Legendary knight": ["duel", "sanctuary", "The sanctuary", "Sparring with a rival"],
        Student: ["study", "study", "Apprentice's study", "Reading by candlelight"],
        "Apprentice mage": ["study", "study", "Apprentice's study", "Reading by candlelight"],
        Mage: ["magic", "academy", "Arcane academy", "Practising the arcane"],
        Wizard: ["magic", "academy", "Arcane academy", "Practising the arcane"],
        "Master wizard": ["magic", "tower", "Astral tower", "Practising the arcane"],
        Chairman: ["magic", "tower", "Astral tower", "Practising the arcane"]
    };

    const martial = new Set(["Strength", "Battle tactics", "Muscle memory", "Intimidation", "Demon training"]);
    const arcane = new Set(["Mana control", "Time warping", "Immortality", "Super immortality", "Dark influence", "Evil control", "Demon's wealth"]);
    const contemplative = new Set(["Meditation", "Blood meditation"]);
    function practiceFor(name) {
        if (martial.has(name)) return [name === "Battle tactics" ? "duel" : "train", "training", "Training yard", "Training " + name.toLowerCase()];
        if (arcane.has(name)) return ["magic", "academy", "Arcane academy", "Studying " + name.toLowerCase()];
        if (name === "Bargaining") return ["trade", "market", "Market square", "Practising bargaining"];
        if (contemplative.has(name)) return ["study", "study", "A quiet study", "Practising " + name.toLowerCase()];
        return ["study", "study", "A quiet study", "Studying " + name.toLowerCase()];
    }

    const sheets = {};
    function getSheet(name) {
        if (!sheets[name]) {
            const image = new Image();
            image.src = `art/motion/${name}.webp`;
            sheets[name] = image;
        }
        return sheets[name];
    }

    let activeBackground = -1;
    let visibleBackground = "";
    let backgroundRequest = 0;
    function showBackground(name) {
        if (visibleBackground === name) return;
        const request = ++backgroundRequest;
        const image = new Image();
        image.onload = () => {
            if (request !== backgroundRequest) return;
            const next = activeBackground === 0 ? 1 : 0;
            backgrounds[next].style.setProperty("--scene-image", `url("${image.src}")`);
            backgrounds[next].classList.add("is-visible");
            if (activeBackground !== -1) backgrounds[activeBackground].classList.remove("is-visible");
            activeBackground = next;
            visibleBackground = name;
        };
        image.src = `art/scenes/${name}.webp`;
    }

    let width = 0;
    let height = 0;
    function resize() {
        const box = view.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = box.width;
        height = box.height;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
    }
    new ResizeObserver(resize).observe(view);
    resize();

    const duration = 11400;
    const approach = 2200;
    const depart = 1800;
    let clock = 0;
    let previousTime = 0;
    let displayed = "";

    function drawSprite(name, frame, x, groundY, scale = 1) {
        const image = getSheet(name);
        if (!image.complete || !image.naturalWidth) return;
        const columns = name === "walk" ? 3 : 2;
        const rows = 2;
        const cellW = image.width / columns;
        const cellH = image.height / rows;
        const maxWidth = name === "fish" ? width * .58 : width * .47;
        const ratio = Math.min(height * .82 / cellH, maxWidth / cellW) * scale;
        const drawW = cellW * ratio;
        const drawH = cellH * ratio;
        const frameCount = columns * rows;
        const index = frame % frameCount;
        ctx.drawImage(image, (index % columns) * cellW, Math.floor(index / columns) * cellH,
            cellW, cellH, x - drawW / 2, groundY - drawH, drawW, drawH);
    }

    function groundShadow(x, y, size) {
        ctx.save();
        ctx.fillStyle = "rgba(15, 14, 12, .28)";
        ctx.filter = "blur(9px)";
        ctx.beginPath();
        ctx.ellipse(x, y, size, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawMoment(spec, moment) {
        ctx.clearRect(0, 0, width, height);
        const still = reducedMotion.matches;
        const isApproaching = moment < approach && !still;
        const isLeaving = moment >= duration - depart && !still;
        const walk = isApproaching || isLeaving;
        const ground = height * .82;
        const progressIn = Math.min(1, moment / approach);
        const progressOut = Math.max(0, (moment - (duration - depart)) / depart);
        const x = walk ? width * (isApproaching ? .12 + .38 * progressIn : .5 + .42 * progressOut) : width * .5;
        const frame = still ? 0 : Math.floor(moment / (walk ? 135 : 370));

        if (spec[0] === "duel" && !walk) {
            groundShadow(width * .72, ground, 72);
            drawSprite("opponent", Math.floor(moment / 460) + 1, width * .72, ground, .72);
            groundShadow(width * .32, ground, 75);
            drawSprite("duel", frame, width * .36, ground, .78);
        } else {
            groundShadow(x - (spec[0] === "fish" && !walk ? 70 : 0), ground, 72);
            drawSprite(walk ? "walk" : spec[0], frame, x, ground);
        }
    }

    function tick(now) {
        const delta = previousTime ? Math.min(now - previousTime, 70) : 0;
        previousTime = now;
        if (typeof gameData === "undefined" || !gameData.currentJob || !gameData.currentSkill) {
            requestAnimationFrame(tick);
            return;
        }

        const playing = !gameData.paused && (typeof isAlive !== "function" || isAlive());
        if (playing && !reducedMotion.matches) clock += delta;
        const episode = Math.floor(clock / duration) % 2;
        const moment = clock % duration;
        const task = episode === 0 ? gameData.currentJob : gameData.currentSkill;
        const spec = episode === 0 ? actions[task.name] || actions.Beggar : practiceFor(task.name);
        const key = episode + ":" + task.name;
        if (key !== displayed) {
            displayed = key;
            showBackground(spec[1]);
            chapter.textContent = episode === 0 ? "AT WORK" : "IN PRACTICE";
            action.textContent = spec[3];
            location.textContent = spec[2];
            markers.forEach((marker, index) => marker.classList.toggle("is-current", index === episode));
            getSheet(spec[0]);
            getSheet("walk");
            if (spec[0] === "duel") getSheet("opponent");
        }
        jobText.textContent = `${gameData.currentJob.name} · LV ${gameData.currentJob.level}`;
        skillText.textContent = `${gameData.currentSkill.name} · LV ${gameData.currentSkill.level}`;
        ageText.textContent = `AGE ${Math.floor(gameData.days / 365)}`;
        drawMoment(spec, reducedMotion.matches ? approach : moment);
        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
})();
