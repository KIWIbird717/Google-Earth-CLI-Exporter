/**
 * Fetches a URL with optional auto-retry functionality
 * @param url - The URL to fetch
 * @param autoRetry - Whether to enable auto-retry on failure
 * @returns The response data as a Buffer
 */
declare function getUrl(url: string, autoRetry?: boolean): Promise<Buffer>;

export = getUrl;
