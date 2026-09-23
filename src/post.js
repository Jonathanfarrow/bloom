import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { N8AOPass } from 'n8ao';

// Tilt-shift: blur grows away from a horizontal focus band, like a macro photo of a model.
const TiltShift = {
  uniforms: { tDiffuse: { value: null }, focus: { value: 0.5 }, amount: { value: 0 }, dir: { value: new THREE.Vector2(1, 0) }, texel: { value: new THREE.Vector2() } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float focus; uniform float amount; uniform vec2 dir; uniform vec2 texel;
    varying vec2 vUv;
    void main() {
      float d = smoothstep(0.12, 0.55, abs(vUv.y - focus)) * amount;
      vec4 sum = vec4(0.0);
      float w[5]; w[0] = 0.227; w[1] = 0.1945; w[2] = 0.1216; w[3] = 0.054; w[4] = 0.0162;
      sum += texture2D(tDiffuse, vUv) * w[0];
      for (int i = 1; i < 5; i++) {
        vec2 o = dir * texel * float(i) * d * 2.2;
        sum += texture2D(tDiffuse, vUv + o) * w[i];
        sum += texture2D(tDiffuse, vUv - o) * w[i];
      }
      gl_FragColor = sum;
    }`,
};

// Gentle grade: a touch more saturation and warmth, soft vignette.
const Grade = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: TiltShift.vertexShader,
  fragmentShader: `
    uniform sampler2D tDiffuse; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(vec3(l), c.rgb, 1.12);
      c.rgb *= vec3(1.02, 1.0, 0.97);
      vec2 q = vUv - 0.5;
      c.rgb *= 1.0 - dot(q, q) * 0.45;
      gl_FragColor = c;
    }`,
};

export function createPost(renderer, scene, camera, host) {
  const w = host.clientWidth, h = host.clientHeight;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(w, h);

  // Plain render pass, used only if ambient occlusion is unavailable or switched off
  const beauty = new RenderPass(scene, camera);
  composer.addPass(beauty);
  let ao = null;
  try {
    ao = new N8AOPass(scene, camera, w, h);
    ao.configuration.screenSpaceRadius = true;
    ao.configuration.aoRadius = 36;
    ao.configuration.distanceFalloff = 0.25;
    ao.configuration.intensity = 2.6;
    ao.configuration.color = new THREE.Color('#2b2418');
    ao.configuration.gammaCorrection = false;
    ao.configuration.halfRes = small;
    ao.setQualityMode(small ? 'Low' : 'Medium');
    composer.addPass(ao);
  } catch {
    ao = null;
  }
  beauty.enabled = !ao;

  const tiltH = new ShaderPass(TiltShift), tiltV = new ShaderPass(TiltShift);
  tiltV.uniforms.dir.value.set(0, 1);
  composer.addPass(tiltH); composer.addPass(tiltV);
  composer.addPass(new ShaderPass(Grade));
  composer.addPass(new OutputPass());
  const smaa = new SMAAPass(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
  composer.addPass(smaa);

  // Drop the ambient occlusion if the device can't keep up
  let frames = 0, time = 0, degraded = false;

  return {
    render(camDist, shiftY, dt) {
      const k = THREE.MathUtils.clamp((520 - camDist) / 420, 0, 1);
      for (const p of [tiltH, tiltV]) {
        p.uniforms.amount.value = small ? 0 : k * 1.6;
        p.uniforms.focus.value = 0.5 + shiftY;
        p.uniforms.texel.value.set(1 / host.clientWidth, 1 / host.clientHeight);
        p.enabled = !small && k > 0.02;
      }
      composer.render(dt);
      frames++; time += dt;
      if (!degraded && ao && frames > 90 && time > 0) {
        if (frames / time < 24) {
          degraded = true;
          if (!ao.configuration.halfRes) { ao.configuration.halfRes = true; degraded = false; frames = 0; time = 0; }
          else { ao.enabled = false; beauty.enabled = true; }
        } else if (frames > 400) degraded = true;
      }
    },
    setSize(w2, h2) {
      composer.setSize(w2, h2);
      ao?.setSize(w2, h2);
    },
  };
}
