// 顶点点阵网格：deepseek.com/harness 主页同款算法。
// 90px 间距的顶点画点 + 点间细线（距点 10px 断开）；鼠标 140px 半径内将点推离，
// 弹簧回位 + 阻尼；30fps 节流；静止时暂停循环省电；触屏 / reduced-motion 只画静态帧。

interface Dot {
  restX: number;
  restY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const SPACING = 90;
const REACT_RADIUS = 140;
const FORCE_SCALE = 30;
const SPRING = 0.05;
const DAMPING = 0.85;
const LINE_GAP = 10;
const MIN_LINE = 20;
const FRAME = 1000 / 30;
const DOT_GLOW_RADIUS = 8;
const DOT_GLOW_DIST = 170; // 磷光只照亮鼠标周围这一点水域

let lineColor = 'hsla(210, 60%, 45%, 0.13)';
let dotColor = 'hsla(210, 60%, 45%, 0.26)';
let dotRadius = 1.6;
let lineWidthPx = 0.55;
let dotGlowAlpha = 0; // 深水磷光强度：仅夜间开启

function readHue(): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--appearance-hue').trim();
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 210;
}

function syncColors() {
  const hue = readHue();
  const dark = document.documentElement.classList.contains('dark');
  if (dark) {
    // 夜间 = 潜入深水：粒子化作磷光浮游生物；整体略暗避免密集感，鼠标扰动处才发光
    lineColor = `hsla(${hue}, 70%, 75%, 0.22)`;
    dotColor = `hsla(${hue}, 85%, 78%, 0.45)`;
    dotRadius = 2.0;
    lineWidthPx = 0.7;
    dotGlowAlpha = 0.18;
  } else {
    lineColor = `hsla(${hue}, 60%, 45%, 0.13)`;
    dotColor = `hsla(${hue}, 60%, 45%, 0.26)`;
    dotRadius = 1.6;
    lineWidthPx = 0.55;
    dotGlowAlpha = 0;
  }
}

let themeObserverBound = false;
function bindThemeObserver() {
  if (themeObserverBound) return;
  themeObserverBound = true;
  const observer = new MutationObserver(() => syncColors());
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

function initialiseDotGrid() {
  syncColors();
  bindThemeObserver();

  const canvas = document.getElementById('dot-grid') as HTMLCanvasElement | null;
  if (!canvas || canvas.dataset.bound === 'true') return; // transition:persist 的 canvas 已绑定过
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.dataset.bound = 'true';

  const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  let cols = 0;
  let rows = 0;
  let left = 0;
  let top = 0;
  let width = 0;
  let height = 0;
  let dots: Dot[] = [];
  let raf = 0;
  let lastFrame = 0;
  const mouse = { x: Number.NaN, y: Number.NaN };

  const build = () => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * DPR);
    canvas.height = Math.round(height * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cols = Math.ceil(width / SPACING) + 1;
    rows = Math.ceil(height / SPACING) + 1;
    left = (width - (cols - 1) * SPACING) / 2;
    top = (height - (rows - 1) * SPACING) / 2;
    dots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = left + SPACING * c;
        const y = top + SPACING * r;
        dots.push({ restX: x, restY: y, x, y, vx: 0, vy: 0 });
      }
    }
    drawFrame();
  };

  const drawFrame = (): number => {
    ctx.clearRect(0, 0, width, height);
    const mx = mouse.x;
    const my = mouse.y;

    // 物理：鼠标推离 + 弹簧回位 + 阻尼
    let maxVel = 0;
    for (const dot of dots) {
      if (Number.isFinite(mx) && Number.isFinite(my)) {
        const dx = dot.x - mx;
        const dy = dot.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REACT_RADIUS && dist > 0.1) {
          const force = (1 - dist / REACT_RADIUS) * FORCE_SCALE;
          dot.vx += (dx / dist) * force * 0.1;
          dot.vy += (dy / dist) * force * 0.1;
        }
      }
      dot.vx += SPRING * (dot.restX - dot.x);
      dot.vy += SPRING * (dot.restY - dot.y);
      dot.vx *= DAMPING;
      dot.vy *= DAMPING;
      dot.x += dot.vx;
      dot.y += dot.vy;
      const speed = Math.abs(dot.vx) + Math.abs(dot.vy);
      if (speed > maxVel) maxVel = speed;
    }

    // 连线（距点 10px 断开）
    const drawSegments = () => {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 1; c++) {
          strokeGap(dots[r * cols + c], dots[r * cols + c + 1]);
        }
      }
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows - 1; r++) {
          strokeGap(dots[r * cols + c], dots[(r + 1) * cols + c]);
        }
      }
    };
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidthPx;
    drawSegments();

    // 顶点圆点（基础层，不泛光）
    ctx.fillStyle = dotColor;
    for (const dot of dots) {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 夜间磷光：只照亮鼠标周围的点（扰动处浮游生物发光），越近越亮，移开即暗
    if (dotGlowAlpha > 0 && Number.isFinite(mx) && Number.isFinite(my)) {
      ctx.fillStyle = dotColor;
      for (const dot of dots) {
        const dx = dot.x - mx;
        const dy = dot.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > DOT_GLOW_DIST) continue;
        const falloff = 1 - dist / DOT_GLOW_DIST;
        ctx.globalAlpha = dotGlowAlpha * 0.55 * falloff;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_GLOW_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = dotGlowAlpha * falloff;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_GLOW_RADIUS * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    return maxVel;
  };

  const strokeGap = (a: Dot, b: Dot) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < MIN_LINE) return;
    const ux = dx / dist;
    const uy = dy / dist;
    ctx.beginPath();
    ctx.moveTo(a.x + LINE_GAP * ux, a.y + LINE_GAP * uy);
    ctx.lineTo(b.x - LINE_GAP * ux, b.y - LINE_GAP * uy);
    ctx.stroke();
  };

  const loop = (time: number) => {
    raf = requestAnimationFrame(loop);
    if (time - lastFrame < FRAME) return;
    lastFrame = time - ((time - lastFrame) % FRAME);
    const maxVel = drawFrame();
    // 全部点静止后暂停循环（省电），鼠标一动再唤醒
    if (maxVel < 0.05) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const onMove = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    if (!raf) raf = requestAnimationFrame(loop);
  };

  const onLeave = () => {
    mouse.x = Number.NaN;
    mouse.y = Number.NaN;
  };

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(build, 150);
  });

  if (!coarse && !reduceMotion) {
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
  }

  build();
}

document.addEventListener('astro:page-load', initialiseDotGrid);
