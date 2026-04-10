import type {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';

export class LmChatWildbotsGemini implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wildbots Gemini Chat Model',
		name: 'lmChatWildbotsGemini',
		icon: 'file:wildbots.png',
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
		outputs: ['ai_languageModel'],
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
					{
						displayName: 'Sampling Temperature',
						name: 'temperature',
						default: 0.7,
						description:
							'Controls randomness. Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic',
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
						description: 'The maximum cumulative probability of tokens to consider when sampling',
						type: 'number',
						typeOptions: {
							maxValue: 1,
							minValue: 0,
							numberPrecision: 1,
						},
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		// Lazy-load to avoid top-level require that breaks n8n community node loading
		const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');

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
		);

		const modelConfig: Record<string, unknown> = {
			apiKey: credentials.apiKey as string,
			baseUrl: credentials.host as string,
			model: modelName,
			topK: options.topK,
			topP: options.topP,
			temperature: options.temperature,
			maxOutputTokens: options.maxOutputTokens,
		};

		if (safetySettings) {
			modelConfig.safetySettings = safetySettings;
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const model = new ChatGoogleGenerativeAI(modelConfig as any);

		return {
			response: model,
		};
	}
}
