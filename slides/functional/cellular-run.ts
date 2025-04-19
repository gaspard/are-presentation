import { grid2Txt, randomLife } from "./conway";

console.clear();

function print(grid: Grid) {
  console.log(`\x1b[${grid.n + 1}A`);
  console.log(grid2Txt(grid));
}
const c = randomLife(40, 40);
setInterval(() => {
  print(c.next());
}, 50);
