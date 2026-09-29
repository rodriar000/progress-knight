import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";

// A visual companion to the existing simulation: no game state is modified.
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

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    } catch (error) {
        actors.classList.add("is-fallback");
        return;
    }
    renderer.setPixelRatio(1); // Keep the scene inexpensive on high-density and older displays.
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    actors.append(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xf4e1bc, 0x526376, 3.1));
    const sunlight = new THREE.DirectionalLight(0xffdfac, 2.1);
    sunlight.position.set(-3, 6, 5);
    scene.add(sunlight);
    const camera = new THREE.OrthographicCamera(-4, 4, 2, -2, .1, 50);
    camera.position.set(0, 1.4, 10);
    camera.lookAt(0, 1.25, 0);
    function resize() {
        const width = Math.max(1, view.clientWidth);
        const height = Math.max(1, view.clientHeight);
        const aspect = width / height;
        camera.left = -2 * aspect;
        camera.right = 2 * aspect;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
    }
    new ResizeObserver(resize).observe(view);
    resize();

    // A soft contact shadow is one transparent polygon; shadow maps stay off.
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x101414, transparent: true, opacity: .22, depthWrite: false });
    const shadowShape = new THREE.CircleGeometry(.68, 32);
    function shadow() {
        const mesh = new THREE.Mesh(shadowShape, shadowMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = .012;
        scene.add(mesh);
        return mesh;
    }
    const heroShadow = shadow();
    const rivalShadow = shadow();
    rivalShadow.visible = false;

    let hero, rival;
    let ready = false;
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(new URL("art/models/hero.glb", document.baseURI).href, gltf => {
        function character(model) {
            const wrapper = new THREE.Group();
            const box = new THREE.Box3().setFromObject(model);
            const scale = 2.65 / Math.max(.001, box.max.y - box.min.y);
            model.scale.setScalar(scale);
            model.position.y = -box.min.y * scale;
            wrapper.add(model);
            scene.add(wrapper);
            model.traverse(obj => {
                if (obj.isMesh) {
                    obj.frustumCulled = false;
                    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
                    materials.forEach(mat => { mat.opacity = 1; mat.transparent = false; });
                }
            });
            const mixer = new THREE.AnimationMixer(model);
            const clips = new Map(gltf.animations.map(clip => [clip.name, mixer.clipAction(clip)]));
            return { wrapper, model, mixer, clips, current: null, prop: null };
        }
        hero = character(gltf.scene);
        rival = character(cloneSkeleton(gltf.scene));
        rival.wrapper.visible = false;
        rival.model.traverse(obj => {
            if (!obj.isMesh) return;
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            obj.material = mats.map(mat => {
                const copy = mat.clone();
                copy.color.multiplyScalar(.55);
                return copy;
            });
            if (obj.material.length === 1) obj.material = obj.material[0];
        });
        ready = true;
        actors.classList.add("is-ready");
        render();
    }, undefined, () => actors.classList.add("is-fallback"));

    function play(actor, clipName) {
        if (actor.current === clipName) return;
        const next = actor.clips.get(clipName) || actor.clips.get("Idle_Loop");
        if (!next) return;
        next.reset().setLoop(THREE.LoopRepeat, Infinity).play();
        if (actor.current) next.crossFadeFrom(actor.clips.get(actor.current), .35, false);
        actor.current = clipName;
    }

    function rod(length, radius, material) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 6), material);
        mesh.position.y = length / 2;
        return mesh;
    }
    const wood = new THREE.MeshStandardMaterial({ color: 0x4f321d, roughness: 1 });
    const iron = new THREE.MeshStandardMaterial({ color: 0x858a88, metalness: .55, roughness: .52 });
    const paper = new THREE.MeshStandardMaterial({ color: 0xe5d2ac, roughness: 1 });
    function propFor(kind) {
        const group = new THREE.Group();
        if (["farm", "mine", "forge", "fish", "train", "duel"].includes(kind)) {
            const length = kind === "fish" ? 1.9 : kind === "farm" ? 1.45 : .85;
            group.add(rod(length, .025, wood));
            if (kind !== "fish") {
                const head = new THREE.Mesh(new THREE.BoxGeometry(kind === "farm" ? .48 : .3, .12, .14), iron);
                head.position.y = length;
                group.add(head);
            }
            group.rotation.z = kind === "fish" ? -.55 : -.9;
        } else if (kind === "study") {
            const book = new THREE.Mesh(new THREE.BoxGeometry(.42, .06, .34), paper);
            book.position.set(0, .2, .1);
            group.add(book);
        } else return null;
        return group;
    }
    function equip(actor, kind) {
        if (actor.prop) actor.prop.removeFromParent();
        actor.prop = propFor(kind);
        if (actor.prop) actor.model.getObjectByName("hand_r")?.add(actor.prop);
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
    const motions = {
        beg: "Idle_Talking_Loop", farm: "Interact", fish: "Interact", mine: "Interact",
        forge: "Interact", trade: "Idle_Talking_Loop", study: "Interact",
        train: "Sword_Regular_A", duel: "Sword_Attack", magic: "Spell_Simple_Shoot"
    };
    let clock = 0;
    let previousTime = 0;
    let displayed = "";
    let equipped = "";
    let visible = false;
    let lastPhase = "";
    new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        previousTime = performance.now();
    }, { rootMargin: "150px" }).observe(stage);

    function render() {
        if (!ready || typeof gameData === "undefined" || !gameData.currentJob || !gameData.currentSkill) return;
        const playing = !gameData.paused && (typeof isAlive !== "function" || isAlive());
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
        }
        jobText.textContent = `${gameData.currentJob.name} · LV ${gameData.currentJob.level}`;
        skillText.textContent = `${gameData.currentSkill.name} · LV ${gameData.currentSkill.level}`;
        ageText.textContent = `AGE ${Math.floor(gameData.days / 365)}`;
        const still = reducedMotion.matches;
        const entering = moment < approach && !still;
        const leaving = moment >= duration - depart && !still;
        const walking = entering || leaving;
        const phase = walking ? "walk" : spec[0];
        if (phase !== lastPhase) {
            play(hero, walking ? "Jog_Fwd_Loop" : motions[spec[0]]);
            lastPhase = phase;
        }
        if (equipped !== spec[0]) {
            equip(hero, spec[0]);
            equipped = spec[0];
        }
        const progressIn = Math.min(1, moment / approach);
        const progressOut = Math.max(0, (moment - (duration - depart)) / depart);
        const xFraction = walking ? (entering ? .12 + .38 * progressIn : .5 + .42 * progressOut) : .5;
        const worldWidth = camera.right - camera.left;
        const duel = spec[0] === "duel" && !walking;
        hero.wrapper.position.x = (duel ? -.14 : xFraction - .5) * worldWidth;
        hero.wrapper.rotation.y = walking ? Math.PI / 2 : duel ? .95 : .22;
        heroShadow.position.x = hero.wrapper.position.x;
        rival.wrapper.visible = duel;
        rivalShadow.visible = duel;
        if (duel) {
            rival.wrapper.position.x = worldWidth * .19;
            rival.wrapper.scale.setScalar(.82);
            rival.wrapper.rotation.y = -.95;
            rivalShadow.position.x = rival.wrapper.position.x;
            play(rival, "Sword_Attack");
        }
        if (still || !playing) { hero.mixer.update(0); rival.mixer.update(0); }
        renderer.render(scene, camera);
    }

    function tick() {
        const now = performance.now();
        const delta = previousTime ? Math.min(100, Math.max(0, now - previousTime)) : 0;
        previousTime = now;
        const playing = typeof gameData !== "undefined" && !gameData.paused &&
            (typeof isAlive !== "function" || isAlive());
        if (visible && !document.hidden && ready) {
            if (playing && !reducedMotion.matches) {
                clock += delta;
                hero.mixer.update(delta / 1000);
                rival.mixer.update(delta / 1000);
            }
            render();
        }
        setTimeout(tick, visible && !document.hidden && playing && !reducedMotion.matches ? 1000 / 30 : 250);
    }
    tick();
})();
