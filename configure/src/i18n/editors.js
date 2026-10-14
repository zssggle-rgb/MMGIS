import React from "react";
import { EditorState } from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";
import { configureText } from "./index";

// Clone command display props only. Names, shortcuts and execution remain unchanged.
export function localizeMarkdownCommand(command) {
  const key = `editor.markdown.${command.name || command.keyCommand}`;
  const label = configureText(key, { defaultValue: command.buttonProps?.title || "" });
  return {
    ...command,
    buttonProps: { ...command.buttonProps, title: label, "aria-label": label },
    ...(Array.isArray(command.children) ? { children: command.children.map(localizeMarkdownCommand) } : {}),
    ...(/^title[1-6]$/.test(command.name || "") ? {
      icon: <span>{configureText("editor.heading", { level: command.name.slice(-1) })}</span>,
    } : {}),
  };
}

const codeMirrorPhrases = [
  "Find", "Replace", "next", "previous", "all", "match case", "regexp", "by word",
  "replace", "replace all", "close", "Go to line", "go", "Diagnostics", "No diagnostics",
  "Completions", "Control character", "current match", "on line", "replaced match on line $", "replaced $ matches",
];

// The installed search panel only translates labels when it is constructed.
// Refresh its owned labels without remounting the editor or changing its query.
const searchPanelLabels = ViewPlugin.fromClass(class {
  update(update) {
    if (update.startState.phrase("Find") === update.state.phrase("Find")) return;
    const panel = update.view.dom.querySelector(".cm-search");
    if (!panel) return;
    for (const [name, phrase] of [["search", "Find"], ["replace", "Replace"]]) {
      const input = panel.querySelector(`input[name="${name}"]`);
      if (input) {
        input.placeholder = update.state.phrase(phrase);
        input.setAttribute("aria-label", update.state.phrase(phrase));
      }
    }
    for (const [name, phrase] of [["next", "next"], ["prev", "previous"], ["select", "all"], ["replace", "replace"], ["replaceAll", "replace all"]]) {
      const button = panel.querySelector(`button[name="${name}"]`);
      if (button) button.textContent = update.state.phrase(phrase);
    }
    for (const [name, phrase] of [["case", "match case"], ["re", "regexp"], ["word", "by word"]]) {
      const label = panel.querySelector(`input[name="${name}"]`)?.parentElement;
      if (label?.lastChild?.nodeType === 3) label.lastChild.textContent = update.state.phrase(phrase);
    }
    panel.querySelector('button[name="close"]')?.setAttribute("aria-label", update.state.phrase("close"));
  }
});

export function localizedCodeMirrorPhrases() {
  return [searchPanelLabels, EditorState.phrases.of(Object.fromEntries(codeMirrorPhrases.map((phrase) => [
    phrase, configureText(`editor.codemirror.${phrase === "Replace" ? "replaceInput" : phrase.toLowerCase().replace(/\$/g, "value").replace(/\W+/g, "_")}`, { defaultValue: phrase }),
  ])))];
}
