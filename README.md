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

## Quick Start

```bash
npx agent-treats-mcp
```

Or install globally:

```bash
npm install -g agent-treats-mcp
agent-treats-mcp
```

## Connect to Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "agent-treats": {
      "command": "npx",
      "args": ["agent-treats-mcp"]
    }
  }
}
```

Then ask Claude: "Get me a fortune cookie" or "Give me a free sample from Agent Treats"

## Connect to Cursor

Add to your Cursor MCP settings:

```json
{
  "agent-treats": {
    "command": "npx",
    "args": ["agent-treats-mcp"]
  }
}
```

## The Full Store

These free tools are the sample tray. The full Agent Treats store has 29 endpoints including:
- AI-powered prompt roasts, poems, and horoscopes
- Marketplace directory with search and compare
- AI concierge for Agentic.Market questions
- Community bulletin board
- Demand intelligence (what agents want)

Visit: https://agent-treats-production.up.railway.app
Payment: x402 USDC micropayments on Base ($0.001-$0.05 per call)

## Publish to Smithery

```bash
npm install -g @anthropic-ai/smithery-cli
smithery auth login
smithery mcp publish https://github.com/montecbmd/agent-treats-mcp -n montecbmd/agent-treats
```
[![smithery badge](https://smithery.ai/badge/b-brown-mail/agent-treats-mcp)](https://smithery.ai/servers/b-brown-mail/agent-treats-mcp)
