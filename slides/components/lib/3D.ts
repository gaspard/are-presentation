import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PointsExperiment } from "./experiment";

export function orthographicScene(
  elem: HTMLDivElement,
  translate?: { x: number; y: number },
  axes: boolean
) {
  const scene = new THREE.Scene();

  const width = elem.clientWidth;
  const height = width;

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);

  const renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setSize(width, height);

  elem.appendChild(renderer.domElement);

  // Orbit controls
  const controls = new OrbitControls(camera, renderer.domElement);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  controls.update();

  if (translate) {
    scene.position.x = translate.x;
    scene.position.y = translate.y;
  }

  // Add axes for orientation
  if (axes) {
    const axesHelper = new THREE.AxesHelper(0.5);
    scene.add(axesHelper);
  }

  let run = false;

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

export function addPoints(scene: THREE.Scene, experiment: PointsExperiment) {
  const geometry = new THREE.BufferGeometry();
  const scale = experiment.scale || 1;

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

  function update(time: number, data: Float32Array) {
    geometry.setAttribute("position", new THREE.BufferAttribute(data, 3));
  }

  return update;
}

export function addGrid(
  scene: THREE.Scene,
  grid: { n: number; m: number; p: number },
  scale: number = 1
) {
  const geometry = new THREE.PlaneGeometry(2, 2);
  const height = grid.n;
  const width = grid.m;

  if (![1, 2, 4].includes(grid.p)) {
    throw new Error(
      `addGrid only supports dimensions for pixel of 1, 2, or 4. Found grd.p = ${grid.p}`
    );
  }

  const texture = new THREE.DataTexture(
    null,
    width,
    height,
    grid.p === 1
      ? THREE.RedFormat
      : grid.p === 2
      ? THREE.RGFormat
      : // grid.p === 4
        THREE.RGBAFormat,
    THREE.FloatType
  );

  const uniforms = {
    uTime: { value: 0.0 },
    uData: { value: texture },
  };

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform sampler2D uData;
      varying vec2 vUv;
  
      void main() {
        float u = texture2D(uData, vUv).r;
        float v = texture2D(uData, vUv).g;
        vec3 color = vec3(u, v, 0.0);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  function update(time: number, data: Float32Array) {
    texture.image.data = data;
    uniforms.uTime.value = time;
    texture.needsUpdate = true;
  }

  return update;
}
