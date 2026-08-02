/* ===== Rekenavontuur — spellogica (6-9 jaar), TypeScript =====
 * Twee spellen in één PWA:
 *  - Rekenreeksen: het antwoord van elke som wordt het eerste getal van de
 *    volgende som. Antwoorden blijven altijd binnen [0, max].
 *  - Splitsen: splits een topgetal in twee delen; vul het lege vakje in.
 *    Doel: 10 goed ("10 op een rij" — fout antwoord reset de rij NIET).
 */

(() => {
  "use strict";

  // ---------- Teksten (Nederlands) ----------
  const CHEERS = ["Super! 🎉", "Goed zo! ⭐", "Klasse! 🤩", "Ja! 🚀", "Geweldig! 🌈", "Briljant! 💎", "Joepie! 🎊"];
  const TRIES = ["Probeer nog eens! 💪", "Bijna! 🙂", "Net niet — jij kan dit!", "Ga zo door! ✨"];
  const HINT_MIN_ONE_OP = "Kies minstens één soort som! 🙂";

  type Op = "+" | "-" | "*" | "/";
  interface Config {
    max: number;
    ops: Op[];
  }
  interface Move {
    op: Op;
    b: number;
    answer: number;
  }
  interface Exercise {
    a: number;
    op: Op;
    b: number;
    answer: number;
  }

  // ---------- Config (bewaard in localStorage) ----------
  const DEFAULTS: Config = { max: 20, ops: ["+", "-"] };
  const config: Config = loadConfig();

  function isOp(o: unknown): o is Op {
    return o === "+" || o === "-" || o === "*" || o === "/";
  }
  function clampMax(m: unknown): number {
    let n = parseInt(String(m), 10);
    if (isNaN(n)) n = DEFAULTS.max;
    return Math.max(5, Math.min(100, n));
  }
  function loadConfig(): Config {
    try {
      const raw = localStorage.getItem("mathAdventureConfig");
      if (raw) {
        const c = JSON.parse(raw) as Partial<Config>;
        const ops = Array.isArray(c.ops) ? c.ops.filter(isOp) : DEFAULTS.ops;
        return {
          max: clampMax(c.max),
          ops: ops.length ? ops : DEFAULTS.ops.slice(),
        };
      }
    } catch (e) {
      /* kapotte opslag negeren */
    }
    return { max: DEFAULTS.max, ops: DEFAULTS.ops.slice() };
  }
  function saveConfig(): void {
    try {
      localStorage.setItem("mathAdventureConfig", JSON.stringify(config));
    } catch (e) {
      /* opslag kan ontbreken */
    }
  }

  // ---------- DOM ----------
  function byId<T extends HTMLElement = HTMLElement>(id: string): T {
    const node = document.getElementById(id);
    if (!node) throw new Error("Element ontbreekt: #" + id);
    return node as T;
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
    // instellingen
    settingsModal: byId("settingsModal"),
    closeSettings: byId("closeSettings"),
    maxRange: byId<HTMLInputElement>("maxRange"),
    maxValue: byId("maxValue"),
    opToggles: byId("opToggles"),
    opHint: byId("opHint"),
  };

  const mascots = ["🦄", "🐢", "🐰", "🦊", "🐼", "🐸", "🐥", "🐙", "🦖", "🐳"];
  const opSymbol: Record<Op, string> = { "+": "+", "-": "−", "*": "×", "/": "÷" };

  function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ---------- Schermnavigatie ----------
  type ScreenName = "home" | "reeksen" | "splitsSetup" | "splits" | "feest";
  const screens: Record<ScreenName, HTMLElement> = {
    home: el.scrHome,
    reeksen: el.scrReeksen,
    splitsSetup: el.scrSplitsSetup,
    splits: el.scrSplits,
    feest: el.scrFeest,
  };
  let active: ScreenName = "home";

  function show(name: ScreenName): void {
    (Object.keys(screens) as ScreenName[]).forEach((k) => {
      screens[k].hidden = k !== name;
    });
    active = name;
  }

  // ---------- Score (gedeeld over spellen) ----------
  let score = 0;
  function addStar(): void {
    score += 1;
    document.querySelectorAll<HTMLElement>(".js-score").forEach((n) => {
      n.textContent = String(score);
    });
  }

  // =====================================================================
  // ===== Rekenreeksen ==================================================
  // =====================================================================

  let current: Exercise;
  let typed = "";
  let locked = false;
  let streak = 0;

  // Alle geldige zetten vanaf startwaarde `a`.
  function validMoves(a: number, max: number, ops: Op[]): Move[] {
    const moves: Move[] = [];
    ops.forEach((op) => {
      if (op === "+") {
        for (let b = 1; a + b <= max; b++) moves.push({ op, b, answer: a + b });
      } else if (op === "-") {
        for (let b = 1; b <= a; b++) moves.push({ op, b, answer: a - b });
      } else if (op === "*") {
        // Zinvol houden: a,b >= 2, resultaat binnen max. (×0 / ×1 zijn triviaal,
        // en a=0 zou eindeloos doorlopen want 0*b blijft <= max.)
        if (a >= 2) {
          for (let b = 2; a * b <= max; b++) moves.push({ op, b, answer: a * b });
        }
      } else {
        // delen: b deelt a precies, b >= 2 → heel antwoord < a
        for (let b = 2; b <= a; b++) {
          if (a % b === 0) moves.push({ op, b, answer: a / b });
        }
      }
    });
    return moves;
  }

  function makeExercise(startValue: number): Exercise {
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
  function freshStart(max: number, ops: Op[]): number {
    const cap = Math.min(9, max);
    const candidates: number[] = [];
    for (let v = 0; v <= cap; v++) {
      if (validMoves(v, max, ops).length) candidates.push(v);
    }
    if (!candidates.length) {
      for (let v = 0; v <= max; v++) {
        if (validMoves(v, max, ops).length) candidates.push(v);
      }
    }
    return candidates.length ? pick(candidates) : 1;
  }

  function render(): void {
    el.opA.textContent = String(current.a);
    el.operator.textContent = opSymbol[current.op];
    el.opB.textContent = String(current.b);
    updateAnswerBox();
  }

  function updateAnswerBox(): void {
    if (typed === "") {
      el.answerBox.textContent = "?";
      el.answerBox.className = "answer-box";
    } else {
      el.answerBox.textContent = typed;
      el.answerBox.className = "answer-box filled";
    }
  }

  function typeDigit(value: string, key: string): string {
    // Losse "0" mag (geldig antwoord), maar geen voorloopnul: "0" dan "5" → "5".
    if (value.length >= 3) return value;
    if (value === "0") return key;
    return value + key;
  }

  function onKey(key: string): void {
    if (locked) return;
    if (key === "clear") {
      typed = typed.slice(0, -1);
      updateAnswerBox();
      clearFeedback();
    } else if (key === "check") {
      check();
    } else {
      typed = typeDigit(typed, key);
      updateAnswerBox();
      clearFeedback();
    }
  }

  function clearFeedback(): void {
    el.feedback.textContent = "";
    el.feedback.className = "feedback";
  }

  function check(): void {
    if (typed === "") return;
    const val = parseInt(typed, 10);
    if (val === current.answer) onCorrect();
    else onWrong();
  }

  function onCorrect(): void {
    locked = true;
    addStar();
    streak += 1;
    el.streakValue.textContent = String(streak);
    el.streakBox.classList.toggle("dim", streak === 0);

    el.answerBox.className = "answer-box filled correct";
    el.feedback.textContent = pick(CHEERS);
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

  function onWrong(): void {
    streak = 0;
    el.streakValue.textContent = String(streak);
    el.streakBox.classList.add("dim");
    el.answerBox.className = "answer-box filled wrong";
    el.feedback.textContent = pick(TRIES);
    el.feedback.className = "feedback bad";
    el.mascot.className = "mascot sad";
    window.setTimeout(() => {
      el.mascot.className = "mascot";
      typed = "";
      updateAnswerBox();
    }, 700);
  }

  // ---------- Vlieg-animatie ----------
  function flyAnswerToOperand(done: () => void): void {
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
      if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
      done();
    }, 560);
  }

  // =====================================================================
  // ===== Splitsen ======================================================
  // =====================================================================

  type SplitsChoice = 5 | 10 | "rnd";
  interface Split {
    total: number;
    given: number;
    answer: number;
    givenSide: "left" | "right";
  }

  const SPLITS_GOAL = 10;
  const SPLITS_RND_MAX = 20;
  let splitsChoice: SplitsChoice = 10;
  let split: Split = { total: 10, given: 4, answer: 6, givenSide: "left" };
  let splitsTyped = "";
  let splitsLocked = false;
  let splitsGood = 0;

  // Bij een vast topgetal (5 of 10) werken we met een geschudde stapel: elk
  // gegeven getal (0 t/m total) komt precies één keer voorbij. Is de stapel
  // op, dan schudden we opnieuw — zo krijg je nooit steeds dezelfde som.
  let deck: number[] = [];
  let deckTotal = -1;

  function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function drawGiven(total: number): number {
    if (deckTotal !== total || deck.length === 0) {
      deck = shuffle(Array.from({ length: total + 1 }, (_, i) => i));
      deckTotal = total;
      // Geen directe herhaling over de schudgrens heen.
      if (deck.length > 1 && deck[deck.length - 1] === split.given) {
        const top = deck.pop()!;
        deck.unshift(top);
      }
    }
    return deck.pop()!;
  }

  function newSplit(): void {
    let total: number;
    let given: number;
    if (splitsChoice === "rnd") {
      // Verrassing: topgetal 3 t/m 20, gegeven getal willekeurig — maar niet
      // twee keer exact dezelfde som na elkaar.
      let tries = 0;
      do {
        total = 3 + Math.floor(Math.random() * (SPLITS_RND_MAX - 2)); // 3 t/m 20
        given = Math.floor(Math.random() * (total + 1)); // 0 t/m total
        tries++;
      } while (tries < 10 && total === split.total && given === split.given);
    } else {
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

  function answerEl(): HTMLElement {
    return split.givenSide === "left" ? el.boxRight : el.boxLeft;
  }
  function givenEl(): HTMLElement {
    return split.givenSide === "left" ? el.boxLeft : el.boxRight;
  }

  function renderSplit(): void {
    el.splitsTop.textContent = String(split.total);
    givenEl().textContent = String(split.given);
    givenEl().className = "sbox given";
    updateSplitsBox();
  }

  function updateSplitsBox(): void {
    const box = answerEl();
    if (splitsTyped === "") {
      box.textContent = "?";
      box.className = "sbox answer";
    } else {
      box.textContent = splitsTyped;
      box.className = "sbox answer filled";
    }
  }

  function renderCount(): void {
    el.splitsCount.textContent = splitsGood + "/" + SPLITS_GOAL;
  }

  function resetSplitsRun(): void {
    splitsGood = 0;
    renderCount();
    clearSplitsFeedback();
    newSplit();
  }

  function onSplitsKey(key: string): void {
    if (splitsLocked) return;
    if (key === "clear") {
      splitsTyped = splitsTyped.slice(0, -1);
      updateSplitsBox();
      clearSplitsFeedback();
    } else if (key === "check") {
      checkSplit();
    } else {
      splitsTyped = typeDigit(splitsTyped, key);
      updateSplitsBox();
      clearSplitsFeedback();
    }
  }

  function clearSplitsFeedback(): void {
    el.splitsFeedback.textContent = "";
    el.splitsFeedback.className = "feedback";
  }

  function checkSplit(): void {
    if (splitsTyped === "") return;
    const val = parseInt(splitsTyped, 10);
    if (val === split.answer) onSplitCorrect();
    else onSplitWrong();
  }

  function onSplitCorrect(): void {
    splitsLocked = true;
    addStar();
    splitsGood += 1;
    renderCount();

    answerEl().className = "sbox answer filled ok";
    el.splitsFeedback.textContent = pick(CHEERS);
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
      } else {
        clearSplitsFeedback();
        newSplit();
      }
    }, 900);
  }

  function onSplitWrong(): void {
    // Lief zijn: de sterrenrij blijft gewoon staan.
    answerEl().className = "sbox answer filled wrong";
    el.splitsFeedback.textContent = pick(TRIES);
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

  function openSettings(): void {
    el.maxRange.value = String(config.max);
    el.maxValue.textContent = String(config.max);
    el.opToggles.querySelectorAll<HTMLElement>(".op-toggle").forEach((btn) => {
      const op = btn.dataset.op as Op;
      btn.classList.toggle("on", config.ops.indexOf(op) !== -1);
    });
    el.opHint.textContent = "";
    el.settingsModal.hidden = false;
  }

  function closeSettings(): void {
    const chosen: Op[] = [];
    el.opToggles.querySelectorAll<HTMLElement>(".op-toggle.on").forEach((btn) => {
      const op = btn.dataset.op;
      if (isOp(op)) chosen.push(op);
    });
    if (!chosen.length) {
      el.opHint.textContent = HINT_MIN_ONE_OP;
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

  function wireNumpad(pad: HTMLElement, handler: (key: string) => void): void {
    pad.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>(".key");
      if (btn && btn.dataset.key) handler(btn.dataset.key);
    });
  }
  wireNumpad(el.numpad, onKey);
  wireNumpad(el.splitsNumpad, onSplitsKey);

  // Fysiek toetsenbord: naar het actieve spel sturen.
  window.addEventListener("keydown", (e) => {
    if (!el.settingsModal.hidden) return;
    const handler = active === "reeksen" ? onKey : active === "splits" ? onSplitsKey : null;
    if (!handler) return;
    if (e.key >= "0" && e.key <= "9") handler(e.key);
    else if (e.key === "Enter" || e.key === "=") handler("check");
    else if (e.key === "Backspace") {
      e.preventDefault();
      handler("clear");
    }
  });

  // Navigatie
  el.btnReeksen.addEventListener("click", () => show("reeksen"));
  el.btnSplitsen.addEventListener("click", () => show("splitsSetup"));
  document.querySelectorAll<HTMLElement>(".js-home").forEach((btn) => {
    btn.addEventListener("click", () => {
      el.homeMascot.textContent = pick(mascots);
      show("home");
    });
  });
  document.querySelectorAll<HTMLElement>(".js-settings").forEach((btn) => {
    btn.addEventListener("click", openSettings);
  });

  // Splitsen: keuze van het topgetal
  el.scrSplitsSetup.querySelectorAll<HTMLElement>(".numchoice").forEach((btn) => {
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
  el.opToggles.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>(".op-toggle");
    if (!btn) return;
    btn.classList.toggle("on");
    el.opHint.textContent = "";
  });

  // ---------- Confetti ----------
  interface Piece {
    x: number; y: number; vx: number; vy: number;
    size: number; color: string; rot: number; vr: number; life: number;
  }
  const canvas = byId<HTMLCanvasElement>("confetti");
  const ctx = canvas.getContext("2d")!;
  const pieces: Piece[] = [];
  let rafId: number | null = null;
  const confColors = ["#ff6bcb", "#ffd23f", "#2ecc71", "#4d9dff", "#ff9f43", "#9b5de5"];

  function sizeCanvas(): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  sizeCanvas();
  window.addEventListener("resize", sizeCanvas);

  function burstConfetti(): void {
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
    if (rafId === null) rafId = requestAnimationFrame(drawConfetti);
  }

  function drawConfetti(): void {
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
      if (p.life <= 0 || p.y > canvas.height + 30) pieces.splice(i, 1);
    }
    if (pieces.length) {
      rafId = requestAnimationFrame(drawConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      rafId = null;
    }
  }

  // ---------- Zoom uitschakelen (iOS Safari) ----------
  // touch-action: manipulation in CSS stopt dubbeltik-zoom (snel "11" typen
  // mag nooit zoomen); deze guards stoppen ook knijp-zoom, want iOS negeert
  // user-scalable=no in de viewport-meta.
  document.addEventListener("gesturestart", (e) => e.preventDefault());
  document.addEventListener(
    "touchmove",
    (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    },
    { passive: false }
  );

  // ---------- Service worker (offline / PWA) ----------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {
        /* offline is een extraatje, geen vereiste */
      });
    });
  }

  // ---------- Start ----------
  el.streakBox.classList.add("dim");
  current = makeExercise(freshStart(config.max, config.ops));
  render();
  resetSplitsRun();
  show("home");
})();
