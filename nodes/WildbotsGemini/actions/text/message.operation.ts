import {
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeProperties,
	jsonParse,
	updateDisplayOptions,
} from 'n8n-workflow';
// zod-to-json-schema is lazy-loaded in execute() to avoid top-level require issues

import type {
	GenerateContentResponse,
	Content,
	Tool,
	GenerateContentGenerationConfig,
	BuiltInTools,
} from '../../helpers/interfaces';
import { apiRequest } from '../../transport';
import { modelRLC } from '../descriptions';

const properties: INodeProperties[] = [
	modelRLC('modelSearch'),
	{
		displayName: 'Messages',
		name: 'messages',
		type: 'fixedCollection',
		typeOptions: {
			sortable: true,
			multipleValues: true,
		},
		placeholder: 'Add Message',
		default: { values: [{ content: '' }] },
		options: [
			{
				displayName: 'Values',
				name: 'values',
				values: [
					{
						displayName: 'Prompt',
						name: 'content',
						type: 'string',
						description: 'The content of the message to be send',
						default: '',
						placeholder: 'e.g. Hello, how can you help me?',
						typeOptions: {
							rows: 2,
						},
					},
					{
						displayName: 'Role',
						name: 'role',
						type: 'options',
						description:
							"Role in shaping the model's response, it tells the model how it should behave and interact with the user",
						options: [
							{
								name: 'User',
								value: 'user',
								description: 'Send a message as a user and get a response from the model',
							},
							{
								name: 'Model',
								value: 'model',
								description: 'Tell the model to adopt a specific tone or personality',
							},
						],
						default: 'user',
					},
				],
			},
		],
	},
	{
		displayName: 'Simplify Output',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of the raw data',
	},
	{
		displayName: 'Output Content as JSON',
		name: 'jsonOutput',
		type: 'boolean',
		description: 'Whether to attempt to return the response in JSON format',
		default: false,
	},
	{
		displayName: 'Built-in Tools',
		name: 'builtInTools',
		placeholder: 'Add Built-in Tool',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: 'Code Execution',
				name: 'codeExecution',
				type: 'boolean',
				default: true,
				description: 'Whether to allow the model to execute code it generates to produce a response',
			},
			{
				displayName: 'File Search',
				name: 'fileSearch',
				type: 'collection',
				default: { fileSearchStoreNames: '[]' },
				options: [
					{
						displayName: 'File Search Store Names',
						name: 'fileSearchStoreNames',
						description: 'The file search store names to use for the file search',
						type: 'json',
						default: '[]',
					},
					{
						displayName: 'Metadata Filter',
						name: 'metadataFilter',
						type: 'string',
						default: '',
						description: 'Use metadata filter to search within a subset of documents',
						placeholder: 'e.g. author="John Doe"',
					},
				],
			},
			{
				displayName: 'Google Maps',
				name: 'googleMaps',
				type: 'collection',
				default: { latitude: '', longitude: '' },
				options: [
					{
						displayName: 'Latitude',
						name: 'latitude',
						type: 'number',
						default: '',
						description: 'The latitude coordinate for location-based queries',
						typeOptions: {
							numberPrecision: 6,
						},
					},
					{
						displayName: 'Longitude',
						name: 'longitude',
						type: 'number',
						default: '',
						description: 'The longitude coordinate for location-based queries',
						typeOptions: {
							numberPrecision: 6,
						},
					},
				],
			},
			{
				displayName: 'Google Search',
				name: 'googleSearch',
				type: 'boolean',
				default: true,
				description:
					'Whether to allow the model to search the web using Google Search to get real-time information',
			},
			{
				displayName: 'URL Context',
				name: 'urlContext',
				type: 'boolean',
				default: true,
				description: 'Whether to allow the model to read and analyze content from specific URLs',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		placeholder: 'Add Option',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: 'Frequency Penalty',
				name: 'frequencyPenalty',
				default: 0,
				description: 'Positive values penalize new tokens based on their existing frequency',
				type: 'number',
				typeOptions: {
					minValue: -2,
					maxValue: 2,
					numberPrecision: 1,
				},
			},
			{
				displayName: 'Include Merged Response',
				name: 'includeMergedResponse',
				type: 'boolean',
				default: false,
				description:
					'Whether to include a single output string merging all text parts of the response',
			},
			{
				displayName: 'Max Tool Call Iterations',
				name: 'maxIterations',
				type: 'number',
				default: 15,
				description: 'Maximum number of tool call iterations before stopping',
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
			},
			{
				displayName: 'Maximum Number of Tokens',
				name: 'maxOutputTokens',
				default: 16,
				description: 'The maximum number of tokens to generate in the completion',
				type: 'number',
				typeOptions: {
					minValue: 1,
					numberPrecision: 0,
				},
			},
			{
				displayName: 'Number of Completions',
				name: 'candidateCount',
				default: 1,
				description: 'How many completions to generate for each prompt',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 8,
					numberPrecision: 0,
				},
			},
			{
				displayName: 'Output Randomness (Temperature)',
				name: 'temperature',
				default: 1,
				description: 'Controls the randomness of the output',
				type: 'number',
				typeOptions: {
					minValue: 0,
					maxValue: 2,
					numberPrecision: 1,
				},
			},
			{
				displayName: 'Output Randomness (Top K)',
				name: 'topK',
				default: 1,
				description: 'The maximum number of tokens to consider when sampling',
				type: 'number',
				typeOptions: {
					minValue: 0,
					numberPrecision: 0,
				},
			},
			{
				displayName: 'Output Randomness (Top P)',
				name: 'topP',
				default: 1,
				description: 'The maximum cumulative probability of tokens to consider when sampling',
				type: 'number',
				typeOptions: {
					minValue: 0,
					maxValue: 1,
					numberPrecision: 1,
				},
			},
			{
				displayName: 'Presence Penalty',
				name: 'presencePenalty',
				default: 0,
				description: 'Positive values penalize new tokens based on whether they appear in the text so far',
				type: 'number',
				typeOptions: {
					minValue: -2,
					maxValue: 2,
					numberPrecision: 1,
				},
			},
			{
				displayName: 'System Message',
				name: 'systemMessage',
				type: 'string',
				default: '',
				placeholder: 'e.g. You are a helpful assistant',
			},
			{
				displayName: 'Thinking Budget',
				name: 'thinkingBudget',
				type: 'number',
				default: 0,
				description: 'Token budget for model thinking (0 = disabled). Only supported by some models.',
				typeOptions: {
					minValue: 0,
				},
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['message'],
		resource: ['text'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const model = this.getNodeParameter('modelId', i, '', { extractValue: true }) as string;
	const messages = this.getNodeParameter('messages.values', i, []) as Array<{
		content: string;
		role: string;
	}>;
	const simplify = this.getNodeParameter('simplify', i, true) as boolean;
	const jsonOutput = this.getNodeParameter('jsonOutput', i, false) as boolean;
	const options = this.getNodeParameter('options', i, {}) as IDataObject;

	const contents: Content[] = messages.map((msg) => ({
		role: msg.role,
		parts: [{ text: msg.content }],
	}));

	const generationConfig: GenerateContentGenerationConfig = {};

	if (options.maxOutputTokens) {
		generationConfig.maxOutputTokens = options.maxOutputTokens as number;
	}
	if (options.temperature !== undefined) {
		generationConfig.temperature = options.temperature as number;
	}
	if (options.topP !== undefined) {
		generationConfig.topP = options.topP as number;
	}
	if (options.topK !== undefined) {
		generationConfig.topK = options.topK as number;
	}
	if (options.candidateCount) {
		generationConfig.candidateCount = options.candidateCount as number;
	}
	if (options.presencePenalty !== undefined) {
		generationConfig.presencePenalty = options.presencePenalty as number;
	}
	if (options.frequencyPenalty !== undefined) {
		generationConfig.frequencyPenalty = options.frequencyPenalty as number;
	}

	if (jsonOutput) {
		generationConfig.responseMimeType = 'application/json';
	}

	if (options.thinkingBudget && (options.thinkingBudget as number) > 0) {
		generationConfig.thinkingConfig = {
			thinkingBudget: options.thinkingBudget as number,
		};
	}

	const body: IDataObject = {
		contents,
		generationConfig,
	};

	if (options.systemMessage) {
		body.systemInstruction = {
			parts: [{ text: options.systemMessage as string }],
		};
	}

	// Built-in tools (v1.1)
	const builtInTools = this.getNodeParameter('builtInTools', i, {}) as BuiltInTools;
	const tools: Tool[] = [];

	if (builtInTools.googleSearch) {
		tools.push({ googleSearch: {} });
	}
	if (builtInTools.googleMaps && (builtInTools.googleMaps.latitude || builtInTools.googleMaps.longitude)) {
		tools.push({
			googleMaps: {
				latitude: builtInTools.googleMaps.latitude,
				longitude: builtInTools.googleMaps.longitude,
			},
		});
	}
	if (builtInTools.urlContext) {
		tools.push({ urlContext: {} });
	}
	if (builtInTools.fileSearch) {
		const storeNames = jsonParse<string[]>(builtInTools.fileSearch.fileSearchStoreNames || '[]');
		if (storeNames.length > 0) {
			const fileSearchTool: Tool = {
				fileSearch: {
					fileSearchStoreNames: storeNames,
				},
			};
			if (builtInTools.fileSearch.metadataFilter) {
				fileSearchTool.fileSearch!.metadataFilter = builtInTools.fileSearch.metadataFilter;
			}
			tools.push(fileSearchTool);
		}
	}
	if (builtInTools.codeExecution || options.codeExecution) {
		tools.push({ codeExecution: {} });
	}

	// Connected AI tools (function calling)
	let connectedTools: Array<{
		name: string;
		description: string;
		schema?: { parse: (args: unknown) => unknown };
		invoke: (args: unknown) => Promise<unknown>;
	}> = [];

	try {
		const toolsInput = await this.getInputConnectionData(
			'ai_tool',
			0,
		);
		if (Array.isArray(toolsInput)) {
			connectedTools = toolsInput;
		}
	} catch {
		// No tools connected — that's fine
	}

	if (connectedTools.length > 0) {
		const { default: zodToJsonSchema } = await import('zod-to-json-schema');
		const functionDeclarations = connectedTools.map((tool) => {
			const schema = tool.schema
				? zodToJsonSchema(tool.schema as Parameters<typeof zodToJsonSchema>[0])
				: { type: 'object', properties: {} };
			return {
				name: tool.name,
				description: tool.description,
				parameters: schema as IDataObject,
			};
		});
		tools.push({ functionDeclarations });
	}

	if (tools.length > 0) {
		body.tools = tools;
	}

	// Initial API call
	let response = (await apiRequest.call(this, 'POST', `/v1beta/${model}:generateContent`, {
		body,
	})) as GenerateContentResponse;

	// Tool calling loop
	const maxIterations = (options.maxIterations as number) || 15;
	let currentIteration = 0;

	const getToolCalls = (resp: GenerateContentResponse) => {
		if (!resp.candidates?.[0]?.content?.parts) return [];
		return resp.candidates[0].content.parts.filter(
			(part) => 'functionCall' in part,
		);
	};

	let toolCalls = getToolCalls(response);

	while (toolCalls.length > 0 && currentIteration < maxIterations) {
		// Add assistant response to contents
		contents.push(response.candidates[0].content);

		// Execute each tool call
		for (const toolCallPart of toolCalls) {
			if (!('functionCall' in toolCallPart)) continue;
			const functionCall = toolCallPart.functionCall;

			const tool = connectedTools.find((t) => t.name === functionCall.name);
			let toolResponse: IDataObject = {};

			if (tool) {
				try {
					toolResponse = (await tool.invoke(functionCall.args)) as IDataObject;
				} catch (error) {
					toolResponse = { error: (error as Error).message };
				}
			}

			contents.push({
				parts: [
					{
						functionResponse: {
							id: functionCall.id,
							name: functionCall.name,
							response: {
								result: toolResponse,
							},
						},
					},
				],
				role: 'tool',
			});
		}

		response = (await apiRequest.call(this, 'POST', `/v1beta/${model}:generateContent`, {
			body,
		})) as GenerateContentResponse;
		toolCalls = getToolCalls(response);
		currentIteration++;
	}

	const candidates = options.includeMergedResponse
		? response.candidates.map((candidate) => ({
				...candidate,
				mergedResponse: candidate.content.parts
					.filter((part) => 'text' in part)
					.map((part) => (part as { text: string }).text)
					.join(''),
			}))
		: response.candidates;

	if (simplify) {
		return candidates.map((candidate) => ({
			json: candidate,
			pairedItem: { item: i },
		}));
	}

	return [
		{
			json: {
				...response,
				candidates,
			},
			pairedItem: { item: i },
		},
	];
}
