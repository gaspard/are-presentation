export type Vect = Float32Array;
// 4 bytes to encode Float32
const bpe = Float32Array.BYTES_PER_ELEMENT;

export type ODE = {
  // Number of steps in the output (more steps => finer computations).
  steps: number;
  // Time rangee length (defaults to 1)
  duration?: number;

  // Use 4th order of Runge-Kutta
  rungeKutta?: boolean;

  // Number of parameters in the equation (without t)
  dimension: number;
  // Must be an array of "dimension" numbers;
  startValue: number[];
  step: (input: Vect, dt: number, output: Vect) => void;
};

const ODE_DEFAULTS = {
  duration: 1,
  rungeKutta: true,
};

export function solve<T>(odeParam: ODE) {
  if (odeParam.startValue.length !== odeParam.dimension) {
    throw new Error(
      `startValue has length ${odeParam.startValue.length} but dimension is ${odeParam.dimension} (they must be the same!)`
    );
  }

  const { steps, dimension, startValue, step, duration, rungeKutta } =
    Object.assign({}, ODE_DEFAULTS, odeParam) as ODE & typeof ODE_DEFAULTS;

  // Assign data
  const buffer = new ArrayBuffer((steps + 1) * dimension * bpe);

  let input = new Float32Array(buffer, 0, dimension);
  input.set(startValue);

  const dt = duration / steps;

  if (rungeKutta) {
    // Setup buffers for Runge-Kutta (each k is computed for each dimension)
    // k1
    // x + k1/2
    // k2
    // x + k2/2
    // k3
    // x + k3
    // k4
    const k1 = new Float32Array(dimension);
    const x_k1 = new Float32Array(dimension);
    const k2 = new Float32Array(dimension);
    const x_k2 = new Float32Array(dimension);
    const k3 = new Float32Array(dimension);
    const x_k3 = new Float32Array(dimension);
    const k4 = new Float32Array(dimension);

    for (let i = 1; i <= steps; ++i) {
      // k1 = dt * slope(x)
      step(input, dt, k1);
      // x_k1 = x + k1 / 2;
      for (let j = 0; j < dimension; ++j) x_k1[j] = input[j] + k1[j] / 2;
      // k2 = dt * slope(x + k1/2)
      step(x_k1, dt, k2);
      // x_k2 = x + k2 / 2;
      for (let j = 0; j < dimension; ++j) x_k2[j] = input[j] + k2[j] / 2;
      // k3 = dt * slope(x + k2/2)
      step(x_k2, dt, k3);
      // x_k3 = x + k3;
      for (let j = 0; j < dimension; ++j) x_k3[j] = input[j] + k3[j];
      // k4 = dt * slope(x + k3)
      step(x_k3, dt, k4);
      const output = new Float32Array(buffer, i * dimension * bpe, dimension);
      // x = x + 1/6 (k1 + 2 k2 + 2 k3 + k4)
      for (let j = 0; j < dimension; ++j)
        output[j] = input[j] + (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]) / 6;
      input = output;
    }
  } else {
    for (let i = 1; i <= steps; ++i) {
      const output = new Float32Array(buffer, i * dimension * bpe, dimension);
      // step outputs delta value
      step(input, dt, output);
      for (let j = 0; j < dimension; ++j) output[j] = input[j] + output[j];
      input = output;
    }
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
