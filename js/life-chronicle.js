// Compact snapshots taken just before a rebirth. Older saves begin recording
// with their next rebirth; their previous lives cannot be reconstructed.
var LifeChronicle = (function () {
    function currentNumber(state) {
        return state.rebirthOneCount + state.rebirthTwoCount + 1;
    }

    function snapshot(state, kind, evilGained) {
        return {
            number: currentNumber(state),
            kind,
            age: Math.floor(state.days / 365),
            job: {name: state.currentJob.name, level: state.currentJob.level},
            skill: {name: state.currentSkill.name, level: state.currentSkill.level},
            newPeaks: Object.values(state.taskData).filter(task => task.level > task.maxLevel).length,
            evilGained: kind === "dark" ? evilGained : 0
        };
    }

    function append(state, kind, evilGained) {
        return state.lifeChronicle.concat(snapshot(state, kind, evilGained)).slice(-1000);
    }

    return {currentNumber, snapshot, append};
})();

if (typeof module !== "undefined" && module.exports) module.exports = LifeChronicle;
