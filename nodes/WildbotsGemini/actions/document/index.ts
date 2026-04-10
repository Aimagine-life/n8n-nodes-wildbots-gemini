import type { INodeProperties } from 'n8n-workflow';

import * as analyze from './analyze.operation';

export { analyze };

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Analyze Document',
				value: 'analyze',
				action: 'Analyze a document',
				description: 'Analyze document content with a text prompt',
			},
		],
		default: 'analyze',
		displayOptions: {
			show: {
				resource: ['document'],
			},
		},
	},
	...analyze.description,
];
