import * as React from "react";
import { randomBelousov } from "../functional/belousov";
import { Cellular, Vect } from "../functional/cellular";
import { makeStepper, ODE, Stepper } from "../functional/runge-kutta";
import { Experiment } from "./lib/Experiment";
import { gridExperiment } from "./lib/experiments";
import { s, settingsValues } from "./lib/settings";

const bpe = Float32Array.BYTES_PER_ELEMENT;

const experiment = gridExperiment({
  view: {
    axes: false,
    scale: 1 / 60,
    scene: {
      position: { x: -0.9, y: -0.8 },
    },
    grid: {
      fragmentShader: `
      uniform float uTime;
      uniform sampler2D uData;
      varying vec2 vUv;
  
      void main() {
        // x = proies
        float x = texture2D(uData, vUv).r;
        // y = prédateurs
        float y = texture2D(uData, vUv).g;
        // vec3 color = vec3(1. - y, x, x*y);
        vec3 color = vec3(y, x, 0.);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    },
  },
  p: 2, // RG
  m: 400,
  n: 400,
  settings: {
    dt: s.float("dt", "$s$", 2.0, (v) => v > 0),
    speed: s.float("vitesse", "facteur", 1.0, (v) => v > 0),
    noise: s.enum("bruit", ["2D", "blocks"], 1),
    seed: s.seed("reset"),
    break: s.break(),
    Du: s.float("diff. u", "", 0.1, (v) => v >= 0 && v <= 0.2),
    Dv: s.float("diff. v", "", 0.1, (v) => v >= 0 && v <= 0.2),
    break2: s.break(),
    alpha: s.float("$\\alpha$", "", 0.3, (v) => v > 0),
    beta: s.float("$\\beta$", "", 0.03, (v) => v > 0),
    gamma: s.float("$\\gamma$", "", 0.03, (v) => v > 0),
    delta: s.float("$\\delta$", "", 0.3, (v) => v > 0),
  },
  type: "grid",
  init: (experiment) => {
    const cellular: Cellular = randomBelousov(experiment.n, experiment.m, {
      type: experiment.settings.noise.value === 0 ? "2D" : "art",
    });
    const ode: Stepper = makeLv(experiment.settings);
    return { cellular, ode };
  },
  make(settings, { ode, cellular }: { ode: Stepper; cellular: Cellular }) {
    console.log("MAKE");
    const { dt, Du, Dv, alpha, beta, gamma, delta } = settingsValues(settings);

    cellular.kernel = makeKernel({
      Du,
      Dv,
      dt,
    });

    ode.deriv = lvDeriv({ alpha, beta, gamma, delta });

    let last_t = 0;

    function step(_time: number) {
      let t = last_t;
      const time = t + 5 * dt;

      while (t < time) {
        // Diffuse step
        cellular.step(t);
        t += dt;
      }
      last_t = dt;
      // Lotka-Volterra in each cell step
      cellular.swap(); // previous output becomes our input

      // We use 'output' format (not the neighbours). Name should be
      // changed...
      const inp = cellular.input.values.buffer;
      const out = cellular.output.values.buffer;
      const len = cellular.grid.n * cellular.grid.m;
      const dimension = cellular.grid.p;

      for (let i = 0; i < len; ++i) {
        const input = new Float32Array(inp, i * dimension * bpe, dimension);
        const output = new Float32Array(out, i * dimension * bpe, dimension);
        ode.step2(input, dt * 2, output);
      }

      return cellular.output.values;
    }

    return step;
  },
});

export const LotkaTerritory = () => <Experiment experiment={experiment} />;

function makeKernel({
  Du,
  Dv,
  dt,
}: {
  // Diffusion
  Du: number;
  Dv: number;
  dt: number;
}) {
  return function kernel(
    input: Float32Array[],
    t: number,
    output: Float32Array
  ) {
    // Gather self and neighbors
    const self = input[4];
    const u = self[0];
    const v = self[1];

    // Compute Laplacian (discrete diffusion) for u and v
    let lap_u = 0,
      lap_v = 0;
    // Moore neighborhood weights: center 4, sides 1, corners 0.5 (optional)
    const weights = [0.05, 0.2, 0.05, 0.2, -1, 0.2, 0.05, 0.2, 0.05];
    for (let i = 0; i < 9; i++) {
      lap_u += input[i][0] * weights[i] * 4;
      lap_v += input[i][1] * weights[i] * 4;
    }

    output[0] = clip(0, 300, u + lap_u * Du);
    output[1] = clip(0, 300, v + lap_v * Dv);
  };
}

function makeLv(settings) {
  const { n, dt, speed, rungeKutta, alpha, beta, gamma, delta } =
    settingsValues(settings);

  const ode: ODE = {
    dt,
    speed,
    steps: 1,
    rungeKutta: true,

    dimension: 2,
    // Initial position 1, velocity 0, z = 0.
    // This does not matter (values are replaced with cellular data).
    startValue: [10, 10],
    deriv: lvDeriv({ alpha, beta, gamma, delta }),
  };

  const stepper = makeStepper(ode);

  return stepper;
}

function clip(min, max, v) {
  if (v < min) {
    return min;
  } else if (v > max) {
    return max;
  }
  return v;
}

function lvDeriv({
  alpha,
  beta,
  gamma,
  delta,
}: {
  alpha: number;
  beta: number;
  gamma: number;
  delta: number;
}) {
  return (input: Vect, t: number, output: Vect, offset: number) => {
    // proies (Green)
    let x = clip(0.001, 400, input[offset] * 20);
    // prédateurs (Red)
    let y = clip(0.001, 400, input[offset + 1] * 20);

    const dx = (alpha * x - beta * x * y) / 400;
    output[offset] = dx;

    const dy = (gamma * x * y - delta * y) / 400;
    output[offset + 1] = dy;
  };
}
