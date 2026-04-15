import {
  EditorView,
  highlightActiveLine,
  lineNumbers,
  keymap,
  drawSelection,
  highlightActiveLineGutter,
} from "@codemirror/view";
import {
  EditorState,
  Compartment,
  type Extension,
} from "@codemirror/state";
import { lintGutter } from "../features/shellcheck";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  syntaxHighlighting,
  HighlightStyle,
  indentOnInput,
} from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// Uses Obsidian's theme CSS variables (adapt to light/dark mode automatically)
// with One Dark colors as fallback for themes that don't define them.
const scriptVaultHighlight = HighlightStyle.define([
  { tag: t.keyword,                                             color: "var(--code-keyword,   #cf8e6d)" },
  { tag: [t.string, t.special(t.string)],                      color: "var(--code-string,    #6aab73)" },
  { tag: [t.lineComment, t.blockComment],                       color: "var(--code-comment,   #7a7e85)", fontStyle: "italic" },
  { tag: [t.number, t.bool, t.null],                           color: "var(--code-value,     #5191a6)" },
  { tag: t.atom,                                               color: "var(--code-important, #d16969)" },
  { tag: t.variableName,                                       color: "var(--code-normal,    #9cdcfe)" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "var(--code-function,  #dcdcaa)" },
  { tag: t.definition(t.variableName),                         color: "var(--code-function,  #dcdcaa)" },
  { tag: t.propertyName,                                       color: "var(--code-property,  #c8c8c8)" },
  { tag: t.operator,                                           color: "var(--code-operator,  #d4d4d4)" },
  { tag: t.punctuation,                                        color: "var(--code-punctuation,#d4d4d4)" },
  { tag: t.typeName,                                           color: "var(--code-tag,        #4ec9b0)" },
  { tag: t.tagName,                                            color: "var(--code-tag,        #e9c46a)" },
  { tag: t.attributeName,                                      color: "var(--code-property,  #9cdcfe)" },
  { tag: t.link,                                               color: "var(--code-string,    #6aab73)", textDecoration: "underline" },
  { tag: t.invalid,                                            color: "#f44747",                        textDecoration: "underline" },
]);

const baseTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "var(--code-size, var(--font-smaller, 13px))",
    fontFamily: "var(--font-monospace, monospace)",
    backgroundColor: "var(--background-primary, #1e1e1e)",
    color: "var(--text-normal, #d4d4d4)",
  },
  ".cm-content": { caretColor: "var(--text-normal, #d4d4d4)", padding: "0" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--text-normal, #d4d4d4)" },
  ".cm-gutters": {
    backgroundColor: "var(--background-secondary, #252526)",
    color: "var(--text-faint, #858585)",
    border: "none",
    borderRight: "1px solid var(--background-modifier-border, #454545)",
  },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 8px 0 4px", minWidth: "2rem" },
  ".cm-activeLine": { backgroundColor: "var(--background-modifier-hover, rgba(255,255,255,.05))" },
  ".cm-activeLineGutter": { backgroundColor: "var(--background-modifier-hover, rgba(255,255,255,.05))" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "var(--text-selection, rgba(100,100,255,.3))",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "var(--background-modifier-hover, rgba(255,255,255,.1))",
    border: "none",
    color: "var(--text-muted, #858585)",
    padding: "0 6px",
  },
  ".cm-scroller": { fontFamily: "var(--font-monospace, monospace)" },
});

export interface CreateEditorOptions {
  parent: HTMLElement;
  doc: string;
  langCompartment: Compartment;
  maskCompartment: Compartment;
  lintCompartment: Compartment;
  onChange: () => void;
  onCursorMove: (line: number, col: number, totalLines: number) => void;
}

export function createEditor(opts: CreateEditorOptions): EditorView {
  const state = EditorState.create({
    doc: opts.doc,
    extensions: [
      baseTheme,
      lineNumbers(),
      highlightActiveLineGutter(),
      foldGutter(),
      drawSelection(),
      history(),
      indentOnInput(),
      bracketMatching(),
      highlightActiveLine(),
      EditorView.lineWrapping,
      syntaxHighlighting(scriptVaultHighlight, { fallback: true }),
      keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap, indentWithTab]),
      lintGutter(),
      opts.langCompartment.of([] as Extension),
      opts.maskCompartment.of([] as Extension),
      opts.lintCompartment.of([] as Extension),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) opts.onChange();
        if (u.docChanged || u.selectionSet) {
          const sel = u.state.selection.main;
          const lineObj = u.state.doc.lineAt(sel.head);
          const line = lineObj.number;
          const col = sel.head - lineObj.from + 1;
          opts.onCursorMove(line, col, u.state.doc.lines);
        }
      }),
    ],
  });

  return new EditorView({ state, parent: opts.parent });
}
