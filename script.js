// ---------- 1. Data: which keyboard key = which note ----------
const notes = {
  a: { name: "Do",  freq: 262 },
  s: { name: "Re",  freq: 294 },
  d: { name: "Mi",  freq: 330 },
  f: { name: "Fa",  freq: 349 },
  g: { name: "Sol", freq: 392 },
  h: { name: "La",  freq: 440 },
  j: { name: "Ti",  freq: 494 },
  k: { name: "Do",  freq: 523 }
};

// Songs are just strings of piano letters. A space means "rest".
const songs = {
  "Twinkle Twinkle":   "aagghhg ffddssa ggffdds ggffdds aaggffhhg ffddssa".replace(/\s+/g, " "),
  "Mary Had a Lamb":   "dsasddd sss dgg dsasddd ddsssd sa",
  "Ode to Joy":        "ddfggfdsaasdds ddfggfdsaasdsa"
};

// ---------- 2. Sound ----------
const ctx = new AudioContext();
function playNote(freq) {
  const osc = ctx.createOscillator();
  osc.frequency.value = freq;
  osc.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}

// ---------- 3. Press / release (used by keyboard, mouse AND song mode) ----------
const lastNote = document.querySelector("#lastNote");

function press(key) {
  const keyEl = document.querySelector('[data-key="' + key + '"]');
  keyEl.classList.add("active");
  playNote(notes[key].freq);
  lastNote.textContent = notes[key].name;
}
function release(key) {
  document.querySelector('[data-key="' + key + '"]').classList.remove("active");
}

// ---------- 4. Keyboard listeners ----------
document.addEventListener("keydown", function (e) {
  const key = e.key.toLowerCase();          // Caps Lock safe
  if (!notes[key]) return;                  // ignore unmapped keys
  if (e.repeat) return;                     // ignore holding the key
  ctx.resume();                             // browsers block sound until a user action
  press(key);
  checkLearn(key);
});

document.addEventListener("keyup", function (e) {
  const key = e.key.toLowerCase();
  if (!notes[key]) return;
  release(key);
});

// ---------- 5. Bonus: click to play ----------
document.querySelectorAll(".key").forEach(function (keyEl) {
  const key = keyEl.dataset.key;
  keyEl.addEventListener("mousedown", function () { ctx.resume(); press(key); checkLearn(key); });
  keyEl.addEventListener("mouseup", function () { release(key); });
  keyEl.addEventListener("mouseleave", function () { release(key); });
});

// ---------- 6. Bonus: song mode ----------
const songSelect = document.querySelector("#songSelect");
const status = document.querySelector("#status");
let timers = [];          // so Stop can cancel auto-play
let learnSong = null;     // the song we are learning (or null)
let learnIndex = 0;

for (const title in songs) {
  const option = document.createElement("option");
  option.textContent = title;
  songSelect.appendChild(option);
}

function stopSong() {
  timers.forEach(clearTimeout);
  timers = [];
  learnSong = null;
  document.querySelectorAll(".key").forEach(function (k) { k.classList.remove("next", "active"); });
  status.textContent = "Stopped. Pick a song, then choose a mode.";
}

// Mode A: the page plays the song for you
document.querySelector("#autoBtn").addEventListener("click", function () {
  ctx.resume();
  stopSong();
  const song = songs[songSelect.value];
  status.textContent = "Playing: " + songSelect.value;
  for (let i = 0; i < song.length; i++) {
    const letter = song[i];
    if (letter === " ") continue;                       // rest
    timers.push(setTimeout(function () { press(letter); }, i * 400));
    timers.push(setTimeout(function () { release(letter); }, i * 400 + 250));
  }
  timers.push(setTimeout(function () { status.textContent = "Song finished."; }, song.length * 400));
});

// Mode B: you play, the page shows the next key in green
document.querySelector("#learnBtn").addEventListener("click", function () {
  ctx.resume();
  stopSong();
  learnSong = songs[songSelect.value].replace(/ /g, "");   // remove rests
  learnIndex = 0;
  status.textContent = "Press the green key!";
  showNext();
});

function showNext() {
  document.querySelectorAll(".key").forEach(function (k) { k.classList.remove("next"); });
  document.querySelector('[data-key="' + learnSong[learnIndex] + '"]').classList.add("next");
}

function checkLearn(key) {
  if (!learnSong) return;                                  // not in learn mode
  if (key !== learnSong[learnIndex]) return;               // wrong key: wait
  learnIndex++;
  if (learnIndex === learnSong.length) {
    learnSong = null;
    document.querySelectorAll(".key").forEach(function (k) { k.classList.remove("next"); });
    status.textContent = "Well done! You finished the song.";
  } else {
    showNext();
  }
}

document.querySelector("#stopBtn").addEventListener("click", stopSong);