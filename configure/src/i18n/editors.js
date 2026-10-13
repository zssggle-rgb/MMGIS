import React from "react";
import { EditorState } from "@codemirror/state";
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

export function localizedCodeMirrorPhrases() {
  return EditorState.phrases.of(Object.fromEntries(codeMirrorPhrases.map((phrase) => [
    phrase, configureText(`editor.codemirror.${phrase}`, { defaultValue: phrase }),
  ])));
}
