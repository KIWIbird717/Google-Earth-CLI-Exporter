import { Texture, DecodedTexture } from '../../types';

/**
 * Decodes a texture based on its format
 * @param texture - The texture object to decode
 * @returns The decoded texture data
 */
declare function decodeTexture(texture: Texture): DecodedTexture;

export { decodeTexture };
