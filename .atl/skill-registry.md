# Skill Registry — solar-erp

Generated: 2026-03-23

## User-Level Skills (`~/.claude/skills/`)

| Name | Path | Description |
|------|------|-------------|
| `go-testing` | `~/.claude/skills/go-testing/SKILL.md` | Go testing patterns (Bubbletea TUI, teatest) |
| `sdd-apply` | `~/.claude/skills/sdd-apply/SKILL.md` | Implement tasks from a change |
| `sdd-archive` | `~/.claude/skills/sdd-archive/SKILL.md` | Archive completed changes |
| `sdd-design` | `~/.claude/skills/sdd-design/SKILL.md` | Technical design documents |
| `sdd-explore` | `~/.claude/skills/sdd-explore/SKILL.md` | Explore and investigate ideas |
| `sdd-init` | `~/.claude/skills/sdd-init/SKILL.md` | Initialize SDD in a project |
| `sdd-propose` | `~/.claude/skills/sdd-propose/SKILL.md` | Create change proposals |
| `sdd-spec` | `~/.claude/skills/sdd-spec/SKILL.md` | Write specifications |
| `sdd-tasks` | `~/.claude/skills/sdd-tasks/SKILL.md` | Break down changes into tasks |
| `sdd-verify` | `~/.claude/skills/sdd-verify/SKILL.md` | Validate implementation vs specs |
| `skill-creator` | `~/.claude/skills/skill-creator/SKILL.md` | Create new AI agent skills |

## Project-Level Skills (`.agent/skills/`)

| Name | Path | Description |
|------|------|-------------|
| `agent-tools` | `.agent/skills/agent-tools/SKILL.md` | Sol AI agent tool development patterns |
| `architecture` | `.agent/skills/architecture/SKILL.md` | Strict architecture rules (layers, ports, boundaries) |
| `backend-api` | `.agent/skills/backend-api/SKILL.md` | FastAPI patterns (router, schema, auth, CRUD) |
| `database-design` | `.agent/skills/database-design/SKILL.md` | PostgreSQL conventions (UUID PKs, naming, enums) |
| `frontend-design` | `.agent/skills/frontend-design/SKILL.md` | Visual identity (sky blue, Framer Motion, Inter font) |
| `ui-consistency` | `.agent/skills/ui-consistency/SKILL.md` | UI rules checklist (colors, typography, shadows) |

## Convention Files

No `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, or `GEMINI.md` detected at project root.

## Trigger → Skill Mapping

| Context | Load Skill |
|---------|-----------|
| New frontend page / UI component | `frontend-design` + `ui-consistency` |
| New backend endpoint / router | `backend-api` + `architecture` |
| New DB table / model / migration | `database-design` + `backend-api` |
| Sol agent tool development | `agent-tools` + `backend-api` |
| Go tests / Bubbletea TUI | `go-testing` |
| Creating new AI skill | `skill-creator` |
| SDD explore phase | `sdd-explore` |
| SDD proposal | `sdd-propose` |
| SDD specs | `sdd-spec` |
| SDD design | `sdd-design` |
| SDD tasks | `sdd-tasks` |
| SDD implementation | `sdd-apply` |
| SDD verification | `sdd-verify` |
| SDD archiving | `sdd-archive` |
