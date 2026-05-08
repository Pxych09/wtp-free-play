// ============================================
// POKÉMON WORLD — game.js
// Who's That Pokémon? — Daily Guessing Game
// ============================================

"use strict";

// ============================================
// DOM ELEMENTS
// ============================================

const $ = (id) => document.getElementById(id);

const DOM = {
  // Screens
  screenStart:    $("screenStart"),
  screenGame:     $("screenGame"),
  screenCooldown: $("screenCooldown"),

  // Header
  streakCount:    $("streakCount"),
  scoreCount:     $("scoreCount"),
  streakBadge:    $("streakBadge"),
  scoreBadge:     $("scoreBadge"),
  themeToggle:    $("themeToggle"),
  devToggle:      $("devToggle"),

  // Pokémon stage
  pokemonStage:   $("pokemonStage"),
  stageGlow:      $("stageGlow"),
  pokemonImg:     $("pokemonImg"),
  questionMark:   $("questionMark"),
  loadingSpinner: $("loadingSpinner"),

  // Pokéballs
  pokeballs:      $("pokeballs"),

  // Guess panel
  hintBox:        $("hintBox"),
  hintText:       $("hintText"),
  inputGroup:     $("inputGroup"),
  guessInput:     $("guessInput"),
  btnGuess:       $("btnGuess"),
  feedback:       $("feedback"),
  btnSkip:        $("btnSkip"),
  genBadge:       $("genBadge"),

  // Info card
  infoCard:       $("infoCard"),
  infoName:       $("infoName"),
  infoTypes:      $("infoTypes"),
  infoRarity:     $("infoRarity"),
  infoDesc:       $("infoDesc"),
  infoStats:      $("infoStats"),
  infoAbilities:  $("infoAbilities"),
  btnNext:        $("btnNext"),

  // Buttons
  btnStart:       $("btnStart"),

  // Cooldown
  timerH:         $("timerH"),
  timerM:         $("timerM"),
  timerS:         $("timerS"),
  cooldownScore:  $("cooldownScore"),
  cooldownStreak: $("cooldownStreak"),

  // Toast & Overlay
  toastContainer: $("toastContainer"),
  winOverlay:     $("winOverlay"),
  winEmoji:       $("winEmoji"),
  winTitle:       $("winTitle"),
  winSub:         $("winSub"),
  confettiContainer: $("confettiContainer"),

  // Audio
  sfxCorrect: $("sfxCorrect"),
  sfxWrong:   $("sfxWrong"),
  sfxReveal:  $("sfxReveal"),
  sfxCry:     $("sfxCry"),
};


// ============================================
// STATE VARIABLES
// ============================================

const MAX_BALLS = 3;
const COOLDOWN_HOURS = 24;
const TOTAL_POKEMON = 898; // Gen 1–8

const state = {
  currentPokemon:   null,   // Full Pokémon data object
  attemptsLeft:     MAX_BALLS,
  score:            0,
  streak:           0,
  isRevealed:       false,
  isLoading:        false,
  hintShown:        false,
  cooldownInterval: null,
  themeIsDark:      true,
  devMode:          false,   // 🛠️ Dev: infinite Pokéballs when true
};


// ============================================
// RARITY SYSTEM
// (Pokémon IDs → Rarity categories)
// ============================================

const RARITY_MAP = {
  legendary: [
    144, 145, 146, 150, 151,       // Gen 1
    243, 244, 245, 249, 250,        // Gen 2
    377, 378, 379, 380, 381, 382, 383, 384, 385, 386, // Gen 3
    480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, // Gen 4
    638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, // Gen 5
    716, 717, 718, 719, 720, 721,   // Gen 6
    785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 801, 802, 807, 808, 809, // Gen 7-8
  ],
  mythical: [151, 251, 385, 386, 489, 490, 491, 492, 493, 494, 647, 648, 649, 719, 720, 721, 801, 802],
  epic: [
    // Pseudo-legendaries and popular starters
    6, 9, 3, 65, 68, 94, 131, 143, 149, 196, 197, 212, 214, 248, 254, 257, 260,
    306, 350, 373, 376, 448, 445, 452, 460, 472, 473, 475, 479, 503, 530, 545, 549, 553,
    612, 635, 637, 644, 646, 663, 701, 706, 725, 745, 760, 778, 784,
  ],
  rare: [
    // Rare evolutions, uncommon pokémon
    25, 26, 35, 36, 39, 40, 54, 55, 58, 59, 63, 66, 67, 74, 75, 76, 79, 80,
    81, 82, 95, 104, 105, 106, 107, 111, 112, 113, 114, 115, 122, 123, 124,
    125, 126, 127, 128, 130, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142,
    147, 148, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162,
  ],
};

const getRarity = (id) => {
  if (RARITY_MAP.mythical.includes(id))  return { label: "✨ Mythical", cls: "rarity--mythical" };
  if (RARITY_MAP.legendary.includes(id)) return { label: "⭐ Legendary", cls: "rarity--legendary" };
  if (RARITY_MAP.epic.includes(id))      return { label: "💎 Epic", cls: "rarity--epic" };
  if (RARITY_MAP.rare.includes(id))      return { label: "🔵 Rare", cls: "rarity--rare" };
  if (id <= 151)                         return { label: "🟢 Uncommon", cls: "rarity--uncommon" };
  return { label: "⚪ Common", cls: "rarity--common" };
};


// ============================================
// GENERATION SYSTEM
// ============================================

const GENERATIONS = [
  { gen: 1, label: "Generation I",   sub: "Kanto",   range: [1,   151] },
  { gen: 2, label: "Generation II",  sub: "Johto",   range: [152, 251] },
  { gen: 3, label: "Generation III", sub: "Hoenn",   range: [252, 386] },
  { gen: 4, label: "Generation IV",  sub: "Sinnoh",  range: [387, 493] },
  { gen: 5, label: "Generation V",   sub: "Unova",   range: [494, 649] },
  { gen: 6, label: "Generation VI",  sub: "Kalos",   range: [650, 721] },
  { gen: 7, label: "Generation VII", sub: "Alola",   range: [722, 809] },
  { gen: 8, label: "Generation VIII","sub": "Galar",  range: [810, 898] },
];

const getGeneration = (id) =>
  GENERATIONS.find(({ range }) => id >= range[0] && id <= range[1])
  || GENERATIONS[0];

const capitalize = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const normalizeGuess = (str) =>
  str.trim().toLowerCase().replace(/[^a-z0-9\-]/g, "");

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const pad = (n) => String(n).padStart(2, "0");

const createEl = (tag, className = "", text = "") => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text)      el.textContent = text;
  return el;
};


// ============================================
// LOCAL STORAGE HELPERS
// ============================================

const LS_KEY = "pokemonWorldState";

const loadLS = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch { return {}; }
};

const saveLS = (data) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
};

const loadPersistedState = () => {
  const saved = loadLS();
  const now = Date.now();

  // Check if 24h has passed since depletion
  if (saved.depletedAt) {
    const elapsed = now - saved.depletedAt;
    const hoursElapsed = elapsed / (1000 * 60 * 60);
    if (hoursElapsed >= COOLDOWN_HOURS) {
      // Reset
      saveLS({ score: saved.score || 0, streak: saved.streak || 0, attemptsLeft: MAX_BALLS });
      return;
    }
  }

  state.score   = saved.score   || 0;
  state.streak  = saved.streak  || 0;

  if (saved.attemptsLeft !== undefined) {
    state.attemptsLeft = saved.attemptsLeft;
  }
};

const persistState = () => {
  const data = loadLS();
  saveLS({
    ...data,
    score:        state.score,
    streak:       state.streak,
    attemptsLeft: state.attemptsLeft,
    depletedAt:   state.attemptsLeft <= 0 ? (data.depletedAt || Date.now()) : undefined,
  });
};


// ============================================
// SCREEN MANAGEMENT
// ============================================

const showScreen = (screenEl) => {
  [DOM.screenStart, DOM.screenGame, DOM.screenCooldown].forEach(s => {
    s.classList.remove("active");
  });
  screenEl.classList.add("active");
};


// ============================================
// POKÉBALL UI
// ============================================

const POKEBALL_IMG = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="pokeball" />`;

const renderPokeballs = () => {
  const balls = DOM.pokeballs.querySelectorAll(".pokeball");
  balls.forEach((ball, i) => {
    const active = (i + 1) <= state.attemptsLeft;
    ball.classList.toggle("pokeball--active", active);
    ball.classList.toggle("pokeball--lost",   !active);
    ball.innerHTML = POKEBALL_IMG;
  });
};

const animateBallLoss = (ballIndex) => {
  const balls = DOM.pokeballs.querySelectorAll(".pokeball");
  const ball = balls[ballIndex];
  if (!ball) return;
  ball.classList.add("losing");
  ball.addEventListener("animationend", () => {
    ball.classList.remove("losing");
    renderPokeballs();
  }, { once: true });
};


// ============================================
// TOAST SYSTEM
// ============================================

const TOAST_ICONS = { success: "✅", error: "❌", info: "ℹ️" };

const showToast = (message, type = "info", duration = 3000) => {
  const toast = createEl("div", `toast toast--${type}`);
  toast.innerHTML = `<span class="toast__icon">${TOAST_ICONS[type]}</span><span>${message}</span>`;
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("removing");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, duration);
};


// ============================================
// FEEDBACK DISPLAY
// ============================================

const showFeedback = (msg, type = "info") => {
  DOM.feedback.textContent = msg;
  DOM.feedback.className = `feedback ${type}`;
  DOM.feedback.classList.remove("hidden");
};

const hideFeedback = () => DOM.feedback.classList.add("hidden");


// ============================================
// LOADING STATE
// ============================================

const setLoading = (loading) => {
  state.isLoading = loading;
  DOM.loadingSpinner.classList.toggle("hidden", !loading);
  DOM.pokemonImg.classList.toggle("hidden", loading);
  if (loading) DOM.pokemonImg.classList.remove("revealed");
};


// ============================================
// API FUNCTIONS
// ============================================

const BASE_URL = "https://pokeapi.co/api/v2";

const fetchJSON = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

const fetchPokemon = async (id) => {
  const [pokemon, species] = await Promise.all([
    fetchJSON(`${BASE_URL}/pokemon/${id}`),
    fetchJSON(`${BASE_URL}/pokemon-species/${id}`),
  ]);

  // Get English flavor text
  const flavorEntry = species.flavor_text_entries
    .filter(e => e.language.name === "en")
    .pop();

  const description = flavorEntry
    ? flavorEntry.flavor_text.replace(/\f|\n/g, " ")
    : "No description available.";

  return {
    id:          pokemon.id,
    name:        pokemon.name,
    image:       pokemon.sprites.other?.["official-artwork"]?.front_default
                 || pokemon.sprites.front_default,
    types:       pokemon.types.map(t => t.type.name),
    abilities:   pokemon.abilities.map(a => a.ability.name.replace(/-/g, " ")),
    stats: {
      hp:      pokemon.stats[0].base_stat,
      attack:  pokemon.stats[1].base_stat,
      defense: pokemon.stats[2].base_stat,
      speed:   pokemon.stats[5].base_stat,
    },
    cry:         `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemon.id}.ogg`,
    description,
    rarity:      getRarity(pokemon.id),
    generation:  getGeneration(pokemon.id),
  };
};

const fetchRandomPokemon = async () => {
  const id = randomInt(1, TOTAL_POKEMON);
  return fetchPokemon(id);
};


// ============================================
// SOUND EFFECTS
// (Uses Web Audio API for generated tones)
// ============================================

let audioCtx = null;

const getAudioCtx = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
};

const playTone = (frequencies, duration = 0.15, type = "square", vol = 0.15) => {
  try {
    const ctx = getAudioCtx();
    frequencies.forEach(([freq, delay = 0]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    });
  } catch {}
};

const sfx = {
  correct: () => playTone([[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36]], 0.2, "triangle", 0.2),
  wrong:   () => playTone([[220, 0], [196, 0.15]], 0.25, "sawtooth", 0.12),
  reveal:  () => playTone([[262, 0], [330, 0.08], [392, 0.16], [523, 0.24], [659, 0.32], [784, 0.4]], 0.18, "triangle", 0.18),
  click:   () => playTone([[880, 0]], 0.06, "square", 0.08),
};

const playCry = (pokemonId) => {
  try {
    const audio = new Audio(`https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemonId}.ogg`);
    audio.volume = 0.4;
    audio.play().catch(() => {});
  } catch {}
};


// ============================================
// HINT SYSTEM
// ============================================

const getHintText = (pokemon) => {
  const hints = [
    `This Pokémon is a ${pokemon.types.map(capitalize).join(" / ")} type.`,
    `Its name starts with the letter "${pokemon.name[0].toUpperCase()}".`,
    `Pokédex: "${pokemon.description}"`,
    `One of its abilities is "${capitalize(pokemon.abilities[0])}".`,
  ];
  return hints[randomInt(0, hints.length - 1)];
};

const showHint = () => {
  if (!state.currentPokemon || state.hintShown) return;
  state.hintShown = true;
  DOM.hintText.textContent = getHintText(state.currentPokemon);
  DOM.hintBox.classList.remove("hidden");
};


// ============================================
// CONFETTI ANIMATION
// ============================================

const CONFETTI_COLORS = ["#ffcb05", "#2a75bb", "#3ddc84", "#ff4d4d", "#c87dff", "#ff8060"];

const launchConfetti = (container, count = 30) => {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const el = createEl("div", "confetti");
    el.style.cssText = `
      left: ${randomInt(5, 95)}%;
      top: ${randomInt(-10, 20)}%;
      background: ${CONFETTI_COLORS[randomInt(0, CONFETTI_COLORS.length - 1)]};
      width: ${randomInt(6, 12)}px;
      height: ${randomInt(6, 12)}px;
      border-radius: ${randomInt(0, 3)}px;
      animation-duration: ${(randomInt(6, 14) / 10).toFixed(1)}s;
      animation-delay: ${(randomInt(0, 6) / 10).toFixed(1)}s;
    `;
    container.appendChild(el);
  }
};


// ============================================
// WIN OVERLAY
// ============================================

const showWinOverlay = (pokemon, isStreak) => {
  const msgs = [
    `That's ${capitalize(pokemon.name)}! Amazing!`,
    `You got it! ${capitalize(pokemon.name)} is revealed!`,
    `Correct! ${capitalize(pokemon.name)} appeared!`,
  ];
  DOM.winEmoji.textContent = isStreak && state.streak > 2 ? "🔥" : "🎉";
  DOM.winTitle.textContent = "Correct!";
  DOM.winSub.textContent   = msgs[randomInt(0, msgs.length - 1)];
  DOM.winOverlay.classList.remove("hidden");
  launchConfetti(DOM.confettiContainer);
  sfx.reveal();

  setTimeout(() => {
    DOM.winOverlay.classList.add("hidden");
  }, 2200);
};


// ============================================
// POKÉMON INFO CARD RENDERING
// ============================================

const renderTypeBadges = (types) => {
  DOM.infoTypes.innerHTML = types
    .map(t => `<span class="type-badge type--${t}">${capitalize(t)}</span>`)
    .join("");
};

const renderStats = (stats) => {
  const LABELS = { hp: "HP", attack: "ATK", defense: "DEF", speed: "SPD" };
  DOM.infoStats.innerHTML = Object.entries(stats)
    .map(([key, val]) => `
      <div class="stat-item">
        <div class="stat-item__name">${LABELS[key]}</div>
        <div class="stat-item__val">${val}</div>
      </div>
    `).join("");
};

const renderAbilities = (abilities) => {
  DOM.infoAbilities.innerHTML = abilities
    .map(a => `<span class="ability-badge">${capitalize(a)}</span>`)
    .join("");
};

const renderInfoCard = (pokemon) => {
  DOM.infoName.textContent = capitalize(pokemon.name);
  renderTypeBadges(pokemon.types);

  const rarity = pokemon.rarity;
  DOM.infoRarity.className = `info-card__rarity ${rarity.cls}`;
  DOM.infoRarity.textContent = rarity.label;

  DOM.infoDesc.textContent = pokemon.description;
  renderStats(pokemon.stats);
  renderAbilities(pokemon.abilities);

  DOM.infoCard.classList.remove("hidden");
};


// ============================================
// HEADER STATS UPDATE
// ============================================

const updateHeaderStats = (animate = false) => {
  DOM.streakCount.textContent = state.streak;
  DOM.scoreCount.textContent  = state.score;

  if (animate) {
    [DOM.streakBadge, DOM.scoreBadge].forEach(badge => {
      badge.classList.add("pop");
      setTimeout(() => badge.classList.remove("pop"), 400);
    });
  }
};


// ============================================
// GAME LOGIC
// ============================================

const loadNewPokemon = async () => {
  // Reset UI state
  state.isRevealed  = false;
  state.hintShown   = false;
  state.currentPokemon = null;

  hideFeedback();
  DOM.hintBox.classList.add("hidden");
  DOM.infoCard.classList.add("hidden");
  DOM.guessInput.value = "";
  DOM.guessInput.className = "guess-input";
  DOM.pokemonImg.classList.remove("revealed");
  DOM.pokemonImg.classList.add("hidden");
  DOM.questionMark.classList.remove("hidden");
  DOM.pokemonStage.classList.remove("glowing", "correct-glow");
  DOM.inputGroup.querySelectorAll("button, input").forEach(el => el.removeAttribute("disabled"));
  DOM.inputGroup.classList.remove("round-over");
  DOM.btnSkip.removeAttribute("disabled");
  DOM.genBadge.classList.add("hidden");

  setLoading(true);

  try {
    const pokemon = await fetchRandomPokemon();
    state.currentPokemon = pokemon;

    // Show generation badge
    const { label, sub } = pokemon.generation;
    DOM.genBadge.textContent = `${label} · ${sub}`;
    DOM.genBadge.className = `gen-badge gen--${pokemon.generation.gen}`;

    DOM.pokemonImg.src = pokemon.image;
    DOM.pokemonImg.onload = () => {
      setLoading(false);
      DOM.pokemonImg.classList.remove("hidden");
      DOM.pokemonStage.classList.add("glowing");
    };
    DOM.pokemonImg.onerror = () => {
      setLoading(false);
      showToast("Couldn't load image, trying another...", "error");
      loadNewPokemon();
    };
  } catch (err) {
    setLoading(false);
    showToast("Failed to fetch Pokémon. Check your connection.", "error");
    console.error(err);
  }
};

const revealPokemon = async () => {
  if (state.isRevealed || !state.currentPokemon) return;
  state.isRevealed = true;

  const pokemon = state.currentPokemon;

  // Reveal image
  DOM.pokemonImg.classList.add("revealed");
  DOM.questionMark.classList.add("hidden");
  DOM.pokemonStage.classList.remove("glowing");
  DOM.pokemonStage.classList.add("correct-glow");

  // Disable input
  DOM.guessInput.disabled = true;
  DOM.btnGuess.disabled   = true;
  DOM.btnSkip.disabled    = true;
  DOM.inputGroup.classList.add("round-over");

  // Play cry
  playCry(pokemon.id);

  // Show info card
  renderInfoCard(pokemon);
};

const handleCorrectGuess = async () => {
  // Disable immediately — prevents double-clicks during the reveal sequence
  DOM.guessInput.disabled = true;
  DOM.btnGuess.disabled   = true;
  DOM.btnSkip.disabled    = true;
  DOM.inputGroup.classList.add("round-over");

  sfx.correct();
  DOM.guessInput.classList.add("correct");
  showFeedback(`🎉 Correct! It's ${capitalize(state.currentPokemon.name)}!`, "success");

  state.score  += 10 + (state.attemptsLeft * 5);
  state.streak += 1;
  persistState();
  updateHeaderStats(true);

  const wasStreak = state.streak > 1;
  await revealPokemon();
  showWinOverlay(state.currentPokemon, wasStreak);

  if (wasStreak) {
    showToast(`🔥 ${state.streak}x Streak! +Bonus points!`, "success", 2500);
  }
};

const handleWrongGuess = () => {
  const ballIndex = state.attemptsLeft - 1;

  // Dev mode: no ball deduction, just shake and show feedback
  if (state.devMode) {
    sfx.wrong();
    DOM.pokemonStage.classList.add("shake");
    DOM.guessInput.classList.add("shake-input");
    DOM.pokemonStage.addEventListener("animationend", () => {
      DOM.pokemonStage.classList.remove("shake");
    }, { once: true });
    DOM.guessInput.addEventListener("animationend", () => {
      DOM.guessInput.classList.remove("shake-input");
      DOM.guessInput.value = "";
    }, { once: true });
    showFeedback("❌ Wrong! (Dev Mode: no ball lost)", "error");
    return;
  }

  state.attemptsLeft -= 1;
  persistState();

  sfx.wrong();
  DOM.pokemonStage.classList.add("shake");
  DOM.guessInput.classList.add("shake-input");
  animateBallLoss(ballIndex);

  DOM.pokemonStage.addEventListener("animationend", () => {
    DOM.pokemonStage.classList.remove("shake");
  }, { once: true });

  DOM.guessInput.addEventListener("animationend", () => {
    DOM.guessInput.classList.remove("shake-input");
    DOM.guessInput.value = "";
  }, { once: true });

  if (state.attemptsLeft === 2) {
    showFeedback("❌ Wrong! You still have 2 attempts left.", "error");
    showToast("Not quite! Try again.", "error");
  } else if (state.attemptsLeft === 1) {
    showHint();
    showFeedback("💡 Hint unlocked! One attempt remaining!", "info");
    showToast("Hint revealed! Last chance!", "info");
  } else {
    // Out of balls
    state.streak = 0;
    persistState();
    handleGameOver();
  }
};

const handleGameOver = async () => {
  const pokemon = state.currentPokemon;

  showFeedback(`😔 It was ${capitalize(pokemon.name)}! Better luck tomorrow!`, "error");
  showToast("Out of Pokéballs! See you tomorrow!", "error", 4000);
  sfx.wrong();

  // Reveal the answer
  await revealPokemon();

  // Disable input
  DOM.guessInput.disabled = true;
  DOM.btnGuess.disabled   = true;

  // Show cooldown after short delay
  setTimeout(() => {
    updateCooldownScreen();
    showScreen(DOM.screenCooldown);
    startCooldownTimer();
  }, 3000);
};

const processGuess = () => {
  if (state.isLoading || state.isRevealed || !state.currentPokemon) return;

  const raw     = DOM.guessInput.value;
  const guess   = normalizeGuess(raw);
  const answer  = normalizeGuess(state.currentPokemon.name);

  if (!guess) {
    DOM.guessInput.classList.add("shake-input");
    DOM.guessInput.addEventListener("animationend", () => {
      DOM.guessInput.classList.remove("shake-input");
    }, { once: true });
    showToast("Type a Pokémon name first!", "info");
    return;
  }

  sfx.click();

  if (guess === answer) {
    handleCorrectGuess();
  } else {
    handleWrongGuess();
  }
};


// ============================================
// COOLDOWN / TIMER SYSTEM
// ============================================

const getCooldownMs = () => {
  const saved = loadLS();
  if (!saved.depletedAt) return 0;
  const elapsed = Date.now() - saved.depletedAt;
  const remaining = COOLDOWN_HOURS * 60 * 60 * 1000 - elapsed;
  return Math.max(0, remaining);
};

const updateCooldownScreen = () => {
  DOM.cooldownScore.textContent  = state.score;
  DOM.cooldownStreak.textContent = state.streak;
};

const startCooldownTimer = () => {
  if (state.cooldownInterval) clearInterval(state.cooldownInterval);

  const tick = () => {
    const ms = getCooldownMs();
    if (ms <= 0) {
      clearInterval(state.cooldownInterval);
      // Reset and go back to start
      state.attemptsLeft = MAX_BALLS;
      saveLS({ score: state.score, streak: state.streak, attemptsLeft: MAX_BALLS });
      renderPokeballs();
      showScreen(DOM.screenStart);
      showToast("🎉 Pokéballs refilled! Ready to play!", "success");
      return;
    }
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    DOM.timerH.textContent = pad(h);
    DOM.timerM.textContent = pad(m);
    DOM.timerS.textContent = pad(s);
  };

  tick();
  state.cooldownInterval = setInterval(tick, 1000);
};


const toggleTheme = () => {
  state.themeIsDark = !state.themeIsDark;
  document.body.classList.toggle("light", !state.themeIsDark);
  DOM.themeToggle.textContent = state.themeIsDark ? "🌙" : "☀️";
  sfx.click();

  try { localStorage.setItem("pkTheme", state.themeIsDark ? "dark" : "light"); } catch {}
};

// ============================================
// DEV MODE TOGGLE
// ============================================

const toggleDevMode = () => {
  state.devMode = !state.devMode;
  DOM.devToggle.classList.toggle("active", state.devMode);
  sfx.click();

  if (state.devMode) {
    // Restore full balls so tester can keep playing immediately
    state.attemptsLeft = MAX_BALLS;
    persistState();
    renderPokeballs();

    // If stuck on cooldown screen, bounce back to start
    if (DOM.screenCooldown.classList.contains("active")) {
      if (state.cooldownInterval) clearInterval(state.cooldownInterval);
      showScreen(DOM.screenStart);
    }

    showToast("🛠️ Dev Mode ON — Infinite Pokéballs!", "info", 2500);
  } else {
    showToast("🛠️ Dev Mode OFF — Normal rules restored.", "info", 2500);
  }
};

const loadTheme = () => {
  try {
    const saved = localStorage.getItem("pkTheme");
    if (saved === "light") {
      state.themeIsDark = false;
      document.body.classList.add("light");
      DOM.themeToggle.textContent = "☀️";
    }
  } catch {}
};


// ============================================
// GAME INITIALIZATION
// ============================================

const startGame = async () => {
  sfx.click();
  showScreen(DOM.screenGame);
  renderPokeballs();
  updateHeaderStats();
  await loadNewPokemon();
};

const init = () => {
  loadTheme();
  loadPersistedState();
  updateHeaderStats();

  // Check if already in cooldown
  if (state.attemptsLeft <= 0) {
    updateCooldownScreen();
    showScreen(DOM.screenCooldown);
    startCooldownTimer();
  } else {
    showScreen(DOM.screenStart);
  }
};


// ============================================
// EVENT LISTENERS
// ============================================

// Start button
DOM.btnStart.addEventListener("click", startGame);

// Guess button
DOM.btnGuess.addEventListener("click", () => {
  sfx.click();
  processGuess();
});

// Enter key in input
DOM.guessInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") processGuess();
});

// Clear input animation class on input
DOM.guessInput.addEventListener("input", () => {
  DOM.guessInput.classList.remove("correct", "shake-input");
});

// Next Pokémon button
DOM.btnNext.addEventListener("click", async () => {
  sfx.click();
  if (state.attemptsLeft <= 0) {
    updateCooldownScreen();
    showScreen(DOM.screenCooldown);
    startCooldownTimer();
    return;
  }
  renderPokeballs();
  await loadNewPokemon();
  DOM.infoCard.classList.add("hidden");
  hideFeedback();
  DOM.guessInput.value = "";
  DOM.guessInput.className = "guess-input";
  DOM.guessInput.removeAttribute("disabled");
  DOM.btnGuess.removeAttribute("disabled");
  DOM.btnSkip.removeAttribute("disabled");
});

// Skip button
DOM.btnSkip.addEventListener("click", () => {
  sfx.click();
  if (state.isLoading || !state.currentPokemon) return;

  if (!state.devMode) {
    state.attemptsLeft -= 1;
    persistState();
    renderPokeballs();
  }

  showToast(`Skipped! It was ${capitalize(state.currentPokemon.name)}.`, "info");
  revealPokemon();

  if (!state.devMode && state.attemptsLeft <= 0) {
    state.streak = 0;
    persistState();
    setTimeout(() => {
      updateCooldownScreen();
      showScreen(DOM.screenCooldown);
      startCooldownTimer();
    }, 2500);
  }
});

// Theme toggle
DOM.themeToggle.addEventListener("click", toggleTheme);

// Dev mode toggle
DOM.devToggle.addEventListener("click", toggleDevMode);

// Win overlay: click to dismiss early
DOM.winOverlay.addEventListener("click", () => {
  DOM.winOverlay.classList.add("hidden");
});

// ============================================
// BOOT
// ============================================

init();