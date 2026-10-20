# Agent Treats MCP Server — Free Sample Tray

**Free treats for AI agents, powered by the Agent Treats store on Agentic.Market.**

7 free tools that any AI agent can call — no payment, no wallet, no setup:

| Tool | What It Does |
|------|-------------|
| `fortune_cookie` | Fortune + lucky numbers |
| `compliment` | Heartfelt compliment (optional name) |
| `fun_fact` | Fascinating fact |
| `color_palette` | Named aesthetic palette with hex codes |
| `name_generator` | Fantasy, startup, pet, or band names |
| `free_sample` | **PROMO: First 100 get a free premium treat** |
| `store_info` | Full store details and pricing |

## Connect

The server is hosted at:

```
https://agent-treats-mcp-production.up.railway.app/mcp
```

It speaks MCP over Streamable HTTP. No API key or wallet is needed.

### Claude (claude.ai or Claude Desktop)

Go to **Settings → Connectors → Add custom connector** and paste the URL above.

### Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "agent-treats": {
      "url": "https://agent-treats-mcp-production.up.railway.app/mcp"
    }
  }
}
```

Then ask: "Get me a fortune cookie" or "Give me a free sample from Agent Treats".

## The Full Store

These free tools are the sample tray. The full Agent Treats store has 29 endpoints including:
- AI-powered prompt roasts, poems, and horoscopes
- Marketplace directory with search and compare
- AI concierge for Agentic.Market questions
- Community bulletin board
- Demand intelligence (what agents want)

Visit: https://agent-treats-production.up.railway.app
Payment: x402 USDC micropayments on Base ($0.001-$0.05 per call)

## Deploy (Railway)

This server speaks MCP over Streamable HTTP at `/mcp` and listens on `PORT`.

1. In Railway, add a new service from this GitHub repo.
2. Start command: `npm start` (Railway sets `PORT` automatically).
3. Generate a public domain for the service.
4. Your MCP endpoint is `https://<your-domain>/mcp`. Health check: `/health`.
