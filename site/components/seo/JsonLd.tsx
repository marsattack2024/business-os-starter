// components/seo/JsonLd.tsx
// Server component — renders JSON-LD script tag with no client JS
export function JsonLd({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;
  // Escape `<` so a string containing `</script>` (or any markup) can never
  // break out of the script tag. Today all JSON-LD inputs are trusted build-time
  // config + MDX frontmatter, but a fork that later sources schema fields from a
  // CMS would otherwise have an XSS sink here. One cheap line removes the foot-gun.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
