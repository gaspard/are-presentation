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
  step: (input: Vect, t: number, output: Vect) => void;
};

const ODE_DEFAULTS = {
  duration: 1,
  rungeKutta: true,
};

export function solve(odeParam: ODE) {
  const {
    ode: { steps },
    step,
    data,
  } = makeStepper(odeParam);
  for (let i = 1; i <= steps; ++i) step();
  return data;
}

export type Stepper = {
  ode: ODE;
  data: Float32Array;
  last: Float32Array;
  rk: boolean;
  t: number;
  i: number;
  step: () => void;
};

export function makeStepper(odeParam: ODE): Stepper {
  if (odeParam.startValue.length !== odeParam.dimension) {
    throw new Error(
      `startValue has length ${odeParam.startValue.length} but dimension is ${odeParam.dimension} (they must be the same!)`
    );
  }

  const ode = Object.assign({}, ODE_DEFAULTS, odeParam) as ODE &
    typeof ODE_DEFAULTS;
  const { steps, dimension, startValue, step, duration, rungeKutta } = ode;

  // Assign data
  const buffer = new ArrayBuffer((steps + 1) * dimension * bpe);

  const dt = duration / steps;

  const stepper: Stepper = {
    ode,
    data: new Float32Array(buffer, 0, dimension * (steps + 1)),
    last: new Float32Array(buffer, 0, dimension),
    t: 0,
    i: 0,
    rk: rungeKutta,
    step: () => {},
  };
  stepper.last.set(startValue);

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

  stepper.step = () => {
    if (stepper.rk) {
      const i = (stepper.i + 1) % (steps + 1);
      const t = stepper.t;
      const input = stepper.last;
      // k1 / dt =  slope(x)
      step(input, t, k1);
      // x_k1 = x + k1 / 2;
      for (let j = 0; j < dimension; ++j) x_k1[j] = input[j] + (dt * k1[j]) / 2;
      // k2 = dt * slope(x + k1/2)
      step(x_k1, t + dt / 2, k2);
      // x_k2 = x + k2 / 2;
      for (let j = 0; j < dimension; ++j) x_k2[j] = input[j] + (dt * k2[j]) / 2;
      // k3 = dt * slope(x + k2/2)
      step(x_k2, t, k3);
      // x_k3 = x + k3;
      for (let j = 0; j < dimension; ++j) x_k3[j] = input[j] + dt * k3[j];
      // k4 = dt * slope(x + k3)
      step(x_k3, t, k4);
      const output = new Float32Array(buffer, i * dimension * bpe, dimension);
      // x = x + 1/6 (k1 + 2 k2 + 2 k3 + k4)
      for (let j = 0; j < dimension; ++j)
        output[j] =
          input[j] + (dt * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])) / 6;
      stepper.last = output;
      stepper.i = i;
    } else {
      const i = (stepper.i + 1) % (steps + 1);
      const t = stepper.t + dt;
      const input = stepper.last;
      const output = new Float32Array(buffer, i * dimension * bpe, dimension);
      // step outputs delta value
      step(input, t, output);
      for (let j = 0; j < dimension; ++j) output[j] = input[j] + output[j] * dt;
      stepper.last = output;
      stepper.i = i;
    }
  };
  return stepper;
}
