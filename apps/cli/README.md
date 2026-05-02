# @limitrum/cli

Command-line tools for the Limitrum local policy kernel.

```bash
pnpm add -D @limitrum/cli
```

```bash
limitrum simulate --requests 4 --amount 1
```

The standalone CLI creates its local tables automatically. For seeded demo policies such as `agent_sales_01`, clone the repo and run `pnpm db:migrate && pnpm db:seed`.

Useful commands:

- `limitrum verify`
- `limitrum simulate`
- `limitrum agent list`
- `limitrum policy show <agentId>`
- `limitrum logs tail`
- `limitrum budget report`

See the main repository README for local setup.
