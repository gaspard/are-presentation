import { observe, tilia, useTilia } from "@tilia/react";
import * as React from "react";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { makeStepper, ODE, Vect } from "../functional/runge-kutta";

const settings = tilia({
  setup: {
    // reset simulation
    prey: 10,
    predator: 15,
    steps: 840,
    dt: 0.006,
    speed: 3.0,
  },
  live: {
    alpha: 0.72,
    beta: 0.02,
    gamma: 0.01,
    delta: 0.3,
    rungeKutta: true,
  },
});

const range = {
  setup: {
    // reset simulation
    prey: [1, 40, 0.01],
    predator: [1, 40, 0.01],
    steps: [1, 2000, 1],
    dt: [0.0001, 0.1, 0.0001],
    speed: [0.1, 100],
  },
  live: {
    alpha: [0, 1, 0.01],
    beta: [0, 1, 0.01],
    gamma: [0, 1, 0.01],
    delta: [0, 1, 0.01],
    rungeKutta: [0, 0, 0.01],
  },
};

type Range = Record<string, number[]>;

type Settings = typeof settings;

let stepper = makeStepper(prey(settings));

observe(settings, (s) => {
  // observe s.steup but not settings.live
  stepper = makeStepper(prey({ setup: s.setup, live: settings.live }));
});

observe(settings, ({ live }) => {
  // listen for rungeKutta change
  // live changes
  if (live.rungeKutta !== stepper.rk) {
    stepper.rk = live.rungeKutta;
  }
  stepper.deriv = preyDeriv(live);
});

export function Simulator() {
  const domElem = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!domElem.current) return;
    const scene = setupScene(domElem.current);
    const sim = displayPoints(scene.scene, 1 / 60);
    scene.start(sim.step);
  }, []);

  return (
    <>
      <div className="flex flex-col w-1/2">
        {typedKeys(settings.setup).map((k) => (
          <Input
            key={k}
            branch={settings.setup}
            entry={k}
            range={range.setup}
          />
        ))}
      </div>
      <div className="flex flex-col w-1/2">
        {typedKeys(settings.live).map((k) => (
          <Input key={k} branch={settings.live} entry={k} range={range.live} />
        ))}
      </div>
      <div ref={domElem} />
    </>
  );
}

function typedKeys<T extends Object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as any;
}

function Input<T>({
  branch,
  entry,
  range,
}: {
  branch: T;
  entry: keyof T;
  range: Range;
}) {
  const obj = useTilia(branch);
  const v = obj[entry];
  if (typeof v === "number") {
    const r = range[entry as any];
    return (
      <>
        <label>
          {String(entry)}: {v.toFixed(3)}
        </label>
        <input
          type="range"
          min={r[0]}
          max={r[1]}
          step={r[2]}
          value={v}
          onChange={(e) => {
            obj[entry] = Number(e.target.value) as any;
          }}
        />
      </>
    );
  } else if (typeof v === "boolean") {
    return (
      <>
        <label>{String(entry)}</label>
        <input
          type="checkbox"
          checked={v}
          onChange={() => {
            obj[entry] = !v as any;
          }}
        />
      </>
    );
  }
}

function spring(
  k: number,
  m: number,
  steps: number = 9,
  dt: number = 200,
  rungeKutta: boolean = true
): ODE {
  const ode: ODE = {
    // Number of steps in the output (more steps => finer computations).
    dt,
    // Duration for the steps (in seconds)
    steps,

    // Runge-Kutta
    rungeKutta: rungeKutta,

    // Number of parameters in the equation (without t)
    // We need two dimensions for second order ode: one for
    // x and one for x'
    dimension: 3,
    // Must be an array of "dimension" numbers
    startValue: [1, 0, 0], // MUST BE 3 for THREE.js 3D position
    // Spring: a = - (k/m) x
    // dx = v * dt
    // dv = - (k/m) x dt
    deriv: (input: Vect, t: number, output: Vect) => {
      // dx_{n+1} / dt = v_{n}
      output[0] = input[1];
      // dv_{n+1} / dt = - (k/m) x_{n}
      output[1] = -(k / m) * input[0];
    },
  };
  return ode;
}

function prey({ setup, live }: Settings): ODE {
  const ode: ODE = {
    dt: setup.dt,
    steps: setup.steps,
    speed: setup.speed,
    rungeKutta: live.rungeKutta,
    dimension: 3,
    startValue: [setup.prey, setup.predator, 0], // MUST BE 3 for THREE.js 3D position
    deriv: preyDeriv(live),
  };
  return ode;
}

function preyDeriv({ alpha, beta, gamma, delta }: Settings["live"]) {
  return (input: Vect, t: number, output: Vect) => {
    const [x, y] = input;
    // dx / dt = alpha x - beta x y
    output[0] = alpha * x - beta * x * y;
    // dy / dt = gamma x y - delta y
    output[1] = gamma * x * y - delta * y;
  };
}

export type Simulation = {
  step: (elapsed: number) => void;
  cleanup: () => void;
};

function displayPoints(scene: THREE.Scene, scale: number = 1): Simulation {
  const geometry = new THREE.BufferGeometry();

  if (true) {
    const material = new THREE.PointsMaterial({
      color: 0x44ffff,
      size: 0.1 / scale,
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
  } else {
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff });

    // 4. Render line
    const line = new THREE.Line(geometry, material);
    scene.add(line);
  }

  function step(time: number) {
    stepper.step(time);
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(stepper.data, 3)
    );
  }

  return {
    step,
    cleanup() {},
  };
}

function setupScene(elem: HTMLDivElement) {
  // Create scene
  const scene = new THREE.Scene();

  // Create camera (PerspectiveCamera)
  // FIXME
  const width = window.innerWidth / 2;
  const height = window.innerHeight / 2;

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
  scene.position.x = -0.9;
  scene.position.y = -0.8;

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

  // Handle window resize
  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", resize);

  function cleanup() {
    window.removeEventListener("resize", resize);
  }

  return {
    scene,
    cleanup,
    start,
    stop,
  };
}
