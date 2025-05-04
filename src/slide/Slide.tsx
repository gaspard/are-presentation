import hljs from "highlight.js";
import glsl from "highlight.js/lib/languages/glsl";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";
import "highlight.js/styles/night-owl.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { type Slide } from "../slides";
import "./css/slide.css";
import "./css/typography.css";

hljs.registerLanguage("glsl", glsl);
hljs.registerLanguage("py", python);
hljs.registerLanguage("ts", typescript);

export function Slide({ slide }: { slide: Slide }) {
  const navigate = useNavigate();
  const { Component } = slide;

  function toPrev() {
    if (slide.prev) {
      navigate(slide.prev.path);
    }
  }

  function toNext() {
    if (slide.next) {
      navigate(slide.next.path);
    }
  }
  useEffect(() => {
    hljs.highlightAll();
  });

  useEffect(() => {
    // preload next slide
    if (slide.next) {
      slide.next.file();
    }
    function press(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        toPrev();
      } else if (e.key === "ArrowRight") {
        toNext();
      }
    }

    document.addEventListener("keydown", press);
    return () => document.removeEventListener("keydown", press);
  }, []);

  return (
    <div className="">
      <div className="flex justify-between text-predator-400 m-4">
        <div className="w-30 flex flex-row justify-start">
          <div
            className={`h-0 w-0 border-y-12 border-y-transparent border-r-12 border-r-predator-200
          cursor-pointer
           ${slide.page === 1 ? "opacity-25" : ""}`}
            onClick={toPrev}
          ></div>
        </div>
        <div className="grow">ARE - proie / prédateur</div>
        <div className="flex flex-row w-30 gap-8 justify-end">
          <div
            className="opacity-40 cursor-pointer"
            onClick={() => navigate("/")}
          >
            {slide.page}/{slide.total}
          </div>
          <div
            className={`h-0 w-0 border-y-12 border-y-transparent border-l-12 border-l-predator-200 
          cursor-pointer
          ${slide.page === slide.total ? "opacity-25" : ""} `}
            onClick={toNext}
          ></div>
        </div>
      </div>
      <div className="slide bg-predator-50 rounded-2xl p-8 text-prey-800 text-left">
        <Component />
      </div>
    </div>
  );
}
