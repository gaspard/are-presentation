import { describe, expect, test } from "vitest";
import { Grid, makeCellular } from "./cellular";

const ON = "x";
const OFF = ".";

function txt2Array(text: string): Float32Array {
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

function grid2Txt({ n, m, output }: Grid): string {
  const g: string[] = [];
  for (let i = 0; i < n; ++i) {
    const r: string[] = [];
    for (let j = 0; j < m; ++j) {
      r.push(output[i * m + j][0] === 1 ? ON : OFF);
    }
    g.push(r.join(" "));
  }
  return g.join("\n");
}

function conway(input: Float32Array[], _, output: Float32Array) {
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
describe("txt2Array", () => {
  test("should parse text to grid", (t) => {
    expect([
      ...txt2Array(`
      . . . .
      . x x .
      x . x .
      . . . .
      `),
    ]).toEqual([0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0]);
  });
});

describe("cellular", () => {
  test("should run game of life on 4x4 grid", (t) => {
    const c = makeCellular(
      {
        p: 1,
        n: 4,
        m: 4,
        wrap: true,
      },
      conway,
      txt2Array(`
      . . . .
      . x x .
      x . x .
      . . . .
      `)
    );
    const grid = c.next();
    const txt = grid2Txt(grid);
    expect(txt).toEqual(
      `
. . . .
. x x x
. . x x
. . . .`.trim()
    );
  });
});
