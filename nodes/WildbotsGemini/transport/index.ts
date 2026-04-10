import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

type RequestParameters = {
	headers?: IDataObject;
	body?: IDataObject | string;
	qs?: IDataObject;
	option?: IDataObject;
};

type WildbotsGeminiCredentials = {
	host: string;
	apiKey: string;
};

const DEFAULT_PROXY_HOST = 'https://gemini-proxy.bold-violet-3c8d.workers.dev';

const RATE_LIMIT_MESSAGE = `Лимиты общего прокси исчерпаны — слишком много пользователей на одном воркере.

Разверните свой Cloudflare Worker — это бесплатно и займёт 5 минут.
Инструкция: https://www.npmjs.com/package/n8n-nodes-wildbots-gemini#deploy-your-own-worker`;

export async function apiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	parameters?: RequestParameters,
) {
	const { body, qs, option, headers } = parameters ?? {};

	const credentials = await this.getCredentials<WildbotsGeminiCredentials>('wildbotsGeminiApi');

	const host = credentials.host || DEFAULT_PROXY_HOST;
	const url = `${host}${endpoint}`;

	const options = {
		headers,
		method,
		body,
		qs,
		url,
		json: true,
	};

	if (option && Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}

	try {
		return await this.helpers.httpRequestWithAuthentication.call(
			this,
			'wildbotsGeminiApi',
			options,
		);
	} catch (error) {
		if (
			error?.httpCode === '429' &&
			host === DEFAULT_PROXY_HOST
		) {
			throw new NodeApiError(this.getNode(), error as unknown as JsonObject, {
				message: 'Rate limit exceeded',
				description: RATE_LIMIT_MESSAGE,
			});
		}
		throw error;
	}
}
