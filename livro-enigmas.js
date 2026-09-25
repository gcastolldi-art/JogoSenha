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

function checkPassword() {
  if (sequenceRunning) return;
  if (!passwordInput.value.trim()) {
    statusText.textContent = 'Digite a chave antes de abrir o livro.';
    passwordInput.focus();
    return;
  }

  if (normalize(passwordInput.value) === normalize(BOOK_PASSWORD)) {
    statusText.textContent = 'A chave despertou o livro...';
    window.location.assign(SUCCESS_URL);
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
