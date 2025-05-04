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
  },
  p: 2, // RG
  m: 200,
  n: 200,
  settings: {
    dt: s.float("dt", "$s$", 0.3, (v) => v > 0),
    speed: s.float("vitesse", "facteur", 1.0, (v) => v > 0),
    noise: s.enum("bruit", ["2D", "arty"]),
    seed: s.seed("reset"),
    break: s.break(),
    Du: s.float("diff. u", "", 0.49, (v) => v >= 0),
    Dv: s.float("diff. v", "", 0.03, (v) => v >= 0),
    f: s.float("feed", "", 0.035, (v) => v >= 0),
    k: s.float("kill", "", 0.06, (v) => v >= 0),
    break2: s.break(),
    alpha: s.float("$\\alpha$", "", 0.58, (v) => v > 0),
    beta: s.float("$\\beta$", "", 0.02, (v) => v > 0),
    gamma: s.float("$\\gamma$", "", 0.01, (v) => v > 0),
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
    const { dt, Du, Dv, f, k, noise } = settingsValues(settings);

    const kernel = makeKernel({
      Du,
      Dv,
      f,
      k,
      dt,
    });

    cellular.kernel = kernel;

    function step(time: number) {
      // Diffuse step
      cellular.step(time);
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
        ode.step2(input, dt, output);
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
  f,
  k,
  dt,
}: {
  // Diffusion
  Du: number;
  Dv: number;
  f: number;
  k: number;
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
    const weights = [0.5, 1, 0.5, 1, -6, 1, 0.5, 1, 0.5];
    for (let i = 0; i < 9; i++) {
      lap_u += input[i][0] * weights[i];
      lap_v += input[i][1] * weights[i];
    }

    // Reaction-diffusion equations (Gray-Scott style, BZ-like)
    // du/dt = Du * Laplacian(u) - u*v*v + f*(1-u)
    // dv/dt = Dv * Laplacian(v) + u*v*v - (f + k)*v
    const uvv = u * v * v;
    const du = Du * lap_u - uvv + f * (1 - u);
    const dv = Dv * lap_v + uvv - (f + k) * v;

    output[0] = clip(0, 300, u + du * dt);
    output[1] = clip(0, 300, v + dv * dt);
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
    let x = clip(0.001, 400, input[offset] * 20);
    let y = clip(0.001, 400, input[offset + 1] * 20);

    const dx = (alpha * x - beta * x * y) / 400;
    if (isNaN(dx)) {
      console.log({ x, y });
      output[offset] = 0;
    } else {
      output[offset] = dx;
    }

    const dy = (gamma * x * y - delta * y) / 400;
    if (isNaN(dy)) {
      console.log({ x, y });
      output[offset + 1] = 0;
    } else {
      output[offset + 1] = dy;
    }
  };
}
