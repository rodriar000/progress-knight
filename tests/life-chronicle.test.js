const test = require("node:test");
const assert = require("node:assert/strict");
const chronicle = require("../js/life-chronicle.js");

function life() {
    const job = {name: "Farmer", level: 18, maxLevel: 12};
    const skill = {name: "Concentration", level: 30, maxLevel: 32};
    return {
        days: 75 * 365 + 20, rebirthOneCount: 2, rebirthTwoCount: 1,
        currentJob: job, currentSkill: skill,
        taskData: {Farmer: job, Concentration: skill}, lifeChronicle: []
    };
}

test("records the finished life before resetting its levels", () => {
    const state = life();
    assert.equal(chronicle.currentNumber(state), 4);
    assert.deepEqual(chronicle.snapshot(state, "ordinary", 0), {
        number: 4, kind: "ordinary", age: 75,
        job: {name: "Farmer", level: 18}, skill: {name: "Concentration", level: 30},
        newPeaks: 1, evilGained: 0
    });
    state.lifeChronicle = chronicle.append(state, "dark", 7.5);
    state.currentJob.level = 0;
    assert.equal(state.lifeChronicle[0].job.level, 18, "the snapshot is independent of the reset");
    assert.equal(state.lifeChronicle[0].evilGained, 7.5);
    assert.equal(state.lifeChronicle[0].kind, "dark");
});

test("keeps the most recent thousand lives with their original numbers", () => {
    const state = life();
    state.lifeChronicle = Array.from({length: 1000}, (_, index) => ({number: index + 1}));
    state.rebirthOneCount = 1003;
    const records = chronicle.append(state, "ordinary", 0);
    assert.equal(records.length, 1000);
    assert.equal(records[0].number, 2);
    assert.equal(records.at(-1).number, 1005);
});
