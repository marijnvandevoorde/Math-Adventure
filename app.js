"use strict";
/* ===== Rekenavontuur — spellogica (6-9 jaar), TypeScript =====
 * Twee spellen in één PWA:
 *  - Rekenreeksen: het antwoord van elke som wordt het eerste getal van de
 *    volgende som. Antwoorden blijven altijd binnen [0, max].
 *  - Splitsen: splits een topgetal in twee delen; vul het lege vakje in.
 *    Doel: 10 goed ("10 op een rij" — fout antwoord reset de rij NIET).
 */
(() => {
    "use strict";
    const I18N = {
        nl: {
            title: "Rekenavontuur",
            homeSub: "Wat wil je spelen?",
            reeksenName: "Rekenreeksen",
            reeksenDesc: "Plus, min, keer en delen —<br>het antwoord telt door!",
            splitsName: "Splitsen",
            splitsDesc: "Splits het getal in twee stukjes.<br>Haal jij 10 op een rij?",
            settingsTitle: "Instellingen 🎛️",
            lblMax: "Hoe hoog gaan we?",
            lblOps: "Welke sommen?",
            opNames: { "+": "Plus", "-": "Min", "*": "Keer", "/": "Delen" },
            lblLang: "Taal",
            play: "Spelen maar! 🎉",
            hintMinOne: "Kies minstens één soort som! 🙂",
            splitsQ: "Welk getal ga je splitsen?",
            surprise: "verrassing",
            feestTitle: "10 op een rij!",
            feestSub: "Jij bent een splitskampioen! 🎉",
            again: "Nog een keer! 🔁",
            other: "Ander getal 🎲",
            cheers: ["Super! 🎉", "Goed zo! ⭐", "Klasse! 🤩", "Ja! 🚀", "Geweldig! 🌈", "Briljant! 💎", "Joepie! 🎊"],
            tries: ["Probeer nog eens! 💪", "Bijna! 🙂", "Net niet — jij kan dit!", "Ga zo door! ✨"],
        },
        en: {
            title: "Math Adventure",
            homeSub: "What do you want to play?",
            reeksenName: "Number Chains",
            reeksenDesc: "Add, subtract, multiply, divide —<br>the answer carries on!",
            splitsName: "Number Bonds",
            splitsDesc: "Split the number into two parts.<br>Can you get 10 in a row?",
            settingsTitle: "Settings 🎛️",
            lblMax: "How high do we go?",
            lblOps: "Which sums?",
            opNames: { "+": "Plus", "-": "Minus", "*": "Times", "/": "Divide" },
            lblLang: "Language",
            play: "Let's play! 🎉",
            hintMinOne: "Pick at least one kind of sum! 🙂",
            splitsQ: "Which number will you split?",
            surprise: "surprise",
            feestTitle: "10 in a row!",
            feestSub: "You're a number bonds champion! 🎉",
            again: "Again! 🔁",
            other: "Different number 🎲",
            cheers: ["Awesome! 🎉", "Well done! ⭐", "Great! 🤩", "Yes! 🚀", "Amazing! 🌈", "Brilliant! 💎", "Woohoo! 🎊"],
            tries: ["Try again! 💪", "Almost! 🙂", "Not quite — you've got this!", "Keep going! ✨"],
        },
        fr: {
            title: "Aventure des maths",
            homeSub: "À quoi veux-tu jouer ?",
            reeksenName: "Chaînes de calcul",
            reeksenDesc: "Plus, moins, fois et divisé —<br>la réponse continue !",
            splitsName: "Décomposition",
            splitsDesc: "Coupe le nombre en deux parties.<br>Réussis 10 à la suite !",
            settingsTitle: "Réglages 🎛️",
            lblMax: "Jusqu'à combien ?",
            lblOps: "Quels calculs ?",
            opNames: { "+": "Plus", "-": "Moins", "*": "Fois", "/": "Divisé" },
            lblLang: "Langue",
            play: "On joue ! 🎉",
            hintMinOne: "Choisis au moins un type de calcul ! 🙂",
            splitsQ: "Quel nombre veux-tu décomposer ?",
            surprise: "surprise",
            feestTitle: "10 à la suite !",
            feestSub: "Champion de la décomposition ! 🎉",
            again: "Encore ! 🔁",
            other: "Autre nombre 🎲",
            cheers: ["Super ! 🎉", "Bravo ! ⭐", "Génial ! 🤩", "Oui ! 🚀", "Formidable ! 🌈", "Brillant ! 💎", "Youpi ! 🎊"],
            tries: ["Essaie encore ! 💪", "Presque ! 🙂", "Pas tout à fait — tu peux le faire !", "Continue ! ✨"],
        },
        es: {
            title: "Aventura matemática",
            homeSub: "¿A qué quieres jugar?",
            reeksenName: "Cadenas de cálculo",
            reeksenDesc: "Suma, resta, por y entre —<br>¡la respuesta continúa!",
            splitsName: "Descomponer",
            splitsDesc: "Divide el número en dos partes.<br>¿Logras 10 seguidos?",
            settingsTitle: "Ajustes 🎛️",
            lblMax: "¿Hasta qué número?",
            lblOps: "¿Qué cuentas?",
            opNames: { "+": "Más", "-": "Menos", "*": "Por", "/": "Entre" },
            lblLang: "Idioma",
            play: "¡A jugar! 🎉",
            hintMinOne: "¡Elige al menos un tipo de cuenta! 🙂",
            splitsQ: "¿Qué número vas a descomponer?",
            surprise: "sorpresa",
            feestTitle: "¡10 seguidos!",
            feestSub: "¡Eres un campeón! 🎉",
            again: "¡Otra vez! 🔁",
            other: "Otro número 🎲",
            cheers: ["¡Genial! 🎉", "¡Muy bien! ⭐", "¡Fantástico! 🤩", "¡Sí! 🚀", "¡Increíble! 🌈", "¡Brillante! 💎", "¡Yupi! 🎊"],
            tries: ["¡Inténtalo otra vez! 💪", "¡Casi! 🙂", "Aún no… ¡tú puedes!", "¡Sigue así! ✨"],
        },
    };
    function isLang(v) {
        return v === "nl" || v === "en" || v === "fr" || v === "es";
    }
    // ---------- Config (bewaard in localStorage) ----------
    const DEFAULTS = { max: 20, ops: ["+", "-"], lang: "nl" };
    const config = loadConfig();
    function isOp(o) {
        return o === "+" || o === "-" || o === "*" || o === "/";
    }
    function clampMax(m) {
        let n = parseInt(String(m), 10);
        if (isNaN(n))
            n = DEFAULTS.max;
        return Math.max(5, Math.min(100, n));
    }
    function loadConfig() {
        try {
            const raw = localStorage.getItem("mathAdventureConfig");
            if (raw) {
                const c = JSON.parse(raw);
                const ops = Array.isArray(c.ops) ? c.ops.filter(isOp) : DEFAULTS.ops;
                return {
                    max: clampMax(c.max),
                    ops: ops.length ? ops : DEFAULTS.ops.slice(),
                    lang: isLang(c.lang) ? c.lang : DEFAULTS.lang,
                };
            }
        }
        catch (e) {
            /* kapotte opslag negeren */
        }
        return { max: DEFAULTS.max, ops: DEFAULTS.ops.slice(), lang: DEFAULTS.lang };
    }
    function saveConfig() {
        try {
            localStorage.setItem("mathAdventureConfig", JSON.stringify(config));
        }
        catch (e) {
            /* opslag kan ontbreken */
        }
    }
    // ---------- DOM ----------
    function byId(id) {
        const node = document.getElementById(id);
        if (!node)
            throw new Error("Element ontbreekt: #" + id);
        return node;
    }
    const el = {
        // schermen
        scrHome: byId("scrHome"),
        scrReeksen: byId("scrReeksen"),
        scrSplitsSetup: byId("scrSplitsSetup"),
        scrSplits: byId("scrSplits"),
        scrFeest: byId("scrFeest"),
        // keuzescherm
        btnReeksen: byId("btnReeksen"),
        btnSplitsen: byId("btnSplitsen"),
        homeMascot: byId("homeMascot"),
        homeTitle: byId("homeTitle"),
        homeSub: byId("homeSub"),
        gcReeksenName: byId("gcReeksenName"),
        gcReeksenDesc: byId("gcReeksenDesc"),
        gcSplitsName: byId("gcSplitsName"),
        gcSplitsDesc: byId("gcSplitsDesc"),
        // rekenreeksen
        opA: byId("opA"),
        operator: byId("operator"),
        opB: byId("opB"),
        answerBox: byId("answerBox"),
        feedback: byId("feedback"),
        mascot: byId("mascot"),
        streakValue: byId("streakValue"),
        streakBox: byId("streakBox"),
        numpad: byId("numpad"),
        // splitsen
        splitsCount: byId("splitsCount"),
        splitsMascot: byId("splitsMascot"),
        splitsTop: byId("splitsTop"),
        boxLeft: byId("boxLeft"),
        boxRight: byId("boxRight"),
        splitsFeedback: byId("splitsFeedback"),
        splitsNumpad: byId("splitsNumpad"),
        btnAgain: byId("btnAgain"),
        btnOther: byId("btnOther"),
        splitsQ: byId("splitsQ"),
        rndLabel: byId("rndLabel"),
        feestTitle: byId("feestTitle"),
        feestSub: byId("feestSub"),
        // instellingen
        settingsModal: byId("settingsModal"),
        closeSettings: byId("closeSettings"),
        maxRange: byId("maxRange"),
        maxValue: byId("maxValue"),
        opToggles: byId("opToggles"),
        opHint: byId("opHint"),
        settingsTitle: byId("settingsTitle"),
        lblMax: byId("lblMax"),
        lblOps: byId("lblOps"),
        lblLang: byId("lblLang"),
        langToggles: byId("langToggles"),
    };
    // ---------- Actieve taal ----------
    function L() {
        return I18N[config.lang];
    }
    function applyLang() {
        const t = L();
        document.documentElement.lang = config.lang;
        document.title = t.title + " 🧮";
        el.homeTitle.textContent = t.title;
        el.homeSub.textContent = t.homeSub;
        el.gcReeksenName.textContent = t.reeksenName;
        el.gcReeksenDesc.innerHTML = t.reeksenDesc;
        el.gcSplitsName.textContent = t.splitsName;
        el.gcSplitsDesc.innerHTML = t.splitsDesc;
        el.settingsTitle.textContent = t.settingsTitle;
        el.lblMax.textContent = t.lblMax;
        el.lblOps.textContent = t.lblOps;
        el.lblLang.textContent = t.lblLang;
        el.closeSettings.textContent = t.play;
        el.opToggles.querySelectorAll(".op-toggle").forEach((btn) => {
            const op = btn.dataset.op;
            const name = btn.querySelector(".op-name");
            if (isOp(op) && name)
                name.textContent = t.opNames[op];
        });
        el.langToggles.querySelectorAll(".lang-toggle").forEach((btn) => {
            btn.classList.toggle("on", btn.dataset.lang === config.lang);
        });
        el.splitsQ.textContent = t.splitsQ;
        el.rndLabel.textContent = t.surprise;
        el.feestTitle.textContent = t.feestTitle;
        el.feestSub.textContent = t.feestSub;
        el.btnAgain.textContent = t.again;
        el.btnOther.textContent = t.other;
    }
    const mascots = ["🦄", "🐢", "🐰", "🦊", "🐼", "🐸", "🐥", "🐙", "🦖", "🐳"];
    const opSymbol = { "+": "+", "-": "−", "*": "×", "/": "÷" };
    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
    const screens = {
        home: el.scrHome,
        reeksen: el.scrReeksen,
        splitsSetup: el.scrSplitsSetup,
        splits: el.scrSplits,
        feest: el.scrFeest,
    };
    let active = "home";
    function show(name) {
        Object.keys(screens).forEach((k) => {
            screens[k].hidden = k !== name;
        });
        active = name;
    }
    // ---------- Score (gedeeld over spellen) ----------
    let score = 0;
    function addStar() {
        score += 1;
        document.querySelectorAll(".js-score").forEach((n) => {
            n.textContent = String(score);
        });
    }
    // =====================================================================
    // ===== Rekenreeksen ==================================================
    // =====================================================================
    let current;
    let typed = "";
    let locked = false;
    let streak = 0;
    // Alle geldige zetten vanaf startwaarde `a`.
    function validMoves(a, max, ops) {
        const moves = [];
        ops.forEach((op) => {
            if (op === "+") {
                for (let b = 1; a + b <= max; b++)
                    moves.push({ op, b, answer: a + b });
            }
            else if (op === "-") {
                for (let b = 1; b <= a; b++)
                    moves.push({ op, b, answer: a - b });
            }
            else if (op === "*") {
                // Zinvol houden: a,b >= 2, resultaat binnen max. (×0 / ×1 zijn triviaal,
                // en a=0 zou eindeloos doorlopen want 0*b blijft <= max.)
                if (a >= 2) {
                    for (let b = 2; a * b <= max; b++)
                        moves.push({ op, b, answer: a * b });
                }
            }
            else {
                // delen: b deelt a precies, b >= 2 → heel antwoord < a
                for (let b = 2; b <= a; b++) {
                    if (a % b === 0)
                        moves.push({ op, b, answer: a / b });
                }
            }
        });
        return moves;
    }
    function makeExercise(startValue) {
        const max = config.max;
        const ops = config.ops.length ? config.ops : DEFAULTS.ops;
        let a = startValue;
        let moves = validMoves(a, max, ops);
        if (!moves.length) {
            a = freshStart(max, ops);
            moves = validMoves(a, max, ops);
        }
        const m = pick(moves);
        return { a, op: m.op, b: m.b, answer: m.answer };
    }
    // Klein startgetal met minstens één geldige zet.
    function freshStart(max, ops) {
        const cap = Math.min(9, max);
        const candidates = [];
        for (let v = 0; v <= cap; v++) {
            if (validMoves(v, max, ops).length)
                candidates.push(v);
        }
        if (!candidates.length) {
            for (let v = 0; v <= max; v++) {
                if (validMoves(v, max, ops).length)
                    candidates.push(v);
            }
        }
        return candidates.length ? pick(candidates) : 1;
    }
    function render() {
        el.opA.textContent = String(current.a);
        el.operator.textContent = opSymbol[current.op];
        el.opB.textContent = String(current.b);
        updateAnswerBox();
    }
    function updateAnswerBox() {
        if (typed === "") {
            el.answerBox.textContent = "?";
            el.answerBox.className = "answer-box";
        }
        else {
            el.answerBox.textContent = typed;
            el.answerBox.className = "answer-box filled";
        }
    }
    function typeDigit(value, key) {
        // Losse "0" mag (geldig antwoord), maar geen voorloopnul: "0" dan "5" → "5".
        if (value.length >= 3)
            return value;
        if (value === "0")
            return key;
        return value + key;
    }
    function onKey(key) {
        if (locked)
            return;
        if (key === "clear") {
            typed = typed.slice(0, -1);
            updateAnswerBox();
            clearFeedback();
        }
        else if (key === "check") {
            check();
        }
        else {
            typed = typeDigit(typed, key);
            updateAnswerBox();
            clearFeedback();
        }
    }
    function clearFeedback() {
        el.feedback.textContent = "";
        el.feedback.className = "feedback";
    }
    function check() {
        if (typed === "")
            return;
        const val = parseInt(typed, 10);
        if (val === current.answer)
            onCorrect();
        else
            onWrong();
    }
    function onCorrect() {
        locked = true;
        addStar();
        streak += 1;
        el.streakValue.textContent = String(streak);
        el.streakBox.classList.toggle("dim", streak === 0);
        el.answerBox.className = "answer-box filled correct";
        el.feedback.textContent = pick(L().cheers);
        el.feedback.className = "feedback good";
        el.mascot.className = "mascot happy";
        burstConfetti();
        const answerValue = current.answer;
        flyAnswerToOperand(() => {
            el.mascot.textContent = pick(mascots);
            el.mascot.className = "mascot";
            current = makeExercise(answerValue);
            typed = "";
            render();
            locked = false;
        });
    }
    function onWrong() {
        streak = 0;
        el.streakValue.textContent = String(streak);
        el.streakBox.classList.add("dim");
        el.answerBox.className = "answer-box filled wrong";
        el.feedback.textContent = pick(L().tries);
        el.feedback.className = "feedback bad";
        el.mascot.className = "mascot sad";
        window.setTimeout(() => {
            el.mascot.className = "mascot";
            typed = "";
            updateAnswerBox();
        }, 700);
    }
    // ---------- Vlieg-animatie ----------
    function flyAnswerToOperand(done) {
        const from = el.answerBox.getBoundingClientRect();
        const to = el.opA.getBoundingClientRect();
        const ghost = document.createElement("div");
        ghost.className = "fly-answer";
        ghost.textContent = String(current.answer);
        ghost.style.left = from.left + "px";
        ghost.style.top = from.top + "px";
        ghost.style.fontSize = window.getComputedStyle(el.answerBox).fontSize;
        document.body.appendChild(ghost);
        requestAnimationFrame(() => {
            const dx = to.left + to.width / 2 - (from.left + from.width / 2);
            const dy = to.top + to.height / 2 - (from.top + from.height / 2);
            ghost.style.transform = "translate(" + dx + "px," + dy + "px) scale(1.15)";
            ghost.style.opacity = "0.2";
        });
        window.setTimeout(() => {
            if (ghost.parentNode)
                ghost.parentNode.removeChild(ghost);
            done();
        }, 560);
    }
    const SPLITS_GOAL = 10;
    const SPLITS_RND_MAX = 20;
    let splitsChoice = 10;
    let split = { total: 10, given: 4, answer: 6, givenSide: "left" };
    let splitsTyped = "";
    let splitsLocked = false;
    let splitsGood = 0;
    // Bij een vast topgetal (5 of 10) werken we met een geschudde stapel: elk
    // gegeven getal (0 t/m total) komt precies één keer voorbij. Is de stapel
    // op, dan schudden we opnieuw — zo krijg je nooit steeds dezelfde som.
    let deck = [];
    let deckTotal = -1;
    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }
    function drawGiven(total) {
        if (deckTotal !== total || deck.length === 0) {
            deck = shuffle(Array.from({ length: total + 1 }, (_, i) => i));
            deckTotal = total;
            // Geen directe herhaling over de schudgrens heen.
            if (deck.length > 1 && deck[deck.length - 1] === split.given) {
                const top = deck.pop();
                deck.unshift(top);
            }
        }
        return deck.pop();
    }
    function newSplit() {
        let total;
        let given;
        if (splitsChoice === "rnd") {
            // Verrassing: topgetal 3 t/m 20, gegeven getal willekeurig — maar niet
            // twee keer exact dezelfde som na elkaar.
            let tries = 0;
            do {
                total = 3 + Math.floor(Math.random() * (SPLITS_RND_MAX - 2)); // 3 t/m 20
                given = Math.floor(Math.random() * (total + 1)); // 0 t/m total
                tries++;
            } while (tries < 10 && total === split.total && given === split.given);
        }
        else {
            total = splitsChoice;
            given = drawGiven(total);
        }
        split = {
            total,
            given,
            answer: total - given,
            givenSide: Math.random() < 0.5 ? "left" : "right",
        };
        splitsTyped = "";
        renderSplit();
    }
    function answerEl() {
        return split.givenSide === "left" ? el.boxRight : el.boxLeft;
    }
    function givenEl() {
        return split.givenSide === "left" ? el.boxLeft : el.boxRight;
    }
    function renderSplit() {
        el.splitsTop.textContent = String(split.total);
        givenEl().textContent = String(split.given);
        givenEl().className = "sbox given";
        updateSplitsBox();
    }
    function updateSplitsBox() {
        const box = answerEl();
        if (splitsTyped === "") {
            box.textContent = "?";
            box.className = "sbox answer";
        }
        else {
            box.textContent = splitsTyped;
            box.className = "sbox answer filled";
        }
    }
    function renderCount() {
        el.splitsCount.textContent = splitsGood + "/" + SPLITS_GOAL;
    }
    function resetSplitsRun() {
        splitsGood = 0;
        renderCount();
        clearSplitsFeedback();
        newSplit();
    }
    function onSplitsKey(key) {
        if (splitsLocked)
            return;
        if (key === "clear") {
            splitsTyped = splitsTyped.slice(0, -1);
            updateSplitsBox();
            clearSplitsFeedback();
        }
        else if (key === "check") {
            checkSplit();
        }
        else {
            splitsTyped = typeDigit(splitsTyped, key);
            updateSplitsBox();
            clearSplitsFeedback();
        }
    }
    function clearSplitsFeedback() {
        el.splitsFeedback.textContent = "";
        el.splitsFeedback.className = "feedback";
    }
    function checkSplit() {
        if (splitsTyped === "")
            return;
        const val = parseInt(splitsTyped, 10);
        if (val === split.answer)
            onSplitCorrect();
        else
            onSplitWrong();
    }
    function onSplitCorrect() {
        splitsLocked = true;
        addStar();
        splitsGood += 1;
        renderCount();
        answerEl().className = "sbox answer filled ok";
        el.splitsFeedback.textContent = pick(L().cheers);
        el.splitsFeedback.className = "feedback good";
        el.splitsMascot.className = "mascot happy";
        burstConfetti();
        window.setTimeout(() => {
            el.splitsMascot.textContent = pick(mascots);
            el.splitsMascot.className = "mascot";
            splitsLocked = false;
            if (splitsGood >= SPLITS_GOAL) {
                show("feest");
                burstConfetti();
                window.setTimeout(burstConfetti, 350);
            }
            else {
                clearSplitsFeedback();
                newSplit();
            }
        }, 900);
    }
    function onSplitWrong() {
        // Lief zijn: de sterrenrij blijft gewoon staan.
        answerEl().className = "sbox answer filled wrong";
        el.splitsFeedback.textContent = pick(L().tries);
        el.splitsFeedback.className = "feedback bad";
        el.splitsMascot.className = "mascot sad";
        window.setTimeout(() => {
            el.splitsMascot.className = "mascot";
            splitsTyped = "";
            updateSplitsBox();
        }, 700);
    }
    // =====================================================================
    // ===== Instellingen (Rekenreeksen) ===================================
    // =====================================================================
    function openSettings() {
        el.maxRange.value = String(config.max);
        el.maxValue.textContent = String(config.max);
        el.opToggles.querySelectorAll(".op-toggle").forEach((btn) => {
            const op = btn.dataset.op;
            btn.classList.toggle("on", config.ops.indexOf(op) !== -1);
        });
        el.opHint.textContent = "";
        el.settingsModal.hidden = false;
    }
    function closeSettings() {
        const chosen = [];
        el.opToggles.querySelectorAll(".op-toggle.on").forEach((btn) => {
            const op = btn.dataset.op;
            if (isOp(op))
                chosen.push(op);
        });
        if (!chosen.length) {
            el.opHint.textContent = L().hintMinOne;
            return;
        }
        config.ops = chosen;
        config.max = clampMax(el.maxRange.value);
        saveConfig();
        el.settingsModal.hidden = true;
        // Nieuwe geldige som onder de nieuwe instellingen.
        current = makeExercise(freshStart(config.max, config.ops));
        typed = "";
        clearFeedback();
        render();
    }
    // =====================================================================
    // ===== Events ========================================================
    // =====================================================================
    function wireNumpad(pad, handler) {
        pad.addEventListener("click", (e) => {
            const btn = e.target.closest(".key");
            if (btn && btn.dataset.key)
                handler(btn.dataset.key);
        });
    }
    wireNumpad(el.numpad, onKey);
    wireNumpad(el.splitsNumpad, onSplitsKey);
    // Fysiek toetsenbord: naar het actieve spel sturen.
    window.addEventListener("keydown", (e) => {
        if (!el.settingsModal.hidden)
            return;
        const handler = active === "reeksen" ? onKey : active === "splits" ? onSplitsKey : null;
        if (!handler)
            return;
        if (e.key >= "0" && e.key <= "9")
            handler(e.key);
        else if (e.key === "Enter" || e.key === "=")
            handler("check");
        else if (e.key === "Backspace") {
            e.preventDefault();
            handler("clear");
        }
    });
    // Navigatie
    el.btnReeksen.addEventListener("click", () => show("reeksen"));
    el.btnSplitsen.addEventListener("click", () => show("splitsSetup"));
    document.querySelectorAll(".js-home").forEach((btn) => {
        btn.addEventListener("click", () => {
            el.homeMascot.textContent = pick(mascots);
            show("home");
        });
    });
    document.querySelectorAll(".js-settings").forEach((btn) => {
        btn.addEventListener("click", openSettings);
    });
    // Splitsen: keuze van het topgetal
    el.scrSplitsSetup.querySelectorAll(".numchoice").forEach((btn) => {
        btn.addEventListener("click", () => {
            const t = btn.dataset.total;
            splitsChoice = t === "5" ? 5 : t === "10" ? 10 : "rnd";
            resetSplitsRun();
            show("splits");
        });
    });
    el.btnAgain.addEventListener("click", () => {
        resetSplitsRun();
        show("splits");
    });
    el.btnOther.addEventListener("click", () => show("splitsSetup"));
    el.closeSettings.addEventListener("click", closeSettings);
    el.maxRange.addEventListener("input", () => {
        el.maxValue.textContent = el.maxRange.value;
    });
    // Taalkeuze: meteen toepassen én bewaren.
    el.langToggles.addEventListener("click", (e) => {
        const btn = e.target.closest(".lang-toggle");
        if (!btn)
            return;
        const lang = btn.dataset.lang;
        if (!isLang(lang) || lang === config.lang)
            return;
        config.lang = lang;
        saveConfig();
        applyLang();
    });
    el.opToggles.addEventListener("click", (e) => {
        const btn = e.target.closest(".op-toggle");
        if (!btn)
            return;
        btn.classList.toggle("on");
        el.opHint.textContent = "";
    });
    const canvas = byId("confetti");
    const ctx = canvas.getContext("2d");
    const pieces = [];
    let rafId = null;
    const confColors = ["#ff6bcb", "#ffd23f", "#2ecc71", "#4d9dff", "#ff9f43", "#9b5de5"];
    function sizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);
    function burstConfetti() {
        const cx = window.innerWidth / 2;
        for (let i = 0; i < 90; i++) {
            pieces.push({
                x: cx + (Math.random() - 0.5) * 120,
                y: window.innerHeight * 0.35,
                vx: (Math.random() - 0.5) * 9,
                vy: Math.random() * -9 - 3,
                size: Math.random() * 9 + 5,
                color: confColors[Math.floor(Math.random() * confColors.length)],
                rot: Math.random() * Math.PI,
                vr: (Math.random() - 0.5) * 0.35,
                life: 90 + Math.random() * 40,
            });
        }
        if (rafId === null)
            rafId = requestAnimationFrame(drawConfetti);
    }
    function drawConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = pieces.length - 1; i >= 0; i--) {
            const p = pieces[i];
            p.vy += 0.32; // zwaartekracht
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vr;
            p.life--;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            ctx.restore();
            if (p.life <= 0 || p.y > canvas.height + 30)
                pieces.splice(i, 1);
        }
        if (pieces.length) {
            rafId = requestAnimationFrame(drawConfetti);
        }
        else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            rafId = null;
        }
    }
    // ---------- Zoom uitschakelen (iOS Safari) ----------
    // touch-action: manipulation in CSS stopt dubbeltik-zoom (snel "11" typen
    // mag nooit zoomen); deze guards stoppen ook knijp-zoom, want iOS negeert
    // user-scalable=no in de viewport-meta.
    document.addEventListener("gesturestart", (e) => e.preventDefault());
    document.addEventListener("touchmove", (e) => {
        if (e.touches.length > 1)
            e.preventDefault();
    }, { passive: false });
    // ---------- Service worker (offline / PWA) ----------
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("sw.js").catch(() => {
                /* offline is een extraatje, geen vereiste */
            });
        });
    }
    // ---------- Start ----------
    applyLang();
    el.streakBox.classList.add("dim");
    current = makeExercise(freshStart(config.max, config.ops));
    render();
    resetSplitsRun();
    show("home");
})();
