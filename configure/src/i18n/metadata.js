import resources from "./generated/resources.json";

const keys = new Map(Object.entries(resources.en.metadata || {}).map(([key, text]) => [text, key]));

export function metadataText(text, t) {
  if (typeof text !== "string" || !keys.has(text)) return text;
  return t(keys.get(text), { ns: "metadata", defaultValue: text });
}

// Only render metadata is copied. Names used to identify tools/components,
// configuration paths, defaults and option values stay in the source schema.
export function localizeMetadata(schema, t) {
  if (!schema || typeof schema !== "object") return schema;
  const result = { ...schema };
  if (Array.isArray(schema.tabs)) result.tabs = schema.tabs.map((tab) => localizeNode(tab, t));
  if (Array.isArray(schema.rows)) result.rows = schema.rows.map((row) => localizeNode(row, t));
  return result;
}

function localizeNode(node, t) {
  const result = { ...node };
  for (const field of ["name", "subname", "description", "placeholder", "disabledMessage"]) {
    if (typeof node[field] === "string") result[field] = metadataText(node[field], t);
  }
  for (const field of ["tabs", "rows", "components", "object"]) {
    if (Array.isArray(node[field])) result[field] = node[field].map((child) => localizeNode(child, t));
  }
  if (Array.isArray(node.options)) {
    result.optionLabels = node.options.map((option) => {
      const label = option && typeof option === "object" ? option.label ?? option.value : option;
      return metadataText(typeof label === "boolean" ? String(label) : label, t);
    });
  }
  return result;
}
