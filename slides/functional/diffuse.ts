// input: 9 neighbors, each Float32Array of length 2 (u, v)
// output: Float32Array of length 2 (u, v)

import { Cellular, makeCellular, snoise } from "./cellular";

export interface Settings {
  dt: number;
  f: number; // Feed rate
}

// Parameters for BZ-like reaction-diffusion (tweak for different patterns)
const defaultSettings = {
  dt: 0.01,
  f: 0.035, // Feed rate
};

export function makeKernel({ dt }: Settings) {
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
    const weights = [0.5, 1, 0.5, 1, 0, 1, 0.5, 1, 0.5];
    for (let i = 0; i < 9; i++) {
      lap_u += input[i][0] * weights[i];
      lap_v += input[i][1] * weights[i];
    }
    lap_u -= u * 6; // Subtract center weight sum
    lap_v -= v * 6;

    const du = lap_u;
    const dv = lap_v;

    output[0] = u + du * 100 * dt;
    output[1] = v + dv * 100 * dt;
  };
}

export function randomDiffuse(
  n: number,
  m: number,
  range: number[] = [0, 1],
  settings: Settings = defaultSettings
): Cellular {
  const p = 2;
  const g = {
    p,
    n,
    m,
    wrap: true,
  };
  return makeCellular(g, makeKernel(settings), snoise(g, range));
}
