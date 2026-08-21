"use client";

import { Component, type ReactNode } from "react";

/**
 * Fail-CLOSED boundary for the triggered popup. The popup is mounted on every
 * page, so a render error inside it must NOT bubble to the page's error boundary
 * and replace the whole page — it just makes the popup disappear (and logs).
 * Route-level boundaries (app/quiz/error.tsx, app/(site)/error.tsx) handle the
 * standalone surfaces; this protects the host page from the overlay.
 */
export class QuizErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("[QuizPopup] suppressed render error", { name: error.name });
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
