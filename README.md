# n8n-nodes-wildbots-gemini

<div align="center">

**[English](#english) | [Русский](#русский)**

[![npm version](https://img.shields.io/npm/v/n8n-nodes-wildbots-gemini?color=brightgreen&label=npm)](https://www.npmjs.com/package/n8n-nodes-wildbots-gemini)
[![npm downloads](https://img.shields.io/npm/dm/n8n-nodes-wildbots-gemini?color=blue)](https://www.npmjs.com/package/n8n-nodes-wildbots-gemini)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)
[![n8n community node](https://img.shields.io/badge/n8n-community%20node-orange)](https://www.npmjs.com/package/n8n-nodes-wildbots-gemini)

</div>

---

<a id="english"></a>

## 🇬🇧 English

### Access Google Gemini AI from n8n — anywhere in the world, no regional blocks.

### The Problem

Google Gemini API is unavailable in many regions — Russia, Belarus, and others. You try to call the API from your n8n instance and get a `403` or a connection error. The built-in n8n Gemini node doesn't let you set a custom endpoint URL, so there's no clean workaround.

### The Solution

**n8n-nodes-wildbots-gemini** is a community node package that routes all Gemini API calls through a lightweight Cloudflare Worker proxy. The proxy forwards your requests to Google's servers and returns the response — transparently, with zero extra config.

- A **default public proxy** is included — zero setup required to get started
- You can **deploy your own private proxy** in 5 minutes for free on Cloudflare
- Works with **any n8n deployment** — cloud, self-hosted, or desktop

---

### Features

#### 15 Actions + Chat Model

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

#### Wildbots Gemini Chat Model

A dedicated **sub-node** for n8n AI Agent workflows. Drop it into any AI Agent node as the language model — it inherits your proxy credentials automatically.

---

### Quick Start

#### 1. Install the community node

Open your n8n instance and go to:

**Settings → Community Nodes → Install**

Paste the package name and click Install:

```
n8n-nodes-wildbots-gemini
```

#### 2. Add your Google Gemini API key

1. Go to **Credentials → New Credential**
2. Search for **Wildbots Gemini API**
3. Paste your [Gemini API key](https://aistudio.google.com/app/apikey)
4. Leave **Host** as-is to use the built-in public proxy — or enter your own Worker URL

#### 3. Start building

Add a **Wildbots Gemini** node to your workflow, pick an action, and go.

---

### Configuration

The **Wildbots Gemini API** credential has two fields:

| Field | Description | Default |
|---|---|---|
| **API Key** | Your Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey) | — |
| **Host** | The proxy URL that forwards requests to Gemini | `https://gemini-proxy.bold-violet-3c8d.workers.dev` |

> **Note:** The default public proxy is provided for convenience and is rate-limited. For production use or high request volumes, [deploy your own Worker](#deploy-your-own-worker).

---

### Deploy Your Own Worker

The public proxy is rate-limited. If you hit the limit, or simply want your own private proxy, deploy one for free on Cloudflare — no credit card required.

#### The Worker code

Whichever method you pick below, you'll need this code. It's a hardened reverse-proxy that:
- Forwards only valid Gemini API paths (`/v1beta/`, `/v1/`, `/upload/`) — everything else returns 404
- Strips hop-by-hop and Cloudflare-specific headers before forwarding upstream
- Returns JSON errors when the upstream is unreachable
- Exposes a `/health` endpoint so you can ping it in a browser to verify it's alive
- Passes response bodies as streams (works with Gemini SSE / streaming responses)

```javascript
const VERSION = '2.0.0';
const UPSTREAM_HOST = 'generativelanguage.googleapis.com';

const ALLOWED_PATH_PREFIXES = ['/v1beta/', '/v1/', '/upload/'];

const STRIPPED_REQUEST_HEADERS = new Set([
  'host', 'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade',
  'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'cf-worker',
  'cf-ew-via', 'cf-request-id',
  'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-host', 'x-real-ip',
]);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...CORS_HEADERS,
    },
  });
}

function isAllowedPath(pathname) {
  return ALLOWED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function buildUpstreamHeaders(incoming) {
  const headers = new Headers();
  incoming.forEach((value, name) => {
    if (!STRIPPED_REQUEST_HEADERS.has(name.toLowerCase())) {
      headers.set(name, value);
    }
  });
  return headers;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === '/' || url.pathname === '/health') {
      return jsonResponse(200, {
        status: 'ok',
        name: 'wildbots-gemini-proxy',
        version: VERSION,
        upstream: UPSTREAM_HOST,
        docs: 'https://github.com/Aimagine-life/n8n-nodes-wildbots-gemini',
      });
    }

    if (!isAllowedPath(url.pathname)) {
      return jsonResponse(404, {
        error: 'not_found',
        message: `Path "${url.pathname}" is not a Gemini API endpoint.`,
        allowed_prefixes: ALLOWED_PATH_PREFIXES,
        hint: 'This proxy only forwards requests to the Google Gemini API.',
      });
    }

    const upstreamUrl = new URL(url.toString());
    upstreamUrl.hostname = UPSTREAM_HOST;
    upstreamUrl.protocol = 'https:';
    upstreamUrl.port = '';

    const upstreamRequest = new Request(upstreamUrl.toString(), {
      method: request.method,
      headers: buildUpstreamHeaders(request.headers),
      body: request.body,
      redirect: 'follow',
    });

    let upstreamResponse;
    try {
      upstreamResponse = await fetch(upstreamRequest);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return jsonResponse(502, {
        error: 'upstream_unreachable',
        message: `Failed to reach ${UPSTREAM_HOST}: ${message}`,
        proxy_version: VERSION,
      });
    }

    const responseHeaders = new Headers(upstreamResponse.headers);
    for (const [name, value] of Object.entries(CORS_HEADERS)) {
      responseHeaders.set(name, value);
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
```

#### Option A — Cloudflare Dashboard (no installs, recommended)

The fastest way — everything happens in the browser.

**1.** Sign in at [dash.cloudflare.com](https://dash.cloudflare.com). If you don't have an account, sign up — no credit card needed for the free Workers plan.

**2.** In the left sidebar click **Compute (Workers)** → **Workers & Pages**.

**3.** Click **Create** → **Create Worker**.

**4.** Enter a name (for example `gemini-proxy`) and click **Deploy**. Cloudflare deploys a default "Hello World" worker.

**5.** Once the deploy finishes, click **Edit code** in the top right. The online code editor opens.

**6.** **Delete all the existing code** in `worker.js` and paste the Worker code from the block above.

**7.** Click **Deploy** in the top right of the editor.

**8.** Your Worker is live. The URL is shown at the top of the page — it looks like `https://gemini-proxy.<your-subdomain>.workers.dev`.

**9.** Open your **Wildbots Gemini API** credential in n8n, paste that URL into the **Host** field, and save. Done.

#### Option B — Wrangler CLI (for developers)

If you prefer the terminal.

**1.** Install Wrangler:

```bash
npm install -g wrangler
```

**2.** Create a new folder and save the Worker code from the block above as `worker.js`.

**3.** Log in to Cloudflare:

```bash
wrangler login
```

A browser window opens — authorize Wrangler with your Cloudflare account.

**4.** Deploy:

```bash
wrangler deploy worker.js --name gemini-proxy --compatibility-date 2024-01-01
```

Wrangler prints your Worker URL, something like `https://gemini-proxy.<your-subdomain>.workers.dev`.

**5.** Paste the URL into the **Host** field of your **Wildbots Gemini API** credential in n8n, and save. Done.

---

<a id="русский"></a>

## 🇷🇺 Русский

### Используй Google Gemini AI в n8n — из любой точки мира, без региональных блокировок.

### Проблема

Google Gemini API недоступен во многих регионах — Россия, Беларусь и другие страны. Вы пытаетесь вызвать API из n8n и получаете `403` или ошибку соединения. Встроенная нода n8n не позволяет указать свой URL — обходного пути нет.

### Решение

**n8n-nodes-wildbots-gemini** — community-нода, которая направляет все запросы к Gemini API через лёгкий прокси на Cloudflare Workers. Прокси прозрачно пересылает запросы на серверы Google и возвращает ответ.

- **Публичный прокси по умолчанию** — ничего настраивать не нужно, работает сразу
- Можно **развернуть свой приватный прокси** за 5 минут, бесплатно на Cloudflare
- Работает с **любым вариантом n8n** — облако, self-hosted, десктоп

---

### Возможности

#### 15 действий + Chat Model

| Категория | Действие |
|---|---|
| 🔊 **Аудио** | Анализ аудио |
| 🔊 **Аудио** | Транскрибация записи |
| 📄 **Документ** | Анализ документа |
| 🗂️ **Поиск по файлам** | Создать хранилище |
| 🗂️ **Поиск по файлам** | Удалить хранилище |
| 🗂️ **Поиск по файлам** | Список хранилищ |
| 🗂️ **Поиск по файлам** | Загрузить файл в хранилище |
| 🖼️ **Изображение** | Анализ изображения |
| 🖼️ **Изображение** | Генерация изображения |
| 🖼️ **Изображение** | Редактирование изображения |
| 📁 **Медиафайл** | Загрузка медиафайла |
| 💬 **Текст** | Сообщение модели |
| 🎬 **Видео** | Анализ видео |
| 🎬 **Видео** | Генерация видео |
| 🎬 **Видео** | Скачать видео |

#### Wildbots Gemini Chat Model

Специальная **суб-нода** для AI Agent воркфлоу в n8n. Просто подключите её к любому AI Agent как языковую модель — настройки прокси подтянутся автоматически.

---

### Быстрый старт

#### 1. Установите community-ноду

Откройте n8n и перейдите:

**Settings → Community Nodes → Install**

Вставьте имя пакета и нажмите Install:

```
n8n-nodes-wildbots-gemini
```

#### 2. Добавьте API-ключ Google Gemini

1. Перейдите в **Credentials → New Credential**
2. Найдите **Wildbots Gemini API**
3. Вставьте ваш [API-ключ Gemini](https://aistudio.google.com/app/apikey)
4. Поле **Host** оставьте как есть (публичный прокси) — или укажите URL своего воркера

#### 3. Начните работать

Добавьте ноду **Wildbots Gemini** в воркфлоу, выберите действие — и вперёд.

---

### Настройка

Credential **Wildbots Gemini API** содержит два поля:

| Поле | Описание | По умолчанию |
|---|---|---|
| **API Key** | Ваш API-ключ Google Gemini из [Google AI Studio](https://aistudio.google.com/app/apikey) | — |
| **Host** | URL прокси, который пересылает запросы к Gemini | `https://gemini-proxy.bold-violet-3c8d.workers.dev` |

> **Важно:** Публичный прокси предоставляется для удобства и имеет ограничения по количеству запросов. Для продакшена или больших объёмов — [разверните свой воркер](#разверните-свой-воркер).

---

### Разверните свой воркер

Публичный прокси имеет лимиты. Если они закончились — или вы просто хотите свой приватный прокси — разверните его бесплатно на Cloudflare. Кредитная карта не нужна.

#### Код воркера

Код один и тот же для обоих способов ниже. Это защищённый reverse-proxy, который:
- Проксирует только валидные Gemini API пути (`/v1beta/`, `/v1/`, `/upload/`) — всё остальное возвращает 404
- Чистит hop-by-hop и Cloudflare-специфичные заголовки перед отправкой на upstream
- Возвращает JSON-ошибки, если upstream недоступен
- Отдаёт `/health` эндпоинт — можно пингануть в браузере и увидеть что воркер живой
- Передаёт тело ответа как поток (работает со стримингом Gemini через SSE)

```javascript
const VERSION = '2.0.0';
const UPSTREAM_HOST = 'generativelanguage.googleapis.com';

const ALLOWED_PATH_PREFIXES = ['/v1beta/', '/v1/', '/upload/'];

const STRIPPED_REQUEST_HEADERS = new Set([
  'host', 'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade',
  'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'cf-worker',
  'cf-ew-via', 'cf-request-id',
  'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-host', 'x-real-ip',
]);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...CORS_HEADERS,
    },
  });
}

function isAllowedPath(pathname) {
  return ALLOWED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function buildUpstreamHeaders(incoming) {
  const headers = new Headers();
  incoming.forEach((value, name) => {
    if (!STRIPPED_REQUEST_HEADERS.has(name.toLowerCase())) {
      headers.set(name, value);
    }
  });
  return headers;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === '/' || url.pathname === '/health') {
      return jsonResponse(200, {
        status: 'ok',
        name: 'wildbots-gemini-proxy',
        version: VERSION,
        upstream: UPSTREAM_HOST,
        docs: 'https://github.com/Aimagine-life/n8n-nodes-wildbots-gemini',
      });
    }

    if (!isAllowedPath(url.pathname)) {
      return jsonResponse(404, {
        error: 'not_found',
        message: `Path "${url.pathname}" is not a Gemini API endpoint.`,
        allowed_prefixes: ALLOWED_PATH_PREFIXES,
        hint: 'This proxy only forwards requests to the Google Gemini API.',
      });
    }

    const upstreamUrl = new URL(url.toString());
    upstreamUrl.hostname = UPSTREAM_HOST;
    upstreamUrl.protocol = 'https:';
    upstreamUrl.port = '';

    const upstreamRequest = new Request(upstreamUrl.toString(), {
      method: request.method,
      headers: buildUpstreamHeaders(request.headers),
      body: request.body,
      redirect: 'follow',
    });

    let upstreamResponse;
    try {
      upstreamResponse = await fetch(upstreamRequest);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return jsonResponse(502, {
        error: 'upstream_unreachable',
        message: `Failed to reach ${UPSTREAM_HOST}: ${message}`,
        proxy_version: VERSION,
      });
    }

    const responseHeaders = new Headers(upstreamResponse.headers);
    for (const [name, value] of Object.entries(CORS_HEADERS)) {
      responseHeaders.set(name, value);
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
```

#### Вариант A — через панель Cloudflare (рекомендуется, без установок)

Самый простой путь — всё делается в браузере.

**1.** Зайдите на [dash.cloudflare.com](https://dash.cloudflare.com). Если аккаунта нет — зарегистрируйтесь, кредитная карта для бесплатного плана Workers не нужна.

**2.** В левом меню нажмите **Compute (Workers)** → **Workers & Pages**.

**3.** Нажмите **Create** → **Create Worker**.

**4.** Введите имя (например `gemini-proxy`) и нажмите **Deploy**. Cloudflare задеплоит стандартный "Hello World" воркер.

**5.** После завершения деплоя нажмите **Edit code** в правом верхнем углу — откроется онлайн-редактор.

**6.** **Удалите весь существующий код** в `worker.js` и вставьте код воркера из блока выше.

**7.** Нажмите **Deploy** в правом верхнем углу редактора.

**8.** Ваш воркер запущен. URL показан вверху страницы — он выглядит как `https://gemini-proxy.<ваш-субдомен>.workers.dev`.

**9.** Откройте credential **Wildbots Gemini API** в n8n, вставьте этот URL в поле **Host** и сохраните. Готово.

#### Вариант B — через Wrangler CLI (для разработчиков)

Если вам удобнее работать через терминал.

**1.** Установите Wrangler:

```bash
npm install -g wrangler
```

**2.** Создайте новую папку и сохраните код воркера из блока выше как `worker.js`.

**3.** Войдите в Cloudflare:

```bash
wrangler login
```

Откроется браузер — авторизуйте Wrangler в своём аккаунте.

**4.** Задеплойте:

```bash
wrangler deploy worker.js --name gemini-proxy --compatibility-date 2024-01-01
```

Wrangler покажет URL вашего воркера, типа `https://gemini-proxy.<ваш-субдомен>.workers.dev`.

**5.** Вставьте URL в поле **Host** credential **Wildbots Gemini API** в n8n и сохраните. Готово.

---

## Links / Ссылки

- **npm:** [npmjs.com/package/n8n-nodes-wildbots-gemini](https://www.npmjs.com/package/n8n-nodes-wildbots-gemini)
- **GitHub:** [github.com/Aimagine-life/n8n-nodes-wildbots-gemini](https://github.com/Aimagine-life/n8n-nodes-wildbots-gemini)
- **Gemini API Keys:** [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Cloudflare Workers:** [workers.cloudflare.com](https://workers.cloudflare.com)

---

## License / Лицензия

MIT © [Wildbots](https://github.com/Aimagine-life)
