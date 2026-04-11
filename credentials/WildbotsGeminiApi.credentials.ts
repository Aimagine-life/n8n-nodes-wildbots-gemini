import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WildbotsGeminiApi implements ICredentialType {
	name = 'wildbotsGeminiApi';

	displayName = 'Wildbots Gemini API';

	icon: Icon = 'file:../nodes/WildbotsGemini/wildbots.svg';

	documentationUrl = 'https://github.com/Aimagine-life/n8n-nodes-wildbots-gemini';

	properties: INodeProperties[] = [
		{
			displayName: 'Host',
			name: 'host',
			required: true,
			type: 'string',
			default: 'https://gemini-proxy.bold-violet-3c8d.workers.dev',
			description:
				'Proxy URL. Default is a shared Cloudflare Worker. You can deploy your own — see README.',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your Google Gemini API key from Google AI Studio',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			qs: {
				key: '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.host}}/v1beta/models',
		},
	};
}
