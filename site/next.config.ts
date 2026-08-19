import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keeps Next from writing its own AGENTS.md and CLAUDE.md into this folder.
  // This business already has one set, in the folder above.
  agentRules: false,
};

export default nextConfig;
