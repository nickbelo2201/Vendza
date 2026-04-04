# Claude Agent Tooling

This directory vendors a local Claude Code marketplace for repository workflow use.

It does not add autonomous agents to the Vendza product runtime. It only makes Claude Code plugins available while working in this repository.

## Included plugins

- `agent-orchestration`
- `agent-teams`

## What this enables

- `/agent-orchestration:orq-delegacao-geral`
- `/agent-orchestration:orq-daniel-automacao`
- `/agent-orchestration:multi-agent-optimize`
- `/agent-orchestration:improve-agent`
- `/team-spawn`
- `/team-status`
- `/team-shutdown`
- `/team-review`
- `/team-debug`
- `/team-feature`
- `/team-delegate`

## Expected project behavior

When Claude Code opens this repository and you trust the folder, it should detect the project marketplace declared in `.claude/settings.json` and offer the plugins for installation and enablement.

If you want to install them manually, run:

```text
/plugin marketplace add ./.claude/marketplaces/vendza-agents
/plugin install agent-orchestration@vendza-agents
/plugin install agent-teams@vendza-agents
```

## Agent teams prerequisites

`agent-teams` depends on Claude Code's experimental Agent Teams feature.

Set these on your machine:

1. Environment variable: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
2. User setting in `~/.claude/settings.json`:

```json
{
  "teammateMode": "tmux"
}
```

`tmux` is the recommended mode. `iterm2` is macOS-only. `in-process` is the fallback.
