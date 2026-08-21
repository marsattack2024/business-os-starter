"use client";

import {
  Fragment,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

const NO_SUBSCRIBE = () => () => {};
const FLASH_MS = 1500;

export interface TweakOption {
  val: string;
  label: string;
  note?: string;
  swatches?: string[];
}

export interface TweakGroup {
  key: string;
  sectionLabel: string;
  label: string;
  target: string;
  block?: ScrollLogicalPosition;
  opts: TweakOption[];
}

export interface GroupedTweakSection {
  sectionLabel: string;
  target: string;
  block: ScrollLogicalPosition;
  groups: TweakGroup[];
}

export function groupTweakSections(
  groups: readonly TweakGroup[],
): GroupedTweakSection[] {
  return groups.reduce<GroupedTweakSection[]>((sections, group) => {
    const block = group.block ?? "center";
    const previous = sections.at(-1);
    if (
      previous &&
      previous.sectionLabel === group.sectionLabel &&
      previous.target === group.target &&
      previous.block === block
    ) {
      previous.groups.push(group);
    } else {
      sections.push({
        sectionLabel: group.sectionLabel,
        target: group.target,
        block,
        groups: [group],
      });
    }
    return sections;
  }, []);
}

export interface TweaksPanelProps {
  groups: TweakGroup[];
  defaults: Record<string, string>;
}

export function TweaksPanel({
  groups,
  defaults,
}: TweaksPanelProps) {
  const enabled = useSyncExternalStore(
    NO_SUBSCRIBE,
    () =>
      process.env.NODE_ENV !== "production" &&
      ["localhost", "127.0.0.1", "::1", "[::1]"].includes(
        window.location.hostname,
      ),
    () => false,
  );
  const [state, setState] = useState<Record<string, string>>(() => ({ ...defaults }));
  const [open, setOpen] = useState(true);
  const [reveal, setReveal] = useState<{
    target: string;
    block: ScrollLogicalPosition;
    n: number;
  } | null>(null);
  const sections = groupTweakSections(groups);

  useEffect(() => {
    if (!enabled) return;
    document.body.setAttribute("data-tweaks", "1");
    for (const [key, value] of Object.entries(state)) {
      document.body.setAttribute(`data-${key}`, value);
    }
    return () => {
      document.body.removeAttribute("data-tweaks");
      for (const key of Object.keys(state)) {
        document.body.removeAttribute(`data-${key}`);
      }
    };
  }, [enabled, state]);

  useEffect(() => {
    if (!enabled || !reveal) return;
    let flashTimer = 0;
    let settleTimer = 0;
    let flashed: Element | null = null;
    let innerFrame = 0;
    const outerFrame = window.requestAnimationFrame(() => {
      innerFrame = window.requestAnimationFrame(() => {
        const candidates = Array.from(document.querySelectorAll(reveal.target));
        const target =
          candidates.find((candidate) => candidate.getBoundingClientRect().height > 0) ??
          candidates[0];
        if (!target) return;

        target.classList.add("pc-tweak-flash");
        flashed = target;
        flashTimer = window.setTimeout(
          () => target.classList.remove("pc-tweak-flash"),
          FLASH_MS,
        );
        const block: ScrollLogicalPosition =
          window.innerWidth < 768 ? "start" : reveal.block;
        let attempts = 0;
        let lastTop = Number.NaN;
        const settle = () => {
          target.scrollIntoView({ behavior: "auto", block });
          const top = Math.round(target.getBoundingClientRect().top);
          attempts += 1;
          if (attempts < 6 && top !== lastTop) {
            lastTop = top;
            settleTimer = window.setTimeout(settle, 100);
          }
        };
        settle();
      });
    });
    return () => {
      window.cancelAnimationFrame(outerFrame);
      if (innerFrame) window.cancelAnimationFrame(innerFrame);
      window.clearTimeout(flashTimer);
      window.clearTimeout(settleTimer);
      flashed?.classList.remove("pc-tweak-flash");
    };
  }, [enabled, reveal]);

  if (!enabled || sections.length === 0) return null;

  return (
    <aside
      aria-label="Live design review"
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: 9999,
        display: "flex",
        width: "min(88vw, 340px)",
        maxHeight: "46dvh",
        flexDirection: "column",
        border: "1px solid var(--color-border, #d6d0c7)",
        background: "var(--color-paper, #f8f4ed)",
        color: "var(--color-ink, #1c1814)",
        boxShadow: "0 10px 40px rgb(0 0 0 / 20%)",
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        style={{
          border: 0,
          borderBottom: "1px solid var(--color-border, #d6d0c7)",
          background: "var(--color-paper-2, #efe9df)",
          padding: "12px 16px",
          textAlign: "left",
        }}
      >
        Live tweaks · {groups.length} decisions / {sections.length} sections {open ? "−" : "+"}
      </button>
      {open && (
        <div style={{ overflowY: "auto", padding: 16 }}>
          <p>Strongest recommendation is first. Choosing one jumps to its section.</p>
          {sections.map((section, sectionIndex) => (
            <Fragment key={`${section.sectionLabel}-${sectionIndex}`}>
              <p>{section.sectionLabel}</p>
              {section.groups.map((group) => (
                <fieldset key={group.key}>
                  <legend>{group.label}</legend>
                  {group.opts.map((option) => {
                    const active = state[group.key] === option.val;
                    return (
                      <button
                        key={option.val}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setState((current) => ({
                            ...current,
                            [group.key]: option.val,
                          }));
                          setReveal((current) => ({
                            target: section.target,
                            block: section.block,
                            n: (current?.n ?? 0) + 1,
                          }));
                          if (window.innerWidth < 768) setOpen(false);
                        }}
                      >
                        {option.label}
                        {option.note && <small>{option.note}</small>}
                      </button>
                    );
                  })}
                </fieldset>
              ))}
            </Fragment>
          ))}
        </div>
      )}
    </aside>
  );
}
