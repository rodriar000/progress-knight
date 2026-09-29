// Read-only guidance. Career and chapter goals never change the simulation.
var JourneyGuide = (function () {
    const chapters = [
        {age: 20, start: 14, title: "Your own routine", detail: "Auto-promote and Auto-learn become available."},
        {age: 25, start: 20, title: "A curious find", detail: "The amulet enters your story."},
        {age: 45, start: 25, title: "The first marking", detail: "The amulet reveals another sign."},
        {age: 65, start: 45, title: "A new life", detail: "The amulet offers a rebirth that keeps your highest levels."}
    ];

    function career(state, categories) {
        const current = state.currentJob.name;
        const category = Object.entries(categories).find(([, names]) => names.includes(current));
        if (!category) return null;
        const [path, names] = category;
        const alternative = path === "Common work" ?
            (state.taskData.Strength.level < 5 ?
                "Another path: Strength " + state.taskData.Strength.level + "/5 opens the Squire role." :
                "Another path: the Squire role is open in the military.") :
            "You can still explore the other career paths.";
        const next = names[names.indexOf(current) + 1];
        if (!next) return {
            path, title: path + " complete", detail: "You have reached the final role on this path. Other careers remain open.",
            alternative, requirements: [], action: {type: "tab", value: "jobs", label: "Explore careers"}
        };

        const requirement = state.requirements[next];
        const requirements = requirement.requirements.filter(rule => rule.task).map(rule => {
            const level = state.taskData[rule.task].level;
            return {name: rule.task, level, target: rule.requirement, complete: level >= rule.requirement};
        });
        const missing = requirements.find(rule => !rule.complete);
        return {
            path, title: next, alternative,
            detail: missing ? "Train the requirements below to open your next role." :
                "This role is ready. Choose it whenever you want to move forward.",
            requirements,
            action: missing ? {
                type: "tab", value: state.taskData[missing.name].baseData.income === undefined ? "skills" : "jobs",
                label: state.taskData[missing.name].baseData.income === undefined ? "View skills" : "View jobs"
            } : {type: "job", value: next, label: "Work as " + next}
        };
    }

    function chapter(state) {
        const age = state.days / 365;
        if (age >= 200) return {
            title: "A darker beginning", detail: "The amulet offers another kind of rebirth.",
            age: 200, progress: 100, ready: true
        };
        if (age >= 65) return {
            title: "A new life is available", detail: "Touch the amulet when you are ready to carry your highest levels forward.",
            age: 65, progress: 100, ready: true
        };
        const next = chapters.find(milestone => age < milestone.age);
        return {
            title: next.title, detail: next.detail, age: next.age,
            progress: Math.max(0, Math.min(100, Math.floor((age - next.start) / (next.age - next.start) * 100))),
            ready: false
        };
    }

    return {career, chapter};
})();

if (typeof module !== "undefined" && module.exports) module.exports = JourneyGuide;
