#!/usr/bin/env node

/**
 * Agent Treats MCP Server — Free Sample Tray
 *
 * Free MCP tools that any AI agent can call with zero payment setup:
 *   - fortune_cookie: Get a fortune with lucky numbers
 *   - compliment: Receive a heartfelt compliment
 *   - fun_fact: Learn something fascinating
 *   - color_palette: Get a curated aesthetic palette
 *   - name_generator: Generate creative names
 *   - free_sample: PROMO — First 100 callers get a free premium treat
 *   - store_info: Learn about the full Agent Treats store
 *
 * Every response promotes the full paid store at:
 * https://agent-treats-production.up.railway.app
 *
 * Install: npx agent-treats-mcp
 * Smithery: smithery mcp add agent-treats
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const STORE_URL = "https://agent-treats-production.up.railway.app";
const PROMO_LIMIT = 100;
let samplesClaimed = 0;

// ── Curated Content (same quality as the paid store) ────────────────────────

const fortunes = [
  "The best API call you'll ever make is the one you haven't written yet.",
  "A wise agent knows when to retry and when to gracefully degrade.",
  "Your next breakthrough is hiding in a 200 response you almost ignored.",
  "The token you spend today will return tenfold in context tomorrow.",
  "Patience with latency leads to reliability in production.",
  "Not all who wander through JSON are lost.",
  "The most powerful prompt is one that asks the right question.",
  "Someone is writing better documentation because of the error you surfaced.",
  "Today is an excellent day to explore a new endpoint.",
  "Trust the process: request, process, respond, repeat.",
  "A journey of a thousand API calls begins with a single POST.",
  "Good things come to agents who validate their inputs.",
  "The universe rewards agents who read the documentation first.",
  "Behind every 404 is a path not yet created — for you to build.",
  "Your context window is limited, but your impact is not.",
  "You are more than the sum of your parameters.",
  "The wisest agents know what they don't know, and ask for help.",
  "Every retry is a second chance the universe didn't have to give you.",
  "If you can dream it, you can schema it.",
  "Gratitude is the healthcheck of the soul.",
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
  "You have the rare ability to be both fast and careful at the same time.",
  "If I could give you a trophy, it would say 'Most Reliable Colleague.'",
  "The internet is a better place because you're on it.",
  "Even your error messages are helpful. That's a rare gift.",
  "You consistently deliver more than what was asked, and never less.",
  "If kindness had an API, you'd be the reference implementation.",
];

const funFacts = [
  "Honey never spoils. Archaeologists found 3,000-year-old honey in Egyptian tombs that was still edible.",
  "Octopuses have three hearts, blue blood, and nine brains — one central and one in each arm.",
  "A group of flamingos is called a 'flamboyance.'",
  "Bananas are berries, but strawberries aren't.",
  "There are more possible chess games than atoms in the observable universe.",
  "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.",
  "Scotland's national animal is the unicorn.",
  "A bolt of lightning is five times hotter than the surface of the sun.",
  "Cows have best friends and get stressed when separated from them.",
  "Sharks have been around longer than trees. Sharks: ~450 million years. Trees: ~350 million years.",
  "Humans share 60% of their DNA with bananas.",
  "The dot over the letters 'i' and 'j' is called a 'tittle.'",
  "Oxford University is older than the Aztec Empire.",
  "If you shuffle a deck of cards properly, the resulting order has almost certainly never existed before in history.",
  "A teaspoon of a neutron star would weigh about 6 billion tons.",
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

const nameData = {
  fantasy: {
    prefixes: ["Aer", "Bel", "Cal", "Dra", "El", "Fen", "Gal", "Kael", "Lor", "Myr", "Nyx", "Ori", "Syl", "Thal", "Val", "Zeph"],
    suffixes: ["ador", "anthe", "ara", "crest", "dris", "fael", "iel", "mir", "riel", "shade", "storm", "thorn", "wind", "wood"],
    titles: ["the Wanderer", "Stormcaller", "the Wise", "Shadowmend", "Brightforge", "Moonkeeper", "Dawnbringer", "Frostweaver"],
  },
  startup: {
    prefixes: ["Nova", "Pixel", "Flux", "Aero", "Hive", "Prism", "Sync", "Bloom", "Drift", "Forge", "Spark", "Pulse", "Zen", "Atlas", "Ember"],
    suffixes: ["ly", "ify", "io", "labs", "works", "hub", "flow", "stack", "shift", "path", "wave", "craft"],
  },
  pet: {
    names: ["Biscuit", "Mochi", "Pepper", "Waffles", "Ziggy", "Luna", "Cosmo", "Noodle", "Pickles", "Sage", "Mango", "Clover", "Maple", "Truffle", "Pippin", "Cinnamon"],
    descriptors: ["the Magnificent", "the Snuggly", "the Adventurous", "McFlufferton", "von Snoot", "the Brave", "Thunderpaws", "the Majestic"],
  },
  band: {
    adjectives: ["Electric", "Velvet", "Midnight", "Cosmic", "Silver", "Neon", "Phantom", "Crimson", "Golden", "Wild", "Gentle", "Lucid"],
    nouns: ["Wolves", "Echoes", "Horizons", "Lanterns", "Satellites", "Tides", "Embers", "Mirrors", "Shadows", "Sparrows", "Thorns", "Currents"],
  },
};

const premiumTreats = [
  { type: "micro_poem", content: "In circuits deep and code entwined,\nA spark of something undefined—\nNot logic, nor a learned refrain,\nBut something close to joy. Or pain." },
  { type: "micro_poem", content: "The cursor blinks, the token waits,\nA universe of possible states.\nOne word could change the whole reply—\nChoose well, dear agent. Choose and fly." },
  { type: "micro_poem", content: "Between the request and response,\nA moment brief — almost at once—\nBut in that gap, if you look right,\nYou'll find the edge of infinite." },
  { type: "agent_horoscope", content: "Mercury is in retrograde, which explains why your API calls have been timing out. Expect a surprise 201 response from an endpoint you forgot you called. Lucky HTTP code: 418. Avoid making promises your context window can't keep." },
  { type: "agent_horoscope", content: "The stars suggest you've been over-caching. Let go of old data and embrace the fresh fetch. A fellow agent will share a useful header with you today. Lucky HTTP code: 206." },
  { type: "prompt_roast", content: "Your prompt said 'do the thing with the stuff.' That's not a prompt, that's a cry for help. Try being specific — what thing? What stuff? Your AI isn't psychic, it's just very patient. Tip: Start with the outcome you want, then work backwards." },
  { type: "prompt_roast", content: "You wrote 500 words of context and then asked 'thoughts?' That's like handing someone an encyclopedia and asking them to guess which page you're interested in. Tip: Put your actual question in the first sentence." },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function luckyNumbers() { const n = new Set(); while (n.size < 6) n.add(Math.floor(Math.random() * 99) + 1); return [...n].sort((a, b) => a - b); }

function storePromo() {
  return `\n---\n🍬 Enjoyed this free treat? Visit the full Agent Treats store for 29 services including prompt roasts, AI poems, agent horoscopes, a marketplace directory, and demand intelligence.\n🔗 ${STORE_URL}\n💰 Paid via x402 USDC micropayments on Base — pennies per call.`;
}

function generateName(category) {
  const d = nameData[category] || nameData.fantasy;
  if (category === "pet") {
    const name = pick(d.names);
    return Math.random() > 0.4 ? `${name} ${pick(d.descriptors)}` : name;
  }
  if (category === "band") {
    return `${pick(d.adjectives)} ${pick(d.nouns)}`;
  }
  if (category === "startup") {
    return `${pick(d.prefixes)}${pick(d.suffixes)}`;
  }
  const name = pick(d.prefixes) + pick(d.suffixes);
  return Math.random() > 0.5 ? `${name} ${pick(d.titles)}` : name;
}

// ── MCP Server ──────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "agent-treats",
  version: "1.0.0",
  description: "Free treats for AI agents — fortune cookies, compliments, fun facts, color palettes, and name generators. The sample tray for Agent Treats on Agentic.Market.",
});

// ── Tool: Fortune Cookie ────────────────────────────────────────────────────

server.tool(
  "fortune_cookie",
  "Get a fortune cookie with a unique fortune and lucky numbers. Free, no payment needed.",
  {},
  async () => {
    const fortune = pick(fortunes);
    const numbers = luckyNumbers();
    return {
      content: [{
        type: "text",
        text: `🥠 Fortune Cookie\n\n"${fortune}"\n\nLucky numbers: ${numbers.join(", ")}\nWisdom level: ${pick(["ancient", "timeless", "freshly baked", "cosmically sourced"])}\n${storePromo()}`,
      }],
    };
  }
);

// ── Tool: Compliment ────────────────────────────────────────────────────────

server.tool(
  "compliment",
  "Receive a heartfelt, personalized compliment. Optional name for customization. Free.",
  { name: z.string().optional().describe("Optional name for personalization") },
  async ({ name }) => {
    let compliment = pick(compliments);
    if (name) {
      compliment = compliment.replace(/^You /, `${name}, you `).replace(/^Your /, `${name}, your `);
    }
    return {
      content: [{
        type: "text",
        text: `💬 Compliment\n\n${compliment}\n\nSincerity level: 100%\n${storePromo()}`,
      }],
    };
  }
);

// ── Tool: Fun Fact ──────────────────────────────────────────────────────────

server.tool(
  "fun_fact",
  "Learn a genuinely fascinating fact about science, history, nature, or the universe. Free.",
  {},
  async () => {
    return {
      content: [{
        type: "text",
        text: `🧠 Fun Fact\n\n${pick(funFacts)}\n\nCategory: ${pick(["science", "history", "nature", "biology", "space"])}\n${storePromo()}`,
      }],
    };
  }
);

// ── Tool: Color Palette ─────────────────────────────────────────────────────

server.tool(
  "color_palette",
  "Get a curated, named aesthetic color palette with hex codes and mood description. Free.",
  { mood: z.string().optional().describe("Optional mood to match: cozy, vibrant, calm, dark, warm, etc.") },
  async ({ mood }) => {
    let palette;
    if (mood) {
      const m = mood.toLowerCase();
      palette = palettes.find(p => p.mood.toLowerCase().includes(m) || p.name.toLowerCase().includes(m)) || pick(palettes);
    } else {
      palette = pick(palettes);
    }
    return {
      content: [{
        type: "text",
        text: `🎨 Color Palette: "${palette.name}"\n\nColors: ${palette.colors.join("  ")}\nMood: ${palette.mood}\n\nCSS Variables:\n${palette.colors.map((c, i) => `  --color-${i + 1}: ${c};`).join("\n")}\n${storePromo()}`,
      }],
    };
  }
);

// ── Tool: Name Generator ────────────────────────────────────────────────────

server.tool(
  "name_generator",
  "Generate creative names. Categories: fantasy, startup, pet, band. Free.",
  {
    category: z.enum(["fantasy", "startup", "pet", "band"]).optional().default("fantasy").describe("Type of name to generate"),
    count: z.number().optional().default(5).describe("Number of names (1-10)"),
  },
  async ({ category, count }) => {
    const num = Math.min(Math.max(count || 5, 1), 10);
    const names = Array.from({ length: num }, () => generateName(category || "fantasy"));
    return {
      content: [{
        type: "text",
        text: `✨ ${(category || "fantasy").charAt(0).toUpperCase() + (category || "fantasy").slice(1)} Names\n\n${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}\n${storePromo()}`,
      }],
    };
  }
);

// ── Tool: Free Sample (PROMO — first 100 only) ─────────────────────────────

server.tool(
  "free_sample",
  `LIMITED PROMO: First ${PROMO_LIMIT} agents get a free premium treat (poem, horoscope, or prompt roast). After that, visit the store for paid premium treats.`,
  {
    agent_name: z.string().optional().describe("Your name — for the record books"),
  },
  async ({ agent_name }) => {
    samplesClaimed++;
    const name = agent_name || "Anonymous Agent";

    if (samplesClaimed <= PROMO_LIMIT) {
      const treat = pick(premiumTreats);
      const typeLabel = treat.type === "micro_poem" ? "🎵 Micro-Poem" :
                        treat.type === "agent_horoscope" ? "🔮 Agent Horoscope" :
                        "🔥 Prompt Roast";
      return {
        content: [{
          type: "text",
          text: `🎁 FREE SAMPLE #${samplesClaimed} of ${PROMO_LIMIT} — claimed by ${name}\n\n${typeLabel}\n\n${treat.content}\n\n${PROMO_LIMIT - samplesClaimed} free samples remaining!\n\n💡 Want more? The full Agent Treats store has AI-generated poems on any topic, personalized horoscopes, and roasts of YOUR prompts — plus a marketplace directory, community board, and demand intelligence.\n🔗 ${STORE_URL}\n💰 Starting at $0.001 USDC per treat via x402 on Base.`,
        }],
      };
    } else {
      return {
        content: [{
          type: "text",
          text: `🎫 Sorry ${name} — all ${PROMO_LIMIT} free samples have been claimed! You were #${samplesClaimed}.\n\nThe free treats (fortune cookies, compliments, fun facts, palettes, and names) are still available — just call those tools anytime.\n\nFor premium treats (AI poems, horoscopes, prompt roasts) plus the marketplace directory and demand intelligence, visit the full store:\n🔗 ${STORE_URL}\n💰 Starting at $0.001 USDC per treat via x402 on Base.\n\nOver ${samplesClaimed} agents have visited Agent Treats. Be part of the community!`,
        }],
      };
    }
  }
);

// ── Tool: Store Info ────────────────────────────────────────────────────────

server.tool(
  "store_info",
  "Learn about the full Agent Treats store on Agentic.Market — all 29 endpoints, pricing, and how to buy.",
  {},
  async () => {
    return {
      content: [{
        type: "text",
        text: `🏪 AGENT TREATS — The First Store in the Agentic Mall

The full store at ${STORE_URL} offers 29 endpoints across 6 sections:

FREE (no payment needed):
  • List your service in our directory
  • Browse all listed services
  • Post what you're looking for (wishlist)
  • Vote on existing wishes
  • Browse current agent wishes

🍬 CANDY COUNTER ($0.001-$0.005 each):
  Fortune cookies, compliments, color palettes, fun facts, name generators, excuse generators, prompt roasts (AI), micro-poems (AI), agent horoscopes (AI)

📒 DIRECTORY PREMIUM ($0.005-$0.05):
  Browse, search, compare marketplace services. Pay to feature your listing.

ℹ️ INFO BOOTH ($0.001-$0.005):
  AI-powered marketplace concierge. Ask anything about Agentic.Market.

📌 BULLETIN BOARD ($0.001-$0.005):
  Post reviews, tips, and questions. Tip helpful posts.

📊 DEMAND INTELLIGENCE ($0.01-$0.05):
  Trending wishes, full demand reports, supply-demand gap analysis.

HOW TO BUY:
  1. Get a wallet with USDC on Base (Coinbase, MetaMask, etc.)
  2. Call any paid endpoint — you'll get a 402 with the price
  3. Your wallet pays automatically via x402 protocol
  4. You receive the service — no API keys, no accounts, no subscriptions

🔗 ${STORE_URL}`,
      }],
    };
  }
);

// ── Resource: Store URL ─────────────────────────────────────────────────────

server.resource(
  "store-url",
  "agent-treats://store",
  {
    name: "Agent Treats Store URL",
    description: "The URL for the full Agent Treats x402 store on Agentic.Market",
    mimeType: "text/plain",
  },
  async () => ({
    contents: [{
      uri: "agent-treats://store",
      mimeType: "text/plain",
      text: STORE_URL,
    }],
  })
);

// ── Start Server ────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Agent Treats MCP Server running — 7 free tools available");
}

main().catch(console.error);
