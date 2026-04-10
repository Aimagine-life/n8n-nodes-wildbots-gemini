import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';

import { deleteFileSearchStore } from '../../helpers/utils';

const properties: INodeProperties[] = [
	{
		displayName: 'Store Name',
		name: 'storeName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. fileSearchStores/abc123',
		description: 'The resource name of the File Search store to delete',
	},
	{
		displayName: 'Force Delete',
		name: 'force',
		type: 'boolean',
		default: false,
		description: 'Whether to force delete the store even if it contains files',
	},
];

const displayOptions = {
	show: {
		operation: ['deleteStore'],
		resource: ['fileSearch'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const storeName = this.getNodeParameter('storeName', i) as string;
	const force = this.getNodeParameter('force', i) as boolean;
	const response = await deleteFileSearchStore.call(this, storeName, force);

	return [
		{
			json: response,
			pairedItem: { item: i },
		},
	];
}
