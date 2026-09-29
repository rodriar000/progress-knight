// A visual companion to the existing simulation. It reads the current tasks,
// age and pause state; it never changes progression or the saved game.
(function () {
    const stage = document.getElementById("livingWorld");
    const actors = document.getElementById("livingWorldActors");
    if (!stage || !actors) return;

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

    // The browser composites these images and transforms. There is no full-scene
    // canvas repaint on every animation frame.
    const cache = new Map();
    function sheetURL(name) { return `art/motion/${name}.webp`; }
    function preload(name) {
        if (cache.has(name)) return;
        const image = new Image();
        image.src = sheetURL(name);
        cache.set(name, image);
    }
    preload("walk");

    function createActor() {
        const element = document.createElement("div");
        element.className = "living-world__actor";
        const images = [0, 1].map(() => {
            const image = document.createElement("div");
            image.className = "living-world__pose";
            element.append(image);
            return image;
        });
        actors.append(element);
        return { element, images, visible: 0, pose: "" };
    }
    const hero = createActor();
    const rival = createActor();
    rival.element.hidden = true;

    // Transparent padding differs between rows in the original sheets.
    // Keep the bottom of each pose on the same ground line.
    const floorMargins = {
        beg: [5, 4, 7, 5], duel: [3, 8, 13, 11], farm: [2, 1, 31, 32],
        fish: [0, 5, 36, 23], forge: [2, 1, 23, 21], magic: [0, 0, 5, 6],
        mine: [0, 0, 44, 35], opponent: [5, 5, 20, 30],
        study: [12, 0, 9, 9], trade: [0, 0, 7, 8], train: [3, 1, 24, 21],
        walk: [0, 0, 0, 28, 27, 28]
    };

    function setPose(actor, name, frame) {
        const key = `${name}-${frame}`;
        if (actor.pose === key) return;
        actor.pose = key;
        actor.element.style.setProperty("--aspect", name === "walk" ? "1" :
            (name === "train" || name === "opponent") ? "1.05" : "1.5");
        const next = 1 - actor.visible;
        const columns = name === "walk" ? 3 : 2;
        const image = actor.images[next];
        image.style.backgroundImage = `url("${sheetURL(name)}")`;
        image.style.backgroundSize = `${columns * 100}% 200%`;
        image.style.backgroundPosition = `${(frame % columns) * 100 / (columns - 1)}% ${Math.floor(frame / columns) * 100}%`;
        image.style.top = `${floorMargins[name][frame] / (name === "train" || name === "opponent" ? 480 : 384) * 100}%`;
        actor.images[next].classList.add("is-visible");
        actor.images[actor.visible].classList.remove("is-visible");
        actor.visible = next;
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

    const duration = 11400;
    const approach = 2200;
    const depart = 1800;
    let clock = 0;
    let previousTime = 0;
    let displayed = "";
    let onScreen = false;
    const observer = new IntersectionObserver(entries => {
        onScreen = entries[0].isIntersecting;
        previousTime = performance.now();
    }, { rootMargin: "150px" });
    observer.observe(stage);

    function position(actor, fraction, size) {
        actor.element.style.setProperty("--travel", `${(fraction - .5) * actors.clientWidth}px`);
        actor.element.style.setProperty("--size", size);
    }

    function showMoment(spec, moment, still) {
        const entering = moment < approach && !still;
        const leaving = moment >= duration - depart && !still;
        const walk = entering || leaving;
        const progressIn = Math.min(1, moment / approach);
        const progressOut = Math.max(0, (moment - (duration - depart)) / depart);
        const x = walk ? (entering ? .12 + .38 * progressIn : .5 + .42 * progressOut) : .5;
        const name = walk ? "walk" : spec[0];
        const frame = still ? 0 : Math.floor(moment / (walk ? 180 : 450)) % (walk ? 6 : 4);
        const duel = spec[0] === "duel" && !walk;
        hero.element.classList.toggle("is-walking", walk);
        hero.element.classList.toggle("is-working", !walk && !still);
        position(hero, duel ? .36 : x, duel ? .78 : 1);
        setPose(hero, name, frame);
        rival.element.hidden = !duel;
        if (duel) {
            position(rival, .72, .72);
            setPose(rival, "opponent", Math.floor(moment / 520 + 1) % 4);
        }
    }

    function tick() {
        const now = performance.now();
        const delta = previousTime ? Math.min(250, Math.max(0, now - previousTime)) : 0;
        previousTime = now;
        if (!onScreen || document.hidden || typeof gameData === "undefined" || !gameData.currentJob || !gameData.currentSkill) return;
        const playing = !gameData.paused && (typeof isAlive !== "function" || isAlive());
        stage.classList.toggle("is-paused", !playing);
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
            preload(spec[0]);
            if (spec[0] === "duel") preload("opponent");
        }
        jobText.textContent = `${gameData.currentJob.name} · LV ${gameData.currentJob.level}`;
        skillText.textContent = `${gameData.currentSkill.name} · LV ${gameData.currentSkill.level}`;
        ageText.textContent = `AGE ${Math.floor(gameData.days / 365)}`;
        showMoment(spec, reducedMotion.matches ? approach : moment, reducedMotion.matches);
    }

    // The visual scene is sampled at 10 Hz; transform and opacity transitions
    // are animated by the compositor between samples.
    setInterval(tick, 100);
    tick();
})();
