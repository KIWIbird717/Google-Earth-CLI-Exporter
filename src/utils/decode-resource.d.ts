/**
 * Decodes a resource based on command type
 * @param command - The command type (0 for BULK, 3 for NODE)
 * @param payload - The payload data to decode
 * @returns Promise with decoded resource result
 */
declare function decodeResource(command: number, payload: Buffer): Promise<{ payload: any }>;

export = decodeResource;
