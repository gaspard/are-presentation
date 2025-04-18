import * as React from "react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { makeStepper, ODE, Stepper, Vect } from "../functional/runge-kutta";

export function Simulator() {
  const ref = useRef(makeStepper(spring(1, 1)));
  const [rk, setRk] = useState(false);
  const domElem = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stepper = ref.current;
    if (!stepper) return;
    if (!domElem.current) return;
    const scene = setupScene(domElem.current);
    const sim = displayPoints(scene.scene, stepper);
    scene.start(sim.step);
  }, []);

  useEffect(() => {
    const s = ref.current;
    if (!s) return;
    s.rk = rk;
    console.log(s.rk);
  }, [rk]);

  return (
    <>
      <input type="checkbox" checked={rk} onChange={(e) => setRk((v) => !v)} />
      <div ref={domElem} />
    </>
  );
}

function spring(
  k: number,
  m: number,
  duration: number = 9,
  steps: number = 200,
  rungeKutta: boolean = true
): ODE {
  const ode: ODE = {
    // Number of steps in the output (more steps => finer computations).
    steps,
    // Duration for the steps (in seconds)
    duration,

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
    step: (input: Vect, t: number, output: Vect) => {
      // dx_{n+1} / dt = v_{n}
      output[0] = input[1];
      // dv_{n+1} / dt = - (k/m) x_{n}
      output[1] = -(k / m) * input[0];
    },
  };
  return ode;
}

export type Simulation = {
  step: () => void;
  cleanup: () => void;
};

function displayPoints(scene: THREE.Scene, stepper: Stepper): Simulation {
  const geometry = new THREE.BufferGeometry();

  if (true) {
    const material = new THREE.PointsMaterial({
      color: 0x44ffff,
      size: 0.1,
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
    scene.add(points);
  } else {
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff });

    // 4. Render line
    const line = new THREE.Line(geometry, material);
    scene.add(line);
  }

  function step() {
    stepper.step();
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

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 0, 5); // Pull back to see [-1,1] cube
  camera.lookAt(0, 0, 0);

  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });

  // FIXME
  renderer.setSize(width, height);

  // FIXME
  elem.appendChild(renderer.domElement);

  // Add orbit controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();

  // Optionally, add a grid or axes helper for orientation
  const axesHelper = new THREE.AxesHelper(1.5);
  scene.add(axesHelper);

  // Render function
  let run = false;

  // Start / stop
  function start(update: () => void) {
    if (run === false) {
      run = true;
      function animate() {
        if (run) {
          requestAnimationFrame(animate);
          update();
          renderer.render(scene, camera);
        }
      }
      animate();
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
