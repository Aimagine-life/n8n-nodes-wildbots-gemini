import { NodeOperationError, type IExecuteFunctions, type INodeExecutionData } from 'n8n-workflow';

import * as audio from './audio';
import * as document from './document';
import * as file from './file';
import * as fileSearch from './fileSearch';
import * as image from './image';
import type { WildbotsGeminiType } from './node.type';
import * as text from './text';
import * as video from './video';

export async function router(this: IExecuteFunctions) {
	const returnData: INodeExecutionData[] = [];

	const items = this.getInputData();
	const resource = this.getNodeParameter('resource', 0);
	const operation = this.getNodeParameter('operation', 0);

	const nodeTypeData = {
		resource,
		operation,
	} as WildbotsGeminiType;

	let execute;
	switch (nodeTypeData.resource) {
		case 'audio':
			execute = audio[nodeTypeData.operation].execute;
			break;
		case 'document':
			execute = document[nodeTypeData.operation].execute;
			break;
		case 'file':
			execute = file[nodeTypeData.operation].execute;
			break;
		case 'fileSearch':
			execute = fileSearch[nodeTypeData.operation].execute;
			break;
		case 'image':
			execute = image[nodeTypeData.operation].execute;
			break;
		case 'text':
			execute = text[nodeTypeData.operation].execute;
			break;
		case 'video':
			execute = video[nodeTypeData.operation].execute;
			break;
		default:
			throw new NodeOperationError(
				this.getNode(),
				`The operation "${operation}" is not supported!`,
			);
	}

	for (let i = 0; i < items.length; i++) {
		try {
			const responseData = await execute.call(this, i);
			returnData.push(...responseData);
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
				continue;
			}

			throw new NodeOperationError(this.getNode(), error as Error, {
				itemIndex: i,
				description: (error as Error & { description?: string }).description,
			});
		}
	}

	return [returnData];
}
