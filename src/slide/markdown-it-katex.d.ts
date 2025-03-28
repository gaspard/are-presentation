interface KatexOptions {
  throwOnError?: boolean;
  errorColor?: string;
  displayMode?: boolean;
  macros?: Record<string, string>;
}

declare module "@iktakahiro/markdown-it-katex" {
  function katex(md: MarkdownIt, options?: KatexOptions): void;
  export = katex;
}
