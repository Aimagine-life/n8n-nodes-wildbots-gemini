import type { INodeProperties } from 'n8n-workflow';

import * as analyze from './analyze.operation';
import * as transcribe from './transcribe.operation';

export { analyze, transcribe };

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Analyze Audio',
				value: 'analyze',
				action: 'Analyze audio',
				description: 'Analyze audio content with a text prompt',
			},
			{
				name: 'Transcribe a Recording',
				value: 'transcribe',
				action: 'Transcribe a recording',
				description: 'Transcribe audio to text',
			},
		],
		default: 'analyze',
		displayOptions: {
			show: {
				resource: ['audio'],
			},
		},
	},
	...analyze.description,
	...transcribe.description,
];
