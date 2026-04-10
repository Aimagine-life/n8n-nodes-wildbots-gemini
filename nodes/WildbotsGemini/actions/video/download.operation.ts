import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';

import { downloadFile } from '../../helpers/utils';

const properties: INodeProperties[] = [
	{
		displayName: 'Video URL',
		name: 'videoUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. https://generativelanguage.googleapis.com/...',
		description: 'URL of the generated video to download (from the Generate Video operation)',
	},
];

const displayOptions = {
	show: {
		operation: ['download'],
		resource: ['video'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const videoUrl = this.getNodeParameter('videoUrl', i) as string;

	const { fileContent, mimeType } = await downloadFile.call(this, videoUrl, 'video/mp4');

	const binaryData = await this.helpers.prepareBinaryData(
		fileContent,
		'video.mp4',
		mimeType,
	);

	return [
		{
			json: { url: videoUrl },
			binary: { data: binaryData },
			pairedItem: { item: i },
		},
	];
}
