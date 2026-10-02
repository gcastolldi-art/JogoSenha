
const SUCCESS_URL_BASE = 'https://gcastolldi-art.github.io/livro-dos-enigmas/index.html';
/*
 * Uma única rotina reconhece a equipe recebida em ?equipe=.
 * Os valores são convertidos para a grafia esperada pelo site de destino.
*/
/* CONFIGURAÇÃO: altere aqui a senha e o código de acesso ao destino. */
const BOOK_PASSWORD = 'PRISMA';
const TEAM_ACCESS_CODE = {
  vermelha: 'ABC',
  laranja: 'ERK',
  amarela: 'TPS',
  verde: 'EBM',
  azul: 'SAD',
  marinho: 'WQX',
  roxa: 'PJL',
  rosa: 'VFT',
  marrom: 'ERD',
  turquesa: 'PTR',
  preta: 'CDE',
  branca: 'FHY'
};

const TEAM_NAMES = {
  vermelha: 'Vermelha',
  laranja: 'Laranja',
  amarela: 'Amarela',
  verde: 'Verde',
  azul: 'Azul',
  marinho: 'Marinho',
  roxa: 'Roxa',
  rosa: 'Rosa',
  marrom: 'Marrom',
  turquesa: 'Turquesa',
  preta: 'Preta',
  branca: 'Branca'
};

const requestedTeam = new URLSearchParams(window.location.search)
  .get('equipe')
  ?.trim()
  .toLocaleLowerCase('pt-BR');

const activeTeam = TEAM_NAMES[requestedTeam] || null;

function getSuccessUrl() {
  if (!activeTeam) return null;

  const fragment = new URLSearchParams({
    equipe: activeTeam,
    codigo: TEAM_ACCESS_CODE[requestedTeam] || null
  });

  return `${SUCCESS_URL_BASE}#${fragment.toString()}`;
}

const scene = document.getElementById('bookScene');
const passwordPanel = document.getElementById('passwordPanel');
const passwordInput = document.getElementById('bookPassword');
const openButton = document.getElementById('openBook');
const statusText = document.getElementById('passwordStatus');
const wizardLayer = document.getElementById('wizardLayer');
let sequenceRunning = false;

function normalize(value) {
  return value.trim().toLocaleUpperCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

passwordInput.addEventListener('input', () => {
  const start = passwordInput.selectionStart;
  passwordInput.value = passwordInput.value.toLocaleUpperCase('pt-BR');
  passwordInput.setSelectionRange(start, start);
  statusText.textContent = '';
});

passwordInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') checkPassword();
});

openButton.addEventListener('click', checkPassword);

function playVictorySound() {
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return 2800;
  }

  const audio = new AudioContextClass();
  const startTime = audio.currentTime;

  const masterGain = audio.createGain();
  const compressor = audio.createDynamicsCompressor();

  masterGain.gain.setValueAtTime(0.0001, startTime);
  masterGain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.05);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 3.2);

  masterGain.connect(compressor);
  compressor.connect(audio.destination);

  /*
   * Cascata de notas celestiais e super agudas (Arpejo de encantamento)
   */
  const fairyNotes = [
    { frequency: 1046.50, delay: 0.00 }, // Dó (C6)
    { frequency: 1318.51, delay: 0.08 }, // Mi (E6)
    { frequency: 1567.98, delay: 0.16 }, // Sol (G6)
    { frequency: 2093.00, delay: 0.24 }, // Dó (C7)
    { frequency: 2637.02, delay: 0.32 }, // Mi (E7)
    { frequency: 3135.96, delay: 0.40 }, // Sol (G7)
    { frequency: 4186.01, delay: 0.50 }  // Dó (C8 - Brilho super agudo)
  ];

  fairyNotes.forEach((note) => {
    createVictoryNote(
      audio,
      masterGain,
      note.frequency,
      startTime + note.delay,
      1.8
    );
  });

  /*
   * "Pó de pirlimpimpim": chuva aleatória de estrelinhas cintilantes
   */
  const sparkleFrequencies = [2093.00, 2637.02, 3135.96, 3520.00, 4186.01, 4698.63];

  for (let i = 0; i < 20; i++) {
    const randomFreq = sparkleFrequencies[Math.floor(Math.random() * sparkleFrequencies.length)];
    const randomDelay = 0.6 + Math.random() * 1.8; // Ocorre durante o brilho final

    createVictoryNote(
      audio,
      masterGain,
      randomFreq,
      startTime + randomDelay,
      0.4,
      0.025
    );
  }

  window.setTimeout(() => {
    audio.close();
  }, 3500);

  return 2800;
}

function createVictoryNote(
  audio,
  destination,
  frequency,
  startTime,
  duration,
  volume = 1.08
) {
  const oscillator = audio.createOscillator();
  const secondaryOscillator = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();

  // Ondas seno pura geram sons cristalinos de sino/estrela
  oscillator.type = 'sine';
  secondaryOscillator.type = 'sine';

  oscillator.frequency.setValueAtTime(frequency, startTime);

  // Segunda frequência levemente deslocada para criar a ilusão de cintilação mágica (shimmer)
  secondaryOscillator.frequency.setValueAtTime(frequency * 1.002, startTime);
  secondaryOscillator.detune.setValueAtTime(12, startTime);

  // Filtro passa-alta para eliminar frequências graves e deixar só o brilho cristalino
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(800, startTime);

  // Envelope rápido e ressonante (plim suave)
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(filter);
  secondaryOscillator.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  oscillator.start(startTime);
  secondaryOscillator.start(startTime);

  oscillator.stop(startTime + duration + 0.1);
  secondaryOscillator.stop(startTime + duration + 0.1);
}

function checkPassword() {
  if (sequenceRunning) return;
  if (!passwordInput.value.trim()) {
    statusText.textContent = 'Digite a chave antes de abrir o livro.';
    passwordInput.focus();
    return;
  }

  if (normalize(passwordInput.value) === normalize(BOOK_PASSWORD)) {
    const successUrl = getSuccessUrl();

    if (!successUrl) {
      statusText.textContent =
        'Equipe não identificada. Acesse novamente pelo link oficial da sua equipe.';
      return;
    }

    sequenceRunning = true;
    passwordInput.disabled = true;
    openButton.disabled = true;

    statusText.textContent =
      'A chave despertou o Livro dos Enigmas!';

    const soundDuration = playVictorySound();

    window.setTimeout(() => {
      window.location.assign(successUrl);
    }, soundDuration);

    return;
  }

  runFailureSequence();
}

async function runFailureSequence() {
  sequenceRunning = true;
  passwordInput.blur();
  scene.classList.add('failing', 'lightning-flash');
  playThunder();

  await wait(1150);
  scene.classList.add('wizard-visible');
  wizardLayer.setAttribute('aria-hidden', 'false');

  await wait(3000);
  scene.classList.remove('wizard-visible');
  wizardLayer.setAttribute('aria-hidden', 'true');

  await wait(1350);
  scene.classList.remove('failing', 'lightning-flash');
  passwordInput.value = '';
  statusText.textContent = '';
  sequenceRunning = false;
  await wait(250);
  passwordInput.focus();
}

function wait(milliseconds) {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds));
}

function playThunder() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const audio = new AudioContextClass();
  const now = audio.currentTime;
  const master = audio.createGain();
  master.gain.setValueAtTime(.0001, now);
  master.gain.exponentialRampToValueAtTime(.72, now + .025);
  master.gain.exponentialRampToValueAtTime(.0001, now + 4.6);
  master.connect(audio.destination);

  const duration = 4.7;
  const buffer = audio.createBuffer(1, audio.sampleRate * duration, audio.sampleRate);
  const data = buffer.getChannelData(0);
  let rolling = 0;
  for (let i = 0; i < data.length; i += 1) {
    rolling = rolling * .985 + (Math.random() * 2 - 1) * .16;
    const t = i / audio.sampleRate;
    const crack = t < .13 ? (Math.random() * 2 - 1) * (1 - t / .13) * 2.2 : 0;
    data[i] = rolling * Math.exp(-t * .7) + crack;
  }

  const noise = audio.createBufferSource();
  const lowpass = audio.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(950, now);
  lowpass.frequency.exponentialRampToValueAtTime(75, now + 3.8);
  noise.buffer = buffer;
  noise.connect(lowpass).connect(master);
  noise.start(now);
  noise.stop(now + duration);
  noise.addEventListener('ended', () => audio.close());
}

window.addEventListener('load', () => passwordInput.focus());
