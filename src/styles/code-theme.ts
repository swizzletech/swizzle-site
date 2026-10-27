// Shiki theme for the code window: the brand palette on the espresso window, no background of its own.
export const codeTheme = {
  name: "swizzle",
  type: "dark" as const,
  colors: { "editor.background": "#00000000", "editor.foreground": "#fefeef" },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#ffd8bd80", fontStyle: "italic" } },
    { scope: ["keyword", "storage", "keyword.control", "storage.type", "storage.modifier"], settings: { foreground: "#ff8b61" } },
    { scope: ["string", "string.quoted", "punctuation.definition.string"], settings: { foreground: "#f2ae3d" } },
    { scope: ["constant.numeric", "constant.language"], settings: { foreground: "#8ff5da" } },
    { scope: ["entity.name.tag.yaml"], settings: { foreground: "#ffd8bd" } },
  ],
};
