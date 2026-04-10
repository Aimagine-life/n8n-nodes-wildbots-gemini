# n8n-nodes-wildbots-gemini Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a community n8n node package that proxies Google Gemini API through a Cloudflare Worker to bypass regional restrictions.

**Architecture:** Fork the built-in n8n Google Gemini node (`@n8n/nodes-langchain.googleGemini`) and Chat Model (`lmChatGoogleGemini`) into a standalone community node package. Replace the credential type to point at a Cloudflare Worker proxy by default. Add rate-limit error handling with a friendly Russian message. Ship a Cloudflare Worker as a simple transparent proxy.

**Tech Stack:** TypeScript, n8n community node SDK (`@n8n/node-cli`), `n8n-workflow` (peer dep), `@langchain/google-genai`, `@google/generative-ai`, Cloudflare Workers

---

## File Map

```
n8n-nodes-wildbots-gemini/
├── .github/workflows/
│   ├── ci.yml                                    # CI: lint + build
│   └── publish.yml                               # Publish to npm on tag
├── .gitignore
├── .prettierrc.js
├── eslint.config.mjs
├── package.json
├── tsconfig.json
├── LICENSE.md
├── README.md                                     # Marketing-grade README
├── credentials/
│   └── WildbotsGeminiApi.credentials.ts          # API key + base URL credential
├── nodes/
│   ├── WildbotsGemini/
│   │   ├── WildbotsGemini.node.ts                # Main node class
│   │   ├── WildbotsGemini.node.json              # Codex metadata
│   │   ├── gemini.svg                            # Icon
│   │   ├── actions/
│   │   │   ├── descriptions.ts                   # modelRLC helper
│   │   │   ├── node.type.ts                      # TypeScript type map
│   │   │   ├── router.ts                         # Resource/operation router
│   │   │   ├── versionDescription.ts             # Node metadata
│   │   │   ├── audio/
│   │   │   │   ├── index.ts
│   │   │   │   ├── analyze.operation.ts
│   │   │   │   └── transcribe.operation.ts
│   │   │   ├── document/
│   │   │   │   ├── index.ts
│   │   │   │   └── analyze.operation.ts
│   │   │   ├── file/
│   │   │   │   ├── index.ts
│   │   │   │   └── upload.operation.ts
│   │   │   ├── fileSearch/
│   │   │   │   ├── index.ts
│   │   │   │   ├── createStore.operation.ts
│   │   │   │   ├── deleteStore.operation.ts
│   │   │   │   ├── listStores.operation.ts
│   │   │   │   └── uploadToStore.operation.ts
│   │   │   ├── image/
│   │   │   │   ├── index.ts
│   │   │   │   ├── analyze.operation.ts
│   │   │   │   ├── edit.operation.ts
│   │   │   │   └── generate.operation.ts
│   │   │   ├── text/
│   │   │   │   ├── index.ts
│   │   │   │   └── message.operation.ts
│   │   │   └── video/
│   │   │       ├── index.ts
│   │   │       ├── analyze.operation.ts
│   │   │       ├── download.operation.ts
│   │   │       └── generate.operation.ts
│   │   ├── helpers/
│   │   │   ├── baseAnalyze.ts
│   │   │   ├── interfaces.ts
│   │   │   └── utils.ts
│   │   ├── methods/
│   │   │   ├── index.ts
│   │   │   └── listSearch.ts
│   │   └── transport/
│   │       └── index.ts                          # apiRequest with rate-limit handling
│   └── WildbotsGeminiChatModel/
│       ├── WildbotsGeminiChatModel.node.ts       # Chat Model sub-node
│       └── google.svg                            # Icon for chat model
├── worker/
│   ├── index.ts                                  # Cloudflare Worker proxy
│   └── wrangler.toml                             # Worker config
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-04-10-n8n-nodes-wildbots-gemini-design.md
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.prettierrc.js`
- Create: `eslint.config.mjs`
- Create: `LICENSE.md`
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/publish.yml`

- [ ] **Step 1: Initialize git repo**

```bash
cd /c/Users/Konstantin/google-proxy
git init
```

- [ ] **Step 2: Create package.json**

Create `package.json`:

```json
{
	"name": "n8n-nodes-wildbots-gemini",
	"version": "0.1.0",
	"description": "Google Gemini AI nodes for n8n with built-in proxy — bypass regional restrictions effortlessly",
	"license": "MIT",
	"homepage": "https://github.com/Aimagine-life/n8n-nodes-wildbots-gemini",
	"keywords": [
		"n8n-community-node-package",
		"n8n",
		"gemini",
		"google",
		"ai",
		"proxy",
		"cloudflare"
	],
	"author": {
		"name": "Wildbots",
		"url": "https://github.com/Aimagine-life"
	},
	"repository": {
		"type": "git",
		"url": "https://github.com/Aimagine-life/n8n-nodes-wildbots-gemini.git"
	},
	"scripts": {
		"build": "n8n-node build",
		"build:watch": "tsc --watch",
		"dev": "n8n-node dev",
		"lint": "n8n-node lint",
		"lint:fix": "n8n-node lint --fix",
		"release": "n8n-node release",
		"prepublishOnly": "n8n-node prerelease"
	},
	"files": [
		"dist"
	],
	"n8n": {
		"n8nNodesApiVersion": 1,
		"strict": true,
		"credentials": [
			"dist/credentials/WildbotsGeminiApi.credentials.js"
		],
		"nodes": [
			"dist/nodes/WildbotsGemini/WildbotsGemini.node.js",
			"dist/nodes/WildbotsGeminiChatModel/WildbotsGeminiChatModel.node.js"
		]
	},
	"devDependencies": {
		"@n8n/node-cli": "*",
		"eslint": "9.39.4",
		"prettier": "3.8.1",
		"typescript": "5.9.3"
	},
	"peerDependencies": {
		"n8n-workflow": "*"
	},
	"dependencies": {
		"@google/generative-ai": "^0.24.0",
		"@langchain/google-genai": "^0.2.0",
		"zod-to-json-schema": "^3.24.0"
	}
}
```

- [ ] **Step 3: Create tsconfig.json**

Create `tsconfig.json`:

```json
{
	"compilerOptions": {
		"strict": true,
		"module": "commonjs",
		"moduleResolution": "node",
		"target": "es2019",
		"lib": ["es2019", "es2020", "es2022.error"],
		"removeComments": true,
		"useUnknownInCatchVariables": false,
		"forceConsistentCasingInFileNames": true,
		"noImplicitAny": true,
		"noImplicitReturns": true,
		"noUnusedLocals": true,
		"strictNullChecks": true,
		"preserveConstEnums": true,
		"esModuleInterop": true,
		"resolveJsonModule": true,
		"incremental": true,
		"declaration": true,
		"sourceMap": true,
		"skipLibCheck": true,
		"outDir": "./dist/"
	},
	"include": ["credentials/**/*", "nodes/**/*", "nodes/**/*.json", "package.json"]
}
```

- [ ] **Step 4: Create .gitignore, .prettierrc.js, eslint.config.mjs**

`.gitignore`:
```
dist
node_modules
.tsbuildinfo
```

`.prettierrc.js`:
```javascript
module.exports = {
	semi: true,
	trailingComma: 'all',
	bracketSpacing: true,
	useTabs: true,
	tabWidth: 2,
	arrowParens: 'always',
	singleQuote: true,
	quoteProps: 'as-needed',
	endOfLine: 'lf',
	printWidth: 100,
};
```

`eslint.config.mjs`:
```javascript
import { config } from '@n8n/node-cli/eslint';

export default config;
```

- [ ] **Step 5: Create LICENSE.md**

Standard MIT license with "Wildbots / Aimagine-life" copyright.

- [ ] **Step 6: Create CI workflows**

`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run lint
        run: npm run lint
      - name: Run build
        run: npm run build
```

`.github/workflows/publish.yml`:
```yaml
name: Publish

on:
  push:
    tags:
      - '*.*.*'

jobs:
  publish:
    name: Publish to npm
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Release
        run: |
          [ -n "$NPM_TOKEN" ] && npm config set //registry.npmjs.org/:_authToken "$NPM_TOKEN"
          npm run release
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

- [ ] **Step 7: Commit scaffold**

```bash
git add package.json tsconfig.json .gitignore .prettierrc.js eslint.config.mjs LICENSE.md .github/
git commit -m "chore: initial project scaffold for n8n-nodes-wildbots-gemini"
```

---

### Task 2: Credentials

**Files:**
- Create: `credentials/WildbotsGeminiApi.credentials.ts`

- [ ] **Step 1: Create credential file**

```typescript
import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WildbotsGeminiApi implements ICredentialType {
	name = 'wildbotsGeminiApi';

	displayName = 'Wildbots Gemini API';

	documentationUrl = 'https://github.com/Aimagine-life/n8n-nodes-wildbots-gemini';

	properties: INodeProperties[] = [
		{
			displayName: 'Host',
			name: 'host',
			required: true,
			type: 'string',
			default: 'https://gemini-proxy.bold-violet-3c8d.workers.dev',
			description:
				'Proxy URL. Default is a shared Cloudflare Worker. You can deploy your own — see README.',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your Google Gemini API key from Google AI Studio',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			qs: {
				key: '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.host}}/v1beta/models',
		},
	};
}
```

- [ ] **Step 2: Commit**

```bash
git add credentials/
git commit -m "feat: add WildbotsGeminiApi credentials with proxy URL default"
```

---

### Task 3: Transport Layer with Rate-Limit Handling

**Files:**
- Create: `nodes/WildbotsGemini/transport/index.ts`

- [ ] **Step 1: Create transport with rate-limit error handling**

```typescript
import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

type RequestParameters = {
	headers?: IDataObject;
	body?: IDataObject | string;
	qs?: IDataObject;
	option?: IDataObject;
};

type WildbotsGeminiCredentials = {
	host: string;
	apiKey: string;
};

const DEFAULT_PROXY_HOST = 'https://gemini-proxy.bold-violet-3c8d.workers.dev';

const RATE_LIMIT_MESSAGE = `Лимиты общего прокси исчерпаны — слишком много пользователей на одном воркере.

Разверните свой Cloudflare Worker — это бесплатно и займёт 5 минут.
Инструкция: https://www.npmjs.com/package/n8n-nodes-wildbots-gemini#deploy-your-own-worker`;

export async function apiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	parameters?: RequestParameters,
) {
	const { body, qs, option, headers } = parameters ?? {};

	const credentials = await this.getCredentials<WildbotsGeminiCredentials>('wildbotsGeminiApi');

	const host = credentials.host || DEFAULT_PROXY_HOST;
	const url = `${host}${endpoint}`;

	const options = {
		headers,
		method,
		body,
		qs,
		url,
		json: true,
	};

	if (option && Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}

	try {
		return await this.helpers.httpRequestWithAuthentication.call(
			this,
			'wildbotsGeminiApi',
			options,
		);
	} catch (error) {
		if (
			error?.httpCode === '429' &&
			host === DEFAULT_PROXY_HOST
		) {
			throw new NodeApiError(this.getNode(), error as IDataObject, {
				message: 'Rate limit exceeded',
				description: RATE_LIMIT_MESSAGE,
			});
		}
		throw error;
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add nodes/WildbotsGemini/transport/
git commit -m "feat: add transport layer with rate-limit handling for shared proxy"
```

---

### Task 4: Helpers (interfaces, baseAnalyze, utils)

**Files:**
- Create: `nodes/WildbotsGemini/helpers/interfaces.ts`
- Create: `nodes/WildbotsGemini/helpers/baseAnalyze.ts`
- Create: `nodes/WildbotsGemini/helpers/utils.ts`

- [ ] **Step 1: Create interfaces.ts**

Copy the interfaces from the original node. These define the Gemini API request/response types. Key types: `GenerateContentRequest`, `GenerateContentResponse`, `Content`, `Part`, `Tool`, `ImagenResponse`, `VeoResponse`, `FileSearchOperation`, `BuiltInTools`.

Note: The original imports `Modality` from `@google/genai` and types from `@google/genai`. For the community node, we inline the types we need to avoid depending on `@google/genai` at runtime:

```typescript
import type { IDataObject } from 'n8n-workflow';

export enum Modality {
	IMAGE = 'IMAGE',
	TEXT = 'TEXT',
}

export type GenerateContentGenerationConfig = {
	stopSequences?: string[];
	responseMimeType?: string;
	responseSchema?: IDataObject;
	responseJsonSchema?: IDataObject;
	responseModalities?: string[];
	candidateCount?: number;
	maxOutputTokens?: number;
	temperature?: number;
	topP?: number;
	topK?: number;
	seed?: number;
	presencePenalty?: number;
	frequencyPenalty?: number;
	responseLogprobs?: boolean;
	logprobs?: number;
	speechConfig?: IDataObject;
	thinkingConfig?: IDataObject;
	mediaResolution?: string;
};

export interface GenerateContentRequest extends IDataObject {
	contents: Content[];
	tools?: Tool[];
	toolConfig?: IDataObject;
	systemInstruction?: IDataObject;
	safetySettings?: IDataObject[];
	generationConfig?: GenerateContentGenerationConfig;
	cachedContent?: string;
}

export interface GenerateContentResponse {
	candidates: Array<{
		content: Content;
	}>;
}

export interface Content {
	parts: Part[];
	role: string;
}

export type Part =
	| { text: string }
	| {
			inlineData: {
				mimeType: string;
				data: string;
			};
	  }
	| {
			functionCall: {
				id?: string;
				name: string;
				args?: IDataObject;
			};
	  }
	| {
			functionResponse: {
				id?: string;
				name: string;
				response: IDataObject;
			};
	  }
	| {
			fileData?: {
				mimeType?: string;
				fileUri?: string;
			};
	  };

export interface ImagenResponse {
	predictions: Array<{
		bytesBase64Encoded: string;
		mimeType: string;
	}>;
}

export interface VeoResponse {
	name: string;
	done: boolean;
	error?: {
		message: string;
	};
	response: {
		generateVideoResponse: {
			generatedSamples: Array<{
				video: {
					uri: string;
				};
			}>;
		};
	};
}

export interface FileSearchOperation {
	name: string;
	done: boolean;
	error?: { message: string };
	response?: IDataObject;
}

export interface BuiltInTools {
	googleSearch?: boolean;
	googleMaps?: {
		latitude?: number | string;
		longitude?: number | string;
	};
	urlContext?: boolean;
	fileSearch?: {
		fileSearchStoreNames?: string;
		metadataFilter?: string;
	};
	codeExecution?: boolean;
}

export interface Tool {
	functionDeclarations?: Array<{
		name: string;
		description: string;
		parameters: IDataObject;
	}>;
	googleSearch?: object;
	googleMaps?: object;
	urlContext?: object;
	fileSearch?: {
		fileSearchStoreNames?: string[];
		metadataFilter?: string;
	};
	codeExecution?: object;
}
```

- [ ] **Step 2: Create baseAnalyze.ts**

Copy from original, only change: import `apiRequest` from `'../transport'` (relative path stays the same). No other changes needed — the function is self-contained.

```typescript
import {
	validateNodeParameters,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';

import type { Content, GenerateContentResponse } from './interfaces';
import { downloadFile, uploadFile } from './utils';
import { apiRequest } from '../transport';

export async function baseAnalyze(
	this: IExecuteFunctions,
	i: number,
	urlsPropertyName: string,
	fallbackMimeType: string,
): Promise<INodeExecutionData[]> {
	const model = this.getNodeParameter('modelId', i, '', { extractValue: true }) as string;
	const inputType = this.getNodeParameter('inputType', i, 'url') as string;
	const text = this.getNodeParameter('text', i, '') as string;
	const simplify = this.getNodeParameter('simplify', i, true) as boolean;
	const options = this.getNodeParameter('options', i, {});
	validateNodeParameters(
		options,
		{ maxOutputTokens: { type: 'number', required: false } },
		this.getNode(),
	);
	const generationConfig = {
		maxOutputTokens: options.maxOutputTokens,
	};

	let contents: Content[];
	if (inputType === 'url') {
		const urls = this.getNodeParameter(urlsPropertyName, i, '') as string;
		const filesDataPromises = urls
			.split(',')
			.map((url) => url.trim())
			.filter((url) => url)
			.map(async (url) => {
				if (url.startsWith('https://generativelanguage.googleapis.com')) {
					const { mimeType } = (await apiRequest.call(this, 'GET', '', {
						option: { url },
					})) as { mimeType: string };
					return { fileUri: url, mimeType };
				} else {
					const { fileContent, mimeType } = await downloadFile.call(this, url, fallbackMimeType);
					return await uploadFile.call(this, fileContent, mimeType);
				}
			});

		const filesData = await Promise.all(filesDataPromises);
		contents = [
			{
				role: 'user',
				parts: filesData.map((fileData) => ({
					fileData,
				})),
			},
		];
	} else {
		const binaryPropertyNames = this.getNodeParameter('binaryPropertyName', i, 'data');
		const promises = binaryPropertyNames
			.split(',')
			.map((binaryPropertyName: string) => binaryPropertyName.trim())
			.filter((binaryPropertyName: string) => binaryPropertyName)
			.map(async (binaryPropertyName: string) => {
				const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
				const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
				return await uploadFile.call(this, buffer, binaryData.mimeType);
			});

		const filesData = await Promise.all(promises);
		contents = [
			{
				role: 'user',
				parts: filesData.map((fileData) => ({
					fileData,
				})),
			},
		];
	}

	contents[0].parts.push({ text });

	const body = {
		contents,
		generationConfig,
	};

	const response = (await apiRequest.call(this, 'POST', `/v1beta/${model}:generateContent`, {
		body,
	})) as GenerateContentResponse;

	if (simplify) {
		return response.candidates.map((candidate) => ({
			json: candidate,
			pairedItem: { item: i },
		}));
	}

	return [
		{
			json: { ...response },
			pairedItem: { item: i },
		},
	];
}
```

- [ ] **Step 3: Create utils.ts**

Copy from original — `downloadFile`, `uploadFile`, `transferFile`, `createFileSearchStore`, `uploadToFileSearchStore`, `listFileSearchStores`, `deleteFileSearchStore`. Import `apiRequest` from `'../transport'`. No other changes.

The full file is large (~250 lines). Copy it verbatim from the original source, only adjusting the import path for `apiRequest` and `FileSearchOperation` interface.

- [ ] **Step 4: Commit**

```bash
git add nodes/WildbotsGemini/helpers/
git commit -m "feat: add helpers (interfaces, baseAnalyze, utils)"
```

---

### Task 5: Actions — All 15 Operations

**Files:**
- Create: `nodes/WildbotsGemini/actions/descriptions.ts`
- Create: `nodes/WildbotsGemini/actions/node.type.ts`
- Create: `nodes/WildbotsGemini/actions/audio/index.ts`
- Create: `nodes/WildbotsGemini/actions/audio/analyze.operation.ts`
- Create: `nodes/WildbotsGemini/actions/audio/transcribe.operation.ts`
- Create: `nodes/WildbotsGemini/actions/document/index.ts`
- Create: `nodes/WildbotsGemini/actions/document/analyze.operation.ts`
- Create: `nodes/WildbotsGemini/actions/file/index.ts`
- Create: `nodes/WildbotsGemini/actions/file/upload.operation.ts`
- Create: `nodes/WildbotsGemini/actions/fileSearch/index.ts`
- Create: `nodes/WildbotsGemini/actions/fileSearch/createStore.operation.ts`
- Create: `nodes/WildbotsGemini/actions/fileSearch/deleteStore.operation.ts`
- Create: `nodes/WildbotsGemini/actions/fileSearch/listStores.operation.ts`
- Create: `nodes/WildbotsGemini/actions/fileSearch/uploadToStore.operation.ts`
- Create: `nodes/WildbotsGemini/actions/image/index.ts`
- Create: `nodes/WildbotsGemini/actions/image/analyze.operation.ts`
- Create: `nodes/WildbotsGemini/actions/image/edit.operation.ts`
- Create: `nodes/WildbotsGemini/actions/image/generate.operation.ts`
- Create: `nodes/WildbotsGemini/actions/text/index.ts`
- Create: `nodes/WildbotsGemini/actions/text/message.operation.ts`
- Create: `nodes/WildbotsGemini/actions/video/index.ts`
- Create: `nodes/WildbotsGemini/actions/video/analyze.operation.ts`
- Create: `nodes/WildbotsGemini/actions/video/download.operation.ts`
- Create: `nodes/WildbotsGemini/actions/video/generate.operation.ts`

- [ ] **Step 1: Create descriptions.ts and node.type.ts**

`descriptions.ts` — the `modelRLC` factory function (same as original):

```typescript
import type { INodeProperties } from 'n8n-workflow';

export const modelRLC = (searchListMethod: string): INodeProperties => ({
	displayName: 'Model',
	name: 'modelId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			typeOptions: {
				searchListMethod,
				searchable: true,
			},
		},
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. models/gemini-2.5-flash',
		},
	],
});
```

`node.type.ts`:

```typescript
import type { AllEntities } from 'n8n-workflow';

type NodeMap = {
	text: 'message';
	image: 'analyze' | 'generate' | 'edit';
	video: 'analyze' | 'generate' | 'download';
	audio: 'transcribe' | 'analyze';
	document: 'analyze';
	file: 'upload';
	fileSearch: 'createStore' | 'deleteStore' | 'listStores' | 'uploadToStore';
};

export type WildbotsGeminiType = AllEntities<NodeMap>;
```

- [ ] **Step 2: Create all action index files and operations**

Each action directory has an `index.ts` that exports operations and their property descriptions, plus individual `.operation.ts` files.

All operation files are copied from the original with these changes:
1. Import paths adjusted to relative within the new structure
2. `@utils/helpers` import for `getConnectedTools` in `message.operation.ts` — this is an n8n monorepo alias. We need to either inline this utility or import from `n8n-workflow` directly. The `getConnectedTools` function is a utility from the n8n monorepo that gets AI tools connected to the node. We'll need to implement it inline in `message.operation.ts`.

Key files to handle carefully:

**`text/message.operation.ts`** — the most complex operation. Uses `getConnectedTools` from `@utils/helpers` which is a monorepo-internal import. This function returns connected AI tools (function declarations). We need to replace this with the equivalent n8n-workflow API call:

Replace:
```typescript
import { getConnectedTools } from '@utils/helpers';
```
With the inline implementation:
```typescript
async function getConnectedTools(context: IExecuteFunctions) {
	const connectedTools = await context.getInputConnectionData(
		'ai_tool' as any,
		0,
	);
	return (connectedTools ?? []) as Array<{ name: string; description: string; schema: any; invoke: (args: any) => Promise<any> }>;
}
```

**`image/edit.operation.ts`** and **`image/generate.operation.ts`** — use `Modality` enum. Import from our local `interfaces.ts` instead of `@google/genai`.

**`video/generate.operation.ts`** — uses polling with `VeoResponse` type. Import from our local `interfaces.ts`.

All other operations (audio/analyze, audio/transcribe, document/analyze, file/upload, fileSearch/*, image/analyze, video/analyze, video/download) are straightforward copies with adjusted import paths.

- [ ] **Step 3: Commit**

```bash
git add nodes/WildbotsGemini/actions/
git commit -m "feat: add all 15 Gemini actions (audio, document, file, fileSearch, image, text, video)"
```

---

### Task 6: Methods (listSearch) and Node Entry Point

**Files:**
- Create: `nodes/WildbotsGemini/methods/index.ts`
- Create: `nodes/WildbotsGemini/methods/listSearch.ts`
- Create: `nodes/WildbotsGemini/actions/router.ts`
- Create: `nodes/WildbotsGemini/actions/versionDescription.ts`
- Create: `nodes/WildbotsGemini/WildbotsGemini.node.ts`
- Create: `nodes/WildbotsGemini/WildbotsGemini.node.json`
- Create: `nodes/WildbotsGemini/gemini.svg`

- [ ] **Step 1: Create listSearch methods**

`methods/index.ts`:
```typescript
export * as listSearch from './listSearch';
```

`methods/listSearch.ts` — copy from original, all 6 search functions: `modelSearch`, `audioModelSearch`, `imageGenerationModelSearch`, `imageEditModelSearch`, `videoGenerationModelSearch`, and the base `baseModelSearch`. Import `apiRequest` from `'../transport'`.

- [ ] **Step 2: Create router.ts**

Copy from original, change type import:

```typescript
import { NodeOperationError, type IExecuteFunctions, type INodeExecutionData } from 'n8n-workflow';

import * as audio from './audio';
import * as document from './document';
import * as file from './file';
import * as fileSearch from './fileSearch';
import * as image from './image';
import type { WildbotsGeminiType } from './node.type';
import * as text from './text';
import * as video from './video';

export async function router(this: IExecuteFunctions) {
	const returnData: INodeExecutionData[] = [];

	const items = this.getInputData();
	const resource = this.getNodeParameter('resource', 0);
	const operation = this.getNodeParameter('operation', 0);

	const nodeTypeData = {
		resource,
		operation,
	} as WildbotsGeminiType;

	let execute;
	switch (nodeTypeData.resource) {
		case 'audio':
			execute = audio[nodeTypeData.operation].execute;
			break;
		case 'document':
			execute = document[nodeTypeData.operation].execute;
			break;
		case 'file':
			execute = file[nodeTypeData.operation].execute;
			break;
		case 'fileSearch':
			execute = fileSearch[nodeTypeData.operation].execute;
			break;
		case 'image':
			execute = image[nodeTypeData.operation].execute;
			break;
		case 'text':
			execute = text[nodeTypeData.operation].execute;
			break;
		case 'video':
			execute = video[nodeTypeData.operation].execute;
			break;
		default:
			throw new NodeOperationError(
				this.getNode(),
				`The operation "${operation}" is not supported!`,
			);
	}

	for (let i = 0; i < items.length; i++) {
		try {
			const responseData = await execute.call(this, i);
			returnData.push(...responseData);
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
				continue;
			}

			throw new NodeOperationError(this.getNode(), error, {
				itemIndex: i,
				description: error.description,
			});
		}
	}

	return [returnData];
}
```

- [ ] **Step 3: Create versionDescription.ts**

Key changes from original:
- `displayName`: `'Wildbots Gemini'`
- `name`: `'wildbotsGemini'`
- Credential name: `'wildbotsGeminiApi'`
- Documentation URL: points to GitHub repo
- Codex categories stay the same

```typescript
import { NodeConnectionTypes, type INodeTypeDescription } from 'n8n-workflow';

import * as audio from './audio';
import * as document from './document';
import * as file from './file';
import * as fileSearch from './fileSearch';
import * as image from './image';
import * as text from './text';
import * as video from './video';

export const versionDescription: INodeTypeDescription = {
	displayName: 'Wildbots Gemini',
	name: 'wildbotsGemini',
	icon: 'file:gemini.svg',
	group: ['transform'],
	version: [1, 1.1],
	defaultVersion: 1.1,
	subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
	description: 'Google Gemini AI via Cloudflare proxy — works in any region',
	defaults: {
		name: 'Wildbots Gemini',
	},
	usableAsTool: true,
	codex: {
		alias: ['gemini', 'google', 'ai', 'video', 'document', 'audio', 'transcribe', 'proxy'],
		categories: ['AI'],
		subcategories: {
			AI: ['Agents', 'Miscellaneous', 'Root Nodes'],
		},
		resources: {
			primaryDocumentation: [
				{
					url: 'https://github.com/Aimagine-life/n8n-nodes-wildbots-gemini',
				},
			],
		},
	},
	inputs: `={{
		(() => {
			const resource = $parameter.resource;
			const operation = $parameter.operation;
			if (resource === 'text' && operation === 'message') {
				return [{ type: 'main' }, { type: 'ai_tool', displayName: 'Tools' }];
			}

			return ['main'];
		})()
	}}`,
	outputs: [NodeConnectionTypes.Main],
	credentials: [
		{
			name: 'wildbotsGeminiApi',
			required: true,
		},
	],
	properties: [
		{
			displayName: 'Resource',
			name: 'resource',
			type: 'options',
			noDataExpression: true,
			options: [
				{ name: 'Audio', value: 'audio' },
				{ name: 'Document', value: 'document' },
				{ name: 'File Search', value: 'fileSearch' },
				{ name: 'Image', value: 'image' },
				{ name: 'Media File', value: 'file' },
				{ name: 'Text', value: 'text' },
				{ name: 'Video', value: 'video' },
			],
			default: 'text',
		},
		...audio.description,
		...document.description,
		...file.description,
		...fileSearch.description,
		...image.description,
		...text.description,
		...video.description,
	],
};
```

- [ ] **Step 4: Create WildbotsGemini.node.ts**

```typescript
import type { IExecuteFunctions, INodeType } from 'n8n-workflow';

import { router } from './actions/router';
import { versionDescription } from './actions/versionDescription';
import { listSearch } from './methods';

export class WildbotsGemini implements INodeType {
	description = versionDescription;

	methods = {
		listSearch,
	};

	async execute(this: IExecuteFunctions) {
		return await router.call(this);
	}
}
```

- [ ] **Step 5: Create WildbotsGemini.node.json**

```json
{
	"node": "n8n-nodes-wildbots-gemini.wildbotsGemini",
	"nodeVersion": "1.0",
	"codexVersion": "1.0",
	"categories": ["AI"],
	"resources": {
		"primaryDocumentation": [
			{
				"url": "https://github.com/Aimagine-life/n8n-nodes-wildbots-gemini"
			}
		]
	}
}
```

- [ ] **Step 6: Create gemini.svg**

Download the Gemini icon SVG from the n8n repo or create a simple one. The original uses the Google Gemini sparkle icon.

- [ ] **Step 7: Commit**

```bash
git add nodes/WildbotsGemini/
git commit -m "feat: add WildbotsGemini main node with all resources and operations"
```

---

### Task 7: Chat Model Sub-Node

**Files:**
- Create: `nodes/WildbotsGeminiChatModel/WildbotsGeminiChatModel.node.ts`
- Create: `nodes/WildbotsGeminiChatModel/google.svg`

- [ ] **Step 1: Create WildbotsGeminiChatModel.node.ts**

Forked from `LmChatGoogleGemini`. Key changes:
- `name`: `'lmChatWildbotsGemini'`
- `displayName`: `'Wildbots Gemini Chat Model'`
- Credential: `'wildbotsGeminiApi'`
- `requestDefaults.baseURL`: `'={{ $credentials.host }}'`
- Documentation URL: GitHub repo

The `getAdditionalOptions` import from `'../gemini-common/additional-options'` is a monorepo-internal import. We need to inline the options definition. This provides temperature, topK, topP, maxOutputTokens, and safetySettings options.

The `getConnectionHintNoticeField`, `N8nLlmTracing`, and `makeN8nLlmFailedAttemptHandler` are from `@n8n/ai-utilities` — this is available as an npm package.

```typescript
import type { SafetySetting } from '@google/generative-ai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { NodeConnectionTypes } from 'n8n-workflow';
import type {
	NodeError,
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';

function errorDescriptionMapper(error: NodeError) {
	if (error.description?.includes('properties: should be non-empty for OBJECT type')) {
		return 'Google Gemini requires at least one dynamic parameter when using tools';
	}
	return error.description ?? 'Unknown error';
}

export class WildbotsGeminiChatModel implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wildbots Gemini Chat Model',
		name: 'lmChatWildbotsGemini',
		icon: 'file:google.svg',
		group: ['transform'],
		version: 1,
		description: 'Google Gemini Chat Model via Cloudflare proxy — works in any region',
		defaults: {
			name: 'Wildbots Gemini Chat Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://github.com/Aimagine-life/n8n-nodes-wildbots-gemini',
					},
				],
			},
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiLanguageModel],
		outputNames: ['Model'],
		credentials: [
			{
				name: 'wildbotsGeminiApi',
				required: true,
			},
		],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL: '={{ $credentials.host }}',
		},
		properties: [
			{
				displayName: 'Model',
				name: 'modelName',
				type: 'options',
				description:
					'The model which will generate the completion. <a href="https://developers.generativeai.google/api/rest/generativelanguage/models/list">Learn more</a>.',
				typeOptions: {
					loadOptions: {
						routing: {
							request: {
								method: 'GET',
								url: '/v1beta/models',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'models',
										},
									},
									{
										type: 'filter',
										properties: {
											pass: "={{ !$responseItem.name.includes('embedding') }}",
										},
									},
									{
										type: 'setKeyValue',
										properties: {
											name: '={{$responseItem.name}}',
											value: '={{$responseItem.name}}',
											description: '={{$responseItem.description}}',
										},
									},
									{
										type: 'sort',
										properties: {
											key: 'name',
										},
									},
								],
							},
						},
					},
				},
				routing: {
					send: {
						type: 'body',
						property: 'model',
					},
				},
				default: 'models/gemini-2.5-flash',
			},
			{
				displayName: 'Options',
				name: 'options',
				placeholder: 'Add Option',
				description: 'Additional options to configure the model',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: 'Maximum Output Tokens',
						name: 'maxOutputTokens',
						default: 1024,
						description: 'The maximum number of tokens to generate in the completion',
						type: 'number',
					},
					{
						displayName: 'Sampling Temperature',
						name: 'temperature',
						default: 0.7,
						description:
							'Controls randomness. Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic.',
						type: 'number',
						typeOptions: {
							maxValue: 2,
							minValue: 0,
							numberPrecision: 1,
						},
					},
					{
						displayName: 'Top K',
						name: 'topK',
						default: 40,
						description: 'The maximum number of tokens to consider when sampling',
						type: 'number',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						default: 0.9,
						description:
							'The maximum cumulative probability of tokens to consider when sampling',
						type: 'number',
						typeOptions: {
							maxValue: 1,
							minValue: 0,
							numberPrecision: 1,
						},
					},
					{
						displayName: 'Safety Settings',
						name: 'safetySettings',
						type: 'fixedCollection',
						default: { values: [] },
						typeOptions: {
							multipleValues: true,
						},
						options: [
							{
								displayName: 'Values',
								name: 'values',
								values: [
									{
										displayName: 'Category',
										name: 'category',
										type: 'options',
										default: 'HARM_CATEGORY_HATE_SPEECH',
										options: [
											{
												name: 'Dangerous Content',
												value: 'HARM_CATEGORY_DANGEROUS_CONTENT',
											},
											{
												name: 'Harassment',
												value: 'HARM_CATEGORY_HARASSMENT',
											},
											{
												name: 'Hate Speech',
												value: 'HARM_CATEGORY_HATE_SPEECH',
											},
											{
												name: 'Sexually Explicit',
												value: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
											},
										],
									},
									{
										displayName: 'Threshold',
										name: 'threshold',
										type: 'options',
										default: 'BLOCK_LOW_AND_ABOVE',
										options: [
											{
												name: 'Block Low and Above',
												value: 'BLOCK_LOW_AND_ABOVE',
											},
											{
												name: 'Block Medium and Above',
												value: 'BLOCK_MEDIUM_AND_ABOVE',
											},
											{
												name: 'Block Only High',
												value: 'BLOCK_ONLY_HIGH',
											},
											{
												name: 'Block None',
												value: 'BLOCK_NONE',
											},
										],
									},
								],
							},
						],
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('wildbotsGeminiApi');

		const modelName = this.getNodeParameter('modelName', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {
			maxOutputTokens: 1024,
			temperature: 0.7,
			topK: 40,
			topP: 0.9,
		}) as {
			maxOutputTokens: number;
			temperature: number;
			topK: number;
			topP: number;
		};

		const safetySettings = this.getNodeParameter(
			'options.safetySettings.values',
			itemIndex,
			null,
		) as SafetySetting[];

		const model = new ChatGoogleGenerativeAI({
			apiKey: credentials.apiKey as string,
			baseUrl: credentials.host as string,
			model: modelName,
			topK: options.topK,
			topP: options.topP,
			temperature: options.temperature,
			maxOutputTokens: options.maxOutputTokens,
			safetySettings,
		});

		return {
			response: model,
		};
	}
}
```

Note: We removed the `N8nLlmTracing` and `makeN8nLlmFailedAttemptHandler` callbacks since `@n8n/ai-utilities` may not be available as a public npm package for community nodes. The model will still work correctly — tracing is an optional enhancement. If `@n8n/ai-utilities` is available, we can add it back later.

- [ ] **Step 2: Create google.svg**

Use the Gemini sparkle SVG icon.

- [ ] **Step 3: Commit**

```bash
git add nodes/WildbotsGeminiChatModel/
git commit -m "feat: add WildbotsGeminiChatModel sub-node for AI Agent workflows"
```

---

### Task 8: Cloudflare Worker

**Files:**
- Create: `worker/index.ts`
- Create: `worker/wrangler.toml`

- [ ] **Step 1: Create worker/index.ts**

```typescript
const GOOGLE_API_HOST = 'https://generativelanguage.googleapis.com';

export default {
	async fetch(request: Request): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
					'Access-Control-Allow-Headers': '*',
					'Access-Control-Max-Age': '86400',
				},
			});
		}

		const url = new URL(request.url);
		const targetUrl = `${GOOGLE_API_HOST}${url.pathname}${url.search}`;

		const headers = new Headers(request.headers);
		headers.delete('host');

		const response = await fetch(targetUrl, {
			method: request.method,
			headers,
			body: request.body,
		});

		const responseHeaders = new Headers(response.headers);
		responseHeaders.set('Access-Control-Allow-Origin', '*');

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders,
		});
	},
};
```

- [ ] **Step 2: Create worker/wrangler.toml**

```toml
name = "gemini-proxy"
main = "index.ts"
compatibility_date = "2024-12-01"

[observability]
enabled = true
```

- [ ] **Step 3: Commit**

```bash
git add worker/
git commit -m "feat: add Cloudflare Worker proxy for Gemini API"
```

---

### Task 9: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create marketing-grade README**

The README should be visually appealing with:
- Hero section with badges
- Problem statement (regional restrictions)
- Solution overview
- Feature list (all 15 actions + Chat Model)
- Quick start guide
- "Deploy Your Own Worker" section (anchor: `#deploy-your-own-worker`)
- Configuration details
- License

Language: English with key marketing points.

The "Deploy Your Own Worker" section should include step-by-step instructions:
1. Create a Cloudflare account (free)
2. Install Wrangler CLI: `npm install -g wrangler`
3. Clone the repo or copy `worker/` directory
4. Run `wrangler login`
5. Run `wrangler deploy`
6. Copy the Worker URL and paste it into the n8n credential "Host" field

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add marketing-grade README with deploy instructions"
```

---

### Task 10: Build, Test Locally, and Publish

- [ ] **Step 1: Install dependencies**

```bash
npm install
```

- [ ] **Step 2: Build the project**

```bash
npm run build
```

Fix any TypeScript compilation errors that arise from the port. Common issues:
- Missing type imports from `n8n-workflow`
- `@utils/helpers` alias not resolved — make sure `getConnectedTools` is inlined
- `@google/genai` types — make sure our local interfaces cover everything needed

- [ ] **Step 3: Verify dist/ output**

Check that `dist/` contains all compiled files:
```bash
ls dist/credentials/
ls dist/nodes/WildbotsGemini/
ls dist/nodes/WildbotsGeminiChatModel/
```

- [ ] **Step 4: Create GitHub repo and push**

```bash
gh repo create Aimagine-life/n8n-nodes-wildbots-gemini --public --source=. --push
```

- [ ] **Step 5: Publish to npm**

```bash
npm login
npm publish
```

- [ ] **Step 6: Tag the release**

```bash
git tag 0.1.0
git push origin 0.1.0
```

- [ ] **Step 7: Verify on npm**

Check `https://www.npmjs.com/package/n8n-nodes-wildbots-gemini` shows the package with the README rendered correctly and the `#deploy-your-own-worker` anchor works.
