import { slide_parser } from "./src/slide/slide_parser";

export const markdownPlugin = {
  name: "markdown-plugin",
  transform(code: string, id: string) {
    if (!id.endsWith(".md")) return null;

    return {
      code: `export const slide = ${JSON.stringify(slide_parser(code))}`,
      map: null,
    };
  },
};
