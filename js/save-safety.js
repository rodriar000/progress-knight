// Keep preview playtests separate from the published game, even though both
// pages share a GitHub Pages origin and therefore the same localStorage.
var SaveSafety = (function () {
    const legacyKey = "gameDataSave";
    const version = 1;

    function createStore(storage, pathname) {
        const preview = pathname.split("/").includes("preview");
        const key = preview ? legacyKey + ":preview" : legacyKey;
        const initializedKey = key + ":initialized";
        const recoveryPrefix = key + ":recovery:";

        function recoveries() {
            const keys = [];
            for (let index = 0; index < storage.length; index++) {
                const candidate = storage.key(index);
                if (candidate.startsWith(recoveryPrefix)) keys.push(candidate);
            }
            return keys.sort().reverse().map(candidate => storage.getItem(candidate));
        }

        function read() {
            if (preview && storage.getItem(initializedKey) !== "1") {
                // Preserve the current playtest progress once, then keep it
                // independent from every subsequent production save or reset.
                if (storage.getItem(key) === null) {
                    const previous = storage.getItem(legacyKey);
                    if (previous !== null) storage.setItem(key, previous);
                }
                storage.setItem(initializedKey, "1");
            }
            return storage.getItem(key);
        }

        return {
            key,
            read,
            write: raw => storage.setItem(key, raw),
            reset: () => {
                storage.removeItem(key);
                if (preview) storage.setItem(initializedKey, "1");
            },
            preserveDamaged: raw => {
                const stamp = Date.now();
                let index = 0;
                while (storage.getItem(recoveryPrefix + stamp + ":" + index) !== null) index++;
                storage.setItem(recoveryPrefix + stamp + ":" + index, raw);
                storage.removeItem(key);
            },
            recoveries
        };
    }

    function isRecord(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function isNonNegative(value) {
        return typeof value === "number" && Number.isFinite(value) && value >= 0;
    }

    function validate(data, jobs, skills, items) {
        if (!isRecord(data) || !isRecord(data.taskData) || !isRecord(data.itemData) ||
            !isRecord(data.requirements) || !Array.isArray(data.currentMisc)) throw new Error("Invalid save structure");
        if (data.saveVersion !== undefined && data.saveVersion !== version) throw new Error("Unsupported save version");
        if (!isNonNegative(data.coins) || !isNonNegative(data.days) || !isNonNegative(data.evil)) {
            throw new Error("Invalid progression values");
        }
        for (const key of ["rebirthOneCount", "rebirthTwoCount"]) {
            if (data[key] !== undefined && (!Number.isSafeInteger(data[key]) || data[key] < 0)) {
                throw new Error("Invalid rebirth count");
            }
        }
        if (data.lastUpdateAt !== undefined && !isNonNegative(data.lastUpdateAt)) throw new Error("Invalid timestamp");
        if (data.paused !== undefined && typeof data.paused !== "boolean") throw new Error("Invalid pause state");
        if (data.timeWarpingEnabled !== undefined && typeof data.timeWarpingEnabled !== "boolean") {
            throw new Error("Invalid warp state");
        }
        if (data.preferences !== undefined && !isRecord(data.preferences)) throw new Error("Invalid preferences");

        function knownName(pointer, catalogue) {
            return isRecord(pointer) && typeof pointer.name === "string" &&
                Object.prototype.hasOwnProperty.call(catalogue, pointer.name);
        }
        if (!knownName(data.currentJob, jobs) || !knownName(data.currentSkill, skills) ||
            !knownName(data.currentProperty, items) ||
            data.currentMisc.some(item => !knownName(item, items))) throw new Error("Invalid current choices");

        for (const [name, task] of Object.entries(data.taskData)) {
            if (!Object.prototype.hasOwnProperty.call(jobs, name) &&
                !Object.prototype.hasOwnProperty.call(skills, name)) continue;
            if (!isRecord(task) || task.name !== name || !Number.isSafeInteger(task.level) ||
                task.level < 0 || !Number.isSafeInteger(task.maxLevel) || task.maxLevel < 0 ||
                !isNonNegative(task.xp)) throw new Error("Invalid task progress");
            const base = jobs[name] || skills[name];
            if (!Number.isFinite(base.maxXp * (task.level + 1) * Math.pow(1.01, task.level))) {
                throw new Error("Invalid task level");
            }
        }
        for (const [name, item] of Object.entries(data.itemData)) {
            if (Object.prototype.hasOwnProperty.call(items, name) && (!isRecord(item) || item.name !== name)) {
                throw new Error("Invalid item");
            }
        }
        for (const entry of Object.values(data.requirements)) {
            if (!isRecord(entry) || typeof entry.type !== "string" ||
                typeof entry.completed !== "boolean") throw new Error("Invalid requirement");
        }
        return data;
    }

    return {createStore, validate, version};
})();

if (typeof module !== "undefined" && module.exports) module.exports = SaveSafety;
