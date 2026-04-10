import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';

import type { Content, GenerateContentResponse } from '../../helpers/interfaces';
import { downloadFile, uploadFile } from '../../helpers/utils';
import { apiRequest } from '../../transport';
import { modelRLC } from '../descriptions';

const properties: INodeProperties[] = [
	modelRLC('audioModelSearch'),
	{
		displayName: 'Input Type',
		name: 'inputType',
		type: 'options',
		default: 'url',
		options: [
			{
				name: 'Audio URL',
				value: 'url',
			},
			{
				name: 'Binary File',
				value: 'binary',
			},
		],
	},
	{
		displayName: 'URL',
		name: 'audioUrl',
		type: 'string',
		placeholder: 'e.g. https://example.com/audio.mp3',
		description: 'URL of the audio file to transcribe',
		default: '',
		displayOptions: {
			show: {
				inputType: ['url'],
			},
		},
	},
	{
		displayName: 'Input Data Field Name',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		placeholder: 'e.g. data',
		hint: 'The name of the input field containing the binary file data to be processed',
		displayOptions: {
			show: {
				inputType: ['binary'],
			},
		},
	},
	{
		displayName: 'Simplify Output',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to simplify the response or not',
	},
	{
		displayName: 'Options',
		name: 'options',
		placeholder: 'Add Option',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: 'Start Time (Seconds)',
				name: 'startTime',
				type: 'number',
				default: 0,
				description: 'Start time in seconds for partial transcription',
			},
			{
				displayName: 'End Time (Seconds)',
				name: 'endTime',
				type: 'number',
				default: 0,
				description: 'End time in seconds for partial transcription',
			},
			{
				displayName: 'Length of Transcription (Max Tokens)',
				name: 'maxOutputTokens',
				type: 'number',
				default: 8192,
				typeOptions: {
					minValue: 1,
				},
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['transcribe'],
		resource: ['audio'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const model = this.getNodeParameter('modelId', i, '', { extractValue: true }) as string;
	const inputType = this.getNodeParameter('inputType', i) as string;
	const simplify = this.getNodeParameter('simplify', i, true) as boolean;
	const options = this.getNodeParameter('options', i, {}) as {
		startTime?: number;
		endTime?: number;
		maxOutputTokens?: number;
	};

	let fileData: { fileUri: string; mimeType: string };

	if (inputType === 'url') {
		const audioUrl = this.getNodeParameter('audioUrl', i) as string;
		const { fileContent, mimeType } = await downloadFile.call(this, audioUrl, 'audio/mpeg');
		fileData = await uploadFile.call(this, fileContent, mimeType);
	} else {
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data') as string;
		const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
		const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
		fileData = await uploadFile.call(this, buffer, binaryData.mimeType);
	}

	let prompt = 'Generate a transcript of the speech.';
	if (options.startTime || options.endTime) {
		prompt += ` Only transcribe from ${options.startTime || 0} seconds to ${options.endTime || 'the end'}.`;
	}

	const contents: Content[] = [
		{
			role: 'user',
			parts: [
				{ fileData },
				{ text: prompt },
			],
		},
	];

	const body = {
		contents,
		generationConfig: {
			maxOutputTokens: options.maxOutputTokens || 8192,
		},
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
