/*
 * CONFIGURAÇÃO DO JOGO
 * Escolha de 2 a 12 elementos em CODE_LENGTH.
 * A senha usará, na ordem, essa quantidade de cores de SECRET_COLORS.
 */
const CODE_LENGTH = 6;
const SECRET_COLORS = ['branco', 'preto', 'rosa', 'marrom', 'verde', 'amarelo'];

/* Defina aqui o número exibido sobre cada cor ao revelar a resposta. */
const COLOR_NUMBERS = {
  verde: 7,
  marinho: 0,
  amarelo: 4,
  preto: 6,
  branco: 1,
  marrom: 3,
  vermelho: 0,
  azul: 0,
  rosa: 5,
  roxo: 0,
  turquesa: 0,
  laranja: 0
};

const COLORS = [
  { id: 'verde',    name: 'Verde',    value: '#20a65a' },
  { id: 'marinho',  name: 'Marinho',  value: '#123b75' },
  { id: 'amarelo',  name: 'Amarelo',  value: '#e3ad24' },
  { id: 'preto',    name: 'Preto',    value: '#111216' },
  { id: 'branco',   name: 'Branco',   value: '#f2f2ed' },
  { id: 'marrom',   name: 'Marrom',   value: '#754428' },
  { id: 'vermelho', name: 'Vermelho', value: '#d3313a' },
  { id: 'azul',     name: 'Azul',     value: '#2374d8' },
  { id: 'rosa',     name: 'Rosa',     value: '#ef6fa8' },
  { id: 'roxo',     name: 'Roxo',     value: '#834bb5' },
  { id: 'turquesa', name: 'Turquesa', value: '#21bfc3' },
  { id: 'laranja',  name: 'Laranja',  value: '#ed7425' }
];

if (!Number.isInteger(CODE_LENGTH) || CODE_LENGTH < 2 || CODE_LENGTH > COLORS.length) {
  throw new Error(`CODE_LENGTH deve ser um número inteiro entre 2 e ${COLORS.length}.`);
}

if (SECRET_COLORS.length < CODE_LENGTH || new Set(SECRET_COLORS).size !== SECRET_COLORS.length || SECRET_COLORS.some(id => !COLORS.some(c => c.id === id))) {
  throw new Error('SECRET_COLORS deve conter cores válidas, diferentes e suficientes para o tamanho escolhido.');
}

if (COLORS.some(color => COLOR_NUMBERS[color.id] === undefined)) {
  throw new Error('Defina um número em COLOR_NUMBERS para cada cor disponível.');
}

const SECRET = SECRET_COLORS.slice(0, CODE_LENGTH);

const palette = document.getElementById('palette');
const board = document.getElementById('board');
const modal = document.getElementById('victoryModal');
const solution = document.getElementById('solution');
const restartButton = document.getElementById('restart');
const gameSubtitle = document.getElementById('gameSubtitle');
const colorMap = Object.fromEntries(COLORS.map(color => [color.id, color]));

gameSubtitle.textContent = `Descubra ${CODE_LENGTH} cores na ordem correta`;

let attemptNumber = 0;
let activeAttempt = null;
let finished = false;

function paintCircle(element, colorId) {
  const color = colorMap[colorId];
  element.style.background = color ? color.value : 'var(--slot)';
  element.dataset.color = colorId || '';
  element.setAttribute('aria-label', color ? color.name : 'Posição vazia');
}

function getContrastColor(hexColor) {
  const hex = hexColor.replace('#', '');
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 155 ? '#111318' : '#ffffff';
}

function renderPalette() {
  palette.innerHTML = '';
  COLORS.forEach(color => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'color-choice';
    button.style.background = color.value;
    button.dataset.color = color.id;
    button.title = color.name;
    button.setAttribute('aria-label', color.name);
    button.addEventListener('click', () => chooseColor(color.id));
    palette.appendChild(button);
  });
}

function createAttempt() {
  attemptNumber += 1;
  const row = document.createElement('article');
  row.className = 'attempt';
  row.innerHTML = `
    <div class="slots" aria-label="Tentativa ${attemptNumber}"></div>
    <div class="hints" aria-label="Resultado da tentativa"></div>
    <div class="attempt-number">Tentativa ${attemptNumber}</div>`;

  const slotsBox = row.querySelector('.slots');
  const hintsBox = row.querySelector('.hints');
  const hintColumns = Math.ceil(Math.sqrt(CODE_LENGTH));
  row.style.setProperty('--hint-columns', hintColumns);
  const state = { row, values: Array(CODE_LENGTH).fill(null), selected: null, slots: [], hints: [] };

  for (let index = 0; index < CODE_LENGTH; index += 1) {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'slot';
    slot.setAttribute('aria-label', 'Posição vazia');
    slot.addEventListener('click', () => handleSlotClick(index));
    slotsBox.appendChild(slot);
    state.slots.push(slot);

    const hint = document.createElement('span');
    hint.className = 'hint';
    hintsBox.appendChild(hint);
    state.hints.push(hint);
  }

  board.appendChild(row);
  activeAttempt = state;
  updatePaletteState();
  requestAnimationFrame(() => row.scrollIntoView({ behavior: 'smooth', block: 'center' }));
}

function handleSlotClick(index) {
  if (finished || !activeAttempt) return;
  const state = activeAttempt;

  if (state.values[index]) {
    state.values[index] = null;
    paintCircle(state.slots[index], null);
    state.selected = index;
  } else {
    state.selected = state.selected === index ? null : index;
  }

  updateSelection();
  updatePaletteState();
}

function chooseColor(colorId) {
  if (finished || !activeAttempt || activeAttempt.values.includes(colorId)) return;
  const state = activeAttempt;
  const target = state.selected ?? state.values.findIndex(value => value === null);
  if (target < 0) return;

  state.values[target] = colorId;
  paintCircle(state.slots[target], colorId);
  state.selected = null;
  updateSelection();
  updatePaletteState();

  if (state.values.every(Boolean)) finishAttempt(state);
}

function updateSelection() {
  if (!activeAttempt) return;
  activeAttempt.slots.forEach((slot, index) => slot.classList.toggle('selected', index === activeAttempt.selected));
}

function updatePaletteState() {
  const used = activeAttempt ? activeAttempt.values : [];
  palette.querySelectorAll('.color-choice').forEach(button => {
    const unavailable = finished || used.includes(button.dataset.color);
    button.classList.toggle('used', unavailable);
    button.disabled = unavailable;
  });
}

function finishAttempt(state) {
  const exact = state.values.filter((color, index) => color === SECRET[index]).length;
  const present = state.values.filter(color => SECRET.includes(color)).length - exact;

  const result = [
    ...Array(exact).fill('correct'),
    ...Array(present).fill('present')
  ];

  result.forEach((kind, index) => state.hints[index].classList.add(kind));
  state.slots.forEach(slot => { slot.disabled = true; slot.classList.remove('selected'); });
  activeAttempt = null;

  if (exact === CODE_LENGTH) {
    finished = true;
    updatePaletteState();
    window.setTimeout(showVictory, 450);
  } else {
    window.setTimeout(createAttempt, 360);
  }
}

function showVictory() {
  solution.innerHTML = '';
  SECRET.forEach(colorId => {
    const dot = document.createElement('span');
    dot.className = 'solution-dot';
    paintCircle(dot, colorId);
    dot.textContent = COLOR_NUMBERS[colorId];
    dot.style.color = getContrastColor(colorMap[colorId].value);
    dot.setAttribute('aria-label', `${colorMap[colorId].name}: número ${COLOR_NUMBERS[colorId]}`);
    solution.appendChild(dot);
  });
  modal.classList.add('show');
  launchConfetti();
}

function resetGame() {
  finished = false;
  attemptNumber = 0;
  activeAttempt = null;
  board.innerHTML = '';
  modal.classList.remove('show');
  stopConfetti();
  createAttempt();
}

restartButton.addEventListener('click', resetGame);

const canvas = document.getElementById('confetti');
const ctx = canvas.getContext('2d');

let magicParticles = [];
let animationFrame = null;
let magicStartTime = 0;
let spawningMagic = false;
let magicAudioContext = null;

function unlockMagicAudio() {
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) return;

  if (!magicAudioContext) {
    magicAudioContext = new AudioContextClass();
  }

  if (magicAudioContext.state === 'suspended') {
    magicAudioContext.resume();
  }
}

/*
 * Desbloqueia o áudio no primeiro toque do jogador.
 * Isso é necessário principalmente no celular.
 */
document.addEventListener('pointerdown', unlockMagicAudio, {
  once: true
});

function resizeCanvas() {
  const scale = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = window.innerWidth * scale;
  canvas.height = window.innerHeight * scale;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function createMagicParticle(initial = false) {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight * 0.45;
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * Math.min(
    window.innerWidth * 0.45,
    window.innerHeight * 0.4
  );

  return {
    x: initial
      ? centerX + Math.cos(angle) * distance
      : Math.random() * window.innerWidth,

    y: initial
      ? centerY + Math.sin(angle) * distance
      : window.innerHeight + 20,

    radius: 2 + Math.random() * 4,
    points: Math.random() > 0.45 ? 4 : 5,

    vx: -0.35 + Math.random() * 0.7,
    vy: -0.45 - Math.random() * 1.25,

    drift: Math.random() * Math.PI * 2,
    driftSpeed: 0.015 + Math.random() * 0.025,

    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: -0.025 + Math.random() * 0.05,

    opacity: 0.25 + Math.random() * 0.75,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.045 + Math.random() * 0.065,

    life: 0,
    maxLife: 180 + Math.random() * 220,

    color: Math.random() > 0.25 ? '#ffd76a' : '#fff2b0'
  };
}

function drawMagicStar(particle) {
  const pulse = 0.72 + Math.sin(particle.pulse) * 0.28;
  const radius = particle.radius * pulse;
  const innerRadius = radius * 0.32;

  ctx.save();
  ctx.translate(particle.x, particle.y);
  ctx.rotate(particle.rotation);
  ctx.globalAlpha = particle.opacity * pulse;

  ctx.shadowColor = '#ffd54f';
  ctx.shadowBlur = 14 + radius * 3;

  ctx.beginPath();

  for (let point = 0; point < particle.points * 2; point += 1) {
    const currentRadius = point % 2 === 0 ? radius : innerRadius;
    const angle =
      -Math.PI / 2 +
      point * Math.PI / particle.points;

    const x = Math.cos(angle) * currentRadius;
    const y = Math.sin(angle) * currentRadius;

    if (point === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();

  const gradient = ctx.createRadialGradient(
    0,
    0,
    0,
    0,
    0,
    radius
  );

  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.3, '#fff6bd');
  gradient.addColorStop(0.7, particle.color);
  gradient.addColorStop(1, '#c88916');

  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.restore();

  drawMagicGlow(particle, pulse);
}

function drawMagicGlow(particle, pulse) {
  const glowRadius = particle.radius * 4.5 * pulse;

  ctx.save();
  ctx.globalAlpha = particle.opacity * 0.24;

  const glow = ctx.createRadialGradient(
    particle.x,
    particle.y,
    0,
    particle.x,
    particle.y,
    glowRadius
  );

  glow.addColorStop(0, '#fff9cf');
  glow.addColorStop(0.35, '#ffd75e');
  glow.addColorStop(1, 'rgba(255, 183, 28, 0)');

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(
    particle.x,
    particle.y,
    glowRadius,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
}


function playMagicSound() {
  unlockMagicAudio();

  if (!magicAudioContext || magicAudioContext.state !== 'running') {
    return;
  }

  const audio = magicAudioContext;
  const startTime = audio.currentTime;
  const masterGain = audio.createGain();

  // Volume geral da corneta
  masterGain.gain.setValueAtTime(0.3, startTime);
  masterGain.connect(audio.destination);

  // Sequência clássica de notas de corneta (Toque de Alvorada/Carga simplificado)
  // Frequências: Sol3 (196Hz), Dó4 (261.63Hz), Mi4 (329.63Hz), Sol4 (392Hz)
  const bugleNotes = [
    { frequency: 196.00, delay: 0.00, duration: 0.3 }, // Sol
    { frequency: 261.63, delay: 0.18, duration: 0.3 }, // Dó
    { frequency: 329.63, delay: 0.36, duration: 0.3 }, // Mi
    { frequency: 392.00, delay: 0.54, duration: 0.8 }, // Sol (longo)
    
    { frequency: 329.63, delay: 1.00, duration: 0.3 }, // Mi
    { frequency: 392.00, delay: 1.18, duration: 2.0 }  // Sol (longo final)
  ];

  bugleNotes.forEach(note => {
    createBugleNote(
      audio,
      masterGain,
      note.frequency,
      startTime + note.delay,
      note.duration
    );
  });
}

function createBugleNote(audio, destination, frequency, startTime, duration) {
  // 1. Oscilador principal com onda 'sawtooth' (som metálico de sopro)
  const osc1 = audio.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(frequency, startTime);

  // 2. Segundo oscilador para encorpar o som do instrumento de metal
  const osc2 = audio.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(frequency, startTime);
  osc2.detune.setValueAtTime(4, startTime); // Leve desafinação para dar corpo ao som

  // 3. Filtro passa-baixa para suavizar o agudo áspero do dente de serra
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  // Abre o filtro levemente no início da nota simulando a pressão do sopro
  filter.frequency.setValueAtTime(1200, startTime);
  filter.frequency.exponentialRampToValueAtTime(2500, startTime + 0.05);
  filter.frequency.exponentialRampToValueAtTime(800, startTime + duration);

  // 4. Controle de volume/envelope da nota (Ataque rápido, sustentação e decaimento)
  const noteGain = audio.createGain();
  noteGain.gain.setValueAtTime(0.0001, startTime);
  noteGain.gain.linearRampToValueAtTime(0.3, startTime + 0.02); // Ataque do sopro (20ms)
  noteGain.gain.setValueAtTime(0.25, startTime + duration - 0.05);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // Término da nota

  // Conexão dos nós de áudio
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(noteGain);
  noteGain.connect(destination);

  // Execução da nota
  osc1.start(startTime);
  osc2.start(startTime);
  osc1.stop(startTime + duration + 0.05);
  osc2.stop(startTime + duration + 0.05);
}

function launchConfetti() {
  stopConfetti();
  resizeCanvas();
  playMagicSound();

  magicStartTime = performance.now();
  spawningMagic = true;

  magicParticles = Array.from(
    { length: 95 },
    () => createMagicParticle(true)
  );

  animateMagicParticles();

  window.setTimeout(() => {
    spawningMagic = false;
  }, 6200);
}

function animateMagicParticles(currentTime = performance.now()) {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  if (spawningMagic && magicParticles.length < 140) {
    const elapsed = currentTime - magicStartTime;
    const quantity = elapsed < 900 ? 3 : 1;

    for (let index = 0; index < quantity; index += 1) {
      magicParticles.push(createMagicParticle(false));
    }
  }

  magicParticles.forEach(particle => {
    particle.life += 1;
    particle.drift += particle.driftSpeed;
    particle.pulse += particle.pulseSpeed;
    particle.rotation += particle.rotationSpeed;

    particle.x += particle.vx + Math.sin(particle.drift) * 0.45;
    particle.y += particle.vy;

    const remainingLife = 1 - particle.life / particle.maxLife;

    if (remainingLife < 0.25) {
      particle.opacity = Math.max(0, remainingLife * 4);
    }

    drawMagicStar(particle);
  });

  magicParticles = magicParticles.filter(particle =>
    particle.life < particle.maxLife &&
    particle.y > -50 &&
    particle.x > -50 &&
    particle.x < window.innerWidth + 50
  );

  if (spawningMagic || magicParticles.length > 0) {
    animationFrame = requestAnimationFrame(animateMagicParticles);
  } else {
    stopConfetti();
  }
}

function stopConfetti() {
  spawningMagic = false;

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }

  animationFrame = null;
  magicParticles = [];

  ctx.clearRect(
    0,
    0,
    window.innerWidth,
    window.innerHeight
  );
}

window.addEventListener('resize', () => {
  resizeCanvas();
});

window.addEventListener('resize', () => { if (confettiPieces.length) resizeCanvas(); });

renderPalette();
createAttempt();

/*
 * Mantém a identificação da equipe ao passar do jogo
 * para a página LivroEnigmas.html.
 */
const bookLink = document.getElementById('bookLink');
const incomingTeam = new URLSearchParams(window.location.search).get('equipe');

if (bookLink && incomingTeam) {
  bookLink.href = `LivroEnigmas.html?equipe=${encodeURIComponent(incomingTeam)}`;
}
