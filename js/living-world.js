// Pre-rendered transparent motion clips. The browser decodes one small clip at
// a time; the simulation remains the only source of progression and save data.
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
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    // Safari handles animated WebP alpha more reliably than transparent VP9.
    const useVideo = !!document.createElement("video").canPlayType('video/webm; codecs="vp9"') &&
        !navigator.vendor.includes("Apple");

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

    const motionFor = { beg: "idle", farm: "work", fish: "work", mine: "work",
        forge: "work", trade: "idle", study: "study", train: "train",
        duel: "train", magic: "magic" };
    const propFor = { beg: "bowl", farm: "hoe", fish: "fishing-rod", mine: "pickaxe",
        forge: "hammer", study: "book", train: "sword", duel: "sword", magic: "orb" };

    function createActor() {
        const element = document.createElement("div");
        element.className = "living-world__actor";
        const slots = [0, 1].map(() => {
            const layer = document.createElement("div");
            layer.className = "living-world__clip";
            const video = document.createElement("video");
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = "auto";
            video.setAttribute("aria-hidden", "true");
            const image = document.createElement("img");
            image.alt = "";
            image.draggable = false;
            layer.append(video, image);
            element.append(layer);
            video.addEventListener("error", () => {
                video.hidden = true;
                image.hidden = false;
                image.src = video.dataset.fallback;
                syncPlayback();
            });
            return { layer, video, image };
        });
        const prop = document.createElement("img");
        prop.className = "living-world__prop";
        prop.alt = "";
        prop.draggable = false;
        element.append(prop);
        actors.append(element);
        return { element, slots, prop, active: 0, motion: "", equipment: "" };
    }
    const hero = createActor();
    const rival = createActor();
    rival.element.hidden = true;
    rival.element.classList.add("is-rival");

    function setMotion(actor, name, still) {
        const key = name + (still ? ":still" : "");
        if (actor.motion === key) return;
        actor.motion = key;
        const next = 1 - actor.active;
        const incoming = actor.slots[next];
        const outgoing = actor.slots[actor.active];
        const poster = `art/actors/${name}-poster.webp`;
        incoming.video.pause();
        incoming.video.hidden = still || !useVideo;
        incoming.image.dataset.poster = poster;
        incoming.image.dataset.animated = `art/actors/${name}-animated.webp`;
        incoming.image.src = still ? poster : (useVideo ? poster : `art/actors/${name}-animated.webp`);
        incoming.image.hidden = !still && useVideo;
        if (!still && useVideo) {
            incoming.video.poster = poster;
            incoming.video.dataset.fallback = `art/actors/${name}-animated.webp`;
            incoming.video.src = `art/actors/${name}.webm`;
            incoming.video.load();
        }
        incoming.layer.classList.add("is-visible");
        outgoing.layer.classList.remove("is-visible");
        actor.active = next;
        setTimeout(() => {
            if (!outgoing.layer.classList.contains("is-visible")) outgoing.video.pause();
        }, 220);
    }

    function setProp(actor, name) {
        if (actor.equipment === name) return;
        actor.equipment = name;
        actor.element.dataset.prop = name || "none";
        actor.prop.hidden = !name;
        if (name) actor.prop.src = `art/props/${name}.webp`;
    }

    function syncPlayback() {
        const playing = visible && !document.hidden && typeof gameData !== "undefined" &&
            !gameData.paused && gameData.days < getLifespan() && !reducedMotion.matches;
        stage.classList.toggle("is-paused", !playing);
        for (const actor of [hero, rival]) {
            const slot = actor.slots[actor.active];
            const active = slot.video;
            const actorPlaying = playing && !actor.element.hidden;
            if (actorPlaying && !active.hidden && active.paused) {
                active.play().catch(() => {});
            } else if (!actorPlaying && !active.paused) active.pause();
            if (!slot.image.hidden && !reducedMotion.matches) {
                const desired = actorPlaying ? slot.image.dataset.animated : slot.image.dataset.poster;
                if (desired && slot.image.getAttribute("src") !== desired) slot.image.src = desired;
            }
        }
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
    let visible = false;
    let frameId = 0;
    let stageWidth = actors.clientWidth;
    new ResizeObserver(entries => {
        stageWidth = entries[0].contentRect.width;
        if (visible) refreshStage();
    }).observe(actors);

    function refreshStage() {
        if (frameId) cancelAnimationFrame(frameId);
        frameId = 0;
        previousTime = 0;
        syncPlayback();
        if (visible && !document.hidden) tick(performance.now());
    }

    new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        refreshStage();
    }, { rootMargin: "150px" }).observe(stage);
    document.addEventListener("visibilitychange", refreshStage);
    document.addEventListener("game-state-change", refreshStage);
    reducedMotion.addEventListener("change", refreshStage);

    function position(actor, fraction, size) {
        if (actor.fraction !== fraction || actor.stageWidth !== stageWidth) {
            actor.fraction = fraction;
            actor.stageWidth = stageWidth;
            actor.element.style.setProperty("--travel", `${(fraction - .5) * stageWidth}px`);
        }
        if (actor.size !== size) {
            actor.size = size;
            actor.element.style.setProperty("--size", size);
        }
    }

    function tick(now) {
        frameId = 0;
        const delta = previousTime ? Math.min(200, Math.max(0, now - previousTime)) : 0;
        previousTime = now;
        if (!visible || document.hidden || typeof gameData === "undefined" ||
            !gameData.currentJob || !gameData.currentSkill) {
            syncPlayback();
            return;
        }
        const playing = !gameData.paused && gameData.days < getLifespan();
        if (playing && !reducedMotion.matches) clock += delta;
        const episode = Math.floor(clock / duration) % 2;
        const moment = clock % duration;
        const task = episode === 0 ? gameData.currentJob : gameData.currentSkill;
        const spec = episode === 0 ? actions[task.name] || actions.Beggar : practiceFor(task.name);
        const key = episode + ":" + task.name;
        const sceneChanged = key !== displayed;
        if (key !== displayed) {
            displayed = key;
            showBackground(spec[1]);
            chapter.textContent = episode === 0 ? "AT WORK" : "IN PRACTICE";
            action.textContent = spec[3];
            location.textContent = spec[2];
            markers.forEach((marker, index) => marker.classList.toggle("is-current", index === episode));
        }
        const jobLabel = `${gameData.currentJob.name} · LV ${gameData.currentJob.level}`;
        const skillLabel = `${gameData.currentSkill.name} · LV ${gameData.currentSkill.level}`;
        const ageLabel = `AGE ${Math.floor(gameData.days / 365)}`;
        if (jobText.textContent !== jobLabel) jobText.textContent = jobLabel;
        if (skillText.textContent !== skillLabel) skillText.textContent = skillLabel;
        if (ageText.textContent !== ageLabel) ageText.textContent = ageLabel;

        const still = reducedMotion.matches;
        const entering = moment < approach && !still;
        const leaving = moment >= duration - depart && !still;
        const walking = entering || leaving;
        const phase = walking ? "walk" : motionFor[spec[0]];
        const progressIn = Math.min(1, moment / approach);
        const progressOut = Math.max(0, (moment - (duration - depart)) / depart);
        const x = walking ? (entering ? -.22 + .72 * progressIn : .5 + .72 * progressOut) : .5;
        const duel = spec[0] === "duel" && !walking;
        const duelBlend = duel ? Math.min(1, (moment - approach) / 700, (duration - depart - moment) / 700) : 0;
        const oldHeroMotion = hero.motion;
        const oldRivalMotion = rival.motion;
        const rivalWasHidden = rival.element.hidden;
        position(hero, duel ? .5 - .14 * duelBlend : x, 1 - .22 * duelBlend);
        if (hero.walking !== walking) {
            hero.walking = walking;
            hero.element.classList.toggle("is-walking", walking);
        }
        setMotion(hero, phase, still);
        setProp(hero, walking ? null : propFor[spec[0]] || null);
        if (rival.element.hidden === duel) rival.element.hidden = !duel;
        if (duel) {
            position(rival, .72, .72);
            setMotion(rival, "train", still);
            setProp(rival, "sword");
        }
        if (!playing || sceneChanged || hero.motion !== oldHeroMotion ||
            rival.motion !== oldRivalMotion || rival.element.hidden !== rivalWasHidden) syncPlayback();
        if (playing && !still) frameId = requestAnimationFrame(tick);
    }
})();
