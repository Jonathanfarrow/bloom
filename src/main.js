import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import './style.css';
import { SITES, SCHEMES, SITE_TYPES, PLACE_LABELS } from './data/sites.js';
import { buildGround, buildBridges } from './world/ground.js';
import { buildTown } from './world/buildings.js';
import { buildTrees } from './world/trees.js';
import { buildSites } from './world/siteBuilder.js';
import { FlowerField, flowerUniforms } from './world/flowers.js';
import { groundHeight, streetNames, streetPath, MAJOR, HALF_W, HALF_H } from './world/geo.js';

const $ = (s) => document.querySelector(s);
const app = $('#app');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const store = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
};

const state = {
  selected: null,
  filter: 'all',
  bloom: true,
  labels: true,
  touring: false,
  suggesting: false,
  schemes: store.get('hib-schemes-v1', {}),
  ideas: store.get('hib-ideas-v1', []),
  pendingIdea: null,
};
const schemeOf = (id) => state.schemes[id] || SITES.find((s) => s.id === id)?.scheme || 'summer';

// ---------- Renderer, camera, controls ----------
const host = $('#scene');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(host.clientWidth, host.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
host.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(host.clientWidth, host.clientHeight);
Object.assign(labelRenderer.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
labelRenderer.domElement.className = 'label-layer labels-on';
host.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, host.clientWidth / host.clientHeight, 1, 12000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = 1.36;
controls.minDistance = 10;
controls.maxDistance = 2600;
controls.screenSpacePanning = false;
controls.zoomToCursor = true;

const HOME = { target: new THREE.Vector3(80, 0, -60), dist: 1250, phi: 0.82, theta: 0.35 };
function spherical(target, dist, phi, theta) {
  return new THREE.Vector3(
    target.x + dist * Math.sin(phi) * Math.sin(theta),
    target.y + dist * Math.cos(phi),
    target.z + dist * Math.sin(phi) * Math.cos(theta),
  );
}
controls.target.copy(HOME.target);
camera.position.copy(spherical(HOME.target, HOME.dist, HOME.phi, HOME.theta));
controls.update();

// ---------- Sky & light ----------
const skyUniforms = { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } };
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(6000, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyUniforms,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(horizon, top, pow(smoothstep(0.0, 0.55, h), 0.8)) : mix(horizon, bottom, smoothstep(0.0, -0.2, h));
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
      }`,
  }),
);
sky.frustumCulled = false;
scene.add(sky);

const hemi = new THREE.HemisphereLight('#cfe3ff', '#6d7f4f', 1.1);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff1dc', 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -260, right: 260, top: 260, bottom: -260, near: 10, far: 3000 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.5;
scene.add(sun, sun.target);
scene.fog = new THREE.Fog('#d4e1e6', 1800, 5200);
const sunDir = new THREE.Vector3();

let town;
const THEMES = {
  day: { top: '#5f9bd6', horizon: '#dde9ee', bottom: '#b8c7a8', fog: '#d6e3e7', sun: '#fff0d8', sunI: 2.7, dir: [-0.55, 0.72, 0.42], hemiSky: '#d2e5ff', hemiGround: '#6d7f4f', hemiI: 1.15, glow: 0, exposure: 1.05 },
  dusk: { top: '#1a2045', horizon: '#e08d68', bottom: '#2f2b2c', fog: '#6a5462', sun: '#ffab72', sunI: 1.6, dir: [-0.8, 0.3, 0.35], hemiSky: '#7480b5', hemiGround: '#3a352c', hemiI: 0.95, glow: 1.3, exposure: 1.0 },
};
function isDark() {
  const t = document.documentElement.getAttribute('data-theme');
  if (t) return t === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
function applyTheme() {
  const T = THEMES[isDark() ? 'dusk' : 'day'];
  skyUniforms.top.value.set(T.top); skyUniforms.horizon.value.set(T.horizon); skyUniforms.bottom.value.set(T.bottom);
  scene.fog.color.set(T.fog);
  sun.color.set(T.sun); sun.intensity = T.sunI;
  sunDir.set(...T.dir).normalize();
  hemi.color.set(T.hemiSky); hemi.groundColor.set(T.hemiGround); hemi.intensity = T.hemiI;
  renderer.toneMappingExposure = T.exposure;
  if (town) for (const m of Object.values(town.wallMats)) m.emissiveIntensity = T.glow;
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// ---------- Build the town ----------
let field, siteInfo, ground;
const pins = new Map();
const streetLabels = [];

function build() {
  const g = buildGround(renderer);
  ground = g.ground;
  scene.add(g.group);
  town = buildTown();
  scene.add(town.group);
  const br = buildBridges();
  town.bridges = br.bridges;
  scene.add(br.mesh);
  const built = buildSites(SITES, town);
  scene.add(built.mesh);
  scene.add(buildTrees(town.occ));
  siteInfo = Object.fromEntries(built.sites.map((s) => [s.id, s]));
  const capacity = built.sites.reduce((n, s) => n + s.slots.length, 0) + 16;
  field = new FlowerField(capacity);
  scene.add(field.group);
  field.rebuild(built.sites, schemeOf);

  for (const site of SITES) {
    const el = document.createElement('button');
    el.className = 'pin';
    el.type = 'button';
    el.innerHTML = `<span class="dot"></span><span class="name">${site.name}</span>`;
    el.setAttribute('aria-label', site.name);
    el.addEventListener('click', (e) => { e.stopPropagation(); stopTour(); select(site.id); });
    const obj = new CSS2DObject(el);
    const [x, z] = siteInfo[site.id].center;
    obj.position.set(x, groundHeight(x, z) + (site.type === 'windowboxes' || site.type === 'baskets' ? 12 : 7), z);
    scene.add(obj);
    pins.set(site.id, { el, obj });
  }
  // One label per street, at the middle of its longest stretch
  for (const [name, segs] of streetNames()) {
    if (!segs.some((sg) => MAJOR.has(sg.c) || sg.c === 'pedestrian')) continue;
    const path = streetPath(name);
    if (!path || path.length < 60) continue;
    const mid = path.at(path.length / 2);
    if (Math.abs(mid.x) > HALF_W - 60 || Math.abs(mid.z) > HALF_H - 60) continue;
    addLabel('street-label', name, mid.x, mid.z, 1.5, path.length);
  }
  for (const p of PLACE_LABELS) addLabel('place-label', p.text, p.at[0], p.at[1], 10);
  state.ideas.forEach(addIdeaPin);
  applyTheme();
}

function addLabel(cls, text, x, z, lift, length = 0) {
  const el = document.createElement('div');
  el.className = cls;
  el.textContent = text;
  const obj = new CSS2DObject(el);
  obj.position.set(x, groundHeight(x, z) + lift, z);
  scene.add(obj);
  streetLabels.push({ el, obj, place: cls === 'place-label', length });
}

// ---------- Tweens ----------
const tweens = [];
function tween(dur, apply, done) {
  tweens.push({ t: 0, dur: reduceMotion ? 0.001 : dur, apply, done });
}
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function flyTo(target, dist, phi) {
  const fromT = controls.target.clone(), fromP = camera.position.clone();
  const off = camera.position.clone().sub(controls.target);
  const theta = Math.atan2(off.x, off.z);
  const toP = spherical(target, dist, phi, theta);
  for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].camera) tweens.splice(i, 1);
  tween(1.8, (k) => {
    const e = ease(k);
    controls.target.lerpVectors(fromT, target, e);
    camera.position.lerpVectors(fromP, toP, e);
  });
  tweens[tweens.length - 1].camera = true;
}
function flyToSite(site) {
  const { center: [x, z], radius } = siteInfo[site.id];
  const dist = Math.min(450, Math.max(75, radius * 2.8));
  flyTo(new THREE.Vector3(x, groundHeight(x, z), z), dist, radius > 60 ? 0.85 : 1.0);
}

function setBloom(on) {
  state.bloom = on;
  $('#bloom-toggle').setAttribute('aria-pressed', String(on));
  const from = flowerUniforms.uBloom.value, to = on ? 1 : 0;
  tween(on ? 2.6 : 1.2, (k) => { flowerUniforms.uBloom.value = from + (to - from) * k; });
}

// ---------- UI: catalogue ----------
function renderFilters() {
  const types = ['all', ...new Set(SITES.map((s) => s.type))];
  $('#filters').innerHTML = types.map((t) => `<button class="chip" data-type="${t}" aria-pressed="${state.filter === t}">${t === 'all' ? 'All sites' : SITE_TYPES[t]}</button>`).join('');
}
function visibleSites() { return SITES.filter((s) => state.filter === 'all' || s.type === state.filter); }
function renderList() {
  $('#site-list').innerHTML = visibleSites().map((s) => {
    const cols = SCHEMES[schemeOf(s.id)].plants.slice(0, 4).map((p) => `<i style="background:${p.color}"></i>`).join('');
    return `<li class="site-item"><button data-id="${s.id}" aria-current="${state.selected === s.id}">
      <span class="site-name">${s.name}</span><span class="swatches" aria-hidden="true">${cols}</span>
      <span class="site-meta">${SITE_TYPES[s.type]} · ${SCHEMES[schemeOf(s.id)].name}</span></button></li>`;
  }).join('');
  for (const [id, p] of pins) p.el.classList.toggle('dim', state.filter !== 'all' && SITES.find((s) => s.id === id).type !== state.filter);
}
$('#filters').addEventListener('click', (e) => {
  const b = e.target.closest('.chip'); if (!b) return;
  state.filter = b.dataset.type; renderFilters(); renderList();
});
$('#site-list').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-id]'); if (!b) return;
  stopTour(); select(b.dataset.id);
  if (window.innerWidth <= 760) toggleList(false);
});
function toggleList(open) {
  $('#catalogue').classList.toggle('open', open);
  $('#toggle-list').setAttribute('aria-expanded', String(open));
}
$('#toggle-list').addEventListener('click', () => toggleList(!$('#catalogue').classList.contains('open')));

// ---------- UI: detail ----------
const round = (n) => (n > 1000 ? Math.round(n / 100) * 100 : n > 100 ? Math.round(n / 10) * 10 : Math.round(n));
const fmt = (n) => n.toLocaleString('en-GB');
const CONTAINER_TYPES = new Set(['windowboxes', 'baskets', 'troughs', 'planters']);

function renderDetail() {
  const site = SITES.find((s) => s.id === state.selected);
  const box = $('#detail');
  if (!site) { box.hidden = true; app.classList.remove('has-detail'); return; }
  const key = schemeOf(site.id), scheme = SCHEMES[key], info = siteInfo[site.id];
  const list = visibleSites().length ? visibleSites() : SITES;
  const idx = Math.max(0, list.findIndex((s) => s.id === site.id));
  const prev = list[(idx - 1 + list.length) % list.length], next = list[(idx + 1) % list.length];
  const factor = site.type === 'meadow' ? 0.3 : 1;
  const plants = round(info.area * scheme.perM2 * factor);
  const bulbs = key === 'spring';
  $('#detail-body').innerHTML = `
    <span class="type-tag">${SITE_TYPES[site.type]} <b>· ${site.street}</b></span>
    <h2>${site.name}</h2>
    <p class="blurb">${site.blurb}</p>
    <h3 class="section-label" style="margin:14px 0 4px">Planting scheme</h3>
    <div class="schemes" role="group" aria-label="Planting scheme">
      ${Object.entries(SCHEMES).map(([k, s]) => `<button class="scheme" data-scheme="${k}" aria-pressed="${k === key}">
        <span class="dots" aria-hidden="true">${s.plants.slice(0, 3).map((p) => `<i style="background:${p.color}"></i>`).join('')}</span>${s.name}</button>`).join('')}
    </div>
    <p class="scheme-note"><strong>${scheme.season}.</strong> ${scheme.note}</p>
    <table class="plants"><tbody>
      ${scheme.plants.map((p) => `<tr><td><span class="sw" style="background:${p.color}"></span></td>
        <td>${p.name}<em>${p.latin}</em></td><td class="h">${Math.round(p.share * 100)}% · ${Math.round(p.h * 100)} cm</td></tr>`).join('')}
    </tbody></table>
    <dl class="facts">
      <div><dt>Planted area</dt><dd class="num">≈ ${fmt(info.area)} m²</dd></div>
      ${CONTAINER_TYPES.has(site.type) && info.units ? `<div><dt>Containers</dt><dd class="num">${fmt(info.units)}</dd></div>` : ''}
      <div><dt>${bulbs ? 'Bulbs' : 'Plants'} (approx.)</dt><dd class="num">${fmt(plants)}</dd></div>
      <div><dt>Care</dt><dd>${site.care}</dd></div>
      <div><dt>Watering</dt><dd>${site.water}</dd></div>
    </dl>
    <div class="why"><h3 class="section-label" style="margin:0">Why here</h3><p>${site.why}</p></div>
    <div class="pager">
      <button data-go="${prev.id}" title="${prev.name}">← Previous</button>
      <button data-go="${next.id}" title="${next.name}">Next site →</button>
    </div>`;
  box.hidden = false;
  app.classList.add('has-detail');
}
$('#detail-body').addEventListener('click', (e) => {
  const sb = e.target.closest('[data-scheme]');
  if (sb && state.selected) return setScheme(state.selected, sb.dataset.scheme);
  const go = e.target.closest('[data-go]');
  if (go) { stopTour(); select(go.dataset.go); }
});
$('#close-detail').addEventListener('click', () => { stopTour(); select(null); cancelSuggest(); });

function setScheme(id, key) {
  state.schemes[id] = key;
  store.set('hib-schemes-v1', state.schemes);
  field.rebuild(Object.values(siteInfo), schemeOf, id);
  flowerUniforms.uRegrow.value = 0;
  tween(1.8, (k) => { flowerUniforms.uRegrow.value = k; });
  if (!state.bloom) setBloom(true);
  renderDetail(); renderList();
}

function select(id, { fly = true } = {}) {
  state.selected = id;
  cancelSuggest(false);
  for (const [pid, p] of pins) p.el.classList.toggle('selected', pid === id);
  renderList(); renderDetail();
  const site = SITES.find((s) => s.id === id);
  if (site && fly) flyToSite(site);
  try { history.replaceState(null, '', id ? `#${id}` : location.pathname + location.search); } catch { /* sandboxed */ }
}

// ---------- Tour ----------
let tourTimer = null;
function startTour() {
  state.touring = true;
  $('#tour-btn').setAttribute('aria-pressed', 'true');
  $('#tour-btn .tool-label').textContent = 'Stop tour';
  const list = visibleSites();
  let i = Math.max(-1, list.findIndex((s) => s.id === state.selected));
  const step = () => {
    i = (i + 1) % list.length;
    select(list[i].id);
    tourTimer = setTimeout(step, 7500);
  };
  step();
}
function stopTour() {
  if (!state.touring) return;
  state.touring = false;
  clearTimeout(tourTimer);
  $('#tour-btn').setAttribute('aria-pressed', 'false');
  $('#tour-btn .tool-label').textContent = 'Tour';
}
$('#tour-btn').addEventListener('click', () => (state.touring ? stopTour() : startTour()));

// ---------- Toolbar ----------
$('#bloom-toggle').addEventListener('click', () => setBloom(!state.bloom));
$('#labels-btn').addEventListener('click', () => {
  state.labels = !state.labels;
  $('#labels-btn').setAttribute('aria-pressed', String(state.labels));
  labelRenderer.domElement.classList.toggle('labels-on', state.labels);
  labelRenderer.domElement.classList.toggle('labels-hidden', !state.labels);
});
$('#reset-btn').addEventListener('click', () => {
  stopTour(); select(null, { fly: false });
  flyTo(HOME.target.clone(), HOME.dist, HOME.phi);
});

// ---------- Suggestions ----------
let hintTimer;
function hint(text, ms = 4000) {
  const h = $('#hint');
  h.textContent = text; h.hidden = false;
  clearTimeout(hintTimer);
  if (ms) hintTimer = setTimeout(() => { h.hidden = true; }, ms);
}
function nearestStreet(x, z) {
  let best = null, bd = Infinity;
  for (const name of streetNames().keys()) {
    const path = streetPath(name);
    if (!path || path.length < 2) continue;
    const p = path.at(path.closestT(x, z));
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < bd) { bd = d; best = name; }
  }
  return best;
}
$('#suggest-btn').addEventListener('click', () => {
  if (state.suggesting) return cancelSuggest();
  stopTour();
  state.suggesting = true;
  app.classList.add('suggesting');
  $('#suggest-btn').setAttribute('aria-pressed', 'true');
  hint('Click the spot on the map where you would like to see flowers', 0);
});
function cancelSuggest(hideHint = true) {
  if (!state.suggesting && !state.pendingIdea) return;
  state.suggesting = false;
  state.pendingIdea = null;
  app.classList.remove('suggesting');
  $('#suggest-btn').setAttribute('aria-pressed', 'false');
  if (hideHint) $('#hint').hidden = true;
  if (!state.selected) { $('#detail').hidden = true; app.classList.remove('has-detail'); }
}
function openIdeaForm(x, z) {
  state.suggesting = false;
  app.classList.remove('suggesting');
  $('#hint').hidden = true;
  state.selected = null;
  for (const p of pins.values()) p.el.classList.remove('selected');
  const near = nearestStreet(x, z);
  state.pendingIdea = { x: Math.round(x), z: Math.round(z), near };
  $('#detail-body').innerHTML = `
    <span class="type-tag">Suggest a spot <b>· near ${near}</b></span>
    <h2>What could grow here?</h2>
    <form class="form" id="idea-form">
      <label for="idea-name">Name this spot<input id="idea-name" required maxlength="80" placeholder="e.g. Bench by the bus stop" /></label>
      <label for="idea-type">What kind of planting?
        <select id="idea-type">${Object.entries(SITE_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <label for="idea-scheme">Scheme
        <select id="idea-scheme">${Object.entries(SCHEMES).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</select></label>
      <label for="idea-notes">Notes<textarea id="idea-notes" maxlength="400" placeholder="Who might look after it? Any sponsor?"></textarea></label>
      <div class="row"><button class="primary" type="submit">Save suggestion</button><button class="secondary" type="button" id="idea-cancel">Cancel</button></div>
    </form>`;
  $('#detail').hidden = false;
  app.classList.add('has-detail');
  $('#idea-name').focus();
  $('#idea-cancel').addEventListener('click', () => { cancelSuggest(); });
  $('#idea-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const idea = {
      ...state.pendingIdea,
      id: Date.now().toString(36),
      name: $('#idea-name').value.trim() || 'Unnamed spot',
      type: $('#idea-type').value,
      scheme: $('#idea-scheme').value,
      notes: $('#idea-notes').value.trim(),
    };
    state.ideas.push(idea);
    store.set('hib-ideas-v1', state.ideas);
    addIdeaPin(idea);
    renderIdeas();
    state.pendingIdea = null;
    $('#suggest-btn').setAttribute('aria-pressed', 'false');
    $('#detail').hidden = true;
    app.classList.remove('has-detail');
    hint('Suggestion saved. You can find it under "Your suggested spots".');
  });
}
function addIdeaPin(idea) {
  const el = document.createElement('div');
  el.className = 'pin idea';
  el.innerHTML = `<span class="dot"></span><span class="name">${escapeHtml(idea.name)}</span>`;
  const obj = new CSS2DObject(el);
  obj.position.set(idea.x, groundHeight(idea.x, idea.z) + 5, idea.z);
  scene.add(obj);
}
function renderIdeas() {
  $('#ideas').hidden = !state.ideas.length;
  $('#idea-list').innerHTML = state.ideas.map((i) => `<li><span>${escapeHtml(i.name)} <small>${SITE_TYPES[i.type]}, near ${escapeHtml(i.near)}</small></span></li>`).join('');
}
$('#copy-ideas').addEventListener('click', async () => {
  const text = 'Hitchin in Bloom: suggested spots\n\n' + state.ideas.map((i) =>
    `• ${i.name} (${SITE_TYPES[i.type]}, ${SCHEMES[i.scheme].name}), near ${i.near}${i.notes ? `\n  ${i.notes}` : ''}`).join('\n');
  try { await navigator.clipboard.writeText(text); hint('Copied to clipboard'); }
  catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.className = 'form'; ta.style.width = '100%'; ta.rows = 6;
    $('#ideas').appendChild(ta); ta.select();
    hint('Select the text below and copy it');
  }
});
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// ---------- Picking ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let down = null;
renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; stopTour(); });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
  const rect = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObject(ground, false)[0];
  if (!hit) return;
  const { x, z } = hit.point;
  if (state.suggesting) return openIdeaForm(x, z);
  let best = null, bd = Infinity;
  for (const s of SITES) {
    const { center, radius } = siteInfo[s.id];
    const d = Math.hypot(center[0] - x, center[1] - z);
    if (d < Math.max(14, radius * 0.7) && d < bd) { bd = d; best = s; }
  }
  if (best && best.id !== state.selected) select(best.id);
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (state.suggesting || state.pendingIdea) cancelSuggest(); else if (state.selected) select(null, { fly: false }); }
});

// ---------- Keep the focus in the part of the screen the panels don't cover ----------
const viewShift = { x: 0, y: 0 };
function updateViewOffset() {
  const W = host.clientWidth, H = host.clientHeight;
  let tx = 0, ty = 0;
  const detailOpen = !$('#detail').hidden;
  if (W > 760) {
    const left = $('#catalogue').getBoundingClientRect().right;
    const right = detailOpen ? $('#detail').getBoundingClientRect().left : W;
    tx = W / 2 - (left + right) / 2;
  } else if (detailOpen) {
    const top = $('#catalogue').getBoundingClientRect().bottom;
    const bottom = $('#detail').getBoundingClientRect().top;
    ty = H / 2 - (top + bottom) / 2;
  }
  const k = reduceMotion ? 1 : 0.08;
  viewShift.x += (tx - viewShift.x) * k;
  viewShift.y += (ty - viewShift.y) * k;
  if (Math.abs(viewShift.x) < 0.5 && Math.abs(viewShift.y) < 0.5 && !tx && !ty) camera.clearViewOffset();
  else camera.setViewOffset(W, H, viewShift.x, viewShift.y, W, H);
}

// ---------- Loop ----------
const clock = new THREE.Clock();
const tmpV = new THREE.Vector3();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.1);
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t = Math.min(1, tw.t + dt / tw.dur);
    tw.apply(tw.t);
    if (tw.t >= 1) { tweens.splice(i, 1); tw.done?.(); }
  }
  controls.target.x = THREE.MathUtils.clamp(controls.target.x, -HALF_W, HALF_W);
  controls.target.z = THREE.MathUtils.clamp(controls.target.z, -HALF_H, HALF_H);
  controls.update();
  flowerUniforms.uTime.value += reduceMotion ? 0 : dt;

  // Keep the shadow frustum centred on what we're looking at
  const T = controls.target;
  const camDist = camera.position.distanceTo(T);
  const extent = THREE.MathUtils.clamp(camDist * 0.6, 60, 700);
  const sc = sun.shadow.camera;
  if (Math.abs(sc.right - extent) > 1) {
    sc.left = sc.bottom = -extent; sc.right = sc.top = extent; sc.updateProjectionMatrix();
  }
  const snap = extent / 1024;
  tmpV.set(Math.round(T.x / snap) * snap, 0, Math.round(T.z / snap) * snap);
  sun.target.position.copy(tmpV);
  sun.position.copy(tmpV).addScaledVector(sunDir, 1400);

  for (const p of pins.values()) p.el.classList.toggle('near', camera.position.distanceTo(p.obj.position) < 520);
  for (const l of streetLabels) {
    const d = camera.position.distanceTo(l.obj.position);
    const reach = l.place ? 1500 : 220 + Math.min(l.length, 700) * 0.7;
    const o = THREE.MathUtils.clamp(1 - (d - reach) / (reach * 0.4), 0, 1);
    if (!state.labels) l.el.style.opacity = '0';
    else l.el.style.opacity = o.toFixed(2);
  }
  updateViewOffset();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => {
  const w = host.clientWidth, h = host.clientHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h); labelRenderer.setSize(w, h);
});

// ---------- Boot ----------
requestAnimationFrame(() => setTimeout(() => {
  build();
  renderFilters(); renderList(); renderIdeas();
  const fromHash = location.hash.slice(1);
  if (SITES.some((s) => s.id === fromHash)) select(fromHash);
  else hint('Tap a purple pin, or pick a site from the list', 6000);
  $('#loading').classList.add('done');
  frame();
}, 30));
