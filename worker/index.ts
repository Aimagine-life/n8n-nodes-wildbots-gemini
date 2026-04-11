/**
 * Wildbots Gemini Proxy — Cloudflare Worker
 *
 * Transparent reverse-proxy that forwards requests to Google Gemini API
 * (generativelanguage.googleapis.com). Used by the n8n-nodes-wildbots-gemini
 * community node to bypass regional restrictions on the Gemini API.
 *
 * Source: https://github.com/Aimagine-life/n8n-nodes-wildbots-gemini
 */

const VERSION = '2.0.0';
const UPSTREAM_HOST = 'generativelanguage.googleapis.com';

// Only these path prefixes are proxied. Anything else → 404.
// This prevents the worker from being abused as a general-purpose proxy.
const ALLOWED_PATH_PREFIXES = ['/v1beta/', '/v1/', '/upload/'];

// Headers that should NOT be forwarded to the upstream.
// - hop-by-hop headers (RFC 7230 §6.1)
// - Cloudflare-specific request headers
// - Host header (must match upstream, set by fetch() automatically)
const STRIPPED_REQUEST_HEADERS = new Set([
	'host',
	'connection',
	'keep-alive',
	'proxy-authenticate',
	'proxy-authorization',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade',
	'cf-connecting-ip',
	'cf-ipcountry',
	'cf-ray',
	'cf-visitor',
	'cf-worker',
	'cf-ew-via',
	'cf-request-id',
	'x-forwarded-for',
	'x-forwarded-proto',
	'x-forwarded-host',
	'x-real-ip',
]);

// CORS headers applied to every response (including errors and health).
const CORS_HEADERS: Record<string, string> = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
	'Access-Control-Allow-Headers': '*',
	'Access-Control-Max-Age': '86400',
};

function jsonResponse(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body, null, 2), {
		status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'no-store',
			...CORS_HEADERS,
		},
	});
}

function isAllowedPath(pathname: string): boolean {
	return ALLOWED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function buildUpstreamHeaders(incoming: Headers): Headers {
	const headers = new Headers();
	incoming.forEach((value, name) => {
		if (!STRIPPED_REQUEST_HEADERS.has(name.toLowerCase())) {
			headers.set(name, value);
		}
	});
	return headers;
}

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		// CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: CORS_HEADERS });
		}

		// Health / landing endpoint — so humans hitting the URL in a browser
		// don't get a confusing 404 from the upstream.
		if (url.pathname === '/' || url.pathname === '/health') {
			return jsonResponse(200, {
				status: 'ok',
				name: 'wildbots-gemini-proxy',
				version: VERSION,
				upstream: UPSTREAM_HOST,
				docs: 'https://github.com/Aimagine-life/n8n-nodes-wildbots-gemini',
			});
		}

		// Reject anything that's not a Gemini API path.
		if (!isAllowedPath(url.pathname)) {
			return jsonResponse(404, {
				error: 'not_found',
				message: `Path "${url.pathname}" is not a Gemini API endpoint.`,
				allowed_prefixes: ALLOWED_PATH_PREFIXES,
				hint: 'This proxy only forwards requests to the Google Gemini API.',
			});
		}

		// Build the upstream URL — same path and query, different host.
		const upstreamUrl = new URL(url.toString());
		upstreamUrl.hostname = UPSTREAM_HOST;
		upstreamUrl.protocol = 'https:';
		upstreamUrl.port = '';

		// Forward the request with cleaned headers.
		const upstreamRequest = new Request(upstreamUrl.toString(), {
			method: request.method,
			headers: buildUpstreamHeaders(request.headers),
			body: request.body,
			redirect: 'follow',
		});

		let upstreamResponse: Response;
		try {
			upstreamResponse = await fetch(upstreamRequest);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			return jsonResponse(502, {
				error: 'upstream_unreachable',
				message: `Failed to reach ${UPSTREAM_HOST}: ${message}`,
				proxy_version: VERSION,
			});
		}

		// Preserve upstream response body (streaming-friendly: body is a ReadableStream
		// that gets passed through untouched — works for SSE and large payloads).
		const responseHeaders = new Headers(upstreamResponse.headers);
		for (const [name, value] of Object.entries(CORS_HEADERS)) {
			responseHeaders.set(name, value);
		}

		return new Response(upstreamResponse.body, {
			status: upstreamResponse.status,
			statusText: upstreamResponse.statusText,
			headers: responseHeaders,
		});
	},
};
