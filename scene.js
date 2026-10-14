// Объёмная сцена «периметр компании» для первого экрана.
import * as THREE from './vendor/three.module.min.js';

const host = document.querySelector('.scene');
const canvas = host.querySelector('canvas');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
} catch (e) {
  // без WebGL (нет видеокарты, отключено политикой) показываем снимок сцены
  host.classList.add('still-on');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
// ракурсы: точка, куда смотрит камера, и сколько сцены видно (ширина, высота)
const VIEWS = {
  all: { t: [0, -1.5, 0], w: 30, h: 22 },
  servers: { t: [-3.2, 1.0, -3.4], w: 21, h: 15 },
  apps: { t: [1.2, 0, 2.4], w: 24, h: 17 },
};
const view = VIEWS[host.dataset.view] || VIEWS.all;
cam.position.set(view.t[0] + 30, view.t[1] + 26, view.t[2] + 30);
cam.lookAt(...view.t);
cam.updateMatrixWorld();

scene.add(new THREE.HemisphereLight(0xffffff, 0xc9d4e8, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 2.1);
sun.position.set(-14, 26, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 80 });
sun.shadow.radius = 6;
sun.shadow.bias = -0.0004;
scene.add(sun);

const BLUE = 0x0f62fe;
const clay = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0 });
const clay2 = new THREE.MeshStandardMaterial({ color: 0xf1f4f9, roughness: 0.9 });
const slot = new THREE.MeshStandardMaterial({ color: 0xc8d0dd, roughness: 0.8 });
const glass = new THREE.MeshPhysicalMaterial({ color: BLUE, roughness: 0.18, metalness: 0.05, transparent: true, opacity: 0.82, clearcoat: 1, clearcoatRoughness: 0.2 });
const glassSoft = new THREE.MeshPhysicalMaterial({ color: 0x78a9ff, roughness: 0.25, transparent: true, opacity: 0.55, clearcoat: 1 });
const edgeMat = new THREE.LineBasicMaterial({ color: 0xb9c3d3, transparent: true, opacity: 0.55 });

function box(w, h, d, mat = clay, x = 0, y = 0, z = 0, edges = true) {
  const g = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true;
  if (edges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), edgeMat));
  scene.add(m);
  return m;
}

// пол с мягкой тенью
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.1 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.01;
floor.receiveShadow = true;
scene.add(floor);

// площадка компании и периметр
box(22, 0.7, 16, clay, 0, 0, 0);
const P = 0.7;
const wallMat = new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false });
const wall = new THREE.Mesh(new THREE.BoxGeometry(21.2, 2.4, 15.2, 1, 1, 1), wallMat);
wall.position.set(0, P + 1.2, 0);
scene.add(wall);
const rim = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(21.2, 2.4, 15.2)), new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0.55 }));
rim.position.copy(wall.position);
scene.add(rim);

// серверы: ряд стоек
const servers = new THREE.Group();
for (let i = 0; i < 5; i++) {
  const x = -8.2 + i * 1.9, z = -5.2;
  box(1.5, 3.4, 1.6, clay, x, P, z);
  for (let k = 0; k < 6; k++) box(1.2, 0.08, 0.02, slot, x, P + 0.45 + k * 0.48, z + 0.81, false);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), new THREE.MeshBasicMaterial({ color: BLUE }));
  led.position.set(x + 0.5, P + 3.0, z + 0.83);
  scene.add(led); servers.add(led);
}

// ядро Атриума
const core = box(5.2, 0.5, 5.2, clay2, 1.2, P, 0.2);
const coreTop = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.25, 64), glass);
coreTop.position.set(1.2, P + 0.62, 0.2); coreTop.castShadow = true; scene.add(coreTop);
const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.05, 12, 96), new THREE.MeshBasicMaterial({ color: BLUE }));
ring.rotation.x = Math.PI / 2; ring.position.set(1.2, P + 0.56, 0.2); scene.add(ring);

// журнал: стопка листов
const log = new THREE.Group();
for (let k = 0; k < 6; k++) { const s = box(1.8, 0.12, 2.3, k % 2 ? clay2 : clay, 4.4, P + 0.5 + k * 0.17, 1.6); log.add(s); }

// модели: кубы на постаментах
const models = [];
[[6.6, -4.2], [8.6, -4.2], [6.6, -1.9], [8.6, -1.9], [7.6, 0.4]].forEach(([x, z], i) => {
  box(1.4, 0.35, 1.4, clay2, x, P, z);
  const c = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), i === 4 ? glassSoft : glass);
  c.position.set(x, P + 1.35, z); c.castShadow = true; scene.add(c);
  models.push({ m: c, y: c.position.y, ph: i * 1.3 });
});

// команды: рабочие места
[[-7.5, 3.6], [-4.6, 3.6], [-7.5, 6.0], [-4.6, 6.0]].forEach(([x, z]) => {
  box(2.0, 0.9, 1.3, clay, x, P, z);
  box(1.0, 0.7, 0.08, clay2, x, P + 0.9, z - 0.35);
});

// программы компании
box(2.6, 1.6, 2.0, clay, 6.4, P, 5.0);
box(2.0, 0.08, 1.4, slot, 6.4, P + 1.6, 5.0, false);

// дорожки потока
const paths = [
  [[-6, P + 0.05, 2.6], [-1.5, P + 0.05, 2.6], [-1.5, P + 0.05, 0.2], [-0.4, P + 0.05, 0.2]],
  [[6.4, P + 0.05, 3.8], [6.4, P + 0.05, 2.9], [2.8, P + 0.05, 2.9], [2.8, P + 0.05, 1.9]],
  [[2.8, P + 0.05, -1.5], [2.8, P + 0.05, -3], [5.8, P + 0.05, -3]],
  [[-4.4, P + 0.05, -4.2], [-4.4, P + 0.05, -1.4], [-0.6, P + 0.05, -1.4]],
];
const lineMat = new THREE.LineDashedMaterial({ color: 0x8fb3ff, dashSize: 0.25, gapSize: 0.18 });
const curves = paths.map(p => {
  const pts = p.map(v => new THREE.Vector3(...v));
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
  l.computeLineDistances(); scene.add(l);
  const cp = new THREE.CurvePath();
  pts.slice(1).forEach((b, i) => cp.add(new THREE.LineCurve3(pts[i], b)));
  return cp;
});
const pulses = curves.map((c, i) => {
  const s = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), new THREE.MeshBasicMaterial({ color: BLUE }));
  scene.add(s); return { s, c, t: i * 0.27 };
});

// интернет снаружи периметра: оборванная связь
const cut = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-11, 1.6, 5), new THREE.Vector3(-14.5, 1.6, 8.5)]), new THREE.LineDashedMaterial({ color: 0xa8a8a8, dashSize: 0.3, gapSize: 0.25 }));
cut.computeLineDistances(); scene.add(cut);

// метки: привязка HTML к точкам сцены
const anchors = {
  data: new THREE.Vector3(-6.3, P + 4.4, -5.2),
  model: new THREE.Vector3(7.6, P + 3.0, -2.2),
  access: new THREE.Vector3(1.2, P + 0.8, 0.2),
  trace: new THREE.Vector3(4.4, P + 1.6, 1.6),
  rack: new THREE.Vector3(-4.4, P + 3.6, -5.2),
  core: new THREE.Vector3(1.2, P + 0.8, 0.2),
  apps: new THREE.Vector3(6.4, P + 1.8, 5.0),
  teams: new THREE.Vector3(-6.0, P + 1.6, 4.8),
  net: new THREE.Vector3(-14.5, 1.6, 8.5),
};
const pins = [...host.querySelectorAll('[data-a]')];

function size() {
  const w = host.clientWidth, h = host.clientHeight;
  renderer.setSize(w, h, false);
  const a = w / h, k = w < 600 ? 0.82 : 1;
  const span = Math.max(view.w * k / (2 * a), view.h * k / 2);
  cam.left = -span * a; cam.right = span * a; cam.top = span; cam.bottom = -span;
  cam.updateProjectionMatrix();
}
// метка не должна закрывать текст первого экрана, выходить за край экрана и сцены
// и налезать на другую метку: перебираем положения (вверх/вниз, вправо/влево)
pins.forEach(p => { p.dataset.base = p.className; });
const pad = 8;
const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
function obstacles() {
  const out = [];
  const zone = host.closest('.hero, .page-hero');
  if (!zone) return out;
  zone.querySelectorAll('h1, .sub, .crumb').forEach(el => {
    const r = document.createRange(); r.selectNodeContents(el);
    out.push(...r.getClientRects());
  });
  zone.querySelectorAll('.ctas a').forEach(a => out.push(a.getBoundingClientRect()));
  return out;
}
function place() {
  cam.updateMatrixWorld();
  const w = host.clientWidth, h = host.clientHeight, v = new THREE.Vector3();
  pins.forEach(p => {
    if (!anchors[p.dataset.a]) return;
    v.copy(anchors[p.dataset.a]).project(cam);
    p.style.transform = `translate(${(v.x + 1) / 2 * w}px, ${(1 - v.y) / 2 * h}px)`;
  });
  const busy = obstacles(), hb = host.getBoundingClientRect();
  const left = Math.max(hb.left, pad), right = Math.min(hb.right, document.documentElement.clientWidth - pad);
  pins.forEach(p => {
    const tag = p.querySelector('.tag');
    if (!tag || !tag.offsetWidth) return;
    const base = p.dataset.base, flip = (c, k) => c.includes(' ' + k) ? c.replace(' ' + k, '') : c + ' ' + k;
    let best = null;
    for (const c of [base, flip(base, 'd'), flip(base, 'l'), flip(flip(base, 'd'), 'l')]) {
      p.className = c; p.style.setProperty('--dx', '0px');
      let r = tag.getBoundingClientRect();
      const dx = r.left < left ? left - r.left : r.right > right ? right - r.right : 0;
      p.style.setProperty('--dx', dx + 'px');
      r = tag.getBoundingClientRect();
      const bad = busy.filter(b => hit(r, b)).length + (r.bottom > hb.bottom ? 1 : 0) + Math.abs(dx) / 1000;
      if (!best || bad < best.bad) best = { c, dx, bad };
      if (bad < 0.05) break;
    }
    p.className = best.c; p.style.setProperty('--dx', best.dx + 'px');
    busy.push(tag.getBoundingClientRect());
  });
}
const clock = new THREE.Clock();
// анимация идёт, пока сцена на экране; если кадры рисуются медленно
// (программная отрисовка без видеокарты), переходим на снимок
// window.atriumLive ставит только скрипт съёмки снимков: там отрисовка программная и медленная
const live = window.atriumLive === true;
let running = false, visible = true, slow = false, n = 0, t0 = 0;
function frame(now) {
  if (!visible || slow) { running = false; return; }
  const t = clock.getElapsedTime();
  models.forEach(o => { o.m.position.y = o.y + Math.sin(t * 1.1 + o.ph) * 0.12; o.m.rotation.y = Math.sin(t * 0.4 + o.ph) * 0.25; });
  ring.scale.setScalar(1 + Math.sin(t * 1.6) * 0.04);
  pulses.forEach(p => { p.s.position.copy(p.c.getPointAt(((t * 0.18 + p.t) % 1))); });
  lineMat.dashOffset = -t * 0.6;
  renderer.render(scene, cam);
  if (++n === 3) t0 = now;
  if (!live && n > 3 && now - t0 > 1500 && n < 30) {
    slow = true; host.classList.add('still-on'); return;
  }
  requestAnimationFrame(frame);
}
function start() { if (!running && !reduce && !slow) { running = true; requestAnimationFrame(frame); } }
size(); place();
if (reduce) {
  clock.start(); pulses.forEach(p => p.s.position.copy(p.c.getPointAt(0.5)));
  const a = performance.now(); renderer.render(scene, cam);
  if (!live && performance.now() - a > 1000) { slow = true; host.classList.add('still-on'); }
}
new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(host);
new ResizeObserver(() => { size(); place(); if (!slow) renderer.render(scene, cam); }).observe(host);
if (!slow) host.classList.remove('still-on');
host.classList.add('ready');
