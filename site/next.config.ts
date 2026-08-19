import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keeps Next from writing its own AGENTS.md and CLAUDE.md into this folder.
  // This business already has one set, in the folder above.
  agentRules: false,

  // Blog posts live in ../content (the folder the skills write to), which is
  // outside this site folder. Tracing from the repo root tells a deploy to
  // include them; without this, posts render locally but vanish once live.
  outputFileTracingRoot: path.join(import.meta.dirname, ".."),
};

export default nextConfig;
