import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';

import type { VeoResponse } from '../../helpers/interfaces';
import { apiRequest } from '../../transport';
import { modelRLC } from '../descriptions';

const POLL_INTERVAL = 5000;

const properties: INodeProperties[] = [
	modelRLC('videoGenerationModelSearch'),
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. A cinematic drone shot over mountains at sunset',
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
				displayName: 'Aspect Ratio',
				name: 'aspectRatio',
				type: 'options',
				default: '16:9',
				options: [
					{ name: '16:9', value: '16:9' },
					{ name: '9:16', value: '9:16' },
				],
			},
			{
				displayName: 'Duration (Seconds)',
				name: 'duration',
				type: 'options',
				default: '5',
				options: [
					{ name: '5 Seconds', value: '5' },
					{ name: '8 Seconds', value: '8' },
				],
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['generate'],
		resource: ['video'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const model = this.getNodeParameter('modelId', i, '', { extractValue: true }) as string;
	const prompt = this.getNodeParameter('prompt', i) as string;
	const options = this.getNodeParameter('options', i, {}) as IDataObject;

	const body: IDataObject = {
		instances: [{ prompt }],
		parameters: {},
	};

	if (options.aspectRatio) {
		(body.parameters as IDataObject).aspectRatio = options.aspectRatio;
	}
	if (options.duration) {
		(body.parameters as IDataObject).durationSeconds = parseInt(options.duration as string, 10);
	}

	// Start video generation (long-running operation)
	let operation = (await apiRequest.call(this, 'POST', `/v1beta/${model}:predict`, {
		body,
	})) as VeoResponse;

	// Poll until done
	while (!operation.done) {
		await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
		operation = (await apiRequest.call(this, 'GET', `/v1beta/${operation.name}`)) as VeoResponse;
	}

	if (operation.error) {
		throw new Error(operation.error.message);
	}

	const samples = operation.response?.generateVideoResponse?.generatedSamples || [];

	return samples.map((sample) => ({
		json: {
			videoUri: sample.video.uri,
			model,
		},
		pairedItem: { item: i },
	}));
}
