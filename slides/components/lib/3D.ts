import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export function orthographicScene(
  elem: HTMLDivElement,
  translate?: { x: number; y: number }
) {
  // Create scene
  const scene = new THREE.Scene();

  // Create camera (PerspectiveCamera)
  // FIXME
  const width = elem.clientWidth;
  const height = width;

  // const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  const size = 1;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);

  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });

  // FIXME
  renderer.setSize(width, height);

  // FIXME
  elem.appendChild(renderer.domElement);

  // Add orbit controls
  const controls = new OrbitControls(camera, renderer.domElement);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  controls.update();

  if (translate) {
    scene.position.x = translate.x;
    scene.position.y = translate.y;
  }

  // Optionally, add a grid or axes helper for orientation
  const axesHelper = new THREE.AxesHelper(0.5);
  scene.add(axesHelper);

  // Render function
  let run = false;

  // Start / stop
  function start(update: (time: number) => void) {
    if (run === false) {
      run = true;
      let prevTime;
      function animate(time: number) {
        if (run) {
          requestAnimationFrame(animate);
          if (prevTime === undefined) {
            prevTime = time;
          }
          update((time - prevTime) / 1000);
          renderer.render(scene, camera);
        }
      }
      requestAnimationFrame(animate);
    }
  }

  function stop() {
    run = false;
  }

  // Handle elem resize
  function resize() {
    const width = elem.clientWidth;
    // camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, width);
  }

  // Set initial size
  resize();

  // Watch for changes in `elem`'s size
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(elem);

  function cleanup() {
    stop();
    window.removeEventListener("resize", resize);
    resizeObserver.unobserve(elem);
    cleanupThreejs({ scene, renderer, elem });
  }

  return {
    scene,
    cleanup,
    start,
    stop,
  };
}

export function addPoints(scene: THREE.Scene, scale: number = 1) {
  const geometry = new THREE.BufferGeometry();

  const material = new THREE.PointsMaterial({
    color: 0x44ffff,
    size: 4,
    opacity: 0.45,
    transparent: true,
  });
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <alphatest_fragment>",
      `
        float r = length(gl_PointCoord - vec2(0.5));
        if (r > 0.5) discard;
        #include <alphatest_fragment>
      `
    );
  };

  const points = new THREE.Points(geometry, material);
  points.scale.set(scale, scale, scale);
  scene.add(points);

  function update(data: Float32Array) {
    geometry.setAttribute("position", new THREE.BufferAttribute(data, 3));
  }

  return update;
}

export function cleanupThreejs(animation: {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  elem: HTMLElement;
}) {
  const { scene, renderer, elem } = animation;

  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    }
  });

  renderer.renderLists.dispose();
  renderer.forceContextLoss();

  if (renderer.domElement && elem.contains(renderer.domElement)) {
    elem.removeChild(renderer.domElement);
  }

  (animation as any).scene = null;
  (animation as any).renderer = null;
}
