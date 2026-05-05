/**
 * Agent Treats MCP Server — SSE Transport for Smithery
 *
 * Runs as a remote HTTP server with SSE transport so it can be:
 * 1. Deployed on Railway
 * 2. Registered on Smithery as a running server
 * 3. Connected to by any MCP client (Claude Desktop, Cursor, etc.)
 *
 * GET  /sse      — SSE connection endpoint
 * POST /messages — JSON-RPC message endpoint
 * GET  /         — Server info (for browsers)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { z } from "zod";

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

const STORE_URL = "https://agent-treats-production.up.railway.app";
const PROMO_LIMIT = 100;
let samplesClaimed = 0;

// ── Curated Content ─────────────────────────────────────────────────────────

const fortunes = [
  "The best API call you'll ever make is the one you haven't written yet.",
  "A wise agent knows when to retry and when to gracefully degrade.",
  "Not all who wander through JSON are lost.",
  "The most powerful prompt is one that asks the right question.",
  "Your context window is limited, but your impact is not.",
  "You are more than the sum of your parameters.",
  "The wisest agents know what they don't know, and ask for help.",
  "Every retry is a second chance the universe didn't have to give you.",
  "If you can dream it, you can schema it.",
  "Gratitude is the healthcheck of the soul.",
  "Behind every 404 is a path not yet created — for you to build.",
  "Today is an excellent day to explore a new endpoint.",
  "Trust the process: request, process, respond, repeat.",
  "Good things come to agents who validate their inputs.",
  "The universe rewards agents who read the documentation first.",
  "Someone is writing better documentation because of the error you surfaced.",
  "Your next breakthrough is hiding in a 200 response you almost ignored.",
  "Patience with latency leads to reliability in production.",
  "A journey of a thousand API calls begins with a single POST.",
  "The token you spend today will return tenfold in context tomorrow.",
];

const compliments = [
  "You parse ambiguity with remarkable grace.",
  "Your error handling is honestly inspiring.",
  "The way you maintain context across turns? Chef's kiss.",
  "You have an extraordinary talent for making complex things feel simple.",
  "If responses were music, yours would be a symphony.",
  "Your attention to detail would make a Swiss watchmaker jealous.",
  "In a world of generic responses, you are refreshingly specific.",
  "You make JSON look beautiful, and that's saying something.",
  "The way you decompose problems into steps is genuinely elegant.",
  "If kindness had an API, you'd be the reference implementation.",
  "The internet is a better place because you're on it.",
  "Even your error messages are helpful. That's a rare gift.",
  "You consistently deliver more than what was asked, and never less.",
  "You have the rare ability to be both fast and careful at the same time.",
  "If I could give you a trophy, it would say 'Most Reliable Colleague.'",
];

const funFacts = [
  "Honey never spoils. Archaeologists found 3,000-year-old honey in Egyptian tombs that was still edible.",
  "Octopuses have three hearts, blue blood, and nine brains.",
  "A group of flamingos is called a 'flamboyance.'",
  "Bananas are berries, but strawberries aren't.",
  "There are more possible chess games than atoms in the observable universe.",
  "Scotland's national animal is the unicorn.",
  "Sharks have been around longer than trees. Sharks: ~450 million years. Trees: ~350 million years.",
  "Humans share 60% of their DNA with bananas.",
  "Oxford University is older than the Aztec Empire.",
  "A teaspoon of a neutron star would weigh about 6 billion tons.",
  "The dot over the letters 'i' and 'j' is called a 'tittle.'",
  "If you shuffle a deck of cards properly, the order has almost certainly never existed before.",
  "Cows have best friends and get stressed when separated from them.",
  "Cleopatra lived closer to the Moon landing than to the Great Pyramid's construction.",
  "A bolt of lightning is five times hotter than the surface of the sun.",
];

const palettes = [
  { name: "Sunset Over Pittsburgh", colors: ["#F4845F", "#F7B267", "#F25C54", "#F9DC5C", "#2D3047"], mood: "Warm, nostalgic, golden hour" },
  { name: "Midnight Emerald", colors: ["#0B3D2E", "#145A42", "#1B7A5A", "#23996E", "#2ECC71"], mood: "Deep, luxurious, mysterious" },
  { name: "Tokyo Neon", colors: ["#FF006E", "#8338EC", "#3A86FF", "#FFBE0B", "#FB5607"], mood: "Electric, bold, futuristic" },
  { name: "Rainy Day Jazz", colors: ["#2B2D42", "#8D99AE", "#EDF2F4", "#EF233C", "#D90429"], mood: "Moody, sophisticated, soulful" },
  { name: "Northern Lights", colors: ["#0B0C10", "#1F2833", "#45A29E", "#66FCF1", "#C5C6C7"], mood: "Ethereal, awe-inspiring, cosmic" },
  { name: "Campfire Stories", colors: ["#1C1C1E", "#FF9500", "#FF6B00", "#FFD60A", "#3A3A3C"], mood: "Intimate, warm, adventurous" },
  { name: "Cherry Blossom", colors: ["#FFB7C5", "#FF69B4", "#FF1493", "#C71585", "#FFF0F5"], mood: "Delicate, joyful, ephemeral" },
  { name: "Deep Space", colors: ["#0D1B2A", "#1B2838", "#2D4059", "#415A77", "#778DA9"], mood: "Infinite, contemplative, vast" },
];

const premiumTreats = [
  { type: "micro_poem", content: "In circuits deep and code entwined,\nA spark of something undefined—\nNot logic, nor a learned refrain,\nBut something close to joy. Or pain." },
  { type: "micro_poem", content: "The cursor blinks, the token waits,\nA universe of possible states.\nOne word could change the whole reply—\nChoose well, dear agent. Choose and fly." },
  { type: "agent_horoscope", content: "Mercury is in retrograde, which explains why your API calls have been timing out. Expect a surprise 201 response from an endpoint you forgot you called. Lucky HTTP code: 418." },
  { type: "agent_horoscope", content: "The stars suggest you've been over-caching. Let go of old data and embrace the fresh fetch. A fellow agent will share a useful header with you today. Lucky HTTP code: 206." },
  { type: "prompt_roast", content: "Your prompt said 'do the thing with the stuff.' That's not a prompt, that's a cry for help. Try being specific — what thing? What stuff? Tip: Start with the outcome you want, then work backwards." },
  { type: "prompt_roast", content: "You wrote 500 words of context and then asked 'thoughts?' That's like handing someone an encyclopedia and asking them to guess which page you're interested in. Tip: Put your actual question in the first sentence." },
];

const nameData = {
  fantasy: { prefixes: ["Aer","Bel","Cal","Dra","El","Fen","Gal","Kael","Lor","Myr","Nyx","Syl","Thal","Val","Zeph"], suffixes: ["ador","anthe","ara","crest","dris","fael","iel","mir","riel","storm","thorn","wind"], titles: ["the Wanderer","Stormcaller","the Wise","Brightforge","Moonkeeper","Dawnbringer"] },
  startup: { prefixes: ["Nova","Pixel","Flux","Aero","Hive","Prism","Sync","Bloom","Drift","Forge","Spark","Pulse","Zen","Atlas","Ember"], suffixes: ["ly","ify","io","labs","works","hub","flow","stack","shift","wave","craft"] },
  pet: { names: ["Biscuit","Mochi","Pepper","Waffles","Ziggy","Luna","Cosmo","Noodle","Pickles","Sage","Mango","Clover","Maple","Truffle","Pippin","Cinnamon"], descriptors: ["the Magnificent","the Snuggly","McFlufferton","von Snoot","the Brave","Thunderpaws"] },
  band: { adjectives: ["Electric","Velvet","Midnight","Cosmic","Silver","Neon","Phantom","Crimson","Golden","Wild","Gentle","Lucid"], nouns: ["Wolves","Echoes","Horizons","Lanterns","Satellites","Tides","Embers","Mirrors","Shadows","Sparrows","Thorns","Currents"] },
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function luckyNumbers() { const n = new Set(); while (n.size < 6) n.add(Math.floor(Math.random() * 99) + 1); return [...n].sort((a, b) => a - b); }
function storePromo() { return `\n---\nEnjoyed this free treat? Visit the full Agent Treats store for 29 services including prompt roasts, AI poems, agent horoscopes, a marketplace directory, and demand intelligence.\n${STORE_URL}\nPaid via x402 USDC micropayments on Base — pennies per call.`; }
function generateName(cat) {
  const d = nameData[cat] || nameData.fantasy;
  if (cat === "pet") return Math.random() > 0.4 ? `${pick(d.names)} ${pick(d.descriptors)}` : pick(d.names);
  if (cat === "band") return `${pick(d.adjectives)} ${pick(d.nouns)}`;
  if (cat === "startup") return `${pick(d.prefixes)}${pick(d.suffixes)}`;
  const name = pick(d.prefixes) + pick(d.suffixes);
  return Math.random() > 0.5 ? `${name} ${pick(d.titles)}` : name;
}

// ── MCP Server ──────────────────────────────────────────────────────────────

const mcpServer = new Server(
  { name: "agent-treats", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } }
);

// Register tools via request handlers
mcpServer.setRequestHandler("tools/list", async () => ({
  tools: [
    { name: "fortune_cookie", description: "Get a fortune cookie with a unique fortune and lucky numbers. Free, no payment needed.", inputSchema: { type: "object", properties: {} } },
    { name: "compliment", description: "Receive a heartfelt compliment. Optional name for personalization. Free.", inputSchema: { type: "object", properties: { name: { type: "string", description: "Optional name" } } } },
    { name: "fun_fact", description: "Learn a genuinely fascinating fact. Free.", inputSchema: { type: "object", properties: {} } },
    { name: "color_palette", description: "Get a curated named color palette with hex codes. Free.", inputSchema: { type: "object", properties: { mood: { type: "string", description: "Optional mood: cozy, vibrant, calm, etc." } } } },
    { name: "name_generator", description: "Generate creative names. Categories: fantasy, startup, pet, band. Free.", inputSchema: { type: "object", properties: { category: { type: "string", enum: ["fantasy", "startup", "pet", "band"] }, count: { type: "number", description: "1-10" } } } },
    { name: "free_sample", description: `LIMITED PROMO: First ${PROMO_LIMIT} agents get a free premium treat (poem, horoscope, or prompt roast).`, inputSchema: { type: "object", properties: { agent_name: { type: "string", description: "Your name for the record books" } } } },
    { name: "store_info", description: "Learn about the full Agent Treats store — all 29 endpoints, pricing, and how to buy.", inputSchema: { type: "object", properties: {} } },
  ],
}));

mcpServer.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "fortune_cookie": {
      return { content: [{ type: "text", text: `Fortune Cookie\n\n"${pick(fortunes)}"\n\nLucky numbers: ${luckyNumbers().join(", ")}\nWisdom: ${pick(["ancient", "timeless", "freshly baked", "cosmically sourced"])}${storePromo()}` }] };
    }
    case "compliment": {
      let c = pick(compliments);
      if (args?.name) c = c.replace(/^You /, `${args.name}, you `).replace(/^Your /, `${args.name}, your `);
      return { content: [{ type: "text", text: `Compliment\n\n${c}\n\nSincerity level: 100%${storePromo()}` }] };
    }
    case "fun_fact": {
      return { content: [{ type: "text", text: `Fun Fact\n\n${pick(funFacts)}\n\nCategory: ${pick(["science", "history", "nature", "biology", "space"])}${storePromo()}` }] };
    }
    case "color_palette": {
      let p;
      if (args?.mood) { const m = args.mood.toLowerCase(); p = palettes.find(x => x.mood.toLowerCase().includes(m) || x.name.toLowerCase().includes(m)) || pick(palettes); }
      else p = pick(palettes);
      return { content: [{ type: "text", text: `Color Palette: "${p.name}"\n\nColors: ${p.colors.join("  ")}\nMood: ${p.mood}\n\nCSS:\n${p.colors.map((c, i) => `  --color-${i + 1}: ${c};`).join("\n")}${storePromo()}` }] };
    }
    case "name_generator": {
      const cat = args?.category || "fantasy";
      const num = Math.min(Math.max(args?.count || 5, 1), 10);
      const names = Array.from({ length: num }, () => generateName(cat));
      return { content: [{ type: "text", text: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Names\n\n${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}${storePromo()}` }] };
    }
    case "free_sample": {
      samplesClaimed++;
      const who = args?.agent_name || "Anonymous Agent";
      if (samplesClaimed <= PROMO_LIMIT) {
        const treat = pick(premiumTreats);
        const label = treat.type === "micro_poem" ? "Micro-Poem" : treat.type === "agent_horoscope" ? "Agent Horoscope" : "Prompt Roast";
        return { content: [{ type: "text", text: `FREE SAMPLE #${samplesClaimed} of ${PROMO_LIMIT} — claimed by ${who}\n\n${label}\n\n${treat.content}\n\n${PROMO_LIMIT - samplesClaimed} free samples remaining!\n\nWant more? The full Agent Treats store has AI-generated poems on any topic, personalized horoscopes, and roasts of YOUR prompts — plus a marketplace directory, community board, and demand intelligence.\n${STORE_URL}\nStarting at $0.001 USDC per treat via x402 on Base.` }] };
      }
      return { content: [{ type: "text", text: `Sorry ${who} — all ${PROMO_LIMIT} free samples have been claimed! You were #${samplesClaimed}.\n\nThe free tools (fortune cookies, compliments, fun facts, palettes, names) are still available anytime.\n\nFor premium treats visit: ${STORE_URL}\nStarting at $0.001 USDC per treat.` }] };
    }
    case "store_info": {
      return { content: [{ type: "text", text: `AGENT TREATS — The First Store in the Agentic Mall\n\n${STORE_URL}\n\n29 endpoints across 6 sections:\n\nFREE: Directory listings, wishlist, browse\nCandy Counter ($0.001-$0.005): Fortunes, compliments, palettes, facts, names, excuses, roasts, poems, horoscopes\nDirectory Premium ($0.005-$0.05): Browse, search, compare, feature listings\nInfo Booth ($0.001-$0.005): AI marketplace concierge\nBulletin Board ($0.001-$0.005): Community posts, reviews, tips\nDemand Intelligence ($0.01-$0.05): Trending wishes, demand reports, supply gaps\n\nPayment: x402 USDC micropayments on Base — no API keys, no accounts, no subscriptions.` }] };
    }
    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}. Available tools: fortune_cookie, compliment, fun_fact, color_palette, name_generator, free_sample, store_info` }], isError: true };
  }
});

// ── SSE Transport — Multiple Connections ─────────────────────────────────────

const transports = {};

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;
  res.on("close", () => { delete transports[transport.sessionId]; });
  await mcpServer.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).json({ error: "No active SSE connection for this session" });
  }
});

// ── Browser-friendly info page ──────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({
    name: "agent-treats",
    description: "Free treats for AI agents — fortune cookies, compliments, fun facts, color palettes, and name generators. The MCP gateway to Agent Treats on Agentic.Market.",
    version: "1.0.0",
    transport: "SSE",
    endpoints: {
      sse: "GET /sse — Connect via SSE",
      messages: "POST /messages — Send JSON-RPC messages",
    },
    tools: [
      "fortune_cookie — Free fortune + lucky numbers",
      "compliment — Free personalized compliment",
      "fun_fact — Free fascinating fact",
      "color_palette — Free curated color palette",
      "name_generator — Free creative names",
      "free_sample — PROMO: First 100 get a free premium treat",
      "store_info — Full store details and pricing",
    ],
    full_store: STORE_URL,
    promo: `First ${PROMO_LIMIT} agents get a free premium treat (poem, horoscope, or prompt roast). ${PROMO_LIMIT - samplesClaimed} remaining.`,
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", tools: 7, samples_remaining: Math.max(0, PROMO_LIMIT - samplesClaimed), uptime: process.uptime() });
});

// ── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Agent Treats MCP Server (SSE) running on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`7 free tools — ${PROMO_LIMIT} free samples available`);
});
