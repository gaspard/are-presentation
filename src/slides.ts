import { Slide } from "./slide/slide_parser";

export const slides: { [file_name: string]: { slide: Slide } } =
  import.meta.glob("../slides/*.md", { eager: true });
