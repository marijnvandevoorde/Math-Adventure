/* ===== Screenshot scenes =====
 *
 * Injected into the running app (Android WebView / iOS WKWebView) by the
 * capture scripts so every store screenshot shows the same game state on every
 * device instead of whatever the random generator happened to produce.
 *
 * Everything here drives the app through its own DOM — tapping the real
 * buttons, solving the real sums — so a scene can never show a state the app
 * cannot actually reach. Nothing in this file ships inside the app.
 *
 *   await __scene("splits_win")   // resolves once the state is on screen
 */
(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };
  var visible = function (node) { return node && node.offsetParent !== null; };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /**
   * Polls until `test()` is true. Every solver waits on real state this way
   * rather than on a guessed delay: the app locks its numpad while a correct
   * answer animates, and digits pressed during that window are dropped — which
   * silently turns a scripted "10 in a row" into 6 out of 10.
   */
  async function waitFor(test, what, timeout) {
    var deadline = Date.now() + (timeout || 6000);
    while (Date.now() < deadline) {
      if (test()) return;
      await wait(50);
    }
    throw new Error("timed out waiting for " + (what || "condition"));
  }

  /** Current value of the star counter / progress pill, as a number. */
  function scoreValue() {
    var node = null;
    var all = document.querySelectorAll(".js-score");
    for (var i = 0; i < all.length; i++) if (visible(all[i])) { node = all[i]; break; }
    return node ? parseInt(node.textContent.trim(), 10) || 0 : 0;
  }

  function splitsCount() {
    var node = $("#splitsCount");
    return node ? parseInt(node.textContent.trim(), 10) || 0 : 0;
  }

  function tap(target) {
    var node = typeof target === "string" ? $(target) : target;
    if (!node) throw new Error("scene: missing element " + target);
    node.click();
    return wait(60);
  }

  /** Back to the game picker from wherever we are. */
  async function goHome() {
    var close = $("#closeSettings");
    if (close && visible(close)) await tap(close);
    var home = document.querySelectorAll(".js-home");
    for (var i = 0; i < home.length; i++) {
      if (visible(home[i])) { await tap(home[i]); break; }
    }
    await wait(150);
  }

  // ---------- Rekenreeksen ----------

  var OPS = {
    "+": function (a, b) { return a + b; },
    "−": function (a, b) { return a - b; },   // − (minus sign, not hyphen)
    "-": function (a, b) { return a - b; },
    "×": function (a, b) { return a * b; },   // ×
    "÷": function (a, b) { return a / b; },   // ÷
  };

  /** Reads the equation on screen and returns the answer the app expects. */
  function reeksenAnswer() {
    var a = parseInt($("#opA").textContent.trim(), 10);
    var b = parseInt($("#opB").textContent.trim(), 10);
    var op = OPS[$("#operator").textContent.trim()];
    if (!op) throw new Error("scene: unknown operator " + $("#operator").textContent);
    return op(a, b);
  }

  async function press(padSel, keys) {
    for (var i = 0; i < keys.length; i++) {
      await tap(padSel + ' [data-key="' + keys[i] + '"]');
    }
  }

  /** Types the correct answer. Pass submit=false to leave it sitting in the box. */
  async function solveReeksen(submit) {
    await waitFor(function () { return $("#answerBox").textContent.trim() === "?"; },
                  "a fresh equation");
    var digits = String(reeksenAnswer()).split("");
    await press("#numpad", digits);
    if (submit === false) return;

    var before = scoreValue();
    await tap('#numpad [data-key="check"]');
    // A star is awarded the moment the answer is accepted; waiting on that is
    // what tells us the next sum is ready rather than still animating in.
    await waitFor(function () { return scoreValue() > before; }, "a star");
    await waitFor(function () { return $("#answerBox").textContent.trim() === "?"; },
                  "the next equation");
  }

  // ---------- Splitsen ----------

  /**
   * The app tags the pre-filled box .given and the one to fill in .answer, so
   * read those rather than guessing from which box currently holds a number —
   * mid-animation both of them do.
   */
  function splitsMissing() {
    var total = parseInt($("#splitsTop").textContent.trim(), 10);
    var given = parseInt($(".sbox.given").textContent.trim(), 10);
    return total - given;
  }

  var splitsReady = function () {
    var answer = $(".sbox.answer");
    return $(".sbox.given") !== null && answer !== null && answer.textContent.trim() === "?";
  };

  async function solveSplits(submit) {
    await waitFor(splitsReady, "a fresh split");
    var digits = String(splitsMissing()).split("");
    await press("#splitsNumpad", digits);
    if (submit === false) return;

    var before = splitsCount();
    await tap('#splitsNumpad [data-key="check"]');
    // Either the run counter ticks up, or that was the tenth and we are on the
    // celebration screen.
    await waitFor(function () {
      return splitsCount() > before || visible($("#scrFeest"));
    }, "the split to be accepted");
  }

  // ---------- Settings ----------

  async function openSettings() {
    var buttons = document.querySelectorAll(".js-settings");
    for (var i = 0; i < buttons.length; i++) {
      if (visible(buttons[i])) { await tap(buttons[i]); break; }
    }
    await wait(250);
  }

  async function setLanguage(lang) {
    await openSettings();
    await tap('.lang-toggle[data-lang="' + lang + '"]');
    await wait(200);
    await tap("#closeSettings");
    await wait(250);
  }

  /** Turns every operator on and raises the ceiling, for the settings shot. */
  async function enableAllOps() {
    var wanted = ["+", "-", "*", "/"];
    for (var i = 0; i < wanted.length; i++) {
      // The app marks active toggles with .on — click only the ones still off.
      var btn = $('.op-toggle[data-op="' + wanted[i] + '"]');
      if (btn && !btn.classList.contains("on")) await tap(btn);
    }
    var slider = $("#maxRange");
    if (slider) {
      slider.value = "50";
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      slider.dispatchEvent(new Event("change", { bubbles: true }));
    }
    await wait(150);
  }

  // ---------- Scenes ----------

  var SCENES = {
    async home() {
      await goHome();
    },

    async reeksen() {
      await goHome();
      await tap("#btnReeksen");
      await wait(400);
    },

    async reeksen_typed() {
      await SCENES.reeksen();
      await solveReeksen(false);          // answer entered, ✓ not pressed yet
    },

    async reeksen_correct() {
      await SCENES.reeksen();
      await solveReeksen();
      await solveReeksen(false);
      await tap('#numpad [data-key="check"]');
      // Confetti is up and the praise line has landed, but the answer has not
      // yet flown away to become the next sum's first operand.
      await wait(240);
    },

    async reeksen_streak() {
      await SCENES.reeksen();
      for (var i = 0; i < 5; i++) await solveReeksen();
      await wait(200);
    },

    async settings() {
      await goHome();
      await openSettings();
    },

    async settings_full() {
      await goHome();
      await openSettings();
      await enableAllOps();
    },

    async splits_setup() {
      await goHome();
      await tap("#btnSplitsen");
      await wait(400);
    },

    async splits_play() {
      await SCENES.splits_setup();
      await tap('.numchoice[data-total="10"]');
      await wait(400);
    },

    async splits_typed() {
      await SCENES.splits_play();
      await solveSplits(false);
    },

    async splits_progress() {
      await SCENES.splits_play();
      for (var i = 0; i < 6; i++) await solveSplits();
      await wait(400);
    },

    async splits_win() {
      await SCENES.splits_play();
      for (var i = 0; i < 10; i++) await solveSplits();
      await waitFor(function () { return visible($("#scrFeest")); }, "the trophy screen");
      await wait(500);
    },

    async home_en() {
      await goHome();
      await setLanguage("en");
    },

    async reeksen_en() {
      await SCENES.home_en();
      await tap("#btnReeksen");
      await wait(400);
    },

    async settings_en() {
      await SCENES.home_en();
      await openSettings();
    },

    async home_nl() {
      await goHome();
      await setLanguage("nl");
    },
  };

  window.__sceneNames = Object.keys(SCENES);

  /**
   * Runs a scene and announces the outcome on the console. The capture scripts
   * watch for these markers instead of sleeping a guessed number of seconds,
   * so a slow scene is never screenshotted half-finished.
   */
  window.__scene = async function (name) {
    var scene = SCENES[name];
    if (!scene) {
      console.log("SCENE_FAIL " + name + " unknown scene");
      return "unknown";
    }
    try {
      await scene();
      console.log("SCENE_DONE " + name);
      return "ok";
    } catch (err) {
      console.log("SCENE_FAIL " + name + " " + (err && err.message || err));
      return "error";
    }
  };
})();
