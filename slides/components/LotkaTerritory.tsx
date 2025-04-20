import { observe, tilia } from "@tilia/react";
import * as React from "react";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Cellular, makeCellular, snoise, Vect } from "../functional/cellular";
import { makeKernel } from "../functional/diffuse";
import { kutta, ODE } from "../functional/runge-kutta";
import { Inputs } from "./lib/Input";

const g = { n: 400, m: 400, p: 2, wrap: true };
const cellular = makeCellular(
  g,
  makeKernel({ dt: 0.0001, f: 0.01 }),
  snoise(g, [0, 10], [0.002, 0.15])
);

const lotka = tilia({
  setup: {
    // reset simulation
    prey: 10,
    predator: 15,
    steps: 840,
  },
  live: {
    speed: 3.0,
    dt: 0.006,
    alpha: 0.72,
    beta: 0.02,
    gamma: 0.01,
    delta: 0.3,
    rungeKutta: true,
  },
});

const lotkaRange = {
  setup: {
    // reset simulation
    prey: [1, 40, 0.01],
    predator: [1, 40, 0.01],
    steps: [1, 2000, 1],
  },
  live: {
    speed: [0.1, 100],
    dt: [0.0001, 0.1, 0.0001],
    alpha: [0, 1, 0.01],
    beta: [0, 1, 0.01],
    gamma: [0, 1, 0.01],
    delta: [0, 1, 0.01],
    rungeKutta: [0, 0, 0.01],
  },
};

type LotkaSettings = typeof lotka;

const stepper = {
  dt: lotka.live.dt,
  step(input: Float32Array, time: number, output: Float32Array) {},
};

function updateLotka() {
  const step = kutta({ p: 2, dt: lotka.live.dt }, preyDeriv(lotka.live));
  stepper.dt = lotka.live.dt;
  stepper.step = (input: Float32Array, time: number, output: Float32Array) => {
    // p = 2
    const len = input.length / 2;
    for (let i = 0; i < len; ++i) {
      step(input, time, output, i * 2, i * 2);
    }
  };
}

observe(lotka, ({ live }) => {
  updateLotka();
});

export function LotkaTerritory() {
  const domElem = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!domElem.current) return;
    const scene = setupScene(domElem.current);
    const sim = displayPoints(scene);
    scene.start(sim.step);

    // Cleanup on unmount
    return () => {
      sim.cleanup();
      scene.cleanup();
    };
  }, []);

  return (
    <>
      <div
        ref={domElem}
        style={{
          width: "800px",
          height: "800px",
          display: "block",
        }}
      />
      <Inputs branch={lotka.live} range={lotkaRange.live} />
    </>
  );
}

export type Simulation = {
  mesh: THREE.Mesh;
  scene: Scene;
  step: (elapsed: number) => void;
  cleanup: () => void;
};

function displayPoints(scene: Scene, scale: number = 1): Simulation {
  const geometry = new THREE.PlaneGeometry(2, 2);
  const height = cellular.grid.n;
  const width = cellular.grid.m;

  const data = cellular.g[0].values;

  const texture = new THREE.DataTexture(
    data,
    width,
    height,
    THREE.RGFormat, // Only using red and green channels
    THREE.FloatType
  );
  texture.needsUpdate = true;

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
        gl_Position = vec4(position, 1.);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform sampler2D uData;
      varying vec2 vUv;
  
      void main() {
        float prey = texture2D(uData, vUv).r / 60.;
        float predator = texture2D(uData, vUv).g / 60.;
        vec3 color = vec3(predator, prey, 0.);
        gl_FragColor = vec4(color, 1.);
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.scene.add(mesh);

  function step(time: number) {
    // Diffuse
    let t = cellular.t;
    // maybe diffuse should be in the while loop (or we adapt dt ?)
    cellular.next(time);
    while (t < time) {
      cellular.swap();
      // Lotka-Volterra
      stepper.step(cellular.input.values, time, cellular.output.values);
      t += stepper.dt;
    }
    cellular.t = time;

    texture.image.data = cellular.output.values;

    uniforms.uTime.value = time;
    texture.needsUpdate = true;
  }

  return {
    scene,
    mesh,
    step,
    cleanup() {},
  };
}

function setupScene(elem: HTMLDivElement): Scene {
  // Create scene
  const scene = new THREE.Scene();

  // Set up camera
  const width = elem.clientWidth || 800;
  const height = elem.clientHeight || 800;
  const aspect = width / height;

  // Orthographic camera that fits the plane
  const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10);
  camera.position.z = 1; // Move camera back so it can see the plane

  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  elem.appendChild(renderer.domElement);

  // Render function
  let run = false;

  function start(update: (time: number) => void) {
    if (run === false) {
      run = true;
      let prevTime: number | undefined;
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

  // Handle window resize for orthographic camera
  function resize() {
    const w = elem.clientWidth || 800;
    const h = elem.clientHeight || 800;
    const aspect = w / h;
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener("resize", resize);

  function cleanup() {
    window.removeEventListener("resize", resize);
    renderer.dispose();
  }

  return {
    scene,
    renderer,
    camera,
    cleanup,
    start,
    stop,
  };
}

interface Scene {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.OrthographicCamera;
  cleanup: () => void;
  start: (update: (time: number) => void) => void;
  stop: () => void;
}

function clickAction(
  { scene: { renderer, camera }, mesh }: Simulation,
  cellular: Cellular
) {
  const { grid, g } = cellular;
  function onMove(event) {
    // Get mouse position in normalized device coordinates (-1 to +1)
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    // Raycast from camera
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Intersect with your plane mesh
    const intersects = raycaster.intersectObject(mesh);
    if (intersects.length > 0) {
      const point = intersects[0].point; // 3D point on the plane

      // Map point to grid coordinates (assuming plane covers [-1,1] x [-1,1])
      const x = Math.floor(((point.x + 1) / 2) * grid.m);
      const y = Math.floor((1 - (point.y + 1) / 2) * grid.n);

      // Update your simulation state
      const i = grid.m * x + y;
      const v0 = 1.0 - g[0].output[i][0];
      const v1 = 1.0 - g[0].output[i][1];
      g[0].output[i][0] = v1;
      g[1].output[i][1] = v0;
    }
  }
  renderer.domElement.addEventListener("mousemove", onMove, false);
}

function prey({ setup, live }: LotkaSettings): ODE {
  const ode: ODE = {
    dt: live.dt,
    steps: 1,
    speed: live.speed,
    rungeKutta: true,
    dimension: 3,
    startValue: [setup.prey, setup.predator, 0], // MUST BE 3 for THREE.js 3D position
    deriv: preyDeriv(live),
  };
  return ode;
}

function preyDeriv({ alpha, beta, gamma, delta }: LotkaSettings["live"]) {
  return (input: Vect, t: number, output: Vect, offset: number) => {
    const x = input[offset];
    const y = input[offset + 1];
    // dx / dt = alpha x - beta x y
    output[offset] = alpha * x - beta * x * y;
    // dy / dt = gamma x y - delta y
    output[offset + 1] = gamma * x * y - delta * y;
  };
}
