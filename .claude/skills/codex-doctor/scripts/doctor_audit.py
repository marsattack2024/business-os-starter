#!/usr/bin/env python3
"""Read-only mechanical audit for repository agent harnesses."""

from __future__ import annotations

import argparse
import glob
import json
import math
import os
import re
import shlex
import stat
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


AGENT_DIRS = (".claude", ".codex", ".cursor", ".agents")
SKIP_DIRS = {
    ".git",
    ".next",
    "build",
    "dist",
    "node_modules",
    "vendor",
    "worktrees",
}
ROOT_DOCS = (
    "CLAUDE.md",
    "AGENTS.md",
    "GEMINI.md",
    ".cursorrules",
    ".github/copilot-instructions.md",
)
SKILL_ROOT_SUFFIXES = (
    Path(".claude/skills"),
    Path(".codex/skills"),
    Path(".agents/skills"),
    Path(".cursor/skills"),
)
PATH_PREFIXES = (
    "app",
    "api",
    "client",
    "config",
    "docs",
    "infra",
    "lib",
    "packages",
    "prisma",
    "public",
    "scripts",
    "server",
    "src",
    "supabase",
    "test",
    "tests",
    ".agents",
    ".claude",
    ".codex",
    ".cursor",
    ".github",
)
PLACEHOLDER_RE = re.compile(
    r"(?:<[^>]+>|\{[^}]+\}|\$\{?[A-Z_][A-Z0-9_]*\}?|"
    r"YYYY|example|your-|Your|some-|exact/path|path/to|foo|bar|\[[^\]]+\])",
    re.IGNORECASE,
)
ABSOLUTE_PATH_RE = re.compile(
    r"(?<![\w:])(?:/(?:Users|home)/[^\s`\"'<>]+|[A-Za-z]:\\\\[^\s`\"'<>]+)"
)
PACKAGE_COMMAND_RE = re.compile(
    r"\b(?:npm|pnpm|yarn)\s+run\s+([A-Za-z0-9:_-]+)"
)
BACKTICK_RE = re.compile(r"`([^`\n]+)`")
OUTPUT_CONTEXT_RE = re.compile(
    r"\b(?:create|creates|created|write|writes|written|generate|generates|"
    r"generated|save|saves|saved|output|outputs|produce|produces|artifact|"
    r"destination)\b",
    re.IGNORECASE,
)
GUARDED_COMMAND_RE = re.compile(
    r"\b(?:if|when)\b.{0,120}\b(?:no|not|missing|absent|unavailable|"
    r"does not exist|is not present)\b",
    re.IGNORECASE | re.DOTALL,
)
INFO_DISPLAY_LIMIT = 25


@dataclass
class Finding:
    severity: str
    category: str
    location: str
    message: str


@dataclass
class SkillRecord:
    name: str
    canonical_path: str
    scope: str
    mirrors: list[str]
    description_chars: int
    estimated_tokens: int
    invocation_mode: str


def run(
    args: list[str],
    cwd: Path,
    *,
    check: bool = False,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        args,
        cwd=cwd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=check,
    )


def resolve_root(value: str) -> tuple[Path, bool]:
    candidate = Path(value).expanduser().resolve()
    result = run(["git", "rev-parse", "--show-toplevel"], candidate)
    if result.returncode == 0:
        return Path(result.stdout.strip()).resolve(), True
    return candidate, False


def relative_label(path: Path, root: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return str(path)


def tracked_files(root: Path, is_git: bool) -> set[str]:
    if not is_git:
        return set()
    result = run(["git", "ls-files", "-z"], root)
    if result.returncode != 0:
        return set()
    return {item for item in result.stdout.split("\0") if item}


def is_agent_doc(relative: str) -> bool:
    path = Path(relative)
    if relative in ROOT_DOCS:
        return True
    if path.suffix.lower() != ".md":
        return False
    if not path.parts or path.parts[0] not in AGENT_DIRS:
        return False
    return not any(part in {"worktrees", ".git", "node_modules"} for part in path.parts)


def discover_agent_docs(
    root: Path,
    tracked: set[str],
    findings: list[Finding],
) -> list[Path]:
    candidates: set[Path] = set()
    for relative in tracked:
        if not is_agent_doc(relative):
            continue
        path = root / relative
        if path.exists():
            candidates.add(path)
        else:
            findings.append(
                Finding(
                    "warning",
                    "tracked-doc-missing",
                    relative,
                    "Tracked agent document is absent from the working tree.",
                )
            )

    for relative in ROOT_DOCS:
        path = root / relative
        if path.exists() and path.is_file():
            candidates.add(path)

    for dirname in AGENT_DIRS:
        base = root / dirname
        if not base.exists() or base.is_symlink():
            continue
        for current, directories, files in os.walk(base, followlinks=False):
            directories[:] = [
                name
                for name in directories
                if name not in SKIP_DIRS
                and not (Path(current) / name).is_symlink()
            ]
            for name in files:
                path = Path(current) / name
                relative = relative_label(path, root)
                if path.suffix.lower() == ".md" and is_agent_doc(relative):
                    candidates.add(path)

    by_real_path: dict[str, Path] = {}
    for path in sorted(candidates):
        by_real_path.setdefault(str(path.resolve()), path)
    return list(by_real_path.values())


def parse_frontmatter(path: Path) -> dict[str, object]:
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}
    end = next(
        (index for index, line in enumerate(lines[1:], start=1) if line.strip() == "---"),
        None,
    )
    if end is None:
        return {}

    result: dict[str, object] = {}
    index = 1
    while index < end:
        match = re.match(r"^([A-Za-z0-9_-]+):(?:\s*(.*))?$", lines[index])
        if not match:
            index += 1
            continue
        key, raw = match.group(1), (match.group(2) or "").strip()
        if raw in (">", "|"):
            parts: list[str] = []
            index += 1
            while index < end and (
                not lines[index].strip() or lines[index][:1].isspace()
            ):
                parts.append(lines[index].strip())
                index += 1
            result[key] = " ".join(part for part in parts if part)
            continue
        value: object = raw.strip("\"'")
        if str(value).lower() in ("true", "false"):
            value = str(value).lower() == "true"
        result[key] = value
        index += 1
    return result


def skill_roots(root: Path, include_global: bool) -> list[Path]:
    roots = [root / suffix for suffix in SKILL_ROOT_SUFFIXES]
    if include_global:
        home = Path.home()
        roots.extend(
            [
                home / ".claude/skills",
                home / ".codex/skills",
                home / ".agents/skills",
            ]
        )

    unique: list[Path] = []
    seen: set[str] = set()
    for candidate in roots:
        if not candidate.exists():
            continue
        label = str(candidate.absolute())
        if label in seen:
            continue
        seen.add(label)
        unique.append(candidate)
    return unique


def classify_scope(canonical: Path, root: Path) -> str:
    try:
        canonical.relative_to(root)
        return "project"
    except ValueError:
        pass
    try:
        canonical.relative_to(Path.home())
        return "global"
    except ValueError:
        return "external"


def discover_skills(
    root: Path,
    include_global: bool,
    findings: list[Finding],
) -> list[SkillRecord]:
    grouped: dict[str, dict[str, object]] = {}
    for base in skill_roots(root, include_global):
        if base.is_symlink() and not include_global:
            try:
                base.resolve().relative_to(root)
            except ValueError:
                continue
        try:
            children = list(base.iterdir())
        except OSError as exc:
            findings.append(
                Finding("warning", "skill-root-unreadable", str(base), str(exc))
            )
            continue
        for child in children:
            skill_file = child / "SKILL.md"
            if not skill_file.exists():
                if child.is_symlink() and not child.exists():
                    findings.append(
                        Finding(
                            "error",
                            "broken-skill-mirror",
                            str(child),
                            f"Skill mirror dangles to {os.readlink(child)}.",
                        )
                    )
                continue
            canonical = child.resolve()
            key = str(canonical)
            entry = grouped.setdefault(
                key,
                {
                    "canonical": canonical,
                    "mirrors": [],
                    "skill_file": canonical / "SKILL.md",
                },
            )
            entry["mirrors"].append(child.absolute())

    records: list[SkillRecord] = []
    for entry in grouped.values():
        skill_file = Path(entry["skill_file"])
        metadata = parse_frontmatter(skill_file)
        description = str(metadata.get("description", "")).strip()
        name = str(metadata.get("name", skill_file.parent.name)).strip()
        disabled = metadata.get("disable-model-invocation") is True
        records.append(
            SkillRecord(
                name=name,
                canonical_path=str(Path(entry["canonical"])),
                scope=classify_scope(Path(entry["canonical"]), root),
                mirrors=sorted(str(path) for path in entry["mirrors"]),
                description_chars=len(description),
                estimated_tokens=math.ceil(len(description) / 4),
                invocation_mode="manual" if disabled else "model-routed",
            )
        )
        if not description:
            findings.append(
                Finding(
                    "warning",
                    "missing-description",
                    relative_label(skill_file, root),
                    "Skill has no frontmatter description.",
                )
            )
    return sorted(records, key=lambda item: (item.scope, item.name.lower()))


def fence_findings(path: Path, root: Path) -> list[Finding]:
    text = path.read_text(encoding="utf-8", errors="replace")
    fence: str | None = None
    opened = 0
    for number, line in enumerate(text.splitlines(), start=1):
        match = re.match(r"^ {0,3}(`{3,}|~{3,})(.*)$", line)
        if not match:
            continue
        marks, info = match.groups()
        if fence is None:
            fence = marks
            opened = number
        elif (
            marks[0] == fence[0]
            and len(marks) >= len(fence)
            and not info.strip()
        ):
            fence = None
    if fence is None:
        return []
    return [
        Finding(
            "error",
            "unbalanced-fence",
            f"{relative_label(path, root)}:{opened}",
            "Markdown fence is never closed.",
        )
    ]


def find_skill_directory(path: Path, root: Path) -> Path | None:
    current = path.parent
    while True:
        if (current / "SKILL.md").exists():
            return current
        if current == root or current.parent == current:
            return None
        current = current.parent


def ignored_by_git(root: Path, relative: str, is_git: bool) -> bool:
    if not is_git:
        return False
    result = run(
        ["git", "check-ignore", "-q", "--no-index", "--", relative],
        root,
    )
    return result.returncode == 0


def path_reference_findings(
    path: Path,
    root: Path,
    is_git: bool,
) -> list[Finding]:
    text = path.read_text(encoding="utf-8", errors="replace")
    findings: list[Finding] = []
    skill_dir = find_skill_directory(path, root)
    seen: set[str] = set()
    for line in text.splitlines():
        for raw in BACKTICK_RE.findall(line):
            ref = raw.strip().rstrip(".,:;")
            if ref in seen or PLACEHOLDER_RE.search(ref):
                continue
            seen.add(ref)
            first = ref.split("/", 1)[0]
            if (
                first not in PATH_PREFIXES
                or "/" not in ref
                or any(char.isspace() for char in ref)
            ):
                continue
            candidates = [root / ref]
            if skill_dir is not None:
                candidates.append(skill_dir / ref)
            if any(candidate.exists() for candidate in candidates):
                continue
            if any(
                glob.glob(str(candidate), recursive=True)
                for candidate in candidates
                if any(mark in str(candidate) for mark in ("*", "?", "["))
            ):
                continue
            if ignored_by_git(root, ref, is_git):
                continue
            if OUTPUT_CONTEXT_RE.search(line):
                continue
            findings.append(
                Finding(
                    "info",
                    "unresolved-path-candidate",
                    relative_label(path, root),
                    (
                        f"`{ref}` resolves against neither the repository root nor "
                        "the skill directory. Classify it before fixing."
                    ),
                )
            )
    return findings


def absolute_path_findings(path: Path, root: Path) -> list[Finding]:
    text = path.read_text(encoding="utf-8", errors="replace")
    findings: list[Finding] = []
    for match in sorted(set(ABSOLUTE_PATH_RE.findall(text))):
        findings.append(
            Finding(
                "warning",
                "machine-specific-path",
                relative_label(path, root),
                f"Review machine-specific path `{match}`.",
            )
        )
    return findings


def package_command_findings(path: Path, root: Path, scripts: set[str]) -> list[Finding]:
    if not scripts:
        return []
    text = path.read_text(encoding="utf-8", errors="replace")
    missing = sorted(set(PACKAGE_COMMAND_RE.findall(text)) - scripts)
    lines = text.splitlines()
    findings: list[Finding] = []
    for command in missing:
        occurrence = next(
            (
                index
                for index, line in enumerate(lines)
                if re.search(
                    rf"\b(?:npm|pnpm|yarn)\s+run\s+{re.escape(command)}\b",
                    line,
                )
            ),
            0,
        )
        context = "\n".join(
            lines[max(0, occurrence - 3) : min(len(lines), occurrence + 7)]
        )
        guarded = command in context and GUARDED_COMMAND_RE.search(context)
        findings.append(
            Finding(
                "info" if guarded else "warning",
                (
                    "guarded-package-command"
                    if guarded
                    else "missing-package-command"
                ),
                relative_label(path, root),
                (
                    f"Package command `{command}` is absent, but nearby guidance "
                    "provides an explicit fallback."
                    if guarded
                    else (
                        f"Referenced package command `{command}` is absent from "
                        "the repository's package manifests."
                    )
                ),
            )
        )
    return findings


def package_scripts(root: Path, is_git: bool, tracked: set[str]) -> set[str]:
    if is_git:
        paths = [
            root / relative
            for relative in tracked
            if relative == "package.json" or relative.endswith("/package.json")
        ]
    else:
        paths = []
        for current, directories, files in os.walk(root):
            directories[:] = [name for name in directories if name not in SKIP_DIRS]
            if "package.json" in files:
                paths.append(Path(current) / "package.json")

    result: set[str] = set()
    for path in paths:
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        scripts = data.get("scripts", {})
        if isinstance(scripts, dict):
            result.update(scripts)
    return result


def walk_commands(node: object) -> Iterable[str]:
    if isinstance(node, list):
        for item in node:
            yield from walk_commands(item)
    elif isinstance(node, dict):
        for key, value in node.items():
            if key == "command" and isinstance(value, str):
                yield value
            yield from walk_commands(value)


def hook_findings(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    configs = (
        root / ".claude/settings.json",
        root / ".codex/hooks.json",
        root / ".cursor/hooks.json",
    )
    project_vars = (
        "CLAUDE_PROJECT_DIR",
        "CODEX_PROJECT_DIR",
        "CURSOR_PROJECT_DIR",
    )
    for config in configs:
        if not config.exists():
            continue
        try:
            data = json.loads(config.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            findings.append(
                Finding(
                    "error",
                    "invalid-hook-config",
                    relative_label(config, root),
                    str(exc),
                )
            )
            continue
        for command in sorted(set(walk_commands(data))):
            try:
                tokens = shlex.split(command)
            except ValueError:
                tokens = command.split()
            script_token = next(
                (
                    token
                    for token in tokens
                    if re.search(r"\.(?:sh|py|js|mjs|cjs|ts)$", token)
                ),
                None,
            )
            if script_token is None:
                continue
            expanded = script_token
            for variable in project_vars:
                expanded = expanded.replace(f"${{{variable}}}", str(root))
                expanded = expanded.replace(f"${variable}", str(root))
            rooted_suffix = re.search(
                r"/(\.(?:claude|codex|cursor|agents)/[A-Za-z0-9_./-]+)$",
                expanded,
            )
            if rooted_suffix:
                expanded = str(root / rooted_suffix.group(1))
            candidate = Path(expanded)
            if not candidate.is_absolute():
                candidate = root / candidate
            if not candidate.exists():
                findings.append(
                    Finding(
                        "critical",
                        "missing-hook-target",
                        relative_label(config, root),
                        f"Hook target `{script_token}` does not resolve.",
                    )
                )
                continue
            if (
                not Path(expanded).is_absolute()
                and not any(variable in command for variable in project_vars)
            ):
                findings.append(
                    Finding(
                        "warning",
                        "cwd-dependent-hook",
                        relative_label(config, root),
                        f"Hook target `{script_token}` assumes the repository cwd.",
                    )
                )
            if candidate.suffix == ".sh":
                direct = tokens and tokens[0] == script_token
                mode = candidate.stat().st_mode
                if direct and not mode & stat.S_IXUSR:
                    findings.append(
                        Finding(
                            "critical",
                            "hook-not-executable",
                            relative_label(config, root),
                            f"Direct hook target `{script_token}` is not executable.",
                        )
                    )
    return findings


def tracked_symlink_paths(root: Path, is_git: bool) -> set[Path]:
    if not is_git:
        return set()
    result = run(["git", "ls-files", "-s"], root)
    paths: set[Path] = set()
    if result.returncode != 0:
        return paths
    for line in result.stdout.splitlines():
        if "\t" not in line:
            continue
        metadata, relative = line.split("\t", 1)
        mode = metadata.split(" ", 1)[0]
        if mode == "120000":
            paths.add(root / relative)
    return paths


def local_agent_symlink_paths(root: Path) -> set[Path]:
    paths: set[Path] = set()
    for relative in ROOT_DOCS:
        path = root / relative
        if path.is_symlink():
            paths.add(path)
    for dirname in AGENT_DIRS:
        base = root / dirname
        if base.is_symlink():
            paths.add(base)
            continue
        if not base.exists():
            continue
        for current, directories, files in os.walk(base, followlinks=False):
            directories[:] = [
                name for name in directories if name not in SKIP_DIRS
            ]
            current_path = Path(current)
            for name in directories + files:
                candidate = current_path / name
                if candidate.is_symlink():
                    paths.add(candidate)
    return paths


def symlink_findings(root: Path, is_git: bool) -> tuple[list[Finding], int]:
    findings: list[Finding] = []
    tracked = tracked_symlink_paths(root, is_git)
    paths = tracked | local_agent_symlink_paths(root)
    for path in sorted(paths):
        label = relative_label(path, root)
        try:
            target = os.readlink(path)
        except OSError as exc:
            findings.append(Finding("error", "unreadable-symlink", label, str(exc)))
            continue
        target_path = Path(target)
        resolved = target_path if target_path.is_absolute() else path.parent / target_path
        is_tracked = path in tracked
        if target_path.is_absolute():
            findings.append(
                Finding(
                    "critical" if is_tracked else "info",
                    "absolute-symlink" if is_tracked else "local-absolute-symlink",
                    label,
                    (
                        f"{'Tracked' if is_tracked else 'Machine-local'} symlink "
                        f"uses absolute target `{target}`."
                    ),
                )
            )
        if not resolved.exists():
            findings.append(
                Finding(
                    "critical" if is_tracked else "error",
                    "dangling-symlink",
                    label,
                    f"Symlink target `{target}` does not resolve.",
                )
            )
        if is_tracked:
            try:
                resolved.resolve().relative_to(root)
            except ValueError:
                findings.append(
                    Finding(
                        "warning",
                        "tracked-link-outside-repo",
                        label,
                        f"Tracked symlink points outside the repository to `{target}`.",
                    )
                )
    return findings, len(paths)


def markdown_report(
    root: Path,
    is_git: bool,
    docs: list[Path],
    skills: list[SkillRecord],
    symlink_count: int,
    findings: list[Finding],
    context_window: int,
) -> str:
    description_chars = sum(skill.description_chars for skill in skills)
    estimated_tokens = sum(skill.estimated_tokens for skill in skills)
    budget = math.floor(context_window * 0.01)
    counts = {
        severity: sum(item.severity == severity for item in findings)
        for severity in ("critical", "error", "warning", "info")
    }
    lines = [
        "# Codex Doctor Mechanical Audit",
        "",
        f"- Root: `{root}`",
        f"- Git repository: `{'yes' if is_git else 'no'}`",
        f"- Canonical skills: `{len(skills)}`",
        f"- Agent documents: `{len(docs)}`",
        f"- Agent-surface symlinks: `{symlink_count}`",
        (
            f"- Description listing: `{description_chars}` characters, about "
            f"`{estimated_tokens}` tokens"
        ),
        (
            f"- One-percent budget at `{context_window}` tokens: `{budget}` tokens"
        ),
        (
            "- Findings: "
            + ", ".join(f"{key} `{value}`" for key, value in counts.items())
        ),
        "",
        "## Skills",
        "",
        "| Skill | Scope | Invocation | Description chars | Estimated tokens | Mirrors |",
        "|---|---|---|---:|---:|---:|",
    ]
    for skill in skills:
        lines.append(
            f"| {skill.name} | {skill.scope} | {skill.invocation_mode} | "
            f"{skill.description_chars} | {skill.estimated_tokens} | "
            f"{len(skill.mirrors)} |"
        )
    lines.extend(
        [
            "",
            "## Findings",
            "",
            "| Severity | Category | Location | Evidence |",
            "|---|---|---|---|",
        ]
    )
    if findings:
        ordered = sorted(
            findings,
            key=lambda entry: (
                ("critical", "error", "warning", "info").index(entry.severity),
                entry.category,
                entry.location,
            ),
        )
        high_signal = [item for item in ordered if item.severity != "info"]
        info = [item for item in ordered if item.severity == "info"]
        displayed = high_signal + info[:INFO_DISPLAY_LIMIT]
        for item in displayed:
            message = item.message.replace("|", "\\|")
            lines.append(
                f"| {item.severity} | {item.category} | "
                f"`{item.location}` | {message} |"
            )
        omitted = len(info) - min(len(info), INFO_DISPLAY_LIMIT)
        if omitted:
            lines.append(
                f"| info | additional-candidates | — | {omitted} more info "
                "findings omitted from Markdown. Use `--format json` for all. |"
            )
    else:
        lines.append("| — | — | — | No mechanical findings. |")
    lines.extend(
        [
            "",
            "## Boundary",
            "",
            "This report checks mechanical evidence. Review every path candidate",
            "semantically before editing or deleting anything.",
        ]
    )
    return "\n".join(lines)


def audit(args: argparse.Namespace) -> tuple[dict[str, object], str]:
    root, is_git = resolve_root(args.root)
    findings: list[Finding] = []
    tracked = tracked_files(root, is_git)
    docs = discover_agent_docs(root, tracked, findings)
    skills = discover_skills(root, args.include_global, findings)
    scripts = package_scripts(root, is_git, tracked)

    for path in docs:
        findings.extend(fence_findings(path, root))
        findings.extend(path_reference_findings(path, root, is_git))
        findings.extend(absolute_path_findings(path, root))
        findings.extend(package_command_findings(path, root, scripts))

    findings.extend(hook_findings(root))
    link_findings, symlink_count = symlink_findings(root, is_git)
    findings.extend(link_findings)

    payload: dict[str, object] = {
        "root": str(root),
        "git_repository": is_git,
        "agent_document_count": len(docs),
        "agent_symlink_count": symlink_count,
        "context_window_tokens": args.context_window,
        "description_characters": sum(item.description_chars for item in skills),
        "estimated_description_tokens": sum(item.estimated_tokens for item in skills),
        "skills": [asdict(item) for item in skills],
        "findings": [asdict(item) for item in findings],
    }
    report = markdown_report(
        root,
        is_git,
        docs,
        skills,
        symlink_count,
        findings,
        args.context_window,
    )
    return payload, report


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=__doc__)
    result.add_argument("--root", default=".", help="Repository path.")
    result.add_argument(
        "--format",
        choices=("markdown", "json"),
        default="markdown",
        help="Output format.",
    )
    result.add_argument(
        "--context-window",
        type=int,
        default=200_000,
        help="Context-window size used for the one-percent comparison.",
    )
    result.add_argument(
        "--include-global",
        action="store_true",
        help="Include metadata from known home-directory skill roots.",
    )
    result.add_argument(
        "--strict",
        action="store_true",
        help="Exit 1 when critical or error findings exist.",
    )
    return result


def main() -> int:
    args = parser().parse_args()
    payload, report = audit(args)
    if args.format == "json":
        print(json.dumps(payload, indent=2, sort_keys=True))
    else:
        print(report)
    if args.strict and any(
        finding["severity"] in ("critical", "error")
        for finding in payload["findings"]
    ):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
