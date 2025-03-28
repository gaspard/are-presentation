import md_katex from "@iktakahiro/markdown-it-katex";
import { default as markdown } from "markdown-it";
import md_attrs from "markdown-it-attrs";
import md_high from "markdown-it-highlightjs";
// import md_react from "markdown-it-react-component";
// import { Test } from "./components/Test";

const katex_opts: KatexOptions = {
  macros: {
    "\\T": "\\bullet",
    "\\F": "\\cdot",
    "\\hT": "\\textcolor{#ff9900}{\\bullet}",
    "\\hF": "\\textcolor{#ff9900}{\\cdot}",
    "\\iff": "\\leftrightarrow",
    "\\lighttext": "\\textcolor{#999}",
  },
};

const md = new markdown({
  html: true,
});

md.use(md_katex, katex_opts);
md.use(md_attrs, {
  leftDlimiter: "{",
  rightDelimiter: "}",
  allowedAttributes: [], // allow all
});
md.use(md_high);
//md.use(md_react, {
//  components: {
//    Test: (props: any) => <Test {...props} />,
//  },
//});

export function render(source: string) {
  try {
    return md.render(source);
  } catch (e: any) {
    console.log(e);
    return `<span class='md-error'>${e.message}</span>`;
  }
}
