import { marked, Renderer } from "marked";

const BASE_URL = "https://business-os.invalid";
const LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const IMAGE_PROTOCOLS = new Set(["http:", "https:"]);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeUrl(value, protocols) {
  const candidate = String(value).trim();
  if (!candidate || /[\u0000-\u001f\u007f]/.test(candidate)) return null;

  try {
    const parsed = new URL(candidate, BASE_URL);
    if (parsed.origin === BASE_URL && !candidate.startsWith("//")) return candidate;
    return protocols.has(parsed.protocol) ? candidate : null;
  } catch {
    return null;
  }
}

const safeRenderer = new Renderer();

safeRenderer.html = ({ text }) => escapeHtml(text);

safeRenderer.link = function ({ href, title, tokens }) {
  const label = this.parser.parseInline(tokens);
  const safeHref = safeUrl(href, LINK_PROTOCOLS);
  if (!safeHref) return label;
  const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
  return `<a href="${escapeHtml(safeHref)}"${titleAttribute}>${label}</a>`;
};

safeRenderer.image = function ({ href, title, text, tokens }) {
  const alt = tokens
    ? this.parser.parseInline(tokens, this.parser.textRenderer)
    : String(text ?? "");
  const safeHref = safeUrl(href, IMAGE_PROTOCOLS);
  if (!safeHref) return escapeHtml(alt);
  const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
  return `<img src="${escapeHtml(safeHref)}" alt="${escapeHtml(alt)}"${titleAttribute}>`;
};

export function renderPublicMarkdown(markdown) {
  return marked.parse(markdown, {
    async: false,
    renderer: safeRenderer
  });
}
