import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { slides } from "../../src/slides";
import "./toc.css";

export function TableOfContents() {
  return (
    <div className="toc grid grid-cols-[1fr_0fr]">
      {slides.map((slide) => (
        <Fragment key={slide.name}>
          <Link to={slide.path}>{slide.name}</Link>
          <div className="opacity-20">{slide.presenter}</div>
        </Fragment>
      ))}
    </div>
  );
}
