// Космос за комнатой: отдельный 2D-холст позади WebGL. Звёзды мерцают, планеты размыты,
// астероиды дрейфуют, комета раз в 40–90 с, вокруг комнаты — тёплое свечение-«рамка».
const rnd = (a, b) => a + Math.random() * (b - a);

export function initSpace() {
  const c = document.createElement("canvas");
  c.id = "space"; document.body.prepend(c);
  const x = c.getContext("2d");
  const bg = document.createElement("canvas"), bx = bg.getContext("2d");
  let W = 0, H = 0, stars = [], rocks = [], comet = null;
  let nextComet = performance.now() + rnd(40000, 90000);

  function planet(px, py, r, c1, c2, ring) {
    bx.save();
    bx.shadowColor = c1; bx.shadowBlur = r * 0.6;
    const g = bx.createRadialGradient(px - r * 0.35, py - r * 0.35, r * 0.1, px, py, r);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    bx.globalAlpha = 0.42; bx.fillStyle = g;
    bx.beginPath(); bx.arc(px, py, r, 0, 6.2832); bx.fill();
    bx.shadowBlur = 0;
    // полосы на планете
    bx.globalAlpha = 0.07; bx.strokeStyle = "#000"; bx.lineWidth = r * 0.08;
    bx.save(); bx.beginPath(); bx.arc(px, py, r, 0, 6.2832); bx.clip();
    for (let k = -2; k <= 2; k++) { bx.beginPath(); bx.ellipse(px, py + k * r * 0.32, r * 1.1, r * 0.12, -0.25, 0, 6.2832); bx.stroke(); }
    bx.restore();
    if (ring) {
      bx.globalAlpha = 0.3; bx.strokeStyle = c1; bx.lineWidth = r * 0.06;
      bx.beginPath(); bx.ellipse(px, py, r * 1.7, r * 0.4, -0.3, 0, 6.2832); bx.stroke();
    }
    bx.restore();
  }

  function build() {
    W = c.width = bg.width = innerWidth; H = c.height = bg.height = innerHeight;
    // небо: глубокий индиго, к низу — фиолетовый с намёком на рассвет
    const g = bx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#07061a"); g.addColorStop(0.6, "#120d2e"); g.addColorStop(1, "#24123a");
    bx.fillStyle = g; bx.fillRect(0, 0, W, H);
    // туманности
    for (let i = 0; i < 6; i++) {
      const nx = rnd(0, W), ny = rnd(0, H), nr = rnd(0.15, 0.35) * Math.max(W, H);
      const ng = bx.createRadialGradient(nx, ny, 0, nx, ny, nr);
      const col = ["120,60,160", "60,80,170", "200,90,110"][i % 3];
      ng.addColorStop(0, `rgba(${col},.08)`); ng.addColorStop(1, `rgba(${col},0)`);
      bx.fillStyle = ng; bx.fillRect(0, 0, W, H);
    }
    const m = Math.min(W, H);
    planet(W * 0.9, H * 0.86, m * 0.2, "#ff9a6a", "#5a1d3a");
    planet(W * 0.1, H * 0.16, m * 0.06, "#8fd0d8", "#1d3a5a", true);
    planet(W * 0.78, H * 0.12, m * 0.025, "#d8c0ff", "#3a2a6a");
    // свечение вокруг комнаты
    const cx = W * 0.5, cy = H * 0.5, rg = bx.createRadialGradient(cx, cy, m * 0.25, cx, cy, Math.hypot(W, H) * 0.55);
    rg.addColorStop(0, "rgba(255,170,120,.16)"); rg.addColorStop(0.5, "rgba(190,90,130,.07)"); rg.addColorStop(1, "rgba(0,0,0,0)");
    bx.fillStyle = rg; bx.fillRect(0, 0, W, H);

    stars = Array.from({ length: Math.round(W * H / 5000) }, () => ({
      x: rnd(0, W), y: rnd(0, H), r: Math.random() < 0.9 ? rnd(0.4, 1.1) : rnd(1.2, 1.8),
      a: rnd(0.25, 0.8), ph: rnd(0, 6.28), sp: rnd(0.4, 1.6), warm: Math.random() < 0.25,
      d: rnd(0.3, 1), jx: rnd(0, 6.28), jy: rnd(0, 6.28), flare: Math.random() < 0.04, // глубина (параллакс), фаза дрожи, редкие «вспышки»
    }));
    rocks = Array.from({ length: 7 }, () => {
      const n = 7 + (Math.random() * 4 | 0), s = rnd(3, 9);
      return { x: rnd(0, W), y: rnd(0, H), vx: rnd(-6, 6), vy: rnd(-3, 3), rot: rnd(0, 6), vr: rnd(-0.3, 0.3),
        pts: Array.from({ length: n }, (_, i) => [i / n * 6.2832, s * rnd(0.65, 1.2)]) };
    });
  }

  let last = performance.now(), acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now; acc += dt;
    if (acc < 1 / 30) return; // хватает 30 кадров
    const step = acc; acc = 0;
    x.drawImage(bg, 0, 0);
    const ts = now / 1000;
    // звёзды едва заметно плывут (ближние быстрее), подрагивают и мерцают; редкие яркие — с лучиками
    const drift = ts * 2.2;
    for (const s of stars) {
      const px = ((s.x + drift * s.d + Math.sin(ts * 0.9 + s.jx) * 0.35) % W + W) % W;
      const py = ((s.y + drift * s.d * 0.35 + Math.sin(ts * 1.1 + s.jy) * 0.35) % H + H) % H;
      const tw = 0.5 + 0.5 * Math.sin(ts * s.sp + s.ph);
      x.globalAlpha = s.a * (0.35 + 0.65 * tw * tw);
      x.fillStyle = s.warm ? "#ffd9b0" : "#e8ecff";
      x.beginPath(); x.arc(px, py, s.r, 0, 6.2832); x.fill();
      if (s.flare && tw > 0.8) {
        const L = s.r * 5 * (tw - 0.8) * 5; x.globalAlpha = s.a * (tw - 0.8) * 3; x.strokeStyle = x.fillStyle; x.lineWidth = 0.6;
        x.beginPath(); x.moveTo(px - L, py); x.lineTo(px + L, py); x.moveTo(px, py - L); x.lineTo(px, py + L); x.stroke();
      }
    }
    x.globalAlpha = 0.55; x.fillStyle = "#6e6070"; x.strokeStyle = "#a89aa0"; x.lineWidth = 0.6;
    for (const r of rocks) {
      r.x += r.vx * step; r.y += r.vy * step; r.rot += r.vr * step;
      if (r.x < -20) r.x = W + 20; if (r.x > W + 20) r.x = -20; if (r.y < -20) r.y = H + 20; if (r.y > H + 20) r.y = -20;
      x.beginPath();
      r.pts.forEach(([a, d], i) => { const px = r.x + Math.cos(a + r.rot) * d, py = r.y + Math.sin(a + r.rot) * d; i ? x.lineTo(px, py) : x.moveTo(px, py); });
      x.closePath(); x.fill(); x.stroke();
    }
    if (!comet && now > nextComet) {
      const fromLeft = Math.random() < 0.5;
      comet = { t0: now, dur: rnd(2200, 3200), x0: fromLeft ? rnd(-0.1, 0.3) * W : rnd(0.7, 1.1) * W, y0: rnd(-0.05, 0.2) * H,
        dx: (fromLeft ? 1 : -1) * rnd(0.4, 0.6) * W, dy: rnd(0.25, 0.45) * H };
    }
    if (comet) {
      const p = (now - comet.t0) / comet.dur;
      if (p >= 1) { comet = null; nextComet = now + rnd(40000, 90000); }
      else {
        const hx = comet.x0 + comet.dx * p, hy = comet.y0 + comet.dy * p, len = 0.25;
        const tx = hx - comet.dx * len, ty = hy - comet.dy * len;
        const fade = Math.sin(p * Math.PI);
        const cg = x.createLinearGradient(hx, hy, tx, ty);
        cg.addColorStop(0, `rgba(255,240,220,${0.8 * fade})`); cg.addColorStop(1, "rgba(255,180,140,0)");
        x.globalAlpha = 1; x.strokeStyle = cg; x.lineWidth = 2.2; x.lineCap = "round";
        x.beginPath(); x.moveTo(hx, hy); x.lineTo(tx, ty); x.stroke();
        x.fillStyle = `rgba(255,250,240,${fade})`; x.beginPath(); x.arc(hx, hy, 2.2, 0, 6.2832); x.fill();
      }
    }
    x.globalAlpha = 1;
  }
  addEventListener("resize", build); build();
  requestAnimationFrame(frame);
  return { cometNow: () => { nextComet = 0; } }; // для отладки
}
