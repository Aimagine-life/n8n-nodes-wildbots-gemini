import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';

import { uploadToFileSearchStore } from '../../helpers/utils';

const properties: INodeProperties[] = [
	{
		displayName: 'Store Name',
		name: 'storeName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. fileSearchStores/abc123',
		description: 'The resource name of the File Search store',
	},
	{
		displayName: 'File Display Name',
		name: 'fileDisplayName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. quarterly-report.pdf',
		description: 'Display name for the uploaded file',
	},
	{
		displayName: 'Input Type',
		name: 'inputType',
		type: 'options',
		default: 'url',
		options: [
			{
				name: 'File URL',
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
		name: 'fileUrl',
		type: 'string',
		placeholder: 'e.g. https://example.com/document.pdf',
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
];

const displayOptions = {
	show: {
		operation: ['uploadToStore'],
		resource: ['fileSearch'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const storeName = this.getNodeParameter('storeName', i) as string;
	const fileDisplayName = this.getNodeParameter('fileDisplayName', i) as string;
	const inputType = this.getNodeParameter('inputType', i) as string;
	const downloadUrl = inputType === 'url' ? (this.getNodeParameter('fileUrl', i) as string) : undefined;

	const response = await uploadToFileSearchStore.call(
		this,
		i,
		storeName,
		fileDisplayName,
		downloadUrl,
	);

	return [
		{
			json: response || {},
			pairedItem: { item: i },
		},
	];
}
