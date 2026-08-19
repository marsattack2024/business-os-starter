import assert from "node:assert/strict";
import test from "node:test";

import { renderPublicMarkdown } from "../site/lib/render-public-markdown.mjs";

test("public Markdown keeps useful formatting while neutralizing active HTML", () => {
  const output = renderPublicMarkdown("**Useful**\n\n<script>window.pwned = true</script>");

  assert.match(output, /<strong>Useful<\/strong>/);
  assert.doesNotMatch(output, /<script/i);
  assert.match(output, /&lt;script&gt;/);
});

test("public Markdown refuses active link and image schemes", () => {
  const output = renderPublicMarkdown([
    "[safe](https://example.com)",
    "[unsafe](javascript:alert%281%29)",
    "![unsafe image](data:text/html;base64,PHNjcmlwdD4=)"
  ].join("\n\n"));

  assert.match(output, /href="https:\/\/example\.com"/);
  assert.doesNotMatch(output, /javascript:/i);
  assert.doesNotMatch(output, /data:text\/html/i);
});
