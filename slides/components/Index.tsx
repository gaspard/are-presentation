import React from "react";
import { Link } from "react-router-dom";
import { slides } from "../../src/slides";

export function Index() {
  return (
    <div className="flex flex-col">
      {slides.map((slide) => (
        <Link to={slide.path}>{slide.name}</Link>
      ))}
    </div>
  );
}
