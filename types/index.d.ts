// Типы для скриптов проекта

// Типы для decode-texture.js
export interface Texture {
  textureFormat: number; // 1 для JPEG, 6 для DXT1
  bytes: number[];
  width: number;
  height: number;
}

export interface DecodedTexture {
  extension: 'jpg' | 'bmp';
  buffer: Buffer;
}

// Типы для parse-command-line.js
export interface CommandLineOptions {
  OCTANTS: string[];
  MAX_LEVEL: number;
  DUMP_JSON: boolean;
  DUMP_RAW: boolean;
  PARALLEL_SEARCH: boolean;
}

// Типы для get-url.js
export interface RetryOptions {
  MAX_TRIES?: number;
  MAX_BACKOFF_SECS?: number;
}

// Типы для utils.js
export interface UtilsConfig {
  URL_PREFIX: string;
  DUMP_JSON_DIR: string | null;
  DUMP_RAW_DIR: string | null;
  DUMP_JSON: boolean;
  DUMP_RAW: boolean;
}

export interface Bulk {
  flags: Uint8Array;
  childIndices: Int16Array;
  epoch: Uint32Array;
  bulkMetadataEpoch: Uint32Array;
  metersPerTexel: Float32Array;
  obbCenters: Float64Array;
  obbExtents: Float32Array;
  obbRotations: Float32Array;
  imageryEpochArray?: Uint32Array;
  textureFormatArray?: Uint8Array;
  viewDependentTextureFormatArray?: Uint8Array;
  availableViewDirectionsArray?: Uint8Array;
  defaultImageryEpoch: number;
  defaultTextureFormat: number;
  defaultAvailableViewDirections: number;
  headNodePath: string;
}

export interface Node {
  meshes: Record<string, Mesh>;
  matrixGlobeFromMesh: number[];
}

export interface Mesh {
  texture: Texture;
  vertices: Float32Array;
  indices: Uint32Array;
  normals?: Float32Array;
  uvOffsetAndScale?: Float32Array;
  layerBounds?: Float32Array;
  vertexAlphas?: Uint8Array;
  numNonDegenerateTriangles: number;
  meshId: number;
  octantCounts?: Uint32Array;
}

export interface Planetoid {
  bulkMetadataEpoch: Uint32Array;
}

export interface Utils {
  bulk: {
    hasNodeAtIndex(bulk: Bulk, index: number): boolean;
    hasBulkMetadataAtIndex(bulk: Bulk, index: number): boolean;
    getIndexByPath(bulk: Bulk, path: string): number;
    getPathByIndex(bulk: Bulk, index: number): string | null;
    allPaths(bulk: Bulk, filter?: (index: number) => boolean, stopAfterFirst?: boolean): string[];
  };
  getNode(path: string, bulk: Bulk, index: number): Promise<Node>;
  getPlanetoid(): Promise<Planetoid>;
  getBulk(path: string, epoch: number): Promise<Bulk>;
}

// Типы для decode-resource.js
export interface DecodeResourceResult {
  payload: any;
}

// Типы для dump_obj.js
export interface ObjContext {
  objDir: string;
  c_v: number;
  c_n: number;
  c_u: number;
}

export interface NodeSearchCallbacks {
  nodeFound?: (path: string) => void;
  nodeDownloaded?: (path: string, node: Node, octantsToExclude: number[]) => void;
}

export interface NodeCheckResult {
  bulk: Bulk;
  index: number;
}

export interface Semaphore {
  wait(blocking?: boolean): Promise<void>;
  signal(): void;
}

// Глобальные типы
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: string;
    }
  }
}
