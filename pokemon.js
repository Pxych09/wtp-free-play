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
  screenStart:    $("screenStart"),
  screenGame:     $("screenGame"),
  screenCooldown: $("screenCooldown"),

  streakCount:    $("streakCount"),
  scoreCount:     $("scoreCount"),
  streakBadge:    $("streakBadge"),
  scoreBadge:     $("scoreBadge"),
  themeToggle:    $("themeToggle"),
  devToggle:      $("devToggle"),

  pokemonStage:   $("pokemonStage"),
  stageGlow:      $("stageGlow"),
  pokemonImg:     $("pokemonImg"),
  questionMark:   $("questionMark"),
  loadingSpinner: $("loadingSpinner"),

  pokeballs:      $("pokeballs"),

  hintBox:        $("hintBox"),
  hintText:       $("hintText"),
  choicesGrid:    $("choicesGrid"),
  feedback:       $("feedback"),
  btnSkip:        $("btnSkip"),
  genBadge:       $("genBadge"),

  infoCard:       $("infoCard"),
  infoName:       $("infoName"),
  infoTypes:      $("infoTypes"),
  infoRarity:     $("infoRarity"),
  infoDesc:       $("infoDesc"),
  infoStats:      $("infoStats"),
  infoAbilities:  $("infoAbilities"),
  btnNext:        $("btnNext"),

  btnStart:       $("btnStart"),

  timerH:         $("timerH"),
  timerM:         $("timerM"),
  timerS:         $("timerS"),
  cooldownScore:  $("cooldownScore"),
  cooldownStreak: $("cooldownStreak"),

  toastContainer: $("toastContainer"),
  winOverlay:     $("winOverlay"),
  winEmoji:       $("winEmoji"),
  winTitle:       $("winTitle"),
  winSub:         $("winSub"),
  confettiContainer: $("confettiContainer"),
};


// ============================================
// STATE
// ============================================

const MAX_BALLS   = 3;
const COOLDOWN_HOURS = 24;
const TOTAL_POKEMON  = 898;
const SHOWN_KEY = "pokemonWorldShownToday";

const state = {
  currentPokemon:   null,
  choiceNames:      [],   // The 4 names shown as choices
  attemptsLeft:     MAX_BALLS,
  score:            0,
  streak:           0,
  isRevealed:       false,
  isLoading:        false,
  hintShown:        false,
  cooldownInterval: null,
  themeIsDark:      true,
  devMode:          false,
};


// ============================================
// RARITY SYSTEM
// ============================================

const RARITY_MAP = {
  legendary: [
    144,145,146,150,151,
    243,244,245,249,250,
    377,378,379,380,381,382,383,384,385,386,
    480,481,482,483,484,485,486,487,488,489,490,491,492,493,
    638,639,640,641,642,643,644,645,646,647,648,649,
    716,717,718,719,720,721,
    785,786,787,788,789,790,791,792,793,794,795,796,797,798,799,800,801,802,807,808,809,
  ],
  mythical: [151,251,385,386,489,490,491,492,493,494,647,648,649,719,720,721,801,802],
  epic: [
    6,9,3,65,68,94,131,143,149,196,197,212,214,248,254,257,260,
    306,350,373,376,448,445,452,460,472,473,475,479,503,530,545,549,553,
    612,635,637,644,646,663,701,706,725,745,760,778,784,
  ],
  rare: [
    25,26,35,36,39,40,54,55,58,59,63,66,67,74,75,76,79,80,
    81,82,95,104,105,106,107,111,112,113,114,115,122,123,124,
    125,126,127,128,130,133,134,135,136,137,138,139,140,141,142,
    147,148,152,153,154,155,156,157,158,159,160,161,162,
  ],
};

const getRarity = (id) => {
  if (RARITY_MAP.mythical.includes(id))  return { label: "✨ Mythical",  cls: "rarity--mythical"  };
  if (RARITY_MAP.legendary.includes(id)) return { label: "⭐ Legendary", cls: "rarity--legendary" };
  if (RARITY_MAP.epic.includes(id))      return { label: "💎 Epic",      cls: "rarity--epic"      };
  if (RARITY_MAP.rare.includes(id))      return { label: "🔵 Rare",      cls: "rarity--rare"      };
  if (id <= 151)                         return { label: "🟢 Uncommon",  cls: "rarity--uncommon"  };
  return { label: "⚪ Common", cls: "rarity--common" };
};


// ============================================
// GENERATION SYSTEM
// ============================================

const GENERATIONS = [
  { gen: 1, label: "Generation I",    sub: "Kanto",  range: [1,   151] },
  { gen: 2, label: "Generation II",   sub: "Johto",  range: [152, 251] },
  { gen: 3, label: "Generation III",  sub: "Hoenn",  range: [252, 386] },
  { gen: 4, label: "Generation IV",   sub: "Sinnoh", range: [387, 493] },
  { gen: 5, label: "Generation V",    sub: "Unova",  range: [494, 649] },
  { gen: 6, label: "Generation VI",   sub: "Kalos",  range: [650, 721] },
  { gen: 7, label: "Generation VII",  sub: "Alola",  range: [722, 809] },
  { gen: 8, label: "Generation VIII", sub: "Galar",  range: [810, 898] },
];

const getGeneration = (id) =>
  GENERATIONS.find(({ range }) => id >= range[0] && id <= range[1]) || GENERATIONS[0];


// ============================================
// NAME FORMATTING
// ============================================

/**
 * Cleans a raw PokeAPI slug into a display name.
 *
 * Rules applied:
 *  1. Strip form suffixes (e.g. "-male", "-female", "-alola", "-galar", etc.)
 *     EXCEPT meaningful ones that ARE part of the actual name
 *     (e.g. "mr-mime", "mime-jr", "type-null", "ho-oh", "porygon-z").
 *  2. Replace remaining hyphens with spaces.
 *  3. Capitalise each word.
 *
 * We handle the "keep" list explicitly because PokeAPI slugs for
 * hyphenated names are identical to form slugs in structure.
 */

// Names whose hyphens are part of the real Pokémon name
const HYPHEN_NAMES = new Set([
  "mr-mime", "mime-jr", "type-null", "ho-oh", "porygon-z",
  "jangmo-o", "hakamo-o", "kommo-o", "tapu-koko", "tapu-lele",
  "tapu-bulu", "tapu-fini", "mr-rime", "chi-yu", "ting-lu",
  "chien-pao", "wo-chien",
]);

// Suffixes to strip (form indicators from PokeAPI)
const FORM_SUFFIXES = [
  "-male", "-female", "-alola", "-alolan", "-galar", "-galarian",
  "-hisui", "-hisuian", "-mega", "-mega-x", "-mega-y",
  "-primal", "-origin", "-sky", "-land", "-therian", "-incarnate",
  "-ordinary", "-resolute", "-aria", "-pirouette", "-blade",
  "-shield", "-sunshine", "-rainy", "-snowy", "-heat", "-wash",
  "-frost", "-fan", "-mow", "-attack", "-defense", "-speed",
  "-plant", "-sandy", "-trash", "-overcast", "-sunshine",
  "-east", "-west", "-dusk", "-midnight", "-midday",
  "-school", "-solo", "-totem", "-gmax", "-eternamax",
  "-starter", "-zen", "-darmanitan", "-standard",
  "-low-key", "-amped", "-noice", "-hangry", "-full-belly",
  "-white-striped", "-family-of-three", "-gulping", "-gorging",
  "-hero", "-crowned", "-original", "-black", "-white",
  "-red-striped", "-blue-striped",
];

const formatPokemonName = (raw) => {
  let name = raw.toLowerCase();

  // If it's a known hyphenated proper name, keep as-is (just capitalise)
  if (HYPHEN_NAMES.has(name)) {
    return name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("-");
  }

  // Strip known form suffixes (longest-first to avoid partial matches)
  const sorted = [...FORM_SUFFIXES].sort((a, b) => b.length - a.length);
  for (const suffix of sorted) {
    if (name.endsWith(suffix)) {
      name = name.slice(0, -suffix.length);
      break;
    }
  }

  // Replace remaining hyphens with spaces, capitalise each word
  return name
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const pad = (n) => String(n).padStart(2, "0");

const createEl = (tag, className = "", text = "") => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text)      el.textContent = text;
  return el;
};


// ============================================
// LOCAL STORAGE
// ============================================

const LS_KEY = "pokemonWorldState";

const loadLS = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
  catch { return {}; }
};

const saveLS = (data) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); }
  catch {}
};

const loadShownToday = () => {
  const saved = loadLS();
  const today = new Date().toDateString();
  
  if (saved.shownDate !== today) {
    saveLS({ ...saved, shownToday: [], shownDate: today });
    return new Set();
  }
  return new Set(saved.shownToday || []);
};

const saveShownToday = (shownSet) => {
  const data = loadLS();
  saveLS({
    ...data,
    shownToday: Array.from(shownSet),
    shownDate: new Date().toDateString()
  });
};

const loadPersistedState = () => {
  const saved = loadLS();
  const now   = Date.now();

  if (saved.depletedAt) {
    const elapsed = now - saved.depletedAt;
    if (elapsed / (1000 * 60 * 60) >= COOLDOWN_HOURS) {
      saveLS({ score: saved.score || 0, streak: saved.streak || 0, attemptsLeft: MAX_BALLS });
      return;
    }
  }

  state.score  = saved.score  || 0;
  state.streak = saved.streak || 0;
  if (saved.attemptsLeft !== undefined) state.attemptsLeft = saved.attemptsLeft;
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
  [DOM.screenStart, DOM.screenGame, DOM.screenCooldown]
    .forEach(s => s.classList.remove("active"));
  screenEl.classList.add("active");
};


// ============================================
// POKÉBALL UI
// ============================================

const POKEBALL_IMG = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="pokeball" />`;

const renderPokeballs = () => {
  DOM.pokeballs.querySelectorAll(".pokeball").forEach((ball, i) => {
    const active = (i + 1) <= state.attemptsLeft;
    ball.classList.toggle("pokeball--active", active);
    ball.classList.toggle("pokeball--lost",   !active);
    ball.innerHTML = POKEBALL_IMG;
  });
};

const animateBallLoss = (ballIndex) => {
  const ball = DOM.pokeballs.querySelectorAll(".pokeball")[ballIndex];
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

const showToast = (msg, type = "info", duration = 3000) => {
  const toast = createEl("div", `toast toast--${type}`);
  toast.innerHTML = `<span class="toast__icon">${TOAST_ICONS[type]}</span><span>${msg}</span>`;
  DOM.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("removing");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, duration);
};


// ============================================
// FEEDBACK
// ============================================

const showFeedback = (msg, type = "info") => {
  DOM.feedback.textContent = msg;
  DOM.feedback.className   = `feedback ${type}`;
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
// API
// ============================================

const BASE_URL  = "https://pokeapi.co/api/v2";
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

  const flavorEntry = species.flavor_text_entries
    .filter(e => e.language.name === "en").pop();

  const description = flavorEntry
    ? flavorEntry.flavor_text.replace(/\f|\n/g, " ")
    : "No description available.";

  return {
    id,
    name:        pokemon.name,                 // raw slug, e.g. "mr-mime"
    displayName: formatPokemonName(pokemon.name), // clean display name
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
    description,
    rarity:     getRarity(pokemon.id),
    generation: getGeneration(pokemon.id),
  };
};

const fetchRandomPokemon = async () => fetchPokemon(randomInt(1, TOTAL_POKEMON));

/**
 * Fetch 3 random Pokémon names to use as wrong choices.
 * Returns their displayNames only.
 */
const fetchWrongChoiceNames = async (correctId) => {
  const ids = new Set();
  while (ids.size < 3) {
    const id = randomInt(1, TOTAL_POKEMON);
    if (id !== correctId) ids.add(id);
  }

  const results = await Promise.allSettled(
    [...ids].map(id => fetchJSON(`${BASE_URL}/pokemon/${id}`))
  );

  return results
    .filter(r => r.status === "fulfilled")
    .map(r => formatPokemonName(r.value.name));
};


// ============================================
// MULTIPLE CHOICE UI
// ============================================

const LETTERS = ["A", "B", "C", "D"];

/**
 * Shuffle an array in-place (Fisher-Yates).
 */
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const renderChoices = (correctName, wrongNames) => {
  const all = shuffle([correctName, ...wrongNames]);
  state.choiceNames = all;

  DOM.choicesGrid.innerHTML = "";
  all.forEach((name, i) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.dataset.name = name;
    btn.innerHTML = `
      <span class="choice-btn__letter">${LETTERS[i]}</span>
      <span class="choice-btn__label">${name}</span>
    `;
    btn.addEventListener("click", () => handleChoicePick(btn, name, correctName));
    DOM.choicesGrid.appendChild(btn);
  });
};

const lockChoices = () => {
  DOM.choicesGrid.querySelectorAll(".choice-btn").forEach(b => {
    b.disabled = true;
  });
};

const handleChoicePick = (btn, picked, correct) => {
  if (state.isRevealed || state.isLoading) return;

  // Lock all choices immediately
  lockChoices();
  sfx.click();

  if (picked === correct) {
    btn.classList.add("correct");
    handleCorrectGuess();
  } else {
    btn.classList.add("wrong");
    // Reveal which one was correct
    DOM.choicesGrid.querySelectorAll(".choice-btn").forEach(b => {
      if (b.dataset.name === correct) b.classList.add("correct");
      else if (b !== btn)             b.classList.add("dimmed");
    });
    handleWrongGuess();
  }
};


// ============================================
// SOUND
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
  correct: () => playTone([[523,0],[659,0.12],[784,0.24],[1047,0.36]], 0.2, "triangle", 0.2),
  wrong:   () => playTone([[220,0],[196,0.15]], 0.25, "sawtooth", 0.12),
  reveal:  () => playTone([[262,0],[330,0.08],[392,0.16],[523,0.24],[659,0.32],[784,0.4]], 0.18, "triangle", 0.18),
  click:   () => playTone([[880,0]], 0.06, "square", 0.08),
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
    `Its name starts with the letter "${pokemon.displayName[0].toUpperCase()}".`,
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
// CONFETTI
// ============================================

const CONFETTI_COLORS = ["#ffcb05","#2a75bb","#3ddc84","#ff4d4d","#c87dff","#ff8060"];

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
    `That's ${pokemon.displayName}! Amazing!`,
    `You got it! ${pokemon.displayName} is revealed!`,
    `Correct! ${pokemon.displayName} appeared!`,
  ];
  DOM.winEmoji.textContent = isStreak && state.streak > 2 ? "🔥" : "🎉";
  DOM.winTitle.textContent = "Correct!";
  DOM.winSub.textContent   = msgs[randomInt(0, msgs.length - 1)];
  DOM.winOverlay.classList.remove("hidden");
  launchConfetti(DOM.confettiContainer);
  sfx.reveal();
  setTimeout(() => DOM.winOverlay.classList.add("hidden"), 2200);
};


// ============================================
// INFO CARD
// ============================================

const renderTypeBadges = (types) => {
  DOM.infoTypes.innerHTML = types
    .map(t => `<span class="type-badge type--${t}">${capitalize(t)}</span>`)
    .join("");
};

const renderStats = (stats) => {
  const LABELS = { hp: "HP", attack: "ATK", defense: "DEF", speed: "SPD" };
  DOM.infoStats.innerHTML = Object.entries(stats)
    .map(([k, v]) => `<div class="stat-item"><div class="stat-item__name">${LABELS[k]}</div><div class="stat-item__val">${v}</div></div>`)
    .join("");
};

const renderAbilities = (abilities) => {
  DOM.infoAbilities.innerHTML = abilities
    .map(a => `<span class="ability-badge">${capitalize(a)}</span>`)
    .join("");
};

const renderInfoCard = (pokemon) => {
  DOM.infoName.textContent = pokemon.displayName;
  renderTypeBadges(pokemon.types);
  const rarity = pokemon.rarity;
  DOM.infoRarity.className   = `info-card__rarity ${rarity.cls}`;
  DOM.infoRarity.textContent = rarity.label;
  DOM.infoDesc.textContent   = pokemon.description;
  renderStats(pokemon.stats);
  renderAbilities(pokemon.abilities);
  DOM.infoCard.classList.remove("hidden");
};


// ============================================
// HEADER STATS
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
  state.isRevealed  = false;
  state.hintShown   = false;
  state.currentPokemon = null;

  hideFeedback();
  DOM.hintBox.classList.add("hidden");
  DOM.infoCard.classList.add("hidden");
  DOM.choicesGrid.innerHTML = "";
  DOM.pokemonImg.classList.remove("revealed");
  DOM.pokemonImg.classList.add("hidden");
  DOM.questionMark.classList.remove("hidden");
  DOM.pokemonStage.classList.remove("glowing", "correct-glow", "shake");
  DOM.btnSkip.removeAttribute("disabled");
  DOM.genBadge.classList.add("hidden");

  setLoading(true);

  let pokemon;
  const shownSet = loadShownToday();

  try {
    // Try up to 20 times to get an unseen Pokémon
    for (let attempt = 0; attempt < 20; attempt++) {
      pokemon = await fetchPokemon(randomInt(1, TOTAL_POKEMON));
      
      if (!shownSet.has(pokemon.id)) {
        shownSet.add(pokemon.id);
        saveShownToday(shownSet);
        break;
      }
    }

    // Fallback: if somehow all are shown (very unlikely with 898)
    if (shownSet.has(pokemon.id)) {
      shownSet.clear(); // reset for the day
      saveShownToday(shownSet);
    }

    state.currentPokemon = pokemon;

    // Show generation badge
    const { label, sub } = pokemon.generation;
    DOM.genBadge.textContent = `${label} · ${sub}`;
    DOM.genBadge.className   = `gen-badge gen--${pokemon.generation.gen}`;

    const wrongNames = await fetchWrongChoiceNames(pokemon.id);

    DOM.pokemonImg.src = pokemon.image;
    DOM.pokemonImg.onload = () => {
      setLoading(false);
      DOM.pokemonImg.classList.remove("hidden");
      DOM.pokemonStage.classList.add("glowing");
      renderChoices(pokemon.displayName, wrongNames);
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

  DOM.pokemonImg.classList.add("revealed");
  DOM.questionMark.classList.add("hidden");
  DOM.pokemonStage.classList.remove("glowing");
  DOM.pokemonStage.classList.add("correct-glow");

  lockChoices();
  DOM.btnSkip.disabled = true;

  playCry(state.currentPokemon.id);
  renderInfoCard(state.currentPokemon);
};

const handleCorrectGuess = async () => {
  DOM.btnSkip.disabled = true;
  sfx.correct();
  showFeedback(`🎉 Correct! It's ${state.currentPokemon.displayName}!`, "success");

  state.score  += 10 + (state.attemptsLeft * 5);
  state.streak += 1;
  persistState();
  updateHeaderStats(true);

  const wasStreak = state.streak > 1;
  await revealPokemon();
  showWinOverlay(state.currentPokemon, wasStreak);

  if (wasStreak) showToast(`🔥 ${state.streak}x Streak! +Bonus points!`, "success", 2500);
};

const handleWrongGuess = () => {
  const ballIndex = state.attemptsLeft - 1;

  if (state.devMode) {
    sfx.wrong();
    DOM.pokemonStage.classList.add("shake");
    DOM.pokemonStage.addEventListener("animationend", () => {
      DOM.pokemonStage.classList.remove("shake");
    }, { once: true });
    showFeedback("❌ Wrong! (Dev Mode: no ball lost)", "error");
    // Re-enable choices for next try
    setTimeout(() => {
      DOM.choicesGrid.querySelectorAll(".choice-btn").forEach(b => {
        b.classList.remove("wrong", "correct", "dimmed");
        b.disabled = false;
      });
    }, 1000);
    return;
  }

  state.attemptsLeft -= 1;
  persistState();

  sfx.wrong();
  DOM.pokemonStage.classList.add("shake");
  DOM.pokemonStage.addEventListener("animationend", () => {
    DOM.pokemonStage.classList.remove("shake");
  }, { once: true });
  animateBallLoss(ballIndex);

  if (state.attemptsLeft === 2) {
    showFeedback("❌ Wrong! You still have 2 attempts left.", "error");
    showToast("Not quite! Try again.", "error");
    // Re-enable remaining choices (wrong one stays marked)
    setTimeout(() => {
      DOM.choicesGrid.querySelectorAll(".choice-btn:not(.wrong):not(.correct)").forEach(b => {
        b.classList.remove("dimmed");
        b.disabled = false;
      });
    }, 800);
  } else if (state.attemptsLeft === 1) {
    showHint();
    showFeedback("💡 Hint unlocked! One attempt remaining!", "info");
    showToast("Hint revealed! Last chance!", "info");
    setTimeout(() => {
      DOM.choicesGrid.querySelectorAll(".choice-btn:not(.wrong):not(.correct)").forEach(b => {
        b.classList.remove("dimmed");
        b.disabled = false;
      });
    }, 800);
  } else {
    // Out of balls
    state.streak = 0;
    persistState();
    handleGameOver();
  }
};

const handleGameOver = async () => {
  showFeedback(`😔 It was ${state.currentPokemon.displayName}! Better luck tomorrow!`, "error");
  showToast("Out of Pokéballs! See you tomorrow!", "error", 4000);
  sfx.wrong();

  await revealPokemon();

  setTimeout(() => {
    updateCooldownScreen();
    showScreen(DOM.screenCooldown);
    startCooldownTimer();
  }, 3000);
};


// ============================================
// COOLDOWN / TIMER
// ============================================

const getCooldownMs = () => {
  const saved = loadLS();
  if (!saved.depletedAt) return 0;
  return Math.max(0, COOLDOWN_HOURS * 3600 * 1000 - (Date.now() - saved.depletedAt));
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
      // Clear shown Pokémon when day resets
      const data = loadLS();
      saveLS({ ...data, shownToday: [], shownDate: new Date().toDateString() });
      clearInterval(state.cooldownInterval);
      state.attemptsLeft = MAX_BALLS;
      saveLS({ score: state.score, streak: state.streak, attemptsLeft: MAX_BALLS });
      renderPokeballs();
      showScreen(DOM.screenStart);
      showToast("🎉 Pokéballs refilled! Ready to play!", "success");
      return;
    }
    const s = Math.floor(ms / 1000);
    DOM.timerH.textContent = pad(Math.floor(s / 3600));
    DOM.timerM.textContent = pad(Math.floor((s % 3600) / 60));
    DOM.timerS.textContent = pad(s % 60);
  };

  tick();
  state.cooldownInterval = setInterval(tick, 1000);
};


// ============================================
// THEME & DEV MODE
// ============================================

const toggleTheme = () => {
  state.themeIsDark = !state.themeIsDark;
  document.body.classList.toggle("light", !state.themeIsDark);
  DOM.themeToggle.textContent = state.themeIsDark ? "🌙" : "☀️";
  sfx.click();
  try { localStorage.setItem("pkTheme", state.themeIsDark ? "dark" : "light"); } catch {}
};

const toggleDevMode = () => {
  state.devMode = !state.devMode;
  DOM.devToggle.classList.toggle("active", state.devMode);
  sfx.click();

  if (state.devMode) {
    state.attemptsLeft = MAX_BALLS;
    persistState();
    renderPokeballs();
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
    if (localStorage.getItem("pkTheme") === "light") {
      state.themeIsDark = false;
      document.body.classList.add("light");
      DOM.themeToggle.textContent = "☀️";
    }
  } catch {}
};


// ============================================
// INIT & EVENT LISTENERS
// ============================================

DOM.btnStart.addEventListener("click", async () => {
  sfx.click();
  showScreen(DOM.screenGame);
  renderPokeballs();
  updateHeaderStats();
  await loadNewPokemon();
});

DOM.btnNext.addEventListener("click", async () => {
  sfx.click();
  if (state.attemptsLeft <= 0) {
    updateCooldownScreen();
    showScreen(DOM.screenCooldown);
    startCooldownTimer();
    return;
  }
  renderPokeballs();
  DOM.infoCard.classList.add("hidden");
  hideFeedback();
  await loadNewPokemon();
});

DOM.btnSkip.addEventListener("click", () => {
  sfx.click();
  if (state.isLoading || !state.currentPokemon) return;

  if (!state.devMode) {
    state.attemptsLeft -= 1;
    persistState();
    renderPokeballs();
  }

  showToast(`Skipped! It was ${state.currentPokemon.displayName}.`, "info");
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

DOM.themeToggle.addEventListener("click", toggleTheme);
DOM.devToggle.addEventListener("click", toggleDevMode);
DOM.winOverlay.addEventListener("click", () => DOM.winOverlay.classList.add("hidden"));

// Boot
loadTheme();
loadPersistedState();
updateHeaderStats();

if (state.attemptsLeft <= 0) {
  updateCooldownScreen();
  showScreen(DOM.screenCooldown);
  startCooldownTimer();
} else {
  showScreen(DOM.screenStart);
}
