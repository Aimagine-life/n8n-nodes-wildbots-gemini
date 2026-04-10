export default {
	async fetch(request: Request): Promise<Response> {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': '*',
					'Access-Control-Max-Age': '86400',
				},
			});
		}

		const url = new URL(request.url);
		url.hostname = 'generativelanguage.googleapis.com';

		const proxyRequest = new Request(url.toString(), {
			method: request.method,
			headers: request.headers,
			body: request.body,
			redirect: 'follow',
		});

		const response = await fetch(proxyRequest);

		const responseHeaders = new Headers(response.headers);
		responseHeaders.set('Access-Control-Allow-Origin', '*');
		responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		responseHeaders.set('Access-Control-Allow-Headers', '*');

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders,
		});
	},
};
