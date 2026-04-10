const GOOGLE_API_HOST = 'https://generativelanguage.googleapis.com';

export default {
	async fetch(request: Request): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
					'Access-Control-Allow-Headers': '*',
					'Access-Control-Max-Age': '86400',
				},
			});
		}

		const url = new URL(request.url);
		const targetUrl = `${GOOGLE_API_HOST}${url.pathname}${url.search}`;

		const headers = new Headers(request.headers);
		headers.delete('host');

		const response = await fetch(targetUrl, {
			method: request.method,
			headers,
			body: request.body,
		});

		const responseHeaders = new Headers(response.headers);
		responseHeaders.set('Access-Control-Allow-Origin', '*');

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders,
		});
	},
};
