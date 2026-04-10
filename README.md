# 🤖 n8n-nodes-wildbots-gemini

<div align="center">

**Access Google Gemini AI from n8n — anywhere in the world, no regional blocks.**

[![npm version](https://img.shields.io/npm/v/n8n-nodes-wildbots-gemini?color=brightgreen&label=npm)](https://www.npmjs.com/package/n8n-nodes-wildbots-gemini)
[![npm downloads](https://img.shields.io/npm/dm/n8n-nodes-wildbots-gemini?color=blue)](https://www.npmjs.com/package/n8n-nodes-wildbots-gemini)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)
[![n8n community node](https://img.shields.io/badge/n8n-community%20node-orange)](https://www.npmjs.com/package/n8n-nodes-wildbots-gemini)

</div>

---

## 😤 The Problem

Google Gemini API is unavailable in many regions — Russia, Belarus, and others. You try to call the API from your n8n instance and get a `403` or a connection error. No clean workaround exists without touching infrastructure.

## ✅ The Solution

**n8n-nodes-wildbots-gemini** is a community node package that routes all Gemini API calls through a lightweight Cloudflare Worker proxy. The proxy forwards your requests to Google's servers and returns the response — transparently, with no extra latency worth worrying about.

- A **default public proxy** is included — zero setup required to get started
- You can **deploy your own private proxy** in 5 minutes for free on Cloudflare
- Works with **any n8n deployment** — cloud, self-hosted, or desktop

---

## ✨ Features

### 15 Actions + Chat Model

| Category | Action |
|---|---|
| 🔊 **Audio** | Analyze audio |
| 🔊 **Audio** | Transcribe a recording |
| 📄 **Document** | Analyze document |
| 🗂️ **File Search** | Create a File Search store |
| 🗂️ **File Search** | Delete a File Search store |
| 🗂️ **File Search** | List all File Search stores |
| 🗂️ **File Search** | Upload a file to a File Search store |
| 🖼️ **Image** | Analyze an image |
| 🖼️ **Image** | Generate an image |
| 🖼️ **Image** | Edit an image |
| 📁 **Media File** | Upload a media file |
| 💬 **Text** | Message a model |
| 🎬 **Video** | Analyze video |
| 🎬 **Video** | Generate a video |
| 🎬 **Video** | Download a video |

### 🧠 Wildbots Gemini Chat Model

A dedicated **sub-node** for n8n AI Agent workflows. Drop it into any AI Agent node as the language model — it inherits your proxy credentials automatically.

---

## 🚀 Quick Start

### 1. Install the community node

Open your n8n instance and go to:

**Settings → Community Nodes → Install**

Paste the package name and click Install:

```
n8n-nodes-wildbots-gemini
```

### 2. Add your Google Gemini API key

1. Go to **Credentials → New Credential**
2. Search for **Wildbots Gemini API**
3. Paste your [Gemini API key](https://aistudio.google.com/app/apikey)
4. Leave **Host** as-is to use the built-in public proxy — or enter your own Worker URL

### 3. Start building

Add a **Wildbots Gemini** node to your workflow, pick an action, and go.

---

## ⚙️ Configuration

The **Wildbots Gemini API** credential has two fields:

| Field | Description | Default |
|---|---|---|
| **API Key** | Your Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey) | — |
| **Host** | The proxy URL that forwards requests to Gemini | `https://gemini-proxy.bold-violet-3c8d.workers.dev` |

> **Note:** The default public proxy is provided for convenience and is rate-limited. For production use or high request volumes, [deploy your own Worker](#deploy-your-own-worker).

---

## 🌐 Deploy Your Own Worker

The public proxy is rate-limited. If you hit the limit, or simply want your own private proxy, deploy one in minutes for free on Cloudflare.

### Prerequisites

- A free [Cloudflare account](https://cloudflare.com)
- Node.js installed

### Steps

**1. Create a free Cloudflare account**

Sign up at [cloudflare.com](https://cloudflare.com) — no credit card required for Workers.

**2. Install Wrangler CLI**

```bash
npm install -g wrangler
```

**3. Create the Worker file**

Create a new directory and add a file named `worker.js` with the following code:

```javascript
export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    url.hostname = 'generativelanguage.googleapis.com';

    const proxyRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow',
    });

    const response = await fetch(proxyRequest);

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  },
};
```

**4. Log in to Cloudflare**

```bash
wrangler login
```

This opens a browser window. Authorize Wrangler with your Cloudflare account.

**5. Deploy the Worker**

```bash
wrangler deploy worker.js --name gemini-proxy --compatibility-date 2024-01-01
```

After deploy, Wrangler prints your Worker URL — something like:

```
https://gemini-proxy.<your-subdomain>.workers.dev
```

**6. Add your Worker URL to the n8n credential**

Open your **Wildbots Gemini API** credential in n8n, paste the Worker URL into the **Host** field, and save. Done.

---

## 📦 Links

- **npm:** [npmjs.com/package/n8n-nodes-wildbots-gemini](https://www.npmjs.com/package/n8n-nodes-wildbots-gemini)
- **GitHub:** [github.com/Aimagine-life/n8n-nodes-wildbots-gemini](https://github.com/Aimagine-life/n8n-nodes-wildbots-gemini)
- **Gemini API Keys:** [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Cloudflare Workers:** [workers.cloudflare.com](https://workers.cloudflare.com)

---

## 📄 License

MIT © [Wildbots](https://github.com/Aimagine-life)
