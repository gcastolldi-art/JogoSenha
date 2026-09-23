/*
 * CONFIGURAÇÃO DO JOGO
 * Escolha de 2 a 12 elementos em CODE_LENGTH.
 * A senha usará, na ordem, essa quantidade de cores de SECRET_COLORS.
 */
const CODE_LENGTH = 6;
const SECRET_COLORS = [
  'verde', 'dourado', 'vermelho', 'azul', 'laranja', 'roxo',
  'turquesa', 'marinho', 'rosa', 'marrom', 'branco', 'preto'
];

/* Defina aqui o número exibido sobre cada cor ao revelar a resposta. */
const COLOR_NUMBERS = {
  verde: 1,
  marinho: 2,
  dourado: 3,
  preto: 4,
  branco: 5,
  marrom: 6,
  vermelho: 7,
  azul: 8,
  rosa: 9,
  roxo: 10,
  turquesa: 11,
  laranja: 12
};

const COLORS = [
  { id: 'verde',    name: 'Verde',    value: '#20a65a' },
  { id: 'marinho',  name: 'Marinho',  value: '#123b75' },
  { id: 'dourado',  name: 'Dourado',  value: '#e3ad24' },
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
let confettiPieces = [];
let animationFrame = null;

function resizeCanvas() {
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * scale;
  canvas.height = innerHeight * scale;
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function launchConfetti() {
  resizeCanvas();
  const shades = COLORS.map(color => color.value).filter(value => value !== '#111216');
  confettiPieces = Array.from({ length: 180 }, () => ({
    x: Math.random() * innerWidth,
    y: -20 - Math.random() * innerHeight * .45,
    w: 5 + Math.random() * 8,
    h: 8 + Math.random() * 10,
    color: shades[Math.floor(Math.random() * shades.length)],
    vx: -2.2 + Math.random() * 4.4,
    vy: 2.5 + Math.random() * 4.8,
    rotation: Math.random() * Math.PI,
    spin: -.16 + Math.random() * .32,
    wave: Math.random() * 6.28
  }));
  animateConfetti();
  window.setTimeout(stopConfetti, 6200);
}

function animateConfetti() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  confettiPieces.forEach(piece => {
    piece.x += piece.vx + Math.sin(piece.wave += .05) * .5;
    piece.y += piece.vy;
    piece.rotation += piece.spin;
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.rotation);
    ctx.fillStyle = piece.color;
    ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
    ctx.restore();
  });
  confettiPieces = confettiPieces.filter(piece => piece.y < innerHeight + 30);
  if (confettiPieces.length) animationFrame = requestAnimationFrame(animateConfetti);
  else stopConfetti();
}

function stopConfetti() {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = null;
  confettiPieces = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', () => { if (confettiPieces.length) resizeCanvas(); });

renderPalette();
createAttempt();
