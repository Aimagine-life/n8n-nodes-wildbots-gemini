import { NodeConnectionTypes, type INodeTypeDescription } from 'n8n-workflow';

import * as audio from './audio';
import * as document from './document';
import * as file from './file';
import * as fileSearch from './fileSearch';
import * as image from './image';
import * as text from './text';
import * as video from './video';

export const versionDescription: INodeTypeDescription = {
	displayName: 'Wildbots Gemini',
	name: 'wildbotsGemini',
	icon: 'file:gemini.svg',
	group: ['transform'],
	version: [1, 1.1],
	defaultVersion: 1.1,
	subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
	description: 'Google Gemini AI via Cloudflare proxy — works in any region',
	defaults: {
		name: 'Wildbots Gemini',
	},
	usableAsTool: true,
	codex: {
		alias: ['gemini', 'google', 'ai', 'video', 'document', 'audio', 'transcribe', 'proxy'],
		categories: ['AI'],
		subcategories: {
			AI: ['Agents', 'Miscellaneous', 'Root Nodes'],
		},
		resources: {
			primaryDocumentation: [
				{
					url: 'https://github.com/Aimagine-life/n8n-nodes-wildbots-gemini',
				},
			],
		},
	},
	inputs: `={{
		(() => {
			const resource = $parameter.resource;
			const operation = $parameter.operation;
			if (resource === 'text' && operation === 'message') {
				return [{ type: 'main' }, { type: 'ai_tool', displayName: 'Tools' }];
			}

			return ['main'];
		})()
	}}`,
	outputs: [NodeConnectionTypes.Main],
	credentials: [
		{
			name: 'wildbotsGeminiApi',
			required: true,
		},
	],
	properties: [
		{
			displayName: 'Resource',
			name: 'resource',
			type: 'options',
			noDataExpression: true,
			options: [
				{ name: 'Audio', value: 'audio' },
				{ name: 'Document', value: 'document' },
				{ name: 'File Search', value: 'fileSearch' },
				{ name: 'Image', value: 'image' },
				{ name: 'Media File', value: 'file' },
				{ name: 'Text', value: 'text' },
				{ name: 'Video', value: 'video' },
			],
			default: 'text',
		},
		...audio.description,
		...document.description,
		...file.description,
		...fileSearch.description,
		...image.description,
		...text.description,
		...video.description,
	],
};
