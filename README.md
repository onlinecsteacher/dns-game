# DNS Detective: The School Office Challenge
### Widget design plan (README — not yet built)

A single-page, timed HTML/CSS/JS activity: **"See how many parents you can help in a minute."** A parent walks up and says only *"I'm looking for my child."* The student narrows a 5×5 grid of 25 teachers down using a question bank, then **clicks a card to flip it and reveal a room number** — the actual "answer" being returned. Click the right one, that parent's helped, and the next parent walks up immediately. Click any wrong one and that lookup fails outright — the parent got sent to the wrong room, and the next parent walks up anyway. One 60-second clock runs for the whole session; only the question count resets between parents, so early rounds spent asking too many questions eat directly into how many parents there's time left to help.

---

## 1. Learning mapping

| Real DNS step | Office equivalent | What the student does |
|---|---|---|
| Browser sends a request with no address cached | Parent says "I'm looking for my child" — no other info offered | Read the (empty) prompt |
| Recursive resolver does the actual querying | **You**, the office helper | You're the one clicking |
| Root/TLD server → narrows to the right general category (.com, .org...) | **Subject** question → narrows to the right row of the grid | Click a subject question |
| Authoritative server for that domain → narrows to the specific server | **Grade level** question → narrows to the right column | Click a grade question |
| Authoritative server returns the exact IP address | Click the one correct card → it flips to show the **room number** | Click the card, watch it flip |
| A wrong or stale answer sends the request somewhere broken | Click the wrong card → it flips to the wrong room, parent is not happy, round fails | See the fail state |
| A cached record → browser already has the IP, no lookup at all | Parent already states subject **and** grade level up front | Round is solved in 0 questions |
| A server under real load, handling many requests in sequence, where time spent on one query delays the next | One 60-second clock for the whole session — every question asked on this parent is time not spent helping the next one | Play fast *and* efficient, not just accurate |

The subject → grade → click order isn't told to students. It's discovered: after a few rounds, the ones who narrow with questions before clicking a card consistently succeed, while the ones who click early on a hunch fail more often — which *is* the lesson. A wrong click isn't a wrong "guess" in the usual game sense, it's a wrong **answer already sent** — same as a resolver returning a bad IP, there's no do-over mid-round.

---

## 2. The grid (content)

25 teachers, arranged so **each row is a subject** and **each column is a grade level** — every subject/grade pair maps to exactly one teacher. Room numbers follow the same logic on purpose: the hundreds digit is the subject's wing, the last two digits step through the grade columns — so the room number itself is structured like an IP address (a "network" part plus a "host" part), which is worth pointing out once during the debrief.

| | 6th | 7th | 8th | 9th | 10th |
|---|---|---|---|---|---|
| **Science** (200s) | Mr. Diaz — 200 | Ms. Yang — 202 | Mr. Osei — 204 | Ms. Rodriguez — 206 | Mr. Klein — 208 |
| **Math** (100s) | Mrs. Ford — 100 | Mr. Chen — 102 | Ms. Rivas — 104 | Mr. Boyd — 106 | Mrs. Singh — 108 |
| **English** (300s) | Ms. Vance — 300 | Mr. Dawson — 302 | Mrs. Patel — 304 | Ms. Okafor — 306 | Mr. Alvarez — 308 |
| **History** (400s) | Mrs. Cole — 400 | Mr. Nakamura — 402 | Ms. Reyes — 404 | Mr. Whitfield — 406 | Ms. Dubois — 408 |
| **Arts** (500s) | Mr. Park — 500 | Mrs. Ibarra — 502 | Ms. Tran — 504 | Mr. Delgado — 506 | Mrs. Brennan — 508 |

Each grid card shows name, subject, and grade on its **front face** at all times — nothing about *who* is hidden. What's hidden is the room number on the **back face**, which only appears once a card is clicked, and only one click is allowed per round.

Each round, the "answer" teacher is picked at random from the 25.

**Cached round (roughly 1 in 5 rounds):** the parent's opening line is replaced with something like *"I'm looking for my child — she has Ms. Rodriguez for 9th grade Science."* Full info, zero questions needed — the student can click straight to the right card. This is the one round type where clicking immediately is the *correct* move, a visible contrast to every other round, worth calling out explicitly in the results screen ("That one was already cached!").

---

## 3. Screen-by-screen flow

1. **Title screen** — premise in one line ("help as many parents as you can in 60 seconds — but each one only gets one click"), Start button. Starts the **session clock**: 60 seconds, counts down, never pauses or resets until the session ends.
2. **Round screen** (repeats back-to-back until the clock hits 0) — the full 25-card grid, reset and re-shuffled to a new random answer, plus the question bank (section 4). Parent's line at the top: *"I'm looking for my child."* (or the cached variant, occasionally). The **question count resets to 0** for this parent — only the session clock at the top carries over from the previous round.
3. **Student clicks a question** → it's marked used → the parent's yes/no answer appears → every card that doesn't match grays out (stays visible, still technically clickable — nothing is removed from the board). This parent's **question count** ticks up by 1. Every second still ticks off the shared session clock in the background.
4. **Student clicks any card, at any point** → it flips:
   - **Correct card** → flips to show the room number in the brass "found it" state, a short success line plays, **parents helped** ticks up by 1, and — if time remains — the *next* parent walks up immediately (back to step 2, grid reshuffled, question count back to 0).
   - **Wrong card** → flips to show *that* card's real room number in the maroon "fail" state, a line like *"Wrong office — the parent is not happy."* plays, **parents missed** ticks up by 1, the actually-correct card flips open right after so the student sees what they missed, then the next parent walks up the same as a success would.
5. **Session ends** the instant the clock hits 0 — mid-round if that's where it lands, no grace period, matching real load where a slow query just doesn't finish in time.
6. **Results screen** — parents helped vs. missed, average questions per helped parent, any cached rounds called out separately, and the recap table from section 1.

There's no "grid narrows to one and auto-highlights" step — the student has to commit by clicking, the same way a resolver has to actually send the query rather than just holding a shortlist. And because the clock never stops between parents, over-asking on an easy one has a direct, visible cost: fewer parents helped by the end, not just a slower individual round.

---

## 4. Question bank design

The bank is fixed across rounds (same questions every time); only which teacher is the hidden answer changes. That repetition is what lets students start recognizing the efficient order for themselves by round three or four — and start feeling *why* clicking early is a gamble instead of just being told so.

**Subject questions (5)** — each one grays out 20 of 25 cards on a "no," or narrows to 5 on a "yes":
- Is it a Science class? / Math? / English? / History? / Arts?

**Grade questions (5)** — same shape, by column instead of row:
- Is the student in 6th grade? / 7th? / 8th? / 9th? / 10th?

**Trap questions (4–5)** — sound useful, don't cleanly divide the grid, tempt students toward clicking before they're actually narrowed down:
- Does the teacher's last name start with a letter A–M? *(cuts unevenly across rows/columns — looks like progress, rarely divides the grid cleanly)*
- Is the teacher's room on the first floor? *(no data behind it — always answers the same way, eliminates nothing)*
- Does the teacher give a lot of homework? *(flavor only, zero elimination)*
- Is it Ms. Rodriguez? *(a direct name guess dressed as a question — answering it doesn't gray anything out except possibly one card, tempting the student to just click instead)*

Two subject-then-grade questions is always enough to narrow to exactly one card, since only one teacher exists per subject/grade pair — so **2 questions before clicking is the theoretical safe minimum**. Clicking with more than one card still live is a real gamble with real odds (e.g., clicking with 5 cards still un-grayed is a 1-in-5 shot), which is the whole point: the game doesn't stop a student from clicking early, it just makes the odds visible after the fact.

**Scoring**: each round is **solved** (question count recorded, parent helped) or **failed** (ends immediately, no partial credit, parent missed) — no in-between. The session score is simply **parents helped in 60 seconds**; questions asked per round only shows up as the thing eating into that number, not as a separate score of its own. Cached rounds always solve in 0 questions and are flagged separately so they don't distort a student's average.

---

## 5. Design plan

Grounding: a real 1990s–2000s school office directory — laminated wing signs, brass-look plaques, a paper sign-in clipboard. Not a generic "cute app" look.

**Color** (named, not defaults)
- `--ink-navy: #1C2B4A` — headers, primary text
- `--hall-tile: #E7ECE7` — page background (pale institutional green-grey, not cream)
- `--plaque-brass: #C9A227` — the correct card's flipped "found it" state
- `--pass-maroon: #7A3B3B` — the wrong card's flipped "fail" state, and grayed-out card borders
- `--chalk-green: #33513E` — hover/active state on question tiles
- `--paper-white: #FCFBF6` — card front face, question tiles

**Type**
- Display: a bold condensed signage face (e.g. *Archivo Black* or *Big Shoulders Display*) for teacher names and the flipped room numbers — reads like actual wayfinding signage
- Body: a plain humanist sans (e.g. *Inter* or *Source Sans 3*) for question text and the parent's line
- Utility/mono: *Space Mono* or *IBM Plex Mono* for the room numbers on the flipped back face and the question counter — styled like an LED hall-pass clock

**Layout (ASCII wireframe, round screen)**
```
┌───────────────────────────────────────────┐
│  ⏱ 0:38 LEFT   HELPED: 4   THIS ONE: 2 Q'S │
│  "I'm looking for my child."               │
│                                             │
│  ┌───────── 5×5 GRID ─────────┐            │
│  │ Diaz  Yang  Osei  Rodrig  Klein│ ← click │
│  │ Ford  Chen  Rivas Boyd    Singh│   any   │
│  │ Vance Dawson Patel Okafor Alvarez│  card  │
│  │ Cole  Naka  Reyes Whit   Dubois│  to     │
│  │ Park  Ibarra Tran Delg   Brenn │  flip   │
│  └────────────────────────────┘            │
│                                             │
│  QUESTION BANK                              │
│  [Science?] [Math?] [English?] [History?]...│
│  [6th?] [7th?] [8th?] [9th?] [10th?]        │
│  [Last name A–M?] [Is it Rodriguez?] ...    │
└───────────────────────────────────────────┘
```

**Signature element**: every card is a **split-flap plaque** (airport-departures style) with two distinct flips. A *narrowing* flip (triggered by a question) turns a ruled-out card to a dim, blank-faced state — reversible-feeling, low stakes. A *commit* flip (triggered by clicking the card itself) is bigger and slower, turns the whole card over to show the room number in brass (correct) or maroon (wrong) — deliberately reads as more final, so the difference between "narrowing" and "answering" is felt physically, not just explained.

---

## 6. Technical structure (single HTML file)

- **HTML**: one `<div id="stage">` — the 25-card grid and the question bank both render into it via JS, no separate pages/routes.
- **CSS**: custom properties for the palette above; `@keyframes narrowFlip` (quick, low-contrast) for question-driven graying, a separate `@keyframes commitFlip` (slower, bigger) for the click-to-reveal room number; a `prefers-reduced-motion` fallback that fades instead of flipping for both.
- **JS state**: a plain object —
  ```js
  const teachers = [
    { name: 'Ms. Rodriguez', subject: 'Science', grade: 9, room: 206 },
    { name: 'Mr. Diaz', subject: 'Science', grade: 6, room: 200 },
    /* ...25 total, from the grid in section 2 */
  ];
  const questionBank = [
    { text: 'Is it a Science class?', test: t => t.subject === 'Science' },
    { text: 'Is the student in 9th grade?', test: t => t.grade === 9 },
    { text: 'Does the last name start with A–M?', test: t => /^[A-M]/.test(t.name.split(' ')[1]) },
    /* ...14 total */
  ];
  let session = { secondsLeft: 60, helped: 0, missed: 0, roundLog: [] };
  let round = { answer: null, ruledOut: new Set(), questionsAsked: 0, cached: false, phase: 'asking' };
  ```
  `session` lives for the whole 60 seconds; `round` is thrown away and rebuilt for every parent. Core functions: `startSession()` (resets `session`, calls `startRound()`, starts the one `setInterval` that both ticks `session.secondsLeft` down every second and ends everything at `showResults()` when it hits 0 — this is the *only* timer in the app, nothing per-round), `startRound()` (resets `round` to a fresh random `answer` and empty `ruledOut`, occasionally sets `cached: true`), `askQuestion(q)` (evaluates `q.test` against every teacher, adds non-matches to `round.ruledOut`, plays `narrowFlip`, increments `round.questionsAsked` — has no effect on `session.secondsLeft`, that keeps ticking on its own), `clickCard(teacher)` (only live while `round.phase === 'asking'` and `session.secondsLeft > 0`; plays `commitFlip`; on correct match, increments `session.helped`, pushes `round.questionsAsked` to `session.roundLog`, and — if time remains — calls `startRound()` again immediately; on wrong match, increments `session.missed`, flips the true answer open, then also calls `startRound()` if time remains), `showResults()` (reads entirely from `session`, ignores whatever's mid-flight in `round`).
- **Accessibility**: question tiles and grid cards are both real `<button>` elements (keyboard-navigable, visible focus ring in `--plaque-brass`); the grid container has `aria-live="polite"` so a screen reader announces both narrowing updates and the solved/failed outcome; reduced-motion respected as above.

---

## 7. Optional extensions (not in v1)

- Difficulty toggle: 5×5 (25 teachers) vs. a smaller 4×4 grid for younger classes
- Per-class-period leaderboard using the artifact storage API (shared key per class code), tracking **parents helped in 60 seconds** as the headline number, with solve rate and average questions-per-solve as supporting stats
- A brief "what you knew when you clicked" recap on a fail — how many cards were still live, so the odds of that click are visible after the fact

---

Let me know if you want the room-number scheme, the trap questions, or the fail messaging adjusted before I build it.
