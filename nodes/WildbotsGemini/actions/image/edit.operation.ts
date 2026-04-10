import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';

import type { Content, GenerateContentResponse } from '../../helpers/interfaces';
import { Modality } from '../../helpers/interfaces';
import { downloadFile, uploadFile } from '../../helpers/utils';
import { apiRequest } from '../../transport';
import { modelRLC } from '../descriptions';

const properties: INodeProperties[] = [
	modelRLC('imageEditModelSearch'),
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. Remove the background and make it transparent',
		typeOptions: {
			rows: 3,
		},
	},
	{
		displayName: 'Input Type',
		name: 'inputType',
		type: 'options',
		default: 'url',
		options: [
			{
				name: 'Image URL(s)',
				value: 'url',
			},
			{
				name: 'Binary File(s)',
				value: 'binary',
			},
		],
	},
	{
		displayName: 'URL(s)',
		name: 'imageUrls',
		type: 'string',
		placeholder: 'e.g. https://example.com/image.png',
		description: 'URL(s) of the image(s) to edit, separate multiple with commas',
		default: '',
		displayOptions: {
			show: {
				inputType: ['url'],
			},
		},
	},
	{
		displayName: 'Input Data Field Name(s)',
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
];

const displayOptions = {
	show: {
		operation: ['edit'],
		resource: ['image'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const model = this.getNodeParameter('modelId', i, '', { extractValue: true }) as string;
	const prompt = this.getNodeParameter('prompt', i) as string;
	const inputType = this.getNodeParameter('inputType', i) as string;

	const parts: Array<IDataObject> = [];

	if (inputType === 'url') {
		const urls = (this.getNodeParameter('imageUrls', i, '') as string)
			.split(',')
			.map((u) => u.trim())
			.filter((u) => u);

		for (const url of urls) {
			const { fileContent, mimeType } = await downloadFile.call(this, url, 'image/png');
			const fileData = await uploadFile.call(this, fileContent, mimeType);
			parts.push({ fileData });
		}
	} else {
		const binaryPropertyNames = (this.getNodeParameter('binaryPropertyName', i, 'data') as string)
			.split(',')
			.map((n) => n.trim())
			.filter((n) => n);

		for (const binaryPropertyName of binaryPropertyNames) {
			const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
			const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
			const fileData = await uploadFile.call(this, buffer, binaryData.mimeType);
			parts.push({ fileData });
		}
	}

	parts.push({ text: prompt });

	const contents: Content[] = [
		{
			role: 'user',
			parts: parts as Content['parts'],
		},
	];

	const body = {
		contents,
		generationConfig: {
			responseModalities: [Modality.TEXT, Modality.IMAGE],
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
					'edited-image.png',
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
}
