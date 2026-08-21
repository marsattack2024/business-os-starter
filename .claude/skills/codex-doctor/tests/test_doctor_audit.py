#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace


SCRIPT = Path(__file__).parents[1] / "scripts" / "doctor_audit.py"
SPEC = importlib.util.spec_from_file_location("doctor_audit", SCRIPT)
assert SPEC and SPEC.loader
doctor_audit = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = doctor_audit
SPEC.loader.exec_module(doctor_audit)


class DoctorAuditTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.git("init", "-q")
        self.git("config", "user.email", "doctor@example.com")
        self.git("config", "user.name", "Codex Doctor")

    def tearDown(self) -> None:
        self.temp.cleanup()

    def git(self, *args: str) -> None:
        subprocess.run(
            ["git", *args],
            cwd=self.root,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

    def write(self, relative: str, content: str) -> Path:
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def audit(self):
        args = SimpleNamespace(
            root=str(self.root),
            include_global=False,
            context_window=200_000,
            format="json",
            strict=False,
        )
        return doctor_audit.audit(args)[0]

    def test_relative_skill_mirrors_are_deduplicated(self) -> None:
        self.write(
            ".claude/skills/example/SKILL.md",
            "---\nname: example\ndescription: Example skill.\n---\n",
        )
        mirror_root = self.root / ".codex/skills"
        mirror_root.mkdir(parents=True)
        (mirror_root / "example").symlink_to("../../.claude/skills/example")
        self.git("add", ".claude/skills/example/SKILL.md", ".codex/skills/example")

        result = self.audit()

        self.assertEqual(len(result["skills"]), 1)
        self.assertEqual(result["skills"][0]["name"], "example")
        self.assertEqual(len(result["skills"][0]["mirrors"]), 2)
        categories = {item["category"] for item in result["findings"]}
        self.assertNotIn("absolute-symlink", categories)
        self.assertNotIn("dangling-symlink", categories)

    def test_unbalanced_fence_and_missing_package_command_are_reported(self) -> None:
        self.write(
            "package.json",
            '{"scripts":{"test":"echo ok"}}\n',
        )
        self.write(
            "CLAUDE.md",
            "Run `npm run missing`.\n\n```bash\necho never-closed\n",
        )
        self.git("add", "package.json", "CLAUDE.md")

        result = self.audit()
        categories = {item["category"] for item in result["findings"]}

        self.assertIn("unbalanced-fence", categories)
        self.assertIn("missing-package-command", categories)

    def test_guarded_missing_package_command_is_informational(self) -> None:
        self.write(
            "package.json",
            '{"scripts":{"test":"echo ok"}}\n',
        )
        self.write(
            "CLAUDE.md",
            (
                "Run `npm run optional-check`.\n\n"
                "If the repository has no `optional-check` script, inspect the "
                "provider state directly.\n"
            ),
        )
        self.git("add", "package.json", "CLAUDE.md")

        result = self.audit()
        matching = [
            item
            for item in result["findings"]
            if item["category"] == "guarded-package-command"
        ]

        self.assertEqual(len(matching), 1)
        self.assertEqual(matching[0]["severity"], "info")

    def test_gitignored_runtime_reference_is_not_missing_source(self) -> None:
        self.write(".gitignore", "scripts/token.pkl\n")
        self.write(
            ".claude/skills/uploader/SKILL.md",
            (
                "---\nname: uploader\ndescription: Upload a file.\n---\n\n"
                "The first run creates `scripts/token.pkl`, which is gitignored.\n"
            ),
        )
        self.git("add", ".gitignore", ".claude/skills/uploader/SKILL.md")

        result = self.audit()
        categories = {item["category"] for item in result["findings"]}

        self.assertNotIn("unresolved-path-candidate", categories)

    def test_generated_output_reference_is_not_missing_source(self) -> None:
        self.write(
            ".claude/skills/reporter/SKILL.md",
            (
                "---\nname: reporter\ndescription: Create a report.\n---\n\n"
                "Create `docs/generated-report.md` after the audit.\n"
            ),
        )
        self.git("add", ".claude/skills/reporter/SKILL.md")

        result = self.audit()
        categories = {item["category"] for item in result["findings"]}

        self.assertNotIn("unresolved-path-candidate", categories)

    def test_absolute_tracked_symlink_is_critical(self) -> None:
        target = self.write(
            ".claude/skills/example/SKILL.md",
            "---\nname: example\ndescription: Example skill.\n---\n",
        ).parent
        mirror_root = self.root / ".codex/skills"
        mirror_root.mkdir(parents=True)
        (mirror_root / "example").symlink_to(target)
        self.git("add", ".claude/skills/example/SKILL.md", ".codex/skills/example")

        result = self.audit()
        matching = [
            item
            for item in result["findings"]
            if item["category"] == "absolute-symlink"
        ]

        self.assertEqual(len(matching), 1)
        self.assertEqual(matching[0]["severity"], "critical")


if __name__ == "__main__":
    unittest.main()
