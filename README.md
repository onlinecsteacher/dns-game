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

> **Revision note:** the original v1 flow let a student click *any* card *at any time* to answer, which is also what made narrowing quietly buggy — a question's yes/no was being decided per-card instead of once, against the actual hidden answer (see the callout in section 4). This revision fixes both at once by borrowing the **Guess Who** structure: questions narrow the field, but nothing is ever "answered" until the student explicitly declares they're ready to guess.

1. **Title screen** — premise in one line ("help as many parents as you can in 60 seconds — but each one only gets one click"), Start button. Starts the **session clock**: 60 seconds, counts down, never pauses or resets until the session ends.
2. **Round screen** (repeats back-to-back until the clock hits 0) — the full 25-card grid, reset and re-shuffled to a new random answer, plus the question bank (section 4) stacked beside it. Parent's line at the top: *"I'm looking for my child."* (or the cached variant, occasionally). A **"Ready to make a guess?"** button sits at the top of the screen, next to the parent's line. The **question count resets to 0** for this parent — only the session clock at the top carries over from the previous round. Round `phase` starts as `'narrowing'` — in this phase, grid cards are **inert**: clicking one does nothing except a small "not yet" shake, because there's nothing to guess with until the student commits to guessing.
3. **Student clicks a question** (while `phase === 'narrowing'`) → it's marked used and disabled → the **true yes/no answer**, evaluated once against *this round's actual hidden answer*, appears next to the parent's line, colored **green for "Yes"** and **red for "No"** → the question tile itself is recolored to match (green border/fill for a "yes" question, red for a "no" question) so a glance back at the bank shows the full trail of answers so far, not just the most recent one → every card whose own answer to that question *doesn't match* the true yes/no grays out (stays visible, still technically inert — nothing is removed from the board). This parent's **question count** ticks up by 1. Every second still ticks off the shared session clock in the background.
4. **Student clicks "Ready to make a guess?"** → `phase` switches to `'guessing'`, the button itself becomes disabled/relabeled (e.g. "Choose a teacher...") so it can't be clicked twice, and the grid cards become live — this is the only point at which a card click means anything.
5. **Student clicks any card, now that `phase === 'guessing'`** → it flips:
   - **Correct card** → flips to show the room number in the brass "found it" state, a short success line plays, **parents helped** ticks up by 1, and — if time remains — the *next* parent walks up immediately (back to step 2, grid reshuffled, question count back to 0, `phase` back to `'narrowing'`).
   - **Wrong card** → flips to show *that* card's real room number in the maroon "fail" state, a line like *"Wrong office — the parent is not happy."* plays, **parents missed** ticks up by 1, the actually-correct card flips open right after so the student sees what they missed, then the next parent walks up the same as a success would.
6. **Session ends** the instant the clock hits 0 — mid-round if that's where it lands, no grace period, matching real load where a slow query just doesn't finish in time.
7. **Results screen** — parents helped vs. missed, average questions per helped parent, any cached rounds called out separately, and the recap table from section 1.

The Guess Who framing makes the commit moment explicit instead of accidental: a student can no longer fat-finger a card mid-narrowing and blow a round they didn't mean to answer yet. But the clock doesn't care that the student now has to click one extra button — the session timer keeps ticking through the "Ready to make a guess?" click same as everything else, so stalling before committing still costs real seconds. And because the clock never stops between parents, over-asking on an easy one has a direct, visible cost: fewer parents helped by the end, not just a slower individual round.

---

## 4. Question bank design

The bank is fixed across rounds (same questions every time); only which teacher is the hidden answer changes. That repetition is what lets students start recognizing the efficient order for themselves by round three or four — and start feeling *why* clicking early is a gamble instead of just being told so.

> **Bug fix — how narrowing must actually work:** v1 evaluated each question's `test` directly against every card and grayed out whichever ones came back `false`. That's wrong: it silently assumes the answer to every question is "yes." If the hidden answer is *not* a Science teacher and the student asks "Is it a Science class?", the honest response is **"No,"** and the cards that should gray out are the **5 Science cards** — not the 20 non-Science ones. The fix is to always evaluate the question **once, against `round.answer`**, to get the true yes/no for this round, then gray out every card whose own answer disagrees with that yes/no:
> - `const isYes = q.test(round.answer);`
> - a card grays out when `q.test(card) !== isYes`
>
> This is also what makes the green/no-red coloring below meaningful — the color reflects a real fact about the hidden answer, not just a fixed assumption.

**Subject questions (5)** — a "yes" grays out the 20 cards outside that subject's row; a "no" grays out the 5 cards inside it:
- Is it a Science class? / Math? / English? / History? / Arts?

**Grade questions (5)** — same shape, by column instead of row:
- Is the student in 6th grade? / 7th? / 8th? / 9th? / 10th?

**Trap questions (4–5)** — sound useful, don't cleanly divide the grid, tempt students toward guessing before they're actually narrowed down:
- Does the teacher's last name start with a letter A–M? *(cuts unevenly across rows/columns — looks like progress, rarely divides the grid cleanly)*
- Is the teacher's room on the first floor? *(no data behind it — always evaluates the same way for every round, so the answer is always "Yes" and nothing grays out)*
- Does the teacher give a lot of homework? *(flavor only, zero elimination — same "always Yes, nothing changes" shape as the floor question)*
- Is it Ms. Rodriguez? *(a direct name guess dressed as a question — the answer is "Yes" on the roughly 1-in-25 rounds she's the hidden answer, in which case it does gray out 24 cards at once, but "No" the rest of the time and it grays out just the one Rodriguez card — tempting the student to skip narrowing and just start guessing instead)*

Two subject-then-grade questions is always enough to narrow to exactly one card, since only one teacher exists per subject/grade pair — so **2 questions before clicking "Ready to make a guess?" is the theoretical safe minimum**. Guessing with more than one card still live is a real gamble with real odds (e.g., guessing with 5 cards still un-grayed is a 1-in-5 shot), which is the whole point: the game doesn't stop a student from declaring "Ready to make a guess?" early, it just makes the odds visible after the fact.

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
- `--answer-yes: #2F7A4B` — a "Yes" answer's text and the matching question tile's border/fill once it's been asked
- `--answer-no: #B23B3B` — a "No" answer's text and the matching question tile's border/fill once it's been asked (distinct from `--pass-maroon` so a "No" tile doesn't read as a failed/error state — it's just information)

**Type**
- Display: a bold condensed signage face (e.g. *Archivo Black* or *Big Shoulders Display*) for teacher names and the flipped room numbers — reads like actual wayfinding signage
- Body: a plain humanist sans (e.g. *Inter* or *Source Sans 3*) for question text and the parent's line
- Utility/mono: *Space Mono* or *IBM Plex Mono* for the room numbers on the flipped back face and the question counter — styled like an LED hall-pass clock

**Layout (ASCII wireframe, round screen)** — question bank moves off the bottom (where it read as one big cluttered block under the grid) and onto a right-hand rail, stacked vertically, so the grid stays the visual anchor and each question reads as its own row instead of wrapping chaotically:
```
┌─────────────────────────────────────────────────────┐
│  ⏱ 0:38 LEFT   HELPED: 4   THIS ONE: 2 Q'S           │
│  [ Ready to make a guess? ]                          │
│  "I'm looking for my child."                         │
│  Yes — it's a Science class.  (green)                │
│                                                       │
│  ┌────── 5×5 GRID ──────┐   ┌─ QUESTION BANK ──────┐ │
│  │ Diaz  Yang  Osei  ... │   │ [Science? ✓ Yes]     │ │
│  │ Ford  Chen  Rivas ... │   │ [Math?]              │ │
│  │ Vance Dawson Patel...│   │ [English?]            │ │
│  │ Cole  Naka  Reyes ...│   │ [History?]            │ │
│  │ Park  Ibarra Tran ...│   │ [Arts?]               │ │
│  │                       │   │ [6th?] [7th?] ...     │ │
│  │  (inert until guess   │   │ [Last name A–M?]      │ │
│  │   mode is armed)      │   │ [First floor?]        │ │
│  └───────────────────────┘   │ [Homework?]           │ │
│                               │ [Is it Rodriguez?]    │ │
│                               └────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```
The `[Science? ✓ Yes]` tile shown above is what an *already-asked* question looks like: label plus the answer it got, tile recolored in `--answer-yes` (or `--answer-no` for a "no"). Unasked tiles stay in the neutral `--paper-white`/`--ink-navy` styling. The "Ready to make a guess?" button lives in the header row, next to the parent's line, so it's visible regardless of how far down the page the grid or bank scroll.

**Signature element**: every card is a **split-flap plaque** (airport-departures style) with two distinct flips. A *narrowing* flip (triggered by a question) turns a ruled-out card to a dim, blank-faced state — reversible-feeling, low stakes. A *commit* flip (triggered by clicking the card itself, only possible once "Ready to make a guess?" has been pressed) is bigger and slower, turns the whole card over to show the room number in brass (correct) or maroon (wrong) — deliberately reads as more final, so the difference between "narrowing" and "answering" is felt physically, not just explained. Before guess mode is armed, cards are visually flat/non-interactive (no hover state) so the board doesn't invite premature clicks.

---

## 6. Technical structure (single HTML file)

- **HTML**: one `<div id="stage">` — the 25-card grid and the question bank both render into it via JS, no separate pages/routes. The grid and bank are siblings inside a flex/grid row (`#board`) so CSS alone controls the "bank to the right of the grid, stacked" layout from section 5 — no separate markup structure needed if the screen narrows to mobile width (see below).
- **CSS**: custom properties for the palette above, including the new `--answer-yes` / `--answer-no`; `@keyframes narrowFlip` (quick, low-contrast) for question-driven graying, a separate `@keyframes commitFlip` (slower, bigger) for the click-to-reveal room number; a `prefers-reduced-motion` fallback that fades instead of flipping for both. `#board` is `display: flex` with the grid taking the flexible width and `.question-bank` a fixed-width column (`flex-direction: column` internally, so questions stack top to bottom) — on narrow viewports `#board` switches to `flex-direction: column` so the bank drops below the grid instead of squeezing it.
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
  let round = { answer: null, ruledOut: new Set(), questionsAsked: 0, cached: false, phase: 'narrowing' };
  ```
  `round.phase` is now the state machine driving the whole Guess Who structure: `'narrowing'` (questions live, grid inert) → `'guessing'` (questions locked, grid live) → `'resolved'` (round over, waiting on the transition to the next parent). `session` lives for the whole 60 seconds; `round` is thrown away and rebuilt for every parent.

  Core functions: `startSession()` (resets `session`, calls `startRound()`, starts the one `setInterval` that both ticks `session.secondsLeft` down every second and ends everything at `showResults()` when it hits 0 — this is the *only* timer in the app, nothing per-round); `startRound()` (resets `round` to a fresh random `answer`, empty `ruledOut`, `phase: 'narrowing'`, occasionally sets `cached: true`); `askQuestion(q)` (only live while `round.phase === 'narrowing'` — **evaluates `q.test(round.answer)` once to get `isYes`, the true answer for this round**, colors that question tile and the on-screen answer line `--answer-yes`/`--answer-no` accordingly, then adds every teacher where `q.test(teacher) !== isYes` to `round.ruledOut` and plays `narrowFlip` on those cards, increments `round.questionsAsked` — has no effect on `session.secondsLeft`, that keeps ticking on its own); `armGuess()` (only live while `round.phase === 'narrowing'` — the handler for the "Ready to make a guess?" button; sets `round.phase = 'guessing'`, disables/relabels that button, and turns on hover/focus affordances on the grid so it visibly becomes clickable); `clickCard(teacher)` (only live while `round.phase === 'guessing'` and `session.secondsLeft > 0` — a click while still `'narrowing'` is a no-op, not an error, so an early click never accidentally costs a round; plays `commitFlip`; on correct match, increments `session.helped`, pushes `round.questionsAsked` to `session.roundLog`, and — if time remains — calls `startRound()` again immediately; on wrong match, increments `session.missed`, flips the true answer open, then also calls `startRound()` if time remains); `showResults()` (reads entirely from `session`, ignores whatever's mid-flight in `round`).
- **Accessibility**: question tiles, grid cards, and the "Ready to make a guess?" button are all real `<button>` elements (keyboard-navigable, visible focus ring in `--plaque-brass`); grid cards get `aria-disabled="true"` (and `tabindex` left in the normal tab order, just inert) while `phase === 'narrowing'`, so assistive tech gets the same "not yet" signal sighted students get from the flat/non-hover styling; the grid container and the parent's-line answer text are both `aria-live="polite"` so a screen reader announces the yes/no answer, the narrowing update, and the solved/failed outcome as they happen; reduced-motion respected as above.

---

## 7. Optional extensions (not in v1)

- Difficulty toggle: 5×5 (25 teachers) vs. a smaller 4×4 grid for younger classes
- Per-class-period leaderboard using the artifact storage API (shared key per class code), tracking **parents helped in 60 seconds** as the headline number, with solve rate and average questions-per-solve as supporting stats
- A brief "what you knew when you clicked" recap on a fail — how many cards were still live, so the odds of that click are visible after the fact

---

Let me know if you want the room-number scheme, the trap questions, or the fail messaging adjusted before I build it.
