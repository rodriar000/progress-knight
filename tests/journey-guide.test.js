const test = require("node:test");
const assert = require("node:assert/strict");
const guide = require("../js/journey-guide.js");

const categories = {
    "Common work": ["Beggar", "Farmer", "Fisherman", "Miner"],
    Military: ["Squire", "Footman"]
};
function state(job = "Beggar", days = 14 * 365) {
    const tasks = Object.fromEntries(["Beggar", "Farmer", "Fisherman", "Miner", "Squire", "Footman", "Strength"]
        .map(name => [name, {name, level: 0, baseData: name === "Strength" ? {} : {income: 5}}]));
    return {
        days, currentJob: tasks[job], taskData: tasks,
        requirements: {
            Farmer: {requirements: [{task: "Beggar", requirement: 10}]},
            Fisherman: {requirements: [{task: "Farmer", requirement: 10}]},
            Miner: {requirements: [{task: "Strength", requirement: 10}, {task: "Fisherman", requirement: 10}]},
            Footman: {requirements: [{task: "Strength", requirement: 20}, {task: "Squire", requirement: 10}]}
        }
    };
}

test("career guidance follows the chosen path and exposes alternatives", () => {
    const game = state();
    const first = guide.career(game, categories);
    assert.equal(first.title, "Farmer");
    assert.deepEqual(first.requirements[0], {name: "Beggar", level: 0, target: 10, complete: false});
    assert.match(first.alternative, /Strength 0\/5/);
    game.taskData.Beggar.level = 10;
    const ready = guide.career(game, categories);
    assert.deepEqual(ready.action, {type: "job", value: "Farmer", label: "Work as Farmer"});
    game.taskData.Strength.level = 5;
    assert.match(guide.career(game, categories).alternative, /military/);
});

test("career guidance identifies both requirements and completed paths", () => {
    const game = state("Fisherman");
    game.taskData.Fisherman.level = 10;
    const goal = guide.career(game, categories);
    assert.equal(goal.title, "Miner");
    assert.equal(goal.requirements.length, 2);
    assert.deepEqual(goal.action, {type: "tab", value: "skills", label: "View skills"});
    game.taskData.Strength.level = 10;
    assert.deepEqual(guide.career(game, categories).action, {type: "job", value: "Miner", label: "Work as Miner"});
    game.currentJob = game.taskData.Miner;
    assert.equal(guide.career(game, categories).title, "Common work complete");
});

test("life chapters describe every threshold and preserve the rebirth choice", () => {
    assert.equal(guide.chapter(state()).age, 20);
    assert.equal(guide.chapter(state("Beggar", 20 * 365)).age, 25);
    assert.equal(guide.chapter(state("Beggar", 25 * 365)).age, 45);
    assert.equal(guide.chapter(state("Beggar", 45 * 365)).age, 65);
    assert.equal(guide.chapter(state("Beggar", 65 * 365)).ready, true);
    assert.equal(guide.chapter(state("Beggar", 70 * 365)).age, 65);
    assert.equal(guide.chapter(state("Beggar", 200 * 365)).title, "A darker beginning");
    assert.equal(guide.chapter(state("Beggar", 17 * 365)).progress, 50);
});
