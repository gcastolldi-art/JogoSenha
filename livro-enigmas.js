/* CONFIGURAÇÃO: altere aqui a senha e o destino após o acerto. */
const BOOK_PASSWORD = 'XX';
const SUCCESS_URL = 'https://sig.crea-pr.org.br';

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
  masterGain.gain.exponentialRampToValueAtTime(
    0.42,
    startTime + 0.08
  );
  masterGain.gain.exponentialRampToValueAtTime(
    0.0001,
    startTime + 2.8
  );

  masterGain.connect(compressor);
  compressor.connect(audio.destination);

  /*
   * Acorde crescente de vitória.
   */
  const notes = [
    { frequency: 392.00, delay: 0.00 },
    { frequency: 523.25, delay: 0.16 },
    { frequency: 659.25, delay: 0.34 },
    { frequency: 783.99, delay: 0.54 },
    { frequency: 1046.50, delay: 0.78 },
    { frequency: 1318.51, delay: 1.06 }
  ];

  notes.forEach((note, index) => {
    createVictoryNote(
      audio,
      masterGain,
      note.frequency,
      startTime + note.delay,
      1.6 + index * 0.12
    );
  });

  /*
   * Notas brilhantes adicionais.
   */
  const sparkles = [
    { frequency: 1567.98, delay: 1.30 },
    { frequency: 2093.00, delay: 1.52 },
    { frequency: 1760.00, delay: 1.72 },
    { frequency: 2637.02, delay: 1.94 }
  ];

  sparkles.forEach(note => {
    createVictoryNote(
      audio,
      masterGain,
      note.frequency,
      startTime + note.delay,
      0.7,
      0.045
    );
  });

  window.setTimeout(() => {
    audio.close();
  }, 3000);

  return 2800;
}

function createVictoryNote(
  audio,
  destination,
  frequency,
  startTime,
  duration,
  volume = 0.1
) {
  const oscillator = audio.createOscillator();
  const secondaryOscillator = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();

  oscillator.type = 'sine';
  secondaryOscillator.type = 'triangle';

  oscillator.frequency.setValueAtTime(
    frequency,
    startTime
  );

  secondaryOscillator.frequency.setValueAtTime(
    frequency * 2,
    startTime
  );

  secondaryOscillator.detune.setValueAtTime(
    6,
    startTime
  );

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(
    5000,
    startTime
  );

  gain.gain.setValueAtTime(
    0.0001,
    startTime
  );

  gain.gain.exponentialRampToValueAtTime(
    volume,
    startTime + 0.025
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    startTime + duration
  );

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
  sequenceRunning = true;

  passwordInput.disabled = true;
  openButton.disabled = true;

  statusText.textContent =
    'A chave despertou o Livro dos Enigmas!';

  const soundDuration = playVictorySound();

  window.setTimeout(() => {
    window.location.assign(SUCCESS_URL);
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
