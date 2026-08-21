# New Client Website Template

This is the reusable starting system for client websites, not a fixed design recipe. Fork its durable plumbing, then let the client's sources and the site's current code determine the implementation.

- Follow the template's current package, framework, routing, styling, component, and content patterns. Installed code and official docs outrank copied version notes.
- Content lives in typed config and static repository files by default, including ordinary blog content. Use Supabase only when current code and a real client workflow require it; do not add Supabase or another CMS as a default layer.
- Preserve working cross-site plumbing for forms, schema, metadata, redirects, feeds, agent discovery, safe headers, accessibility, responsive behavior, and verification. Improve the shared owner rather than forking it per client.
- Keep content and visual design client-specific. The template supplies primitives and contracts, not claims, brand voice, assets, or a universal section sequence.
- Above the fold, make the audience, service, outcome, location or market, proof, and primary next action understandable without inventing details.
- Favor excellent, relevant photography and intentional hierarchy over effects. Motion must support the story, respect reduced-motion preferences, and avoid competing owners.
- Default to the simplest durable architecture that satisfies the actual client journey. Do not build SaaS infrastructure for a brochure site.

Before promoting a template change, test the template and inspect blast radius across existing forks. Canonical quality owners are `docs/TEMPLATE-STANDARDS.md`, `sites/WEBSITE-QUALITY-CHECKLIST.md`, current template tests, and the migration/build skills.
