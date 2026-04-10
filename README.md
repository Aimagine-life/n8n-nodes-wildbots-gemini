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

The public proxy is rate-limited. If you hit the limit, or simply want your own private proxy, deploy one in minutes for free on Cloudflare.

#### Prerequisites

- A free [Cloudflare account](https://cloudflare.com)
- Node.js installed

#### Steps

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

Публичный прокси имеет лимиты. Если они закончились — или вы просто хотите свой приватный прокси — разверните его за пару минут бесплатно на Cloudflare.

#### Что нужно

- Бесплатный аккаунт [Cloudflare](https://cloudflare.com)
- Установленный Node.js

#### Шаги

**1. Создайте бесплатный аккаунт Cloudflare**

Зарегистрируйтесь на [cloudflare.com](https://cloudflare.com) — кредитная карта для Workers не нужна.

**2. Установите Wrangler CLI**

```bash
npm install -g wrangler
```

**3. Создайте файл воркера**

Создайте новую папку и добавьте файл `worker.js`:

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

**4. Войдите в Cloudflare**

```bash
wrangler login
```

Откроется браузер — авторизуйте Wrangler в своём аккаунте Cloudflare.

**5. Задеплойте воркер**

```bash
wrangler deploy worker.js --name gemini-proxy --compatibility-date 2024-01-01
```

После деплоя Wrangler покажет URL вашего воркера:

```
https://gemini-proxy.<ваш-субдомен>.workers.dev
```

**6. Укажите URL воркера в n8n**

Откройте credential **Wildbots Gemini API** в n8n, вставьте URL воркера в поле **Host** и сохраните. Готово.

---

## Links / Ссылки

- **npm:** [npmjs.com/package/n8n-nodes-wildbots-gemini](https://www.npmjs.com/package/n8n-nodes-wildbots-gemini)
- **GitHub:** [github.com/Aimagine-life/n8n-nodes-wildbots-gemini](https://github.com/Aimagine-life/n8n-nodes-wildbots-gemini)
- **Gemini API Keys:** [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Cloudflare Workers:** [workers.cloudflare.com](https://workers.cloudflare.com)

---

## License / Лицензия

MIT © [Wildbots](https://github.com/Aimagine-life)
