import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import './style.css';
import { SITES, SCHEMES, ROLES, LEVEL, PLACE_LABELS, ROUTE, PROGRAMME, JUDGING, VOLUNTEER_RATE, SOURCING, PRICE_NOTES, costOf } from './data/sites.js';
import { buildGround, buildBridges } from './world/ground.js';
import { buildTown } from './world/buildings.js';
import { buildTrees } from './world/trees.js';
import { buildProps } from './world/props.js';
import { createPost } from './post.js';
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
  view: 'site',
  plan: store.get('hib-plan-v3', {}),
  model: 'volunteer', // volunteer-led programme; only specialist work is paid
  sourcing: store.get('hib-sourcing-v1', 'mixed'),
  ideas: store.get('hib-ideas-v1', []),
  pendingIdea: null,
};
const siteById = (id) => SITES.find((s) => s.id === id);
const optionOf = (id) => { const s = siteById(id); return s.options.find((o) => o.id === state.plan[id]?.opt) || s.options[0]; };
const inPlan = (id) => state.plan[id]?.on ?? !siteById(id).future;
const schemeOf = (id) => optionOf(id).scheme;
const PLANT_KINDS = { bed: 'Flower bed', planters: 'Planters', baskets: 'Hanging baskets', windowboxes: 'Window boxes', meadow: 'Wildflowers or bulbs', other: 'Something else' };

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

let town, lampMat, post;
const THEMES = {
  day: { top: '#79aedc', horizon: '#f2e7d4', bottom: '#cbc3a3', fog: '#e9e1cf', sun: '#ffe2ba', sunI: 3.2, dir: [-0.62, 0.52, 0.5], hemiSky: '#d6e4f5', hemiGround: '#b9a680', hemiI: 1.05, glow: 0, exposure: 1.0 },
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
  if (lampMat) lampMat.emissiveIntensity = T.glow * 2.2;
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// ---------- Build the town ----------
let field, ground;
const optionInfo = new Map(); // "site:option" → { slots, mesh, area, units, center, radius }
const info = (id) => optionInfo.get(`${id}:${optionOf(id).id}`);
const pins = new Map();
const streetLabels = [];

function build() {
  const g = buildGround(renderer);
  ground = g.pickables;
  scene.add(g.group);
  town = buildTown();
  scene.add(town.group);
  const br = buildBridges();
  town.bridges = br.bridges;
  scene.add(br.mesh);
  const built = buildSites(SITES, town);
  scene.add(built.fixtures);
  for (const o of built.options) { optionInfo.set(o.key, o); scene.add(o.mesh); }
  scene.add(buildTrees(town.occ));
  const props = buildProps(town.occ);
  lampMat = props.lampMat;
  scene.add(props.group);
  post = createPost(renderer, scene, camera, host);
  const capacity = SITES.reduce((n, s) => n + Math.max(...s.options.map((o) => optionInfo.get(`${s.id}:${o.id}`).slots.length)), 0) + 16;
  field = new FlowerField(capacity);
  scene.add(field.group);
  refreshPlanting();

  for (const site of SITES) {
    const el = document.createElement('button');
    el.className = 'pin';
    el.type = 'button';
    el.innerHTML = `<span class="dot">${ROUTE.indexOf(site.id) + 1}</span><span class="name">${site.name}</span>`;
    el.setAttribute('aria-label', `Stop ${ROUTE.indexOf(site.id) + 1}: ${site.name}`);
    el.addEventListener('click', (e) => { e.stopPropagation(); stopTour(); select(site.id); });
    const obj = new CSS2DObject(el);
    const [x, z] = optionInfo.get(`${site.id}:${site.options[0].id}`).center;
    const high = site.options[0].shapes.some((sh) => sh.kind === 'baskets' || sh.kind === 'windowboxes');
    obj.position.set(x, groundHeight(x, z) + (high ? 12 : 7), z);
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
  refreshPins();
  state.ideas.forEach(addIdeaPin);
  applyTheme();
}

// Show the chosen option at every site in the plan, and nothing at sites left out
function refreshPlanting(freshId) {
  const active = [];
  for (const site of SITES) {
    for (const o of site.options) optionInfo.get(`${site.id}:${o.id}`).mesh.visible = false;
    if (!inPlan(site.id)) continue;
    const i = info(site.id);
    i.mesh.visible = true;
    active.push({ id: site.id, slots: i.slots });
  }
  field.rebuild(active, schemeOf, freshId);
  for (const [id, p] of pins) p.el.classList.toggle('dim', !inPlan(id) || (state.filter !== 'all' && siteById(id).role !== state.filter));
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
  const { center: [x, z], radius } = info(site.id);
  const dist = Math.min(450, Math.max(75, radius * 2.8));
  flyTo(new THREE.Vector3(x, groundHeight(x, z), z), dist, radius > 60 ? 0.85 : 1.0);
}

function setBloom(on) {
  state.bloom = on;
  $('#bloom-toggle').setAttribute('aria-pressed', String(on));
  const from = flowerUniforms.uBloom.value, to = on ? 1 : 0;
  tween(on ? 2.6 : 1.2, (k) => { flowerUniforms.uBloom.value = from + (to - from) * k; });
}

// ---------- Money ----------
const roundMoney = (n) => (n < 1000 ? Math.round(n / 10) * 10 : n < 10000 ? Math.round(n / 50) * 50 : Math.round(n / 100) * 100);
const gbp = (n) => '£' + roundMoney(n).toLocaleString('en-GB');
const range = ([lo, hi]) => (roundMoney(lo) === roundMoney(hi) ? gbp(lo) : `${gbp(lo)}–${gbp(hi)}`);
const short = (n) => (n >= 1000 ? `£${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : gbp(n));
const shortRange = ([lo, hi]) => (roundMoney(lo) === roundMoney(hi) ? short(lo) : `${short(lo)}–${short(hi)}`);
const hrs = (h) => (h >= 100 ? Math.round(h / 10) * 10 : Math.round(h)).toLocaleString('en-GB');
const siteCost = (id, opt = optionOf(id)) => costOf(opt, optionInfo.get(`${id}:${opt.id}`), state.model, state.sourcing);
const routeNo = (id) => ROUTE.indexOf(id) + 1;
const orderedSites = () => [...SITES].sort((a, b) => routeNo(a.id) - routeNo(b.id));

// Programme costs that apply to the plan as a whole
function programmeLines() {
  const volunteer = state.model === 'volunteer';
  const containers = SITES.some((s) => inPlan(s.id) && optionOf(s.id).shapes.some((sh) => ['planter', 'along', 'baskets', 'troughs'].includes(sh.kind)));
  return PROGRAMME.filter((p) => p.when === 'always' || (p.when === 'volunteer' && volunteer) || (p.when === 'containers' && volunteer && containers));
}
function planTotals() {
  const t = { capital: [0, 0], annual: [0, 0], setupHours: 0, yearHours: 0, count: 0 };
  for (const s of SITES) {
    if (!inPlan(s.id)) continue;
    const c = siteCost(s.id);
    t.capital[0] += c.capitalTotal[0]; t.capital[1] += c.capitalTotal[1];
    t.annual[0] += c.annualTotal[0]; t.annual[1] += c.annualTotal[1];
    t.setupHours += c.setupHours; t.yearHours += c.yearHours;
    t.count++;
  }
  t.sitesCapital = [...t.capital];
  t.programme = programmeLines();
  t.siteHours = t.yearHours;
  t.progHours = 0;
  for (const p of t.programme) { t.capital[0] += p.capital[0]; t.capital[1] += p.capital[1]; t.annual[0] += p.annual[0]; t.annual[1] += p.annual[1]; t.progHours += p.hours ?? 0; }
  t.yearHours += t.progHours;
  // year one: planting and establishment on top of the normal year
  t.firstYearHours = t.setupHours + t.yearHours;
  t.contingency = [t.capital[0] * 0.1, t.capital[1] * 0.1];
  t.setup = [t.capital[0] + t.contingency[0], t.capital[1] + t.contingency[1]];
  // a regular volunteer giving 2 hours a week over a 30-week season
  t.volunteers = Math.ceil(t.yearHours / 60);
  return t;
}
function savePlan() { store.set('hib-plan-v3', state.plan); }
function setSourcing(v) {
  state.sourcing = v;
  store.set('hib-sourcing-v1', v);
  renderList();
  if (state.view === 'plan') renderPlan(); else if (state.view === 'judging') renderJudging(); else renderDetail();
}

// How strongly a site's chosen option speaks to each judging pillar (0–2)
function pillarLevels(id) {
  const o = optionOf(id), c = costOf(o, info(id), 'volunteer');
  const people = c.setupHours + c.yearHours;
  const s = siteById(id);
  const communityPartners = s.partners.some((p) => /volunteer|school|community|business/i.test(p));
  return {
    horticulture: o.impact,
    environment: o.wildlife,
    community: people > 150 || (people > 0 && communityPartners) ? 2 : people > 0 || communityPartners ? 1 : 0,
  };
}

// ---------- UI: catalogue ----------
function renderFilters() {
  const roles = ['all', ...Object.keys(ROLES)];
  $('#filters').innerHTML = roles.map((t) => `<button class="chip" data-type="${t}" aria-pressed="${state.filter === t}">${t === 'all' ? 'All sites' : ROLES[t]}</button>`).join('');
}
function visibleSites() { return orderedSites().filter((s) => state.filter === 'all' || s.role === state.filter); }
function renderList() {
  const item = (s) => {
    const o = optionOf(s.id), c = siteCost(s.id);
    const cols = SCHEMES[o.scheme].plants.slice(0, 4).map((p) => `<i style="background:${p.color}"></i>`).join('');
    return `<li class="site-item${inPlan(s.id) ? '' : ' out'}">
      <button data-id="${s.id}" aria-current="${state.selected === s.id && state.view === 'site'}">
        <span class="site-name"><span class="stop" title="Stop ${routeNo(s.id)} on the judges' route">${routeNo(s.id)}</span>${s.name}</span><span class="swatches" aria-hidden="true">${cols}</span>
        <span class="site-meta">${s.future ? 'Future site' : ROLES[s.role]} · ${o.name}${inPlan(s.id) ? ` · <span class="money">${short(c.capitalTotal[1])}</span>` : ''}</span>
      </button>
      <input type="checkbox" class="plan-check" id="plan-${s.id}" data-plan="${s.id}" ${inPlan(s.id) ? 'checked' : ''} aria-label="Include ${s.name} in the plan" title="Include in the plan" />
    </li>`;
  };
  const list = visibleSites();
  const now = list.filter((s) => !s.future), later = list.filter((s) => s.future);
  $('#site-list').innerHTML = (now.length ? `<li class="list-head">Phase 1 · volunteer-led</li>${now.map(item).join('')}` : '')
    + (later.length ? `<li class="list-head">Future sites <small>tick to add</small></li>${later.map(item).join('')}` : '');
  renderPlanBar();
}
function renderPlanBar() {
  const t = planTotals();
  $('#plan-bar').innerHTML = `<div><span class="pb-label">Your plan · ${t.count} sites · volunteer-led</span>
    <span class="pb-figs"><b>${shortRange(t.setup)}</b> set-up · <b>${shortRange(t.annual)}</b> a year${state.model === 'volunteer' ? `<br /><b>${hrs(t.firstYearHours)}</b> volunteer hours in year one, then <b>${hrs(t.yearHours)}</b> a year` : ''}</span></div>
    <button class="primary small" id="open-plan">Plan &amp; costs</button>`;
}
$('#filters').addEventListener('click', (e) => {
  const b = e.target.closest('.chip'); if (!b) return;
  state.filter = b.dataset.type; renderFilters(); renderList(); refreshPins();
});
function refreshPins() {
  for (const [id, p] of pins) p.el.classList.toggle('dim', !inPlan(id) || (state.filter !== 'all' && siteById(id).role !== state.filter));
}
$('#site-list').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-id]'); if (!b) return;
  stopTour(); select(b.dataset.id);
  if (window.innerWidth <= 760) toggleList(false);
});
$('#site-list').addEventListener('change', (e) => {
  const c = e.target.closest('[data-plan]'); if (!c) return;
  setInPlan(c.dataset.plan, c.checked);
});
$('#catalogue').addEventListener('click', (e) => { if (e.target.closest('#open-plan')) { stopTour(); openPlan(); } });
function toggleList(open) {
  $('#catalogue').classList.toggle('open', open);
  $('#toggle-list').setAttribute('aria-expanded', String(open));
}
$('#toggle-list').addEventListener('click', () => toggleList(!$('#catalogue').classList.contains('open')));

function setInPlan(id, on) {
  state.plan[id] = { ...(state.plan[id] || {}), on };
  savePlan();
  refreshPlanting(id);
  flowerUniforms.uRegrow.value = 0;
  tween(1.6, (k) => { flowerUniforms.uRegrow.value = k; });
  renderList();
  if (state.view === 'plan') renderPlan(); else if (state.view === 'judging') renderJudging(); else renderDetail();
}
function setOption(id, optId) {
  state.plan[id] = { ...(state.plan[id] || {}), opt: optId, on: true };
  savePlan();
  refreshPlanting(id);
  flowerUniforms.uRegrow.value = 0;
  tween(1.8, (k) => { flowerUniforms.uRegrow.value = k; });
  if (!state.bloom) setBloom(true);
  renderDetail(); renderList();
}

const modelSwitch = () => `<div class="switches">
  <div class="seg" role="group" aria-label="How plants are bought">
    ${Object.entries(SOURCING).map(([k, v]) => `<button data-sourcing="${k}" aria-pressed="${state.sourcing === k}">${v.name}</button>`).join('')}</div>
  </div>`;

// ---------- UI: site detail ----------
const fmt = (n) => Math.round(n).toLocaleString('en-GB');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const levelTag = (label, v, good) => `<span class="lvl lvl-${good ? v : 2 - v}">${label}: ${LEVEL[v]}</span>`;
const PILLAR_SHORT = { horticulture: 'Horticulture', environment: 'Environment', community: 'Community' };

function renderDetail() {
  const site = siteById(state.selected);
  const box = $('#detail');
  if (!site) { box.hidden = true; app.classList.remove('has-detail'); return; }
  state.view = 'site';
  const opt = optionOf(site.id), scheme = SCHEMES[opt.scheme], i = info(site.id), c = siteCost(site.id);
  const vol = state.model === 'volunteer';
  const list = visibleSites().length ? visibleSites() : orderedSites();
  const idx = Math.max(0, list.findIndex((s) => s.id === site.id));
  const prev = list[(idx - 1 + list.length) % list.length], next = list[(idx + 1) % list.length];
  const plants = scheme.perM2 ? Math.round((i.area * scheme.perM2) / 10) * 10 : 0;
  const qty = (l) => ({ area: `${fmt(l.qty)} m²`, gravel: `${fmt(l.qty)} m²`, edging: `${fmt(l.qty)} m`, hedge: `${fmt(l.qty)} m`, units: `${fmt(l.qty)} ×`, benches: `${fmt(l.qty)} ×` })[l.kind] || '';
  const costRows = (lines) => lines.map((l) => `<tr><td>${l.label}<em>${qty(l)}${l.byVolunteers ? `${qty(l) ? ' · ' : ''}volunteers: about ${hrs(l.hours)} hours, materials only` : l.paidLabour ? `${qty(l) ? ' · ' : ''}paid work` : ''}</em></td><td class="h">${range([l.lo, l.hi])}</td></tr>`).join('');
  const pl = pillarLevels(site.id);
  $('#detail-body').innerHTML = `
    <span class="type-tag">${site.future ? 'Future site' : `Stop ${routeNo(site.id)}`} · ${ROLES[site.role]} <b>· ${site.street}</b></span>
    <h2>${site.name}</h2>
    <p class="blurb">${site.headline}</p>
    <label class="inplan" for="inplan"><input type="checkbox" id="inplan" ${inPlan(site.id) ? 'checked' : ''} /> Include in the plan</label>
    <h3 class="section-label">${site.options.length > 1 ? 'Options' : 'Proposal'}</h3>
    ${modelSwitch()}
    <div class="options" role="group" aria-label="Options for ${esc(site.name)}">
      ${site.options.map((o, k) => {
        const oc = siteCost(site.id, o);
        return `<button class="option" data-opt="${o.id}" aria-pressed="${o.id === opt.id}">
          <span class="opt-head"><span class="opt-letter">${site.options.length > 1 ? `Option ${'ABC'[k]}` : 'Proposal'}</span>${k === 0 && site.options.length > 1 ? '<span class="rec">Recommended</span>' : ''}</span>
          <span class="opt-name"><span class="dots" aria-hidden="true">${SCHEMES[o.scheme].plants.slice(0, 3).map((p) => `<i style="background:${p.color}"></i>`).join('')}</span>${o.name}</span>
          <span class="opt-cost"><b>${range(oc.capitalTotal)}</b> set-up · <b>${range(oc.annualTotal)}</b> a year${vol && oc.setupHours + oc.yearHours > 0 ? `<br />plus ${[oc.setupHours >= 1 ? `<b>${hrs(oc.setupHours)}</b> volunteer hours to plant and water in` : '', oc.yearHours >= 1 ? `<b>${hrs(oc.yearHours)}</b> hours a year to look after` : ''].filter(Boolean).join(', ')}` : ''}</span>
          <span class="opt-tags">${levelTag('Upkeep', o.maintenance, false)}${levelTag('Impact', o.impact, true)}${levelTag('Wildlife', o.wildlife, true)}</span>
        </button>`;
      }).join('')}
    </div>
    <p class="opt-summary">${opt.summary}</p>
    <details class="costs"><summary>Cost breakdown</summary>
      <table class="cost-table">
        <tbody><tr class="grp"><th colspan="2">Set-up</th></tr>${costRows(c.capital)}
        <tr class="tot"><td>Set-up total${vol && c.setupHours ? `<em>plus about ${hrs(c.setupHours)} volunteer hours</em>` : ''}</td><td class="h">${range(c.capitalTotal)}</td></tr>
        <tr class="grp"><th colspan="2">Each year</th></tr>${c.annual.length ? costRows(c.annual) : '<tr><td>No running costs: bulbs come back every year</td><td class="h">£0</td></tr>'}
        <tr class="tot"><td>Yearly total${vol && c.yearHours ? `<em>plus about ${hrs(c.yearHours)} volunteer hours</em>` : ''}</td><td class="h">${range(c.annualTotal)}</td></tr></tbody>
      </table>
      <p class="fine">Plants: ${SOURCING[state.sourcing].name.toLowerCase()}${state.sourcing === 'mixed' ? ' (80% trade plugs, bulbs and seed, 20% from local shops)' : ''}. Volunteers do the planting, watering and weeding, so only materials are costed. Traffic management, work at height, structural fixings and machinery are paid. Budget prices: get quotes before bidding.</p>
    </details>
    <h3 class="section-label">What the judges will see</h3>
    <div class="pillars">${Object.entries(pl).map(([k, v]) => `<span class="pill-${k}"><i style="--v:${v}"></i>${PILLAR_SHORT[k]}: ${LEVEL[v]}</span>`).join('')}</div>
    <h3 class="section-label">Planting · ${scheme.season}</h3>
    <p class="scheme-note">${scheme.note}</p>
    <table class="plants"><tbody>
      ${scheme.plants.map((p) => `<tr><td><span class="sw" style="background:${p.color}"></span></td>
        <td>${p.name}<em>${p.latin}</em></td><td class="h">${Math.round(p.share * 100)}% · ${Math.round(p.h * 100)} cm</td></tr>`).join('')}
    </tbody></table>
    <dl class="facts">
      <div><dt>Planted area</dt><dd class="num">≈ ${fmt(i.area)} m²</dd></div>
      ${i.units ? `<div><dt>Containers</dt><dd class="num">${fmt(i.units)}</dd></div>` : ''}
      ${plants ? `<div><dt>${opt.scheme === 'bulbs' || opt.scheme === 'spring' ? 'Bulbs' : 'Plants'} (approx.)</dt><dd class="num">${fmt(plants)}</dd></div>` : ''}
    </dl>
    <div class="why"><h3 class="section-label">Why this site</h3><ul>${site.why.map((w) => `<li>${w}</li>`).join('')}</ul></div>
    <div class="why"><h3 class="section-label">Before going ahead</h3>
      <p class="owner"><b>Land:</b> ${site.owner}</p>
      <ul class="checks">${site.checks.map((w) => `<li>${w}</li>`).join('')}</ul>
      <p class="owner"><b>Partners:</b> ${site.partners.join(' · ')}</p>
    </div>
    <div class="pager">
      <button data-go="${prev.id}" title="${prev.name}">← Previous stop</button>
      <button data-go="${next.id}" title="${next.name}">Next stop →</button>
    </div>`;
  box.hidden = false;
  app.classList.add('has-detail');
}
$('#detail-body').addEventListener('click', (e) => {
  const sb = e.target.closest('[data-sourcing]');
  if (sb) return setSourcing(sb.dataset.sourcing);
  const ob = e.target.closest('[data-opt]');
  if (ob && state.selected) return setOption(state.selected, ob.dataset.opt);
  const go = e.target.closest('[data-go]');
  if (go) { stopTour(); select(go.dataset.go); return; }
  const row = e.target.closest('[data-site]');
  if (row) { stopTour(); select(row.dataset.site); return; }
  if (e.target.closest('#copy-plan')) copyPlan();
  if (e.target.closest('#open-judging')) openJudging();
  if (e.target.closest('#open-plan-2')) openPlan();
});
$('#detail-body').addEventListener('change', (e) => {
  if (e.target.id === 'inplan' && state.selected) setInPlan(state.selected, e.target.checked);
});
$('#close-detail').addEventListener('click', () => { stopTour(); state.view = 'site'; select(null); cancelSuggest(); });

// ---------- UI: plan summary ----------
function openPlan() {
  state.selected = null;
  for (const p of pins.values()) p.el.classList.remove('selected');
  renderPlan();
  renderList();
  flyTo(HOME.target.clone(), HOME.dist, HOME.phi);
}
function renderPlan() {
  state.view = 'plan';
  const t = planTotals(), vol = state.model === 'volunteer';
  const rows = orderedSites().filter((s) => inPlan(s.id)).map((s) => {
    const c = siteCost(s.id), o = optionOf(s.id);
    return `<tr data-site="${s.id}"><td><b>${routeNo(s.id)}. ${s.name}</b><em>${o.name}${vol && c.yearHours ? ` · ${hrs(c.yearHours)} vol. hrs/yr` : ''}</em></td><td class="h">${range(c.capitalTotal)}</td><td class="h">${range(c.annualTotal)}</td></tr>`;
  }).join('');
  const prog = t.programme.map((p) => `<tr class="prog"><td>${p.label}${p.hours ? `<em>volunteers: about ${hrs(p.hours)} hours a year</em>` : ''}</td><td class="h">${p.hours ? '–' : range(p.capital)}</td><td class="h">${p.hours ? 'volunteers' : range(p.annual)}</td></tr>`).join('');
  const left = SITES.filter((s) => !inPlan(s.id));
  $('#detail-body').innerHTML = `
    <span class="type-tag">Planting plan</span>
    <h2>Proposed planting for Hitchin</h2>
    ${modelSwitch()}
    <div class="tiles">
      <div class="tile"><span>Set-up</span><b>${shortRange(t.setup)}</b><em>incl. 10% contingency</em></div>
      <div class="tile"><span>Each year</span><b>${shortRange(t.annual)}</b><em>materials, specialist work, running the group</em></div>
      ${vol ? `<div class="tile"><span>Volunteers</span><b>${hrs(t.yearHours)} hrs</b><em>a year · about ${t.volunteers} people at 2 hrs/week</em></div>` : `<div class="tile"><span>Sites</span><b>${t.count}</b><em>of ${SITES.length} proposed</em></div>`}
    </div>
    ${vol ? `<p class="fine">Volunteer time is worth about ${gbp(t.yearHours * VOLUNTEER_RATE)} a year at £${VOLUNTEER_RATE}/hour. Many funders accept that as in-kind match funding. Of those hours, ${hrs(t.siteHours)} are looking after the sites and ${hrs(t.progHours)} are litter picks, organising and events. Year one needs about ${hrs(t.setupHours)} more for planting and first-summer watering: ${hrs(t.firstYearHours)} in all.</p>` : ''}
    <table class="plan-table">
      <thead><tr><th>Stop, site and option</th><th class="h">Set-up</th><th class="h">Per year</th></tr></thead>
      <tbody>${rows}
        ${prog ? `<tr class="grp"><th colspan="3">Running the programme</th></tr>${prog}` : ''}
        <tr class="tot"><td>Contingency (10% of set-up)</td><td class="h">${range(t.contingency)}</td><td></td></tr>
        <tr class="tot"><td>Total</td><td class="h">${range(t.setup)}</td><td class="h">${range(t.annual)}</td></tr>
      </tbody>
    </table>
    ${left.length ? `<p class="fine"><b>Future sites</b> (not costed in this phase): ${left.map((s) => `<button class="linkish" data-site="${s.id}">${s.name}</button>`).join(', ')}. Tick them in the list to add them.</p>` : ''}
    <details class="costs"><summary>Where the prices come from</summary>
      <ul class="sources">${PRICE_NOTES.map(([n, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${n}</a></li>`).join('')}</ul>
      <p class="fine">Containers, signs and specialist work are typical trade prices. Plants use the mix chosen above. Free woodchip from local tree surgeons, donated plants and cuttings grown by volunteers would bring costs down further.</p>
    </details>
    <p class="fine">Ranges use UK supplier prices and quantities measured from the model. Ownership and permissions are to be confirmed site by site. Sponsorship (baskets, roundabout, planters) can reduce the council's share further.</p>
    <div class="row"><button class="primary" id="copy-plan">Copy plan for the council paper</button><button class="secondary" id="open-judging">How to win</button></div>
    <textarea id="plan-text" class="plan-text" rows="8" hidden aria-label="Plan text"></textarea>`;
  $('#detail').hidden = false;
  app.classList.add('has-detail');
}

// ---------- UI: how to win ----------
function openJudging() {
  state.selected = null;
  for (const p of pins.values()) p.el.classList.remove('selected');
  renderJudging();
  renderList();
}
function renderJudging() {
  state.view = 'judging';
  const t = planTotals();
  const inSites = orderedSites().filter((s) => inPlan(s.id));
  const strong = (k) => inSites.filter((s) => pillarLevels(s.id)[k] === 2).map((s) => s.name);
  const bar = JUDGING.pillars.map((p) => `<span class="jbar-${p.id}" style="flex:${p.marks}">${p.marks}</span>`).join('');
  $('#detail-body').innerHTML = `
    <span class="type-tag">Anglia in Bloom · RHS Britain in Bloom</span>
    <h2>How to win</h2>
    <p class="blurb">Hitchin would enter Anglia in Bloom's <b>Large Town</b> category. Judges walk a route in summer and mark out of 100. Flowers are only 40 of those marks. The other 60 are for how the town looks after its environment and how many people get involved all year.</p>
    <div class="jbar" aria-label="Marks: horticulture 40, environment 30, community 30">${bar}</div>
    <p class="fine medals">${JUDGING.medals.map(([m, n]) => `<b>${m}</b> ${n}+`).join(' · ')}</p>
    ${JUDGING.pillars.map((p) => `<div class="pillar-card pc-${p.id}"><h3>${p.name} <span>${p.marks} marks</span></h3><p>${p.detail}</p>
      <p class="plan-fit"><b>In this plan:</b> ${strong(p.id).length ? strong(p.id).join(', ') : 'nothing strong yet. Consider adding sites or options that score here.'}</p></div>`).join('')}
    <p class="fine">A volunteer-led programme is a real advantage here: community participation is 30% of the marks. ${state.model === 'volunteer' ? `This plan needs about ${hrs(t.yearHours)} volunteer hours a year, roughly ${t.volunteers} regular volunteers.` : ''}</p>
    <h3 class="section-label">Beyond the planting</h3>
    <ul class="jlist">${JUDGING.checklist.map((c) => `<li class="jl-${c.pillar}">${c.text}</li>`).join('')}</ul>
    <h3 class="section-label">Suggested judges' route</h3>
    <ol class="route">${orderedSites().map((s) => `<li class="${inPlan(s.id) ? '' : 'out'}"><button data-site="${s.id}">${s.name}</button></li>`).join('')}</ol>
    <p class="fine">Press <b>Tour</b> to fly the route. The whole route is judged, including the streets between stops, so tidy those too.</p>
    <h3 class="section-label">Sources</h3>
    <ul class="sources">${JUDGING.sources.map(([n, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${n}</a></li>`).join('')}</ul>
    <div class="row"><button class="primary" id="open-plan-2">Back to plan &amp; costs</button></div>`;
  $('#detail').hidden = false;
  app.classList.add('has-detail');
}

function planText() {
  const t = planTotals(), vol = state.model === 'volunteer';
  const lines = [
    'HITCHIN IN BLOOM: PROPOSED PLANTING PLAN',
    '',
    `Phase 1: ${t.count} sites, delivered by volunteers, with paid specialists only where needed (traffic management, work at height, structural fixings, machinery). Plants bought: ${SOURCING[state.sourcing].name.toLowerCase()}.`,
    `Set-up ${range(t.setup)} (including 10% contingency). Running costs ${range(t.annual)} a year.`,
    vol ? `Volunteer time: about ${hrs(t.firstYearHours)} hours in year one (including ${hrs(t.setupHours)} to plant and water in), then ${hrs(t.yearHours)} hours a year (${hrs(t.siteHours)} on the sites, ${hrs(t.progHours)} on litter picks, organising and events). That is about ${t.volunteers} regular volunteers giving 2 hours a week through the season, and the time is worth about ${gbp(t.yearHours * VOLUNTEER_RATE)} a year as in-kind match funding.` : '',
    'Figures are indicative ranges for budgeting, based on typical UK prices and quantities measured from a 3D model of the town. Quotes to follow.',
    '',
    'HOW THE PLAN TARGETS AN ANGLIA IN BLOOM AWARD (LARGE TOWN)',
    'Judges mark out of 100: horticultural achievement 40, environmental responsibility 30, community participation 30 (Gold 85+).',
    ...JUDGING.pillars.map((p) => `${p.name}: ${inSitesStrong(p.id).join(', ') || 'none yet'}.`),
    '',
  ];
  if (t.programme.length) {
    lines.push('RUNNING THE PROGRAMME');
    for (const p of t.programme) lines.push(p.hours ? `${p.label}: about ${hrs(p.hours)} volunteer hours a year.` : `${p.label}: ${range(p.capital)} set-up, ${range(p.annual)} a year.`);
    lines.push('');
  }
  const later = SITES.filter((x) => !inPlan(x.id));
  if (later.length) { lines.push(`FUTURE SITES (later phases, not costed here): ${later.map((x) => x.name).join(', ')}.`); lines.push(''); }
  lines.push('PHASE 1 SITES, IN JUDGES’ ROUTE ORDER');
  for (const s of orderedSites().filter((x) => inPlan(x.id))) {
    const o = optionOf(s.id), c = siteCost(s.id), i = info(s.id);
    lines.push(`\n${routeNo(s.id)}. ${s.name} (${s.street}) · ${ROLES[s.role]}`);
    lines.push(`Proposal: ${o.name}. ${o.summary}`);
    lines.push(`Why: ${s.why.join(' ')}`);
    lines.push(`Size: about ${fmt(i.area)} m²${i.units ? `, ${fmt(i.units)} containers` : ''}. Upkeep ${LEVEL[o.maintenance].toLowerCase()}, impact ${LEVEL[o.impact].toLowerCase()}, wildlife value ${LEVEL[o.wildlife].toLowerCase()}.`);
    lines.push(`Cost: ${range(c.capitalTotal)} set-up, ${range(c.annualTotal)} a year${vol && c.setupHours + c.yearHours ? `; plus about ${c.setupHours >= 1 ? `${hrs(c.setupHours)} volunteer hours to plant and water in, then ` : ''}${hrs(c.yearHours)}${c.setupHours >= 1 ? '' : ' volunteer hours'} a year` : ''}.`);
    lines.push(`Land: ${s.owner}. To confirm: ${s.checks.join(' ')}`);
    lines.push(`Partners: ${s.partners.join(', ')}.`);
  }
  return lines.filter((l, k, a) => !(l === '' && a[k - 1] === '')).join('\n');
}
function inSitesStrong(k) { return orderedSites().filter((s) => inPlan(s.id) && pillarLevels(s.id)[k] === 2).map((s) => s.name); }
async function copyPlan() {
  const text = planText();
  try { await navigator.clipboard.writeText(text); hint('Plan copied. Paste it into your council paper.'); }
  catch {
    const ta = $('#plan-text');
    ta.hidden = false; ta.value = text; ta.focus(); ta.select();
    hint('Select the text below and copy it');
  }
}

function select(id, { fly = true } = {}) {
  state.selected = id;
  if (id) state.view = 'site';
  cancelSuggest(false);
  for (const [pid, p] of pins) p.el.classList.toggle('selected', pid === id);
  renderList(); renderDetail();
  const site = siteById(id);
  if (site && fly) flyToSite(site);
  try { history.replaceState(null, '', id ? `#${id}` : location.pathname + location.search); } catch { /* sandboxed */ }
}

// ---------- Tour ----------
let tourTimer = null;
function startTour() {
  state.touring = true;
  $('#tour-btn').setAttribute('aria-pressed', 'true');
  $('#tour-btn .tool-label').textContent = 'Stop tour';
  const list = orderedSites().filter((s) => inPlan(s.id) && (state.filter === 'all' || s.role === state.filter));
  if (!list.length) return stopTour();
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
$('#judging-btn').addEventListener('click', () => { stopTour(); openJudging(); });
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
        <select id="idea-type">${Object.entries(PLANT_KINDS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
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
  $('#idea-list').innerHTML = state.ideas.map((i) => `<li><span>${escapeHtml(i.name)} <small>${PLANT_KINDS[i.type] || ''}, near ${escapeHtml(i.near)}</small></span></li>`).join('');
}
$('#copy-ideas').addEventListener('click', async () => {
  const text = 'Hitchin in Bloom: suggested spots\n\n' + state.ideas.map((i) =>
    `• ${i.name} (${PLANT_KINDS[i.type] || ''}, ${SCHEMES[i.scheme]?.name || ''}), near ${i.near}${i.notes ? `\n  ${i.notes}` : ''}`).join('\n');
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
  const hit = ray.intersectObjects(ground, false)[0];
  if (!hit) return;
  const { x, z } = hit.point;
  if (state.suggesting) return openIdeaForm(x, z);
  let best = null, bd = Infinity;
  for (const s of SITES) {
    const { center, radius } = info(s.id);
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
  if (post) post.render(camDist, viewShift.y / host.clientHeight, dt);
  else renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => {
  const w = host.clientWidth, h = host.clientHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h); labelRenderer.setSize(w, h);
  post?.setSize(w, h);
});

// ---------- Boot ----------
requestAnimationFrame(() => setTimeout(() => {
  build();
  renderFilters(); renderList(); renderIdeas();
  const fromHash = location.hash.slice(1);
  if (SITES.some((s) => s.id === fromHash)) select(fromHash);
  else {
    if (window.innerWidth > 760) renderPlan();
    hint('Tap a purple pin, or pick a site from the list', 6000);
  }
  $('#loading').classList.add('done');
  frame();
}, 30));
