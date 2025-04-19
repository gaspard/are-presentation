export type Vect = Float32Array;
// 4 bytes to encode Float32
const bpe = Float32Array.BYTES_PER_ELEMENT;

export interface GridParam {
  // Number of values per cell
  p: number;
  // Number of rows
  n: number;
  // Number of columns
  m: number;
  // Edge wrapping
  wrap?: boolean;
}

export interface Grid extends GridParam {
  // data
  data: ArrayBuffer;
  values: Float32Array;
  // edge cell
  e: Float32Array;
  // 9 neighbors
  input: Float32Array[][];
  // cell (i * m + j)
  output: Float32Array[];
}

export interface Cellular {
  // Grid definition
  grid: GridParam;
  // Double buffers
  g: Grid[];
  i: number;
  // operation
  t: number;
  next: () => Grid;
  step: (input: Float32Array[], t: number, output: Float32Array) => void;
}

// Returns n x m times 9 neighbors (on set of neighbors for each cell).
export function makeGrid(
  gridParam: GridParam,
  init: Float32Array,
  e: Float32Array
): Grid {
  const { p, n, m, wrap } = gridParam;
  const data = new ArrayBuffer(n * m * p * bpe);
  const values = new Float32Array(data, 0, n * m * p);
  values.set(init);
  const cells: Float32Array[][] = [];
  const output: Float32Array[] = [];
  for (let i = -1; i <= n; ++i) {
    const row: Float32Array[] = [];
    for (let j = -1; j <= m; ++j) {
      if (i < 0 || i >= n || j < 0 || j >= m) {
        if (wrap) {
          // will fix later
        } else {
          row[j + 1] = e;
        }
      } else {
        const cell = new Float32Array(data, (i * m + j) * p * bpe, p);
        output.push(cell);
        row[j + 1] = cell;
      }
    }
    cells[i + 1] = row;
  }

  if (wrap) {
    for (let i = -1; i <= n; ++i) {
      const row = cells[i + 1];
      for (let j = -1; j <= m; ++j) {
        if (i < 0 || i >= n || j < 0 || j >= m) {
          if (wrap) {
            // will fix later
            const cell = cells[((i + n) % n) + 1][((j + m) % m) + 1];
            row[j + 1] = cell;
          }
        }
      }
      cells[i + 1] = row;
    }
  }

  const input: Float32Array[][] = [];
  for (let i = 0; i < n; ++i) {
    for (let j = 0; j < m; ++j) {
      const celln: Float32Array[] = [];
      for (let k = i - 1; k <= i + 1; ++k) {
        for (let l = j - 1; l <= j + 1; ++l) {
          celln.push(cells[k + 1][l + 1]);
        }
      }
      input.push(celln);
    }
  }

  return {
    ...gridParam,
    data,
    values,
    e,
    input,
    output,
  };
}

export function makeCellular(
  grid: GridParam,
  step: Cellular["step"],
  init: Float32Array,
  e: Float32Array = new Float32Array(grid.p)
): Cellular {
  const g = [makeGrid(grid, init, e), makeGrid(grid, init, e)];
  const cellular: Cellular = {
    grid,
    g,
    t: 0,
    i: 0,
    step,
    next: () => g[0],
  };

  cellular.next = () => {
    const { step, t, g } = cellular;
    cellular.i = (cellular.i + 1) % 2;
    const g0 = g[(cellular.i + 1) % 2];
    const g1 = g[cellular.i];
    loop(g0.input, t, g1.output, step);
    return g1;
  };

  return cellular;
}

function loop(
  input: Float32Array[][],
  t: number,
  output: Float32Array[],
  step: Cellular["step"]
) {
  const len = output.length;
  for (let i = 0; i < len; ++i) {
    step(input[i], t, output[i]);
  }
}
