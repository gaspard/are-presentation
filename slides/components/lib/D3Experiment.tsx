/*

const coeff = tilia({
  dt: s.float("dt", "s", 0.01),
});

export function RungeKuttaCoeff() {
  const elem = React.useRef(null);

  React.useEffect(() => {
    if (!elem.current) return;
    const svg = d3.select(elem.current);

    // Define the arrow marker
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 5)
      .attr("refY", 5)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("path")
      .attr("d", "M0,0 L10,5 L0,10 z")
      .style("fill", "red"); // Arrow color

    // Sample data for the lines
    const data = [
      { x1: 50, y1: 250, x2: 200, y2: 100 },
      { x1: 50, y1: 250, x2: 350, y2: 150 },
      { x1: 200, y1: 100, x2: 350, y2: 50 },
    ];

    // Draw the lines with arrows
    svg
      .selectAll("line")
      .data(data)
      .enter()
      .append("line")
      .attr("x1", (d) => d.x1)
      .attr("y1", (d) => d.y1)
      .attr("x2", (d) => d.x2)
      .attr("y2", (d) => d.y2)
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)");
  }, [elem.current]);

  return (
    <div>
      <svg ref={elem} />
    </div>
  );
}
*/
