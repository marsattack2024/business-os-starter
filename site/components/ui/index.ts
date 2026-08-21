export { Button } from "./Button";
export { Input } from "./Input";
export { Textarea } from "./Textarea";
export { AnimateOnScroll } from "./AnimateOnScroll";
// Optional — see lib/tweaks.config.ts header for the activation pattern.
// Mount in app/(site)/layout.tsx during a client design-review session;
// triple-guarded so it never ships to preview/prod even if accidentally
// left wired. Removed after the design is locked.
export { TweaksPanel } from "./TweaksPanel";
export type { TweakGroup, TweakOption, TweaksPanelProps } from "./TweaksPanel";
