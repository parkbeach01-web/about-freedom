document.documentElement.classList.add("js");
// 신청서 전송
// Google Apps Script 웹앱 주소를 배포한 뒤 아래 ENDPOINT에 넣습니다. (apps-script/README.md 참고)
// 구글 캘린더 예약 페이지 주소. 넣으면 신청 완료 화면에 통화 예약 버튼이 나옵니다.
const BOOKING_URL = "";
const ENDPOINT = "https://script.google.com/macros/s/AKfycbw7o7JQjhFea9Zp4bNUuRPlT3pdbz9k34oN9cJsy3rhwRkS1bmRV5avsNGuZnQz2myz5w/exec";

(function () {
  const form = document.getElementById("apply-form");
  if (!form) return;
  const status = document.getElementById("form-status");
  const button = form.querySelector('button[type="submit"]');

  const messages = {
    name: "이름을 적어주세요.",
    phone: "연락받을 전화번호를 적어주세요.",
    email: "이메일 주소를 확인해 주세요.",
    age: "나이대를 선택해 주세요.",
    career: "연차를 선택해 주세요.",
    concern: "지금 가장 큰 고민을 한두 줄 적어주세요.",
    mode: "희망 방식을 선택해 주세요.",
    callTime: "통화 가능한 시간대를 적어주세요.",
    consent: "개인정보 수집과 이용에 동의해 주셔야 신청할 수 있습니다."
  };

  function setStatus(text, type) {
    status.textContent = text;
    status.className = "form-status" + (type ? " is-" + type : "");
  }

  function firstInvalid() {
    form.querySelectorAll(".has-error").forEach(el => el.classList.remove("has-error"));
    for (const el of form.elements) {
      if (!el.name || !el.required) continue;
      if (el.type === "radio") {
        const group = form.querySelectorAll(`input[name="${el.name}"]`);
        if (![...group].some(r => r.checked)) return el;
        continue;
      }
      if (!el.checkValidity()) return el;
    }
    return null;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const bad = firstInvalid();
    if (bad) {
      const field = bad.closest(".field");
      if (field) field.classList.add("has-error");
      setStatus(messages[bad.name] || "빠진 항목을 확인해 주세요.", "error");
      bad.focus();
      return;
    }
    if (form.website.value) return; // 스팸 방지용 숨은 칸

    if (!ENDPOINT) {
      setStatus("신청 접수를 준비하고 있습니다. 곧 열겠습니다.", "error");
      return;
    }

    const data = new URLSearchParams();
    for (const [k, v] of new FormData(form)) if (k !== "website") data.append(k, v);
    data.append("page", location.href);

    button.disabled = true;
    button.textContent = "보내는 중입니다";
    setStatus("");
    try {
      await fetch(ENDPOINT, { method: "POST", mode: "no-cors", body: data });
      form.reset();
      if (BOOKING_URL) {
        setStatus("신청서를 받았습니다. 이어서 첫 통화(10~15분) 시간을 골라주세요.", "ok");
        const next = document.getElementById("booking-next");
        next.querySelector("a").href = BOOKING_URL;
        next.hidden = false;
        next.querySelector("a").focus();
      } else {
        setStatus("신청서를 받았습니다. 확인 후 적어주신 연락처로 직접 연락드리겠습니다.", "ok");
      }
    } catch (err) {
      setStatus("신청서를 보내지 못했습니다. 인터넷 연결을 확인하고 다시 보내주세요.", "error");
    } finally {
      button.disabled = false;
      button.textContent = "신청서 보내기";
    }
  });
})();

// 강의와 워크숍 사진 캐러셀
(function () {
  const track = document.getElementById("carousel");
  if (!track) return;
  const buttons = document.querySelectorAll(".car-btn");
  function update() {
    const max = track.scrollWidth - track.clientWidth - 2;
    buttons.forEach(b => { b.disabled = b.dataset.dir === "-1" ? track.scrollLeft <= 2 : track.scrollLeft >= max; });
  }
  buttons.forEach(b => b.addEventListener("click", () => {
    track.scrollBy({ left: Number(b.dataset.dir) * track.clientWidth * 0.8 });
  }));
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  track.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") track.scrollBy({ left: 300 });
    if (e.key === "ArrowLeft") track.scrollBy({ left: -300 });
  });
  update();
  window.addEventListener("load", update);
})();


// 일곱 가지 질문: 서로 이어진 원들이 떠다니고, 누른 원이 커짐
(function () {
  const svg = document.querySelector(".rings-svg");
  const orbs = Array.from(document.querySelectorAll(".orb"));
  const items = document.querySelectorAll("#toc > li");
  const nav = document.querySelector(".rings-nav");
  const cur = document.getElementById("rings-cur");
  if (!svg || orbs.length !== 7 || items.length !== 7) return;
  nav.hidden = false;
  const NS = "http://www.w3.org/2000/svg";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nodes = orbs.map((g, i) => {
    const c = g.querySelector("circle"), t = g.querySelector("text");
    const bx = +c.getAttribute("cx"), by = +c.getAttribute("cy"), br = +c.getAttribute("r");
    return { g, c, t, bx, by, br, x: bx, y: by, vx: 0, vy: 0, r: br, tr: br,
      p1: i * 1.7, p2: i * 2.3 + 1, s1: 0.00045 + i * 0.00004, s2: 0.00038 + i * 0.00005 };
  });
  const edges = [[0,1],[0,3],[0,4],[1,2],[1,3],[2,3],[2,6],[3,4],[3,5],[5,6],[2,5]];
  const linkG = svg.querySelector(".links");
  const lines = edges.map(() => { const l = document.createElementNS(NS, "line"); linkG.appendChild(l); return l; });
  let step = 1;

  function show(n) {
    step = ((n - 1 + 7) % 7) + 1;
    nodes.forEach((d, i) => {
      const on = i + 1 === step;
      d.g.classList.toggle("is-active", on);
      d.g.setAttribute("aria-pressed", on ? "true" : "false");
      d.tr = on ? d.br * 1.32 : d.br * 0.88;
      if (on) cur.textContent = d.t.textContent;
    });
    lines.forEach((l, k) => l.classList.toggle("is-on", edges[k].includes(step - 1)));
    items.forEach((li, i) => li.classList.toggle("is-active", i + 1 === step));
    if (reduce) { nodes.forEach((d) => { d.r = d.tr; }); settle(); draw(); }
  }

  function draw() {
    nodes.forEach((d) => {
      d.c.setAttribute("cx", d.x.toFixed(1)); d.c.setAttribute("cy", d.y.toFixed(1)); d.c.setAttribute("r", d.r.toFixed(1));
      d.t.setAttribute("x", d.x.toFixed(1)); d.t.setAttribute("y", d.y.toFixed(1));
    });
    lines.forEach((l, k) => {
      const a = nodes[edges[k][0]], b = nodes[edges[k][1]];
      l.setAttribute("x1", a.x.toFixed(1)); l.setAttribute("y1", a.y.toFixed(1));
      l.setAttribute("x2", b.x.toFixed(1)); l.setAttribute("y2", b.y.toFixed(1));
    });
  }

  function physics(time, k) {
    nodes.forEach((d) => {
      d.r += (d.tr - d.r) * 0.12 * k;
      const fx = d.bx + (reduce ? 0 : Math.sin(time * d.s1 + d.p1) * 7);
      const fy = d.by + (reduce ? 0 : Math.cos(time * d.s2 + d.p2) * 7);
      d.vx += (fx - d.x) * 0.02 * k; d.vy += (fy - d.y) * 0.02 * k;
    });
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || 1, min = a.r + b.r + 10;
      if (dist < min) {
        const push = (min - dist) * 0.08 * k, ux = dx / dist, uy = dy / dist;
        a.vx -= ux * push; a.vy -= uy * push; b.vx += ux * push; b.vy += uy * push;
      }
    }
    nodes.forEach((d) => {
      d.vx *= 0.82; d.vy *= 0.82; d.x += d.vx * k; d.y += d.vy * k;
      d.x = Math.min(400 - d.r * 0.6, Math.max(d.r * 0.6, d.x));
      d.y = Math.min(400 - d.r * 0.6, Math.max(d.r * 0.6, d.y));
    });
  }
  function settle() { for (let i = 0; i < 240; i++) physics(0, 1); }

  let visible = false, last = 0, raf = 0;
  function loop(t) {
    const k = last ? Math.min(2, (t - last) / 16.7) : 1; last = t;
    physics(t, k); draw();
    raf = visible ? requestAnimationFrame(loop) : 0;
  }
  if (!reduce && "IntersectionObserver" in window) {
    new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible && !raf) { last = 0; raf = requestAnimationFrame(loop); }
    }).observe(svg);
  }

  orbs.forEach((g, i) => {
    g.addEventListener("click", () => show(i + 1));
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(i + 1); } });
  });
  nav.querySelectorAll(".rings-btn").forEach((b) => b.addEventListener("click", () => show(step + Number(b.dataset.dir))));
  show(1);
  if (reduce) { settle(); draw(); }
})();
