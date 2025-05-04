// input: 9 neighbors, each Float32Array of length 2 (u, v)
// output: Float32Array of length 2 (u, v)

import {
  addGaussianNoise,
  Cellular,
  Gaussian2D,
  makeCellular,
} from "./cellular";

export interface Settings {
  Du: number;
  Dv: number; // Diffusion rate for v (inhibitor)
  f: number; // Feed rate
  k: number; // Kill rate
  dt: number; // Time step
}

// Parameters for BZ-like reaction-diffusion (tweak for different patterns)
const defaultSettings = {
  Du: 0.49, // Diffusion rate for u (activator)
  Dv: 0.08, // Diffusion rate for v (inhibitor)
  f: 0.035, // Feed rate
  k: 0.06, // Kill rate
  dt: 1.0, // Time step
};

export function makeKernel({ Du, Dv, f, k, dt }: Settings) {
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

    output[0] = Math.max(0, u + du * dt);
    output[1] = Math.max(0, v + dv * dt);
  };
}

const anoise: Gaussian2D = {
  center: { x: 0, y: 0 },
  radius: 0.25,
  scale: 1,
};

const bnoise: Gaussian2D = {
  center: { x: 0.3, y: 0.3 },
  radius: 0.5,
  scale: 1,
};

function rand(from: number, to: number) {
  return from + (to - from) * Math.random();
}

function randomGauss(scale = 1.0): Gaussian2D {
  return {
    center: { x: rand(-1, 1), y: rand(-1, 1) },
    radius: rand(0.1, 1),
    scale: rand(0.1, 2),
  };
}

export function randomBelousov(
  n: number,
  m: number,
  settings: Settings = defaultSettings
): Cellular {
  const p = 2;
  return makeCellular(
    {
      p,
      n,
      m,
      wrap: true,
    },
    makeKernel(settings),
    addGaussianNoise({ p, n, m }, [randomGauss(), randomGauss()])
  );
}
