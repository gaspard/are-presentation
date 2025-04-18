import { Cellular, Grid, makeCellular } from "./cellular";

const ON = "X";
const OFF = ".";

export function txt2Array(text: string): Float32Array {
  return new Float32Array(
    text
      .trim()
      .split("\n")
      .flatMap((s) =>
        s
          .trim()
          .split(" ")
          .map((c) => (c === ON ? 1 : 0))
      )
  );
}

export function grid2Txt({ n, m, output }: Grid): string {
  const g: string[] = [];
  for (let i = 0; i < n; ++i) {
    const r: string[] = [];
    for (let j = 0; j < m; ++j) {
      r.push(output[i * m + j][0] === 1 ? ON : " ");
    }
    g.push(r.join(" "));
  }
  return g.join("\n");
}

export function conway(input: Float32Array[], _, output: Float32Array) {
  const self = input[4];
  const neighbors =
    input[0][0] +
    input[1][0] +
    input[2][0] +
    input[3][0] +
    input[5][0] +
    input[6][0] +
    input[7][0] +
    input[8][0];
  if (self[0] > 0) {
    // alive
    if (neighbors < 2 || neighbors > 3) {
      // die
      output[0] = 0;
    } else {
      // live
      output[0] = 1;
    }
  } else {
    // dead
    output[0] = neighbors === 3 ? 1 : 0;
  }
}

export function randomLife(n: number, m: number): Cellular {
  const p = 1;
  return makeCellular(
    {
      p,
      n,
      m,
      wrap: true,
    },
    conway
  );
}
