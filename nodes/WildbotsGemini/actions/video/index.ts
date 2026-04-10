import type { INodeProperties } from 'n8n-workflow';

import * as analyze from './analyze.operation';
import * as download from './download.operation';
import * as generate from './generate.operation';

export { analyze, generate, download };

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Analyze Video',
				value: 'analyze',
				action: 'Analyze a video',
				description: 'Analyze video content with a text prompt',
			},
			{
				name: 'Generate a Video',
				value: 'generate',
				action: 'Generate a video',
				description: 'Generate a video from a text prompt using Veo models',
			},
			{
				name: 'Download Video',
				value: 'download',
				action: 'Download a video',
				description: 'Download a generated video from a Gemini URL',
			},
		],
		default: 'analyze',
		displayOptions: {
			show: {
				resource: ['video'],
			},
		},
	},
	...analyze.description,
	...generate.description,
	...download.description,
];
