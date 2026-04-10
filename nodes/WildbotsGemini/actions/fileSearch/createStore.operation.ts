import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';

import { createFileSearchStore } from '../../helpers/utils';

const properties: INodeProperties[] = [
	{
		displayName: 'Store Name',
		name: 'displayName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. My Document Store',
		description: 'Display name for the new File Search store',
	},
];

const displayOptions = {
	show: {
		operation: ['createStore'],
		resource: ['fileSearch'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const displayName = this.getNodeParameter('displayName', i) as string;
	const response = await createFileSearchStore.call(this, displayName);

	return [
		{
			json: response,
			pairedItem: { item: i },
		},
	];
}
