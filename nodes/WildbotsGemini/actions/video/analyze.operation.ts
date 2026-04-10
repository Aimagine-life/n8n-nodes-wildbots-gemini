import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';

import { baseAnalyze } from '../../helpers/baseAnalyze';
import { modelRLC } from '../descriptions';

const properties: INodeProperties[] = [
	modelRLC('modelSearch'),
	{
		displayName: 'Text Input',
		name: 'text',
		type: 'string',
		placeholder: 'e.g. Describe this video',
		default: 'Describe this video',
		typeOptions: {
			rows: 2,
		},
	},
	{
		displayName: 'Input Type',
		name: 'inputType',
		type: 'options',
		default: 'url',
		options: [
			{
				name: 'Video URL(s)',
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
		name: 'videoUrls',
		type: 'string',
		placeholder: 'e.g. https://example.com/video.mp4',
		description: 'URL(s) of the video(s) to analyze, separate multiple with commas',
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
				displayName: 'Length of Description (Max Tokens)',
				description: 'Fewer tokens will result in shorter, less detailed description',
				name: 'maxOutputTokens',
				type: 'number',
				default: 300,
				typeOptions: {
					minValue: 1,
				},
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['analyze'],
		resource: ['video'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	return await baseAnalyze.call(this, i, 'videoUrls', 'video/mp4');
}
