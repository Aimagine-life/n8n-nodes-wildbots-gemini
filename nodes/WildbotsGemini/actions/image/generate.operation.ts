import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';

import type { GenerateContentResponse, ImagenResponse } from '../../helpers/interfaces';
import { Modality } from '../../helpers/interfaces';
import { apiRequest } from '../../transport';
import { modelRLC } from '../descriptions';

const properties: INodeProperties[] = [
	modelRLC('imageGenerationModelSearch'),
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. A photo of a cat wearing a hat',
		typeOptions: {
			rows: 3,
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		placeholder: 'Add Option',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: 'Number of Images',
				name: 'numberOfImages',
				type: 'number',
				default: 1,
				typeOptions: {
					minValue: 1,
					maxValue: 4,
				},
			},
			{
				displayName: 'Aspect Ratio',
				name: 'aspectRatio',
				type: 'options',
				default: '1:1',
				options: [
					{ name: '1:1', value: '1:1' },
					{ name: '16:9', value: '16:9' },
					{ name: '3:4', value: '3:4' },
					{ name: '4:3', value: '4:3' },
					{ name: '9:16', value: '9:16' },
				],
			},
			{
				displayName: 'Negative Prompt',
				name: 'negativePrompt',
				type: 'string',
				default: '',
				description: 'A description of what to exclude from the image',
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['generate'],
		resource: ['image'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const model = this.getNodeParameter('modelId', i, '', { extractValue: true }) as string;
	const prompt = this.getNodeParameter('prompt', i) as string;
	const options = this.getNodeParameter('options', i, {}) as IDataObject;

	const isGeminiNative = model.includes('gemini');

	if (isGeminiNative) {
		const body = {
			contents: [
				{
					role: 'user',
					parts: [{ text: prompt }],
				},
			],
			generationConfig: {
				responseModalities: [Modality.TEXT, Modality.IMAGE],
				candidateCount: (options.numberOfImages as number) || 1,
			},
		};

		const response = (await apiRequest.call(this, 'POST', `/v1beta/${model}:generateContent`, {
			body,
		})) as GenerateContentResponse;

		const returnData: INodeExecutionData[] = [];

		for (const candidate of response.candidates) {
			for (const part of candidate.content.parts) {
				if ('inlineData' in part) {
					const binaryData = await this.helpers.prepareBinaryData(
						Buffer.from(part.inlineData.data, 'base64'),
						'generated-image.png',
						part.inlineData.mimeType,
					);
					returnData.push({
						json: { model },
						binary: { data: binaryData },
						pairedItem: { item: i },
					});
				}
			}
		}

		return returnData;
	} else {
		const body: IDataObject = {
			instances: [{ prompt }],
			parameters: {
				sampleCount: (options.numberOfImages as number) || 1,
				aspectRatio: (options.aspectRatio as string) || '1:1',
			},
		};

		if (options.negativePrompt) {
			(body.parameters as IDataObject).negativePrompt = options.negativePrompt;
		}

		const response = (await apiRequest.call(this, 'POST', `/v1beta/${model}:predict`, {
			body,
		})) as ImagenResponse;

		const returnData: INodeExecutionData[] = [];

		for (const prediction of response.predictions) {
			const binaryData = await this.helpers.prepareBinaryData(
				Buffer.from(prediction.bytesBase64Encoded, 'base64'),
				'generated-image.png',
				prediction.mimeType,
			);
			returnData.push({
				json: { model },
				binary: { data: binaryData },
				pairedItem: { item: i },
			});
		}

		return returnData;
	}
}
