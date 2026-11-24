import * as THREE from '/vendor/three.module.js';
import { GLTFLoader } from '/vendor/three-addons/loaders/GLTFLoader.mjs';

export function mountBuildingModelPreview(root) {
  if (!root || root.dataset.mounted === 'true') return;
  root.dataset.mounted = 'true';
  root.innerHTML = '';
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  } catch (error) {
    root.textContent = `3D-esikatselu ei ole käytettävissä tässä selaimessa (${error.message}).`;
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xf3eee3, 1);
  renderer.domElement.setAttribute('aria-label', 'Rakennuksen 3D-luonnos. Pyöritä hiirellä tai kosketuksella.');
  root.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3eee3);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 1000);
  scene.add(new THREE.HemisphereLight(0xfff5df, 0x58616a, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  key.position.set(65, 95, 65);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xddeaff, 1.25);
  fill.position.set(-70, 35, -35);
  scene.add(fill);

  const pivot = new THREE.Group();
  scene.add(pivot);
  let radius = 72;
  let theta = root.dataset.modelUrl?.includes('mannerheimintie-5') ? 3.5 : 0.78;
  let phi = root.dataset.modelUrl?.includes('mannerheimintie-5') ? 1.25 : 1.15;
  let dragging = false;
  let last = { x: 0, y: 0 };
  let frameId = 0;
  const canvas = renderer.domElement;
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    last = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    theta -= (event.clientX - last.x) * 0.008;
    phi = Math.max(0.42, Math.min(1.48, phi + (event.clientY - last.y) * 0.004));
    last = { x: event.clientX, y: event.clientY };
    updateCamera();
  });
  const stopDrag = () => { dragging = false; };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    radius = Math.max(34, Math.min(135, radius + event.deltaY * 0.055));
    updateCamera();
  }, { passive: false });

  function updateCamera() {
    const distance = radius * 1.5;
    camera.position.set(distance * Math.sin(phi) * Math.sin(theta), distance * Math.cos(phi), distance * Math.sin(phi) * Math.cos(theta));
    camera.lookAt(0, 0, 0);
  }
  updateCamera();
  function resize() {
    const width = Math.max(280, root.clientWidth);
    const height = Math.max(260, root.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(root);
  resize();

  new GLTFLoader().load(root.dataset.modelUrl, (gltf) => {
    const model = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    model.position.sub(center);
    pivot.add(model);
    const size = bounds.getSize(new THREE.Vector3());
    radius = Math.max(size.x, size.y, size.z) * 1.35;
    updateCamera();
  }, undefined, (error) => {
    root.innerHTML = `<p class="building-model-error">Mallin lataus epäonnistui. Lataa tiedosto linkistä. (${String(error?.message || 'tuntematon virhe')})</p>`;
  });

  const draw = () => {
    if (!root.isConnected) {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      renderer.dispose();
      return;
    }
    frameId = requestAnimationFrame(draw);
    renderer.render(scene, camera);
  };
  draw();
}
