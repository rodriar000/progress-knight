// A read-only portrait of the existing game state. No visual choices are saved.
(function () {
    const portraits = {
        "Beggar":          ["common", "rags",   "none",   "bare",   "stitch", "#746b65", "#b69b74", "#b78358"],
        "Farmer":          ["common", "tunic",  "hoe",    "cap",    "leaf",   "#627c56", "#b29b66", "#a5ca69"],
        "Fisherman":       ["common", "tunic",  "rod",    "cap",    "wave",   "#476d79", "#8da8a1", "#75cbd0"],
        "Miner":           ["common", "tunic",  "pick",   "cap",    "diamond","#645d58", "#a88760", "#e6ae64"],
        "Blacksmith":      ["common", "apron",  "hammer", "bare",   "flame",  "#694c3f", "#a87952", "#f8a260"],
        "Merchant":        ["common", "coat",   "scroll", "hat",    "coin",   "#4b6973", "#d1b777", "#f5cf79"],
        "Squire":          ["military", "tunic", "sword",  "bare",   "shield", "#607381", "#aebec7", "#a5b9d4"],
        "Footman":         ["military", "armor", "sword",  "helm",   "shield", "#506577", "#9caeb8", "#c0d4df"],
        "Veteran footman":["military", "armor", "sword",  "helm",   "shield", "#4b5967", "#bdc1b9", "#dec08b"],
        "Knight":          ["military", "armor", "sword",  "helm",   "shield", "#47556f", "#d2d8d7", "#ecc689"],
        "Veteran knight":  ["military", "armor", "sword",  "helm",   "shield", "#434c68", "#e1d5ba", "#e8ba72"],
        "Elite knight":    ["military", "armor", "sword",  "helm",   "shield", "#414660", "#e4d4ac", "#f4d489"],
        "Holy knight":     ["military", "armor", "sword",  "crown",  "sun",    "#e6dfc9", "#f8e8ba", "#ffe5a0"],
        "Legendary knight":["military", "armor", "sword", "crown",  "sun",    "#383958", "#f9db9c", "#ffe1a0"],
        "Student":         ["arcane", "robe",   "book",   "bare",   "star",   "#525b84", "#a6b5de", "#aeb8ff"],
        "Apprentice mage": ["arcane", "robe",   "staff",  "hood",   "star",   "#475477", "#a5b0df", "#a7a9f5"],
        "Mage":            ["arcane", "robe",   "staff",  "hood",   "star",   "#454b79", "#b8aeec", "#b6a8ff"],
        "Wizard":          ["arcane", "robe",   "staff",  "hat",    "star",   "#483d79", "#c4b0ed", "#d1a6ff"],
        "Master wizard":   ["arcane", "robe",   "staff",  "hat",    "star",   "#42356b", "#e1c6f8", "#dca6ff"],
        "Chairman":        ["arcane", "robe",   "staff",  "crown",  "star",   "#3d315c", "#e9d0ee", "#f5c1ff"]
    };

    const figure = document.getElementById("characterFigure");
    if (!figure) return;

    figure.innerHTML = `<svg class="character-art" viewBox="0 0 300 310" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
            <radialGradient id="portraitHalo"><stop stop-color="var(--accent)" stop-opacity=".28"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></radialGradient>
            <linearGradient id="portraitMetal"><stop stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="var(--trim)"/><stop offset="1" stop-color="#343e4e"/></linearGradient>
            <linearGradient id="portraitCloth" x2=".85" y2="1"><stop stop-color="var(--trim)" stop-opacity=".75"/><stop offset=".25" stop-color="var(--cloth)"/><stop offset="1" stop-color="#202533"/></linearGradient>
        </defs>
        <circle class="character-halo" cx="150" cy="145" r="124" fill="url(#portraitHalo)"/>
        <path class="portrait-ornament" d="M24 165a126 126 0 0 1 252 0 M44 165a106 106 0 0 1 212 0" fill="none" stroke="var(--accent)" stroke-opacity=".22" stroke-width="1"/>
        <path class="portrait-ornament" d="M150 16v15 M24 165h15 M261 165h15" stroke="var(--accent)" stroke-opacity=".5"/>
        <ellipse cx="150" cy="285" rx="87" ry="12" fill="#070d19" opacity=".4"/>
        <g class="character-body">
            <path class="cape" d="M117 120 Q98 157 94 251 Q150 278 207 251 Q199 153 181 119Z" fill="var(--accent)" opacity=".68" stroke="#202331" stroke-width="3"/>
            <path d="M125 207 L123 263 L143 268 L151 215 M153 216 L161 268 L181 263 L175 207Z" fill="#373c49" stroke="#222834" stroke-width="3"/>
            <path d="M121 256 L144 259 L145 280 L112 280 Q115 270 121 256Z M160 259 L181 256 Q188 269 189 280 L156 280Z" fill="#292b31" stroke="var(--trim)" stroke-opacity=".55" stroke-width="2"/>
            <path d="M117 123 Q104 137 104 168 L112 205 L127 199 L128 151 M181 123 Q196 137 196 168 L189 205 L174 199 L172 151" fill="var(--cloth)" stroke="#252c37" stroke-width="3"/>
            <path d="M111 194 L130 191 L129 208 Q119 216 113 207Z M171 191 L190 194 L188 207 Q181 216 171 208Z" fill="var(--trim)" stroke="#29303a" stroke-width="2"/>
            <path class="outfit" d="M124 114 Q150 124 176 114 L190 219 Q150 238 109 219Z" fill="url(#portraitCloth)" stroke="#232b38" stroke-width="3"/>
            <path d="M112 214 Q150 229 188 214 L191 223 Q150 244 109 223Z" fill="var(--trim)" opacity=".63"/>
            <path class="apron" d="M129 149 L171 149 L180 222 Q150 233 120 222Z" fill="#48372e" stroke="var(--trim)" stroke-width="3"/>
            <path class="armor" d="M119 126 L135 118 L150 132 L165 118 L181 126 L176 191 L150 204 L124 191Z" fill="url(#portraitMetal)" stroke="#252f3c" stroke-width="4"/>
            <path class="armor" d="M118 131 L100 140 L105 155 L124 151 M182 131 L200 140 L195 155 L176 151" fill="url(#portraitMetal)" stroke="#293443" stroke-width="3"/>
            <path class="armor" d="M125 184 L175 184 L177 192 L150 206 L123 192Z" fill="var(--accent)" stroke="#353e49" stroke-width="2"/>
            <path class="coat" d="M126 118 L147 147 L129 221 L105 216Z M174 118 L153 147 L171 221 L195 216Z" fill="var(--trim)" opacity=".7" stroke="#26303c" stroke-width="2"/>
            <path class="robe" d="M127 158 L110 221 Q150 243 190 221 L173 158 M150 159 L150 230" fill="none" stroke="var(--trim)" stroke-opacity=".7" stroke-width="3"/>
            <path d="M130 118 Q150 136 170 118 L163 109 L137 109Z" fill="var(--trim)" stroke="#2a2b34" stroke-width="2"/>
            <path d="M133 99 L136 120 Q150 130 164 120 L167 99Z" fill="#a97155"/>
            <ellipse cx="150" cy="81" rx="29" ry="34" fill="#bd8967" stroke="#573c35" stroke-width="2"/>
            <path d="M122 83 Q118 43 149 43 Q180 42 179 83 L173 72 Q153 75 142 62 Q136 73 122 83Z" fill="#31282a"/>
            <path d="M135 85h7 M158 85h7" stroke="#272836" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M145 103 Q150 106 155 103" fill="none" stroke="#70453e" stroke-width="1.5"/>
            <path class="cap" d="M119 73 Q120 40 151 41 Q181 41 181 73 L188 77 Q151 81 116 77Z" fill="var(--cloth)" stroke="var(--trim)" stroke-width="3"/>
            <path class="hood" d="M111 108 Q105 39 150 35 Q196 39 189 108 L171 112 Q182 65 150 57 Q118 65 129 112Z" fill="var(--cloth)" stroke="var(--trim)" stroke-width="3"/>
            <path class="helm" d="M120 78 Q119 42 150 39 Q181 42 180 78 L173 91 L169 67 L131 67 L127 91Z" fill="url(#portraitMetal)" stroke="#303746" stroke-width="3"/>
            <path class="helm" d="M148 42 L152 42 L153 92 L147 92Z" fill="var(--accent)"/>
            <path class="hat" d="M112 75 L130 64 L139 28 L165 30 L177 64 L190 75 Q151 84 112 75Z" fill="var(--cloth)" stroke="var(--trim)" stroke-width="3"/>
            <path class="crown" d="M117 61 L121 32 L136 47 L150 25 L164 47 L179 32 L183 61Z" fill="url(#portraitMetal)" stroke="var(--accent)" stroke-width="3"/>
            <circle class="crown" cx="150" cy="51" r="5" fill="var(--accent)"/>
            <g class="emblem" stroke="var(--accent)" fill="none" stroke-width="2.5" stroke-linejoin="round">
                <path data-emblem="stitch" d="M139 166l8 7 8-7 8 7"/>
                <path data-emblem="leaf" d="M150 178 Q130 163 150 151 Q171 163 150 178Z M150 178v-23"/>
                <path data-emblem="wave" d="M134 160q8-8 16 0t16 0 M134 169q8-8 16 0t16 0"/>
                <path data-emblem="diamond" d="M150 151l13 13-13 14-13-14Z"/>
                <path data-emblem="flame" d="M150 178q-15-8-5-19l2 7q11-10 7-16 17 15 4 27Z"/>
                <circle data-emblem="coin" cx="150" cy="164" r="13"/>
                <path data-emblem="coin" d="M150 154v20 M155 159q-13-8-13 1t14 5-12 8"/>
                <path data-emblem="shield" d="M136 153h28v16l-14 11-14-11Z M150 154v23"/>
                <path data-emblem="sun" d="M150 153v23 M138 165h24 M141 156l18 18 M159 156l-18 18"/>
                <path data-emblem="star" d="M150 148l4 12 13 4-13 4-4 12-4-12-13-4 13-4Z"/>
            </g>
            <g class="tool" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <g data-tool="hoe"><path d="M207 119l-12 154" stroke="#785239" stroke-width="6"/><path d="M186 119l45 4-3 8-43-2Z" fill="var(--trim)" stroke="#28313a" stroke-width="2"/></g>
                <g data-tool="rod"><path d="M199 270Q218 150 230 62" stroke="#a57d52" stroke-width="3"/><path d="M230 62q33 33 5 132" stroke="var(--accent)" stroke-width="1.5"/></g>
                <g data-tool="pick"><path d="M197 260L224 88" stroke="#855e42" stroke-width="6"/><path d="M185 94q38-36 70 2-32-13-70-2Z" fill="var(--trim)" stroke="#303844" stroke-width="3"/></g>
                <g data-tool="hammer"><path d="M198 256L218 126" stroke="#81583b" stroke-width="7"/><path d="M199 118l42 7-3 19-43-7Z" fill="var(--trim)" stroke="#303844" stroke-width="3"/></g>
                <g data-tool="scroll"><path d="M191 161l51 3-3 47-50-4Z" fill="#d5bb84" stroke="#514438" stroke-width="3"/><path d="M201 174h28m-28 9h20m-20 9h24" stroke="#896e56" stroke-width="2"/></g>
                <g data-tool="sword"><path d="M203 220l37-145 8-12-1 17-31 144Z" fill="url(#portraitMetal)" stroke="#37404e" stroke-width="3"/><path d="M186 214l44 13 M207 226l-8 31" stroke="var(--accent)" stroke-width="7"/></g>
                <g data-tool="book"><path d="M190 180q20-6 36 4 16-10 34-5v42q-18-4-34 5-15-9-36-5Z" fill="var(--trim)" stroke="#39344f" stroke-width="3"/><path d="M226 185v41" stroke="#69527e" stroke-width="2"/></g>
                <g data-tool="staff"><path d="M218 272V89" stroke="var(--trim)" stroke-width="7"/><path d="M218 89l-13-17 13-27 13 27Z" fill="var(--accent)" stroke="#eee4ff" stroke-width="2"/><circle cx="218" cy="70" r="24" fill="url(#portraitHalo)" stroke="none"/></g>
            </g>
            <path class="advanced-detail" d="M121 207 Q150 222 179 207 M137 137l13 7 13-7" fill="none" stroke="var(--accent)" stroke-width="2"/>
        </g>
    </svg>`;

    let lastAppearance = "";
    function renderCharacter() {
        if (typeof gameData === "undefined" || !gameData.currentJob) return;
        const job = gameData.currentJob;
        const portrait = portraits[job.name] || portraits.Beggar;
        const level = Number(job.level) || 0;
        const tier = level >= 100 ? 3 : level >= 25 ? 2 : level >= 10 ? 1 : 0;
        const appearance = job.name + ":" + level;
        if (appearance === lastAppearance) return;
        lastAppearance = appearance;

        const [family, outfit, tool, headgear, emblem, cloth, trim, accent] = portrait;
        const art = figure.firstElementChild;
        art.dataset.family = family;
        art.dataset.outfit = outfit;
        art.dataset.tool = tool;
        art.dataset.headgear = headgear;
        art.dataset.emblem = emblem;
        art.dataset.tier = tier;
        art.style.setProperty("--cloth", cloth);
        art.style.setProperty("--trim", trim);
        art.style.setProperty("--accent", accent);
        document.getElementById("characterJob").textContent = job.name;
        document.getElementById("characterLevel").textContent = "LV " + level;
        document.getElementById("characterRank").textContent = family === "common" ? "Common work" : family === "military" ? "Military" : "The Arcane Association";
        figure.setAttribute("aria-label", job.name + ", level " + level);
    }

    renderCharacter();
    setInterval(renderCharacter, 250);
})();
