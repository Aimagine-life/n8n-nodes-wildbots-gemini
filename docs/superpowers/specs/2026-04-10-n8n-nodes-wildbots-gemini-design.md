# n8n-nodes-wildbots-gemini — Design Spec

## Problem

Google Gemini API is region-restricted. Users in affected regions cannot use the built-in n8n Google Gemini nodes. The built-in nodes don't allow specifying a custom base URL (unlike the OpenAI node).

## Solution

A community n8n node package that routes all Gemini API requests through a Cloudflare Worker proxy. The package ships with a default shared proxy and allows users to specify their own.

## Deliverables

1. **Cloudflare Worker** — transparent proxy to `generativelanguage.googleapis.com`
2. **n8n Community Node Package** (`n8n-nodes-wildbots-gemini`) containing:
   - **WildbotsGemini node** — full-featured Gemini node (15 actions)
   - **WildbotsGeminiChatModel node** — Chat Model sub-node for AI Agent workflows
   - **WildbotsGeminiApi credentials** — API key + configurable base URL
3. **README** — marketing-grade, published to npm

---

## 1. Cloudflare Worker

### Purpose

Transparent reverse proxy. Receives requests, forwards them to Google's Gemini API, returns the response unchanged.

### Behavior

```
Client request:
  POST https://gemini-proxy.bold-violet-3c8d.workers.dev/v1beta/models/gemini-2.0-flash:generateContent?key=AIza...

Worker forwards to:
  POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIza...
```

- Passes all headers, query parameters, and body as-is
- Passes the response (status, headers, body) back as-is
- Adds CORS headers for flexibility
- No authentication of its own — the Google API key travels in the request
- No request/response modification or logging
- Handles streaming responses (SSE passthrough)

### File

`worker/index.ts` — single file, deployed to Cloudflare Workers.

---

## 2. Credentials: WildbotsGeminiApi

### Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| API Key | string (password) | — | Google Gemini API key |
| Base URL | string | `https://gemini-proxy.bold-violet-3c8d.workers.dev` | Proxy URL. User can replace with their own Worker |

### Implementation

- Credential type name: `wildbotsGeminiApi`
- Display name: `Wildbots Gemini API`
- Used by both nodes in the package
- Base URL is used as-is (no trailing slash normalization needed — handle in transport)

---

## 3. Node: WildbotsGemini (Main Node)

### Identity

- Type: `n8n-nodes-wildbots-gemini.wildbotsGemini`
- Display name: `Wildbots Gemini`
- Icon: Google Gemini icon (gemini.svg)
- Category: AI
- Subtitle: based on selected resource + operation

### Resources & Actions (15 total)

Forked from the built-in `@n8n/n8n-nodes-langchain.googleGemini`:

**Audio Actions**
- Analyze audio
- Transcribe a recording

**Document Actions**
- Analyze document

**File Search Actions**
- Create a File Search store
- Delete a File Search store
- List all File Search stores
- Upload a file to a File Search store

**Image Actions**
- Analyze an image
- Generate an image
- Edit an image

**Media File Actions**
- Upload a media file

**Text Actions**
- Message a model

**Video Actions**
- Analyze video
- Generate a video
- Download a video

### Transport Layer

- All API requests go through a centralized `apiRequest()` function in `transport/index.ts`
- Base URL is read from credentials (`wildbotsGeminiApi.baseUrl`)
- Endpoint paths are appended to the base URL
- API key is passed as query parameter `key=`

### Error Handling

Standard n8n error handling with one addition:

**Rate limit detection (HTTP 429):**

When a 429 response is received, throw a NodeApiError with a custom message in Russian:

```
Лимиты общего прокси исчерпаны — слишком много пользователей на одном воркере.

Разверните свой Cloudflare Worker — это бесплатно и займёт 5 минут.
Инструкция: https://www.npmjs.com/package/n8n-nodes-wildbots-gemini#deploy-your-own-worker
```

This message is shown only when the default proxy URL is in use. If the user has configured their own Worker URL, the standard 429 error is passed through.

---

## 4. Node: WildbotsGeminiChatModel (AI Agent Sub-Node)

### Identity

- Type: `n8n-nodes-wildbots-gemini.lmChatWildbotsGemini`
- Display name: `Wildbots Gemini Chat Model`
- Icon: Google Gemini icon
- Category: AI > Language Models > Chat Models

### Purpose

Sub-node that provides a chat language model for use with n8n AI Agent, AI Chain, and other LangChain-based nodes.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| Model | options/string | `gemini-2.0-flash` | Model to use |
| Temperature | number | 0.4 | Sampling temperature |
| Max Output Tokens | number | 2048 | Max tokens in response |
| Top P | number | 1 | Top-p sampling |
| Top K | number | 40 | Top-k sampling |

### Implementation

- Forked from `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`
- Implements `supplyData()` method returning a LangChain `ChatGoogleGenerativeAI` instance
- Configures the LangChain model to use the proxy base URL from credentials
- Uses the same `wildbotsGeminiApi` credential type

---

## 5. Package Structure

```
n8n-nodes-wildbots-gemini/
├── credentials/
│   └── WildbotsGeminiApi.credentials.ts
├── nodes/
│   ├── WildbotsGemini/
│   │   ├── WildbotsGemini.node.ts
│   │   ├── WildbotsGemini.node.json        # codex metadata
│   │   ├── gemini.svg
│   │   ├── actions/
│   │   │   ├── router.ts
│   │   │   ├── audio/
│   │   │   │   ├── analyzeAudio.operation.ts
│   │   │   │   └── transcribe.operation.ts
│   │   │   ├── document/
│   │   │   │   └── analyzeDocument.operation.ts
│   │   │   ├── fileSearch/
│   │   │   │   ├── createStore.operation.ts
│   │   │   │   ├── deleteStore.operation.ts
│   │   │   │   ├── listStores.operation.ts
│   │   │   │   └── uploadFile.operation.ts
│   │   │   ├── image/
│   │   │   │   ├── analyzeImage.operation.ts
│   │   │   │   ├── generateImage.operation.ts
│   │   │   │   └── editImage.operation.ts
│   │   │   ├── mediaFile/
│   │   │   │   └── uploadMediaFile.operation.ts
│   │   │   ├── text/
│   │   │   │   └── messageModel.operation.ts
│   │   │   └── video/
│   │   │       ├── analyzeVideo.operation.ts
│   │   │       ├── generateVideo.operation.ts
│   │   │       └── downloadVideo.operation.ts
│   │   ├── transport/
│   │   │   └── index.ts
│   │   └── methods/
│   │       └── listSearch.ts
│   └── WildbotsGeminiChatModel/
│       └── WildbotsGeminiChatModel.node.ts
├── worker/
│   ├── index.ts                             # Cloudflare Worker source
│   └── wrangler.toml                        # Worker config
├── package.json
├── tsconfig.json
├── LICENSE.md
└── README.md                                # Marketing-grade README
```

### package.json key fields

```json
{
  "name": "n8n-nodes-wildbots-gemini",
  "version": "0.1.0",
  "description": "Google Gemini nodes for n8n with built-in proxy for region-restricted access",
  "keywords": ["n8n", "n8n-community-node-package", "gemini", "google", "ai", "proxy"],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": [
      "dist/credentials/WildbotsGeminiApi.credentials.js"
    ],
    "nodes": [
      "dist/nodes/WildbotsGemini/WildbotsGemini.node.js",
      "dist/nodes/WildbotsGeminiChatModel/WildbotsGeminiChatModel.node.js"
    ]
  },
  "peerDependencies": {
    "n8n-workflow": "*"
  }
}
```

---

## 6. README Structure

Marketing-grade README with the following sections:

1. **Hero** — bold tagline, badges (npm version, n8n compatibility, license)
2. **Problem** — "Google Gemini заблокирован в вашем регионе?"
3. **Solution** — what this package does, 1-2 sentences
4. **Features** — full list of 15 actions + Chat Model for AI Agent
5. **Quick Start** — install via n8n community nodes, add API key, done
6. **Screenshots** — node in action (added later)
7. **Deploy Your Own Worker** — step-by-step Cloudflare Worker deployment instructions (anchor: `#deploy-your-own-worker`)
8. **Configuration** — credentials fields explained
9. **License** — MIT

Language: English (npm audience is international), with Russian in the rate-limit error message and where contextually appropriate.

---

## 7. Out of Scope

- No caching in the Worker
- No request logging or analytics
- No Worker-side authentication
- No rate limiting in the Worker itself (rely on Google's own limits)
- No automated tests in v0.1.0 (add later)
