import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { deepMerge, DeepPartial } from "./deepMerge";
import { ExperimentType, PointsExperiment } from "./experiments";

const defaultView = {
  scale: 1,
  scene: {
    position: { x: 0, y: 0, z: 0 },
  },
  camera: {
    lookAt: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 5 },
  },
  grid: {
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
  },
  axes: true,
};

export type View = DeepPartial<typeof defaultView>;

export function orthographicScene(
  elem: HTMLDivElement,
  experiment: ExperimentType
) {
  const scene = new THREE.Scene();
  const view = deepMerge(defaultView, experiment.view);

  const width = elem.clientWidth;
  const height = width;

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);

  const renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setSize(width, height);

  elem.appendChild(renderer.domElement);

  // Orbit controls
  const controls = new OrbitControls(camera, renderer.domElement);
  camera.position.set(
    view.camera.position.x,
    view.camera.position.y,
    view.camera.position.z
  );
  camera.lookAt(
    view.camera.lookAt.x,
    view.camera.lookAt.y,
    view.camera.lookAt.z
  );
  controls.update();

  scene.position.set(
    view.scene.position.x,
    view.scene.position.y,
    view.scene.position.z
  );

  // Add axes for orientation
  if (view.axes) {
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
  const view = deepMerge(defaultView, experiment.view);

  const material = new THREE.PointsMaterial({
    color: 0x44ffff,
    size: 4,
    opacity: 0.45,
    transparent: true,
    depthWrite: false,
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
  points.scale.set(view.scale, view.scale, view.scale);
  scene.add(points);

  function update(time: number, data: Float32Array) {
    geometry.setAttribute("position", new THREE.BufferAttribute(data, 3));
  }

  return update;
}

export function addGrid(
  scene: THREE.Scene,
  experiment: { n: number; m: number; p: number; view: View }
) {
  const view = deepMerge(defaultView, experiment.view);
  const geometry = new THREE.PlaneGeometry(2, 2);
  const height = experiment.n;
  const width = experiment.m;

  if (![1, 2, 4].includes(experiment.p)) {
    throw new Error(
      `addGrid only supports dimensions for pixel of 1, 2, or 4. Found grd.p = ${experiment.p}`
    );
  }

  const texture = new THREE.DataTexture(
    null,
    width,
    height,
    experiment.p === 1
      ? THREE.RedFormat
      : experiment.p === 2
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
    vertexShader: view.grid.vertexShader,
    fragmentShader: view.grid.fragmentShader,
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
