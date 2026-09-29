const test = require("node:test");
const assert = require("node:assert/strict");
const {createStore, validate} = require("../js/save-safety.js");

function storage() {
    const data = new Map();
    return {
        get length() { return data.size; },
        key: index => Array.from(data.keys())[index] || null,
        getItem: key => data.has(key) ? data.get(key) : null,
        setItem: (key, value) => data.set(key, String(value)),
        removeItem: key => data.delete(key)
    };
}

const jobs = {Beggar: {maxXp: 50}};
const skills = {Concentration: {maxXp: 100}, Strength: {maxXp: 100}};
const items = {Homeless: {}, Dumbbells: {}};
function save() {
    return {
        coins: 120, days: 7000, evil: 0, paused: false,
        taskData: {Concentration: {name: "Concentration", level: 3, maxLevel: 4, xp: 14}},
        itemData: {Dumbbells: {name: "Dumbbells"}},
        requirements: {Automation: {type: "age", completed: true}},
        currentJob: {name: "Beggar"}, currentSkill: {name: "Concentration"},
        currentProperty: {name: "Homeless"}, currentMisc: [{name: "Dumbbells"}]
    };
}

test("preview copies the existing save once, then stays independent", () => {
    const browser = storage();
    const production = createStore(browser, "/progress-knight/");
    const preview = createStore(browser, "/progress-knight/preview/index.html");
    production.write("original");
    assert.equal(preview.read(), "original");
    preview.write("playtest");
    production.write("later production progress");
    assert.equal(preview.read(), "playtest");
    assert.equal(production.read(), "later production progress");
    preview.reset();
    assert.equal(preview.read(), null, "reset never recopies production");
    assert.equal(production.read(), "later production progress");
    preview.write("new playtest");
    production.reset();
    assert.equal(preview.read(), "new playtest", "production reset cannot erase the preview");
});

test("corrupt data is preserved while the active save is cleared", () => {
    const browser = storage();
    const preview = createStore(browser, "/progress-knight/preview/");
    preview.write("{broken");
    preview.preserveDamaged(preview.read());
    assert.equal(preview.read(), null);
    assert.equal(preview.recoveries()[0], "{broken");
    preview.write("{another broken save");
    preview.preserveDamaged(preview.read());
    assert.equal(preview.recoveries().length, 2, "a second failure never destroys the first backup");
    preview.write("next save");
    preview.reset();
    assert.ok(preview.recoveries().includes("{broken"), "reset does not destroy recovery data");
});

test("validates an older save and rejects dangerous partial imports", () => {
    assert.equal(validate(save(), jobs, skills, items).coins, 120);
    const future = save();
    future.saveVersion = 2;
    assert.throws(() => validate(future, jobs, skills, items), /version/);
    const brokenTask = save();
    brokenTask.taskData.Concentration.level = "900";
    assert.throws(() => validate(brokenTask, jobs, skills, items), /task progress/);
    const wrongPointer = save();
    wrongPointer.currentSkill.name = "Unknown";
    assert.throws(() => validate(wrongPointer, jobs, skills, items), /current choices/);
    const brokenRequirement = save();
    brokenRequirement.requirements.Automation = null;
    assert.throws(() => validate(brokenRequirement, jobs, skills, items), /requirement/);
});
