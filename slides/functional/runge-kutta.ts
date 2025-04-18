export type Vect = Float32Array;
// 4 bytes to encode Float32
const bpe = Float32Array.BYTES_PER_ELEMENT;

export type ODE = {
  // Number of steps in the output (more steps => finer computations).
  steps: number;
  // Starting time value (defaults to 0)
  start?: number;
  // Time rangee length (defaults to 1)
  duration?: number;

  // Order of the Runge-Kutta (more => better simulation, defaults to 4)
  order?: number;

  // Number of parameters in the equation (without t)
  dimension: number;
  // Must be an array of "dimension" numbers;
  startValue: number[];
  step: (input: Vect, dt: number, output: Vect) => void;
};

const ODE_DEFAULTS = {
  start: 0,
  duration: 1,
  order: 4,
};

export function solve<T>(odeParam: ODE) {
  if (odeParam.startValue.length !== odeParam.dimension) {
    throw new Error(
      `startValue has length ${odeParam.startValue.length} but dimension is ${odeParam.dimension} (they must be the same!)`
    );
  }

  const { steps, dimension, startValue, step, duration, order } = Object.assign(
    {},
    ODE_DEFAULTS,
    odeParam
  ) as ODE & typeof ODE_DEFAULTS;
  // Setup buffers for Runge-Kutta
  // const rk = new ArrayBuffer(order * dimension * bpe);

  // Assign data
  const buffer = new ArrayBuffer((steps + 1) * dimension * bpe);
  let input = new Float32Array(buffer, 0, dimension);
  input.set(startValue);

  const dt = duration / steps;
  for (let i = 1; i <= steps; ++i) {
    // no runge kutta for now
    console.log(i);
    const output = new Float32Array(buffer, i * dimension * bpe, dimension);
    step(input, dt, output);
    input = output;
  }

  return new Float32Array(buffer);
}

/*

const n = 1000; // time steps
const k = 8; // values per step (arbitrary)
const width = n;
const height = Math.ceil(k / 4);
const data = new Float32Array(width * height * 4);

// Example: recursive computation (Lotka-Volterra or custom model)
let state = new Float32Array(k);
// Initialize state as needed
for (let i = 0; i < k; i++) state[i] = Math.random();

for (let t = 0; t < n; t++) {
  // Compute new state recursively
  // Example: simple decay
  for (let i = 0; i < k; i++) state[i] *= 0.99 + 0.01 * Math.sin(t + i);

  // Store in texture data
  for (let i = 0; i < k; i++) {
    const pixelIndex = t + width * Math.floor(i / 4);
    const channel = i % 4;
    data[pixelIndex * 4 + channel] = state[i];
  }
}

*/
