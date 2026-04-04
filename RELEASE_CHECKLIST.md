# Release Checklist — taxsnax

Use this before every npm publish.

## Build + Tests
- [ ] `npm run build`
- [ ] `npm run test`
- [ ] `npm run test:smoke`

## Documentation
- [ ] README has a 2-minute Getting Started
- [ ] SKILL.md has clear trigger phrases + commands
- [ ] AGENTS.md has drop-in integration protocol
- [ ] CHANGELOG.md updated with this version

## CLI Contract
- [ ] `--json` supported on every command
- [ ] `-d, --dir` supported and documented
- [ ] Error responses are parseable in json mode
- [ ] Command structure is consistent (no mixed flat/nested style)

## Packaging
- [ ] `npm run check:docs`
- [ ] `npm run pack:check`
- [ ] `npm run release:check`
- [ ] `npm publish --access public` (if ready)
