# taxsnax — Agent Integration

Drop this into your AI agent's instructions to integrate taxsnax.

## When to Use
- [Describe when an agent should invoke this tool]

## Key Commands
```bash
# Status check
taxsnax status --json -d .taxsnax

# [Primary action]
taxsnax [command] --json -d .taxsnax
```

## Integration Protocol
1. [Step 1 — when to invoke]
2. [Step 2 — what to do with output]
3. [Step 3 — downstream action]

## Important
- Always use `-d .taxsnax` (or set TAXSNAX_DIR) for consistent data location
- `--json` flag on every command for programmatic parsing
