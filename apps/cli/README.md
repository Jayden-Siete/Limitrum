# @limitrum/cli

Command-line tools for the Limitrum local policy kernel.

```bash
limitrum verify \
  --agent-id agent_sales_01 \
  --action openai.chat.completions.create \
  --target api.openai.com/v1/chat/completions \
  --amount 1
```

Useful commands:

- `limitrum verify`
- `limitrum simulate`
- `limitrum agent list`
- `limitrum policy show <agentId>`
- `limitrum logs tail`
- `limitrum budget report`

See the main repository README for local setup.
