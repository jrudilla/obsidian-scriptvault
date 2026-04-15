import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder, type Extension } from "@codemirror/state";

class MaskWidget extends WidgetType {
  toDOM(): HTMLElement {
    const span = document.createElement("span");
    span.className = "scriptvault-masked";
    span.textContent = "••••••";
    return span;
  }

  eq(): boolean {
    return true;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

const ENV_LINE = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to) {
      const line = view.state.doc.lineAt(pos);
      const text = line.text;

      if (text.length > 0 && !text.trimStart().startsWith("#")) {
        const match = ENV_LINE.exec(text);
        if (match && match[2].length > 0) {
          const valueStart = line.from + text.indexOf(match[2], match[1].length);
          const valueEnd = line.from + text.length;
          if (valueEnd > valueStart) {
            builder.add(
              valueStart,
              valueEnd,
              Decoration.replace({ widget: new MaskWidget() }),
            );
          }
        }
      }

      pos = line.to + 1;
      if (line.to >= to) break;
    }
  }

  return builder.finish();
}

export function envMaskExtension(): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildDecorations(view);
      }

      update(update: ViewUpdate): void {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildDecorations(update.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
      provide: (plugin) =>
        EditorView.atomicRanges.of((view) => {
          return view.plugin(plugin)?.decorations || Decoration.none;
        }),
    },
  );
}
