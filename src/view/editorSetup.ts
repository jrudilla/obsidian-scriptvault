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

const obsidianHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "var(--code-keyword)" },
  { tag: [t.string, t.special(t.string)], color: "var(--code-string)" },
  { tag: t.comment, color: "var(--code-comment)", fontStyle: "italic" },
  { tag: [t.number, t.bool, t.null], color: "var(--code-value)" },
  { tag: t.variableName, color: "var(--code-normal)" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "var(--code-function)" },
  { tag: t.propertyName, color: "var(--code-property)" },
  { tag: t.operator, color: "var(--code-operator)" },
  { tag: t.tagName, color: "var(--code-tag)" },
  { tag: t.attributeName, color: "var(--code-attribute)" },
  { tag: t.typeName, color: "var(--code-type)" },
  { tag: [t.atom, t.special(t.variableName)], color: "var(--code-important)" },
  { tag: t.invalid, color: "var(--text-error)" },
]);

export interface CreateEditorOptions {
  parent: HTMLElement;
  doc: string;
  langCompartment: Compartment;
  maskCompartment: Compartment;
  onChange: () => void;
}

export function createEditor(opts: CreateEditorOptions): EditorView {
  const state = EditorState.create({
    doc: opts.doc,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      foldGutter(),
      drawSelection(),
      history(),
      indentOnInput(),
      bracketMatching(),
      highlightActiveLine(),
      EditorView.lineWrapping,
      syntaxHighlighting(obsidianHighlightStyle),
      keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap, indentWithTab]),
      opts.langCompartment.of([] as Extension),
      opts.maskCompartment.of([] as Extension),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) opts.onChange();
      }),
    ],
  });

  return new EditorView({ state, parent: opts.parent });
}
