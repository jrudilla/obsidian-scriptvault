import { StreamLanguage, LanguageSupport } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { dockerFile } from "@codemirror/legacy-modes/mode/dockerfile";
import { properties } from "@codemirror/legacy-modes/mode/properties";
import { powerShell } from "@codemirror/legacy-modes/mode/powershell";
import { yaml } from "@codemirror/legacy-modes/mode/yaml";
import type { LangId } from "./index";

export function getLanguageExtension(id: LangId): Extension {
  switch (id) {
    case "shell":
      return new LanguageSupport(StreamLanguage.define(shell));
    case "dockerfile":
      return new LanguageSupport(StreamLanguage.define(dockerFile));
    case "properties":
      return new LanguageSupport(StreamLanguage.define(properties));
    case "powershell":
      return new LanguageSupport(StreamLanguage.define(powerShell));
    case "yaml":
      return new LanguageSupport(StreamLanguage.define(yaml));
    case "plain":
      return [];
  }
}
