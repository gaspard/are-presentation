import "./css/slide.css";
import "./css/typography.css";
import { render } from "./md";
import { type Slide } from "./slide_parser";

export function Slide({ slide }: { slide: Slide }) {
  return (
    <div className="slide bg-predator-50 rounded-2xl p-8 text-prey-800 text-left">
      <div
        className="md"
        dangerouslySetInnerHTML={{ __html: render(slide.md) }}
      />
    </div>
  );
}
