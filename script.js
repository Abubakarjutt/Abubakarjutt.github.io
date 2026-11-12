// ── Station clock: Islamabad time, so visitors can see his working hours ──
// Runs first so nothing later in this file can stop it. Without the script
// the cell keeps its static "UTC+5", which is still true.
const clock = document.querySelector("[data-clock]");
if (clock) {
  // 12-hour clock, e.g. "9:05 PM".
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const tick = () => {
    const now = new Date();
    clock.textContent = format.format(now);
    clock.dateTime = now.toISOString();
  };
  tick();
  setInterval(tick, 15000);
}

const header = document.querySelector(".site-header");
const nav = document.getElementById("primary-nav");
const navToggle = document.getElementById("primary-nav-toggle");
const year = document.getElementById("year");

// Mobile menu.
if (nav && navToggle) {
  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.textContent = open ? "Close" : "Menu";
  };

  navToggle.addEventListener("click", () => {
    setOpen(!nav.classList.contains("is-open"));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      navToggle.focus();
    }
  });
}

// Show a hairline under the header once the page has scrolled.
if (header) {
  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

if (year) {
  year.textContent = String(new Date().getFullYear());
}

// Highlight the nav link for the section currently being read.
// Called with the id of the section that has entered view (e.g. "work").
// An id with no matching link (the hero has none) clears the highlight.
// CSS styles `.nav a[aria-current="location"]`.
const sectionLinks = document.querySelectorAll(".nav a");

function updateActiveNav(sectionId) {
  const target = sectionId ? `#${sectionId}` : null;
  for (const link of sectionLinks) {
    if (link.getAttribute("href") === target) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

const trackedSections = document.querySelectorAll("main section");
if (sectionLinks.length && trackedSections.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) updateActiveNav(entry.target.id);
      }
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  for (const section of trackedSections) sectionObserver.observe(section);
}

// ── Scroll-linked motion ───────────────────────────────────
// Each [data-scroll] element gets --p (0 to 1): how far it has travelled
// through its scroll range. CSS turns --p into motion, so scrolling back up
// plays everything in reverse. Ranges, measured against the viewport:
//   enter   – 0 as the element's top enters at the bottom, 1 at 45% from the top
//   through – follows a reading line 60% down the screen, top to bottom
//   exit    – 0 at rest, 1 once the element has scrolled fully away
const scrollTargets = Array.from(document.querySelectorAll("[data-scroll]"));
const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const READING_LINE = 0.6;

const scrollRanges = {
  enter: (rect, vh) => (vh - rect.top) / (vh * 0.55),
  through: (rect, vh) => (vh * READING_LINE - rect.top) / rect.height,
  exit: (rect) => -rect.top / rect.height,
};

const timelineEntries = document.querySelectorAll(".timeline-entry");
if (!motionOK) {
  // Reduced motion: show the career rail complete rather than tracking scroll.
  for (const entry of timelineEntries) entry.classList.add("is-reached");
}
let scrollFrame = 0;

function updateScrollMotion() {
  scrollFrame = 0;
  const vh = window.innerHeight;
  const root = document.documentElement;
  const maxScroll = root.scrollHeight - vh;
  root.style.setProperty("--page-p", maxScroll > 0 ? (window.scrollY / maxScroll).toFixed(4) : "0");

  if (!motionOK) return;

  for (const el of scrollTargets) {
    const rect = el.getBoundingClientRect();
    // Skip work for elements well outside the viewport.
    if (rect.bottom < -vh || rect.top > vh * 2) continue;
    const p = Math.min(Math.max(scrollRanges[el.dataset.scroll](rect, vh), 0), 1);
    el.style.setProperty("--p", p.toFixed(4));
  }

  for (const entry of timelineEntries) {
    entry.classList.toggle("is-reached", entry.getBoundingClientRect().top < vh * READING_LINE);
  }
}

const requestScrollUpdate = () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollMotion);
};

window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);
updateScrollMotion();

// ── Project drawings: run their CSS loops only while on screen ──
const projectVisuals = document.querySelectorAll(".project-visual");
if (projectVisuals.length) {
  const visualObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle("is-playing", entry.isIntersecting);
      }
    },
    { threshold: 0.2 }
  );
  for (const visual of projectVisuals) visualObserver.observe(visual);
}

// ── "In practice" film ─────────────────────────────────────
// A looping replay of a question moving through the assistant.
// Sample questions and data only; the page labels it as illustrative.
const filmEpisodes = [
  {
    question: "Which regions missed their sales target last quarter?",
    sql: [
      "SELECT region,",
      "  ROUND(100.0 * SUM(revenue)",
      "    / SUM(target)) AS pct",
      "FROM sales.quarterly",
      "WHERE quarter = '2026-Q3'",
      "GROUP BY region",
      "ORDER BY pct;",
    ],
    bars: [["North", 88], ["Central", 94], ["South", 103], ["East", 109]],
    max: 120,
    target: 100,
    unit: "%",
    answer: "Two regions missed target: North reached 88% and Central 94%.",
  },
  {
    question: "Which business lines grew fastest year over year?",
    sql: [
      "SELECT business_line,",
      "  ROUND(100.0 * (rev_2026",
      "    - rev_2025) / rev_2025) AS growth",
      "FROM finance.revenue_by_line",
      "ORDER BY growth DESC",
      "LIMIT 4;",
    ],
    bars: [["Retail", 21], ["Logistics", 14], ["Energy", 9], ["Foods", 6]],
    max: 25,
    unit: "%",
    answer: "Retail grew fastest at 21%, ahead of Logistics at 14%.",
  },
];

// ── Shared playback for the looping panels (demo and terminal) ──
// Returns a tween() clock that only advances while the panel is on screen,
// the tab is visible, and the viewer hasn't pressed Pause. While it can't
// advance it sleeps on a promise instead of spinning animation frames;
// anything that might let it run again calls wake().
function createPlayback(root, toggle, toggleLabel) {
  let userPaused = false;
  let onScreen = false;
  let resolveWake = null;
  const isRunning = () => !userPaused && onScreen && !document.hidden;
  const waitForWake = () => new Promise((resolve) => (resolveWake = resolve));
  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

  const wake = () => {
    if (resolveWake && isRunning()) {
      resolveWake();
      resolveWake = null;
    }
  };

  document.addEventListener("visibilitychange", wake);

  new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      wake();
    },
    { threshold: 0.3 }
  ).observe(root);

  if (toggle) {
    toggle.addEventListener("click", () => {
      userPaused = !userPaused;
      root.classList.toggle("is-paused", userPaused);
      toggle.textContent = userPaused ? "Play" : "Pause";
      toggle.setAttribute("aria-label", `${userPaused ? "Play" : "Pause"} ${toggleLabel}`);
      wake();
    });
  }

  async function tween(duration, onFrame) {
    let elapsed = 0;
    let last = performance.now();
    while (elapsed < duration) {
      if (!isRunning()) {
        await waitForWake();
        last = performance.now();
        continue;
      }
      await nextFrame();
      const now = performance.now();
      elapsed += Math.min(now - last, 64);
      last = now;
      if (onFrame) onFrame(Math.min(elapsed / duration, 1));
    }
  }

  return { tween };
}

const film = document.querySelector("[data-film]");
if (film) runFilm(film, filmEpisodes);

// ── Terminal: a sample release session, typed and printed live ──
// Steps: "cmd" types after a prompt; "out" prints a line; "progress" fills a
// bar; "spark" draws a sparkline. Markup in `html`/`label`/`suffix` is the
// page's own constant content, never user input.
const terminalSession = [
  { type: "cmd", text: "ml eval --suite sql-regression" },
  { type: "progress", label: "  412 cases on staging  ", width: 10, duration: 1800 },
  { type: "out", html: '  <span class="t-ok">✓</span> execution accuracy   94.2%  <span class="t-dim">(was 93.8)</span>' },
  { type: "out", html: '  <span class="t-ok">✓</span> answer faithfulness  97.1%' },
  { type: "out", html: '  <span class="t-ok">✓</span> p95 latency          1.8 s' },
  { type: "cmd", text: "ml deploy --canary 10%" },
  { type: "out", html: '  v2.4 on 10% of traffic <span class="t-dim">…</span> healthy', delay: 900 },
  { type: "out", html: "  promoted to 100%", delay: 700 },
  { type: "cmd", text: "ml monitor --drift" },
  { type: "spark", label: "  input drift (PSI)   0.04  ", values: [1, 2, 2, 3, 2, 2, 1, 2], suffix: '  <span class="t-ok">ok</span>' },
  { type: "out", html: "  schema changes      none" },
  { type: "out", html: '  next retrain        <span class="t-dim">Sun 02:00 PKT</span>' },
];

const terminal = document.querySelector("[data-terminal]");
if (terminal) runTerminal(terminal, terminalSession);

function runTerminal(root, session) {
  const screen = root.querySelector(".terminal-screen");
  const toggle = root.querySelector(".terminal-toggle");

  // Reduced motion: keep the finished transcript that ships in the HTML.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    if (toggle) toggle.hidden = true;
    return;
  }

  const { tween } = createPlayback(root, toggle, "the terminal session");
  const caret = document.createElement("span");
  caret.className = "terminal-caret";

  const addLine = (extraClass = "") => {
    const line = document.createElement("p");
    line.className = `terminal-line ${extraClass}`.trim();
    screen.append(line);
    return line;
  };

  // A fresh prompt line with the caret at the end; returns the typing target.
  const newPrompt = () => {
    const line = addLine("t-cmd");
    line.innerHTML = '<span class="t-prompt">$</span> ';
    const typed = document.createElement("span");
    line.append(typed, caret);
    return typed;
  };

  async function runStep(step) {
    if (step.type === "cmd") {
      const typed = newPrompt();
      await tween(450);
      await tween(step.text.length * 45, (t) => {
        typed.textContent = step.text.slice(0, Math.round(t * step.text.length));
      });
      await tween(400);
      caret.remove();
    } else if (step.type === "progress") {
      const line = addLine();
      await tween(step.duration, (t) => {
        const filled = Math.round(t * step.width);
        const pct = String(Math.round(t * 100)).padStart(3, " ");
        line.innerHTML = `${step.label}<span class="t-bar">${"█".repeat(filled)}</span><span class="t-dim">${"░".repeat(step.width - filled)}</span> ${pct}%`;
      });
      await tween(250);
    } else if (step.type === "spark") {
      const line = addLine();
      const count = step.values.length;
      await tween(1000, (t) => {
        const shown = Math.round(t * count);
        line.innerHTML = `${step.label}<span class="t-spark">${step.values.slice(0, shown).map((v) => `<i style="--v:${v}"></i>`).join("")}</span>${shown === count ? step.suffix : ""}`;
      });
      await tween(200);
    } else {
      await tween(step.delay || 140);
      addLine().innerHTML = step.html;
    }
  }

  async function play() {
    screen.textContent = "";
    root.classList.remove("is-fading");
    await tween(300);
    for (const step of session) await runStep(step);
    newPrompt(); // idle prompt, caret blinking
    await tween(4500);
    root.classList.add("is-fading");
    await tween(600);
  }

  (async () => {
    for (;;) await play();
  })();
}

function runFilm(root, episodes) {
  const stage = root.querySelector(".film-stage");
  const question = root.querySelector(".film-question-text");
  const nodes = Array.from(root.querySelectorAll(".film-node"));
  const trackFill = root.querySelector(".film-track-fill");
  const sql = root.querySelector(".film-sql");
  const bars = root.querySelector(".film-bars");
  const answer = root.querySelector(".film-answer");
  const toggle = root.querySelector(".film-toggle");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const typeText = (el, text, msPerChar) =>
    tween(text.length * msPerChar, (t) => {
      el.textContent = text.slice(0, Math.round(t * text.length));
    });

  const escapeHtml = (s) =>
    s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const SQL_KEYWORDS = /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|AS|DESC|SUM|ROUND)\b/g;
  const highlight = (line) => escapeHtml(line).replace(SQL_KEYWORDS, '<span class="film-kw">$1</span>');

  function setStep(index) {
    nodes.forEach((node, i) => {
      node.classList.toggle("is-done", i < index);
      node.classList.toggle("is-active", i === index);
    });
  }

  const setProgress = (p) => {
    trackFill.style.transform = `scaleX(${p})`;
  };

  async function advanceTo(index) {
    const span = nodes.length - 1;
    if (index > 0) {
      const from = (index - 1) / span;
      const to = index / span;
      await tween(500, (t) => setProgress(from + (to - from) * easeOut(t)));
    }
    setStep(index);
  }

  function buildBars(episode) {
    bars.textContent = "";
    return episode.bars.map(([label, value]) => {
      const row = document.createElement("div");
      row.className = "film-bar";
      if (episode.target && value < episode.target) row.classList.add("is-miss");

      const name = document.createElement("span");
      name.textContent = label;
      const track = document.createElement("span");
      track.className = "film-bar-track";
      const fill = document.createElement("span");
      fill.className = "film-bar-fill";
      track.append(fill);
      if (episode.target) {
        const marker = document.createElement("span");
        marker.className = "film-bar-target";
        marker.style.left = `${(episode.target / episode.max) * 100}%`;
        track.append(marker);
      }
      const amount = document.createElement("span");
      amount.className = "film-bar-value";

      row.append(name, track, amount);
      bars.append(row);
      return { value, fill, amount };
    });
  }

  function drawBars(rows, episode, t) {
    for (const row of rows) {
      const shown = row.value * t;
      row.fill.style.width = `${(shown / episode.max) * 100}%`;
      row.amount.textContent = t > 0 ? `${Math.round(shown)}${episode.unit}` : "";
    }
  }

  function reset(episode) {
    question.textContent = "";
    sql.textContent = "";
    answer.textContent = "";
    setStep(-1);
    setProgress(0);
    const rows = buildBars(episode);
    drawBars(rows, episode, 0);
    return rows;
  }

  async function typeSql(lines) {
    for (const line of lines) {
      const row = document.createElement("span");
      row.className = "film-sql-line";
      sql.append(row);
      await typeText(row, line, 16);
      row.innerHTML = highlight(line);
    }
  }

  async function play(episode) {
    const rows = reset(episode);
    stage.classList.remove("is-fading");
    await tween(400);

    await advanceTo(0);
    await typeText(question, episode.question, 42);
    await tween(700);

    await advanceTo(1);
    await typeSql(episode.sql);
    await tween(500);

    await advanceTo(2);
    await tween(1200, (t) => drawBars(rows, episode, easeOut(t)));
    await tween(400);

    await advanceTo(3);
    await typeText(answer, episode.answer, 28);
    setStep(nodes.length);
    await tween(3800);

    stage.classList.add("is-fading");
    await tween(600);
  }

  // Reduced motion: show one finished frame and no controls.
  if (reduceMotion) {
    const episode = episodes[0];
    const rows = reset(episode);
    question.textContent = episode.question;
    sql.innerHTML = episode.sql.map((line) => `<span class="film-sql-line">${highlight(line)}</span>`).join("");
    drawBars(rows, episode, 1);
    answer.textContent = episode.answer;
    setStep(nodes.length);
    setProgress(1);
    toggle.hidden = true;
    return;
  }

  const { tween } = createPlayback(root, toggle, "the example animation");

  (async () => {
    for (let i = 0; ; i = (i + 1) % episodes.length) {
      await play(episodes[i]);
    }
  })();
}
