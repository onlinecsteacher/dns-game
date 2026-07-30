// ---------- Data ----------
const teachers = [
  { name: 'Mr. Diaz',      subject: 'Science', grade: 6,  room: 200 },
  { name: 'Ms. Yang',      subject: 'Science', grade: 7,  room: 202 },
  { name: 'Mr. Osei',      subject: 'Science', grade: 8,  room: 204 },
  { name: 'Ms. Rodriguez', subject: 'Science', grade: 9,  room: 206 },
  { name: 'Mr. Klein',     subject: 'Science', grade: 10, room: 208 },

  { name: 'Mrs. Ford',     subject: 'Math', grade: 6,  room: 100 },
  { name: 'Mr. Chen',      subject: 'Math', grade: 7,  room: 102 },
  { name: 'Ms. Rivas',     subject: 'Math', grade: 8,  room: 104 },
  { name: 'Mr. Boyd',      subject: 'Math', grade: 9,  room: 106 },
  { name: 'Mrs. Singh',    subject: 'Math', grade: 10, room: 108 },

  { name: 'Ms. Vance',     subject: 'English', grade: 6,  room: 300 },
  { name: 'Mr. Dawson',    subject: 'English', grade: 7,  room: 302 },
  { name: 'Mrs. Patel',    subject: 'English', grade: 8,  room: 304 },
  { name: 'Ms. Okafor',    subject: 'English', grade: 9,  room: 306 },
  { name: 'Mr. Alvarez',   subject: 'English', grade: 10, room: 308 },

  { name: 'Mrs. Cole',     subject: 'History', grade: 6,  room: 400 },
  { name: 'Mr. Nakamura',  subject: 'History', grade: 7,  room: 402 },
  { name: 'Ms. Reyes',     subject: 'History', grade: 8,  room: 404 },
  { name: 'Mr. Whitfield', subject: 'History', grade: 9,  room: 406 },
  { name: 'Ms. Dubois',    subject: 'History', grade: 10, room: 408 },

  { name: 'Mr. Park',      subject: 'Arts', grade: 6,  room: 500 },
  { name: 'Mrs. Ibarra',   subject: 'Arts', grade: 7,  room: 502 },
  { name: 'Ms. Tran',      subject: 'Arts', grade: 8,  room: 504 },
  { name: 'Mr. Delgado',   subject: 'Arts', grade: 9,  room: 506 },
  { name: 'Mrs. Brennan',  subject: 'Arts', grade: 10, room: 508 },
];

const questionBank = [
  { text: 'Is it a Science class?', test: t => t.subject === 'Science' },
  { text: 'Is it a Math class?', test: t => t.subject === 'Math' },
  { text: 'Is it an English class?', test: t => t.subject === 'English' },
  { text: 'Is it a History class?', test: t => t.subject === 'History' },
  { text: 'Is it an Arts class?', test: t => t.subject === 'Arts' },

  { text: 'Is the student in 6th grade?', test: t => t.grade === 6 },
  { text: 'Is the student in 7th grade?', test: t => t.grade === 7 },
  { text: 'Is the student in 8th grade?', test: t => t.grade === 8 },
  { text: 'Is the student in 9th grade?', test: t => t.grade === 9 },
  { text: 'Is the student in 10th grade?', test: t => t.grade === 10 },

  { text: 'Does the teacher’s last name start with A–M?', test: t => /^[A-M]/.test(t.name.split(' ')[1]) },
  { text: 'Is the teacher’s room on the first floor?', test: () => true },
  { text: 'Does the teacher give a lot of homework?', test: () => true },
  { text: 'Is it Ms. Rodriguez?', test: t => t.name === 'Ms. Rodriguez' },
];

// ---------- State ----------
let session = { secondsLeft: 60, helped: 0, missed: 0, roundLog: [], active: false };
let round = { answer: null, ruledOut: new Set(), questionsAsked: 0, cached: false, phase: 'narrowing' };
let timerId = null;
let transitionTimeoutId = null;

// ---------- DOM refs ----------
const screens = {
  title: document.getElementById('screen-title'),
  round: document.getElementById('screen-round'),
  results: document.getElementById('screen-results'),
};
const timeLeftEl = document.getElementById('time-left');
const helpedCountEl = document.getElementById('helped-count');
const questionCountEl = document.getElementById('question-count');
const parentLineEl = document.getElementById('parent-line');
const answerLineEl = document.getElementById('answer-line');
const feedbackLineEl = document.getElementById('feedback-line');
const gridEl = document.getElementById('grid');
const questionBankEl = document.getElementById('question-bank');
const resultsSummaryEl = document.getElementById('results-summary');
const guessBtnEl = document.getElementById('guess-btn');

document.getElementById('start-btn').addEventListener('click', startSession);
document.getElementById('restart-btn').addEventListener('click', startSession);
guessBtnEl.addEventListener('click', armGuess);

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ---------- Core functions ----------
function startSession() {
  session = { secondsLeft: 60, helped: 0, missed: 0, roundLog: [], active: true };
  clearInterval(timerId);
  clearTimeout(transitionTimeoutId);
  timeLeftEl.textContent = formatTime(session.secondsLeft);
  helpedCountEl.textContent = session.helped;
  showScreen('round');
  startRound();
  timerId = setInterval(() => {
    session.secondsLeft--;
    timeLeftEl.textContent = formatTime(Math.max(session.secondsLeft, 0));
    if (session.secondsLeft <= 0) {
      endSession();
    }
  }, 1000);
}

function startRound() {
  round = {
    answer: teachers[Math.floor(Math.random() * teachers.length)],
    ruledOut: new Set(),
    questionsAsked: 0,
    cached: Math.random() < 0.2,
    phase: 'narrowing',
  };
  questionCountEl.textContent = round.questionsAsked;
  feedbackLineEl.textContent = '';
  feedbackLineEl.className = 'feedback-line';
  answerLineEl.textContent = '';
  answerLineEl.className = 'answer-line';

  guessBtnEl.disabled = false;
  guessBtnEl.textContent = 'Ready to make a guess?';
  guessBtnEl.classList.remove('armed');

  if (round.cached) {
    parentLineEl.textContent = `"I'm looking for my child — she has ${round.answer.name} for ${ordinal(round.answer.grade)} grade ${round.answer.subject}."`;
  } else {
    parentLineEl.textContent = '"I\'m looking for my child."';
  }

  renderGrid();
  renderQuestionBank();
}

function ordinal(n) {
  const suffixes = { 6: 'th', 7: 'th', 8: 'th', 9: 'th', 10: 'th' };
  return `${n}${suffixes[n] || 'th'}`;
}

function renderGrid() {
  gridEl.innerHTML = '';
  gridEl.classList.toggle('inert', round.phase === 'narrowing');
  teachers.forEach((teacher, i) => {
    const card = document.createElement('button');
    card.className = 'card';
    card.dataset.index = i;
    card.setAttribute('aria-label', `${teacher.name}, ${teacher.subject}, grade ${teacher.grade}`);
    card.setAttribute('aria-disabled', round.phase === 'narrowing' ? 'true' : 'false');
    card.innerHTML = `
      <span class="card-inner">
        <span class="card-front">
          <span class="card-name">${teacher.name}</span>
          <span class="card-meta">${ordinal(teacher.grade)} grade ${teacher.subject}</span>
        </span>
        <span class="card-back"></span>
      </span>
    `;
    card.addEventListener('click', () => clickCard(teacher, card));
    gridEl.appendChild(card);
  });
}

function renderQuestionBank() {
  questionBankEl.innerHTML = '';
  questionBank.forEach((q, i) => {
    const btn = document.createElement('button');
    btn.className = 'q-btn';
    btn.type = 'button';
    btn.textContent = q.text;
    btn.addEventListener('click', () => askQuestion(q, btn));
    questionBankEl.appendChild(btn);
  });
}

function askQuestion(q, btn) {
  if (round.phase !== 'narrowing' || !session.active || btn.disabled) return;
  btn.disabled = true;

  const isYes = q.test(round.answer);
  btn.classList.add(isYes ? 'answered-yes' : 'answered-no');
  btn.textContent = `${q.text} — ${isYes ? 'Yes' : 'No'}`;

  answerLineEl.textContent = isYes ? 'Yes.' : 'No.';
  answerLineEl.className = `answer-line ${isYes ? 'answer-yes' : 'answer-no'}`;

  teachers.forEach((t, i) => {
    if (q.test(t) !== isYes) {
      round.ruledOut.add(i);
      const card = gridEl.querySelector(`.card[data-index="${i}"]`);
      if (card) card.classList.add('ruled-out');
    }
  });

  round.questionsAsked++;
  questionCountEl.textContent = round.questionsAsked;
}

function armGuess() {
  if (round.phase !== 'narrowing' || !session.active) return;
  round.phase = 'guessing';
  guessBtnEl.disabled = true;
  guessBtnEl.textContent = 'Choose a teacher...';
  guessBtnEl.classList.add('armed');

  gridEl.classList.remove('inert');
  gridEl.querySelectorAll('.card').forEach(c => c.setAttribute('aria-disabled', 'false'));
  questionBankEl.querySelectorAll('.q-btn').forEach(b => (b.disabled = true));
}

function clickCard(teacher, cardEl) {
  if (round.phase !== 'guessing' || !session.active || session.secondsLeft <= 0) return;
  round.phase = 'resolved';

  const isCorrect = teacher === round.answer;

  if (isCorrect) {
    cardEl.querySelector('.card-back').textContent = teacher.room;
    cardEl.classList.add('correct', 'flipped');

    session.helped++;
    session.roundLog.push({ questionsAsked: round.questionsAsked, cached: round.cached, result: 'helped' });
    helpedCountEl.textContent = session.helped;

    feedbackLineEl.textContent = round.cached
      ? 'Straight to the room — that one was already cached!'
      : 'Found it! Parent helped.';
    feedbackLineEl.classList.add('success');
  } else {
    cardEl.querySelector('.card-back').textContent = teacher.room;
    cardEl.classList.add('wrong', 'flipped');

    session.missed++;
    session.roundLog.push({ questionsAsked: round.questionsAsked, cached: round.cached, result: 'missed' });

    feedbackLineEl.textContent = 'Wrong office — the parent is not happy.';
    feedbackLineEl.classList.add('fail');

    const answerIndex = teachers.indexOf(round.answer);
    const answerCard = gridEl.querySelector(`.card[data-index="${answerIndex}"]`);
    if (answerCard) {
      answerCard.querySelector('.card-back').textContent = round.answer.room;
      answerCard.classList.add('correct', 'flipped');
    }
  }

  disableAllInputs();

  if (session.secondsLeft > 0) {
    transitionTimeoutId = setTimeout(() => {
      if (session.active) startRound();
    }, 1100);
  }
}

function disableAllInputs() {
  questionBankEl.querySelectorAll('.q-btn').forEach(b => (b.disabled = true));
  gridEl.querySelectorAll('.card').forEach(c => (c.style.pointerEvents = 'none'));
}

function endSession() {
  session.active = false;
  clearInterval(timerId);
  clearTimeout(transitionTimeoutId);
  showResults();
}

function showResults() {
  const helpedRounds = session.roundLog.filter(r => r.result === 'helped');
  const nonCachedHelped = helpedRounds.filter(r => !r.cached);

  const avgQuestions = nonCachedHelped.length
    ? (nonCachedHelped.reduce((sum, r) => sum + r.questionsAsked, 0) / nonCachedHelped.length).toFixed(1)
    : '—';

  resultsSummaryEl.innerHTML = `
    <p>Parents helped: <span class="stat-value">${session.helped}</span></p>
    <p>Parents missed: <span class="stat-value">${session.missed}</span></p>
    <p>Average questions per round: <span class="stat-value">${avgQuestions}</span></p>
  `;

  showScreen('results');
}
