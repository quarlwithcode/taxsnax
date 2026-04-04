# Command Map — taxsnax

Command style: **flat**

## Global Flags
- `--json`
- `-d, --dir <path>`


## Flat Topology

Examples:
- `taxsnax status`
- `taxsnax add ...`
- `taxsnax list ...`
- `taxsnax export ...`

Rule: all primary actions live at root command level.




## Contract Notes
- Do not mix flat and nested patterns in the same CLI.
- All commands must support `--json` output behavior.
- Data directory selection must always support `-d, --dir`.
