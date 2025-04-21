export type Vect = Float32Array;
// 4 bytes to encode Float32
const bpe = Float32Array.BYTES_PER_ELEMENT;

export type ODE = {
  dt: number;
  steps?: number;
  speed?: number;

  // Use 4th order of Runge-Kutta
  rungeKutta?: boolean;

  // Number of parameters in the equation (without t)
  dimension: number;
  // Must be an array of "dimension" numbers;
  startValue: number[];
  deriv: (input: Vect, t: number, output: Vect, inputOffset: number) => void;
};

const ODE_DEFAULTS = {
  steps: 100,
  speed: 1,
  rungeKutta: true,
};

export function solve(odeParam: ODE) {
  const { ode, steps, step: step, data } = makeStepper(odeParam);
  step(ode.dt * steps);
  return data;
}

export type Stepper = {
  ode: ODE;
  data: Float32Array;
  last: Float32Array;
  steps: number;
  rk: boolean;
  t: number;
  i: number;
  deriv: ODE["deriv"];
  step: (elapsed: number) => void;
};

export function makeStepper(
  odeParam: ODE,
  init?: (data: Float32Array) => void
): Stepper {
  if (odeParam.startValue.length !== odeParam.dimension) {
    throw new Error(
      `startValue has length ${odeParam.startValue.length} but dimension is ${odeParam.dimension} (they must be the same!)`
    );
  }

  const ode = Object.assign({}, ODE_DEFAULTS, odeParam) as ODE &
    typeof ODE_DEFAULTS;
  const { dimension, startValue, deriv, speed, steps, rungeKutta } = ode;

  // Assign data
  const buffer = new ArrayBuffer((steps + 1) * dimension * bpe);
  const data = new Float32Array(buffer, 0, dimension * (steps + 1));
  if (init) {
    init(data);
  }

  const stepper: Stepper = {
    ode,
    data,
    last: new Float32Array(buffer, 0, dimension),
    steps,
    t: 0,
    i: 0,
    rk: rungeKutta,
    deriv,
    step: () => {},
  };
  for (let i = 0; i <= steps; ++i) {
    stepper.data.set(startValue, i * dimension);
  }

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

  stepper.step = (atime: number) => {
    const time = atime * ode.speed;
    const dt = ode.dt * ode.speed;
    let t = stepper.t;
    const deriv = stepper.deriv;
    while (t < time) {
      const i = (stepper.i + 1) % (steps + 1);
      const input = stepper.last;
      const output = new Float32Array(buffer, i * dimension * bpe, dimension);
      if (stepper.rk) {
        // k1 / dt =  slope(x)
        deriv(input, t, k1, 0);
        // x_k1 = x + k1 / 2;
        for (let j = 0; j < dimension; ++j)
          x_k1[j] = input[j] + (dt * k1[j]) / 2;
        // k2 = dt * slope(x + k1/2)
        deriv(x_k1, t + dt / 2, k2, 0);
        // x_k2 = x + k2 / 2;
        for (let j = 0; j < dimension; ++j)
          x_k2[j] = input[j] + (dt * k2[j]) / 2;
        // k3 = dt * slope(x + k2/2)
        deriv(x_k2, t + dt / 2, k3, 0);
        // x_k3 = x + k3;
        for (let j = 0; j < dimension; ++j) x_k3[j] = input[j] + dt * k3[j];
        // k4 = dt * slope(x + k3)
        deriv(x_k3, t, k4, 0);
        // x = x + 1/6 (k1 + 2 k2 + 2 k3 + k4)
        for (let j = 0; j < dimension; ++j)
          output[j] =
            input[j] + (dt * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])) / 6;
      } else {
        // step outputs delta value
        deriv(input, t, output, 0);
        for (let j = 0; j < dimension; ++j)
          output[j] = input[j] + output[j] * dt;
      }
      stepper.last = output;
      stepper.i = i;
      t += dt;
    }
    stepper.t = t;
  };
  return stepper;
}

export function kutta(
  { p, dt }: { p: number; dt: number },
  deriv: (
    input: Float32Array,
    t: number,
    output: Float32Array,
    offset: number
  ) => void
) {
  const k1 = new Float32Array(p);
  const x_k1 = new Float32Array(p);
  const k2 = new Float32Array(p);
  const x_k2 = new Float32Array(p);
  const k3 = new Float32Array(p);
  const x_k3 = new Float32Array(p);
  const k4 = new Float32Array(p);

  return (
    input: Float32Array,
    t: number,
    output: Float32Array,
    inputOffset: number,
    outputOffset: number
  ) => {
    const dt2 = dt / 2;
    // k1 / dt =  f (x)
    deriv(input, t, k1, inputOffset);
    // x_k1 = x + k1 * dt/2;
    for (let j = 0; j < p; ++j) x_k1[j] = input[inputOffset + j] + k1[j] * dt2;
    // k2 = f (x + k1 * dt/2)
    deriv(x_k1, t + dt2, k2, 0);
    // x_k2 = x + k2 * dt/2;
    for (let j = 0; j < p; ++j) x_k2[j] = input[inputOffset + j] + k2[j] * dt2;
    // k3 = f (x + k2 * dt/2)
    deriv(x_k2, t + dt2, k3, 0);
    // x_k3 = x + k3 * dt;
    for (let j = 0; j < p; ++j) x_k3[j] = input[inputOffset + j] + k3[j] * dt;
    // k4 = f (x + k3)
    deriv(x_k3, t, k4, 0);

    const dt6 = dt / 6;
    // x = x + 1/6 (k1 + 2 k2 + 2 k3 + k4) * dt
    for (let j = 0; j < p; ++j)
      output[outputOffset + j] =
        input[inputOffset + j] + (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]) * dt6;
  };
}
