import fs from 'fs-extra';
import path from 'path';
import { decodeTexture } from './utils/decode-texture';
import initUtils from './utils/utils';
import type { Node, Mesh, ObjContext, NodeCheckResult, Bulk } from '../types';
import { URL_PREFIX, DL_DIR } from './constants/constants';

// Configuration
const [DUMP_OBJ_DIR, DUMP_JSON_DIR, DUMP_RAW_DIR] = ['obj', 'json', 'raw'].map((x) => path.join(DL_DIR, x));

console.log({ DUMP_OBJ_DIR, DUMP_JSON_DIR, DUMP_RAW_DIR });

// const { OCTANTS, MAX_LEVEL, DUMP_JSON, DUMP_RAW, PARALLEL_SEARCH } = parseCommandLine(__filename);
// const DUMP_OBJ = !(DUMP_JSON || DUMP_RAW);
const DUMP_OBJ = true;
const PARALLEL_SEARCH = true;

const utils = initUtils({
  URL_PREFIX,
  DUMP_JSON_DIR,
  DUMP_RAW_DIR,
  DUMP_JSON: false,
  DUMP_RAW: false,
});

const {
  getPlanetoid,
  getBulk,
  getNode,
  bulk: { getIndexByPath, hasBulkMetadataAtIndex, hasNodeAtIndex },
} = utils;

/**
 * Semaphore для управления параллельными операциями
 */
class Semaphore {
  private concurrent: number;
  private waiting: Array<{ resolve: () => void; reject: (error: any) => void }> = [];

  constructor(num: number) {
    this.concurrent = num;
  }

  public async wait(highestPriority = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.concurrent <= 0) {
        if (highestPriority) {
          this.waiting.splice(0, 0, { resolve, reject });
        } else {
          this.waiting.push({ resolve, reject });
        }
      } else {
        this.concurrent--;
        resolve();
      }
    });
  }

  public signal(): void {
    this.concurrent++;
    if (this.concurrent > 0 && this.waiting.length > 0) {
      this.concurrent--;
      this.waiting.splice(0, 1)[0].resolve();
    }
  }
}

/**
 * Класс для работы с OBJ файлами
 */
class ObjWriter {
  private ctx: ObjContext;

  constructor(dir: string) {
    this.ctx = this.initCtxOBJ(dir);
  }

  private initCtxOBJ(dir: string): ObjContext {
    fs.writeFileSync(path.join(dir, 'model.obj'), `mtllib model.mtl\n`);
    return { objDir: dir, c_v: 0, c_n: 0, c_u: 0 };
  }

  public writeNode(node: Node, nodeName: string, exclude: number[]): void {
    for (const [meshIndex, mesh] of Object.entries(node.meshes)) {
      const meshName = `${nodeName}_${meshIndex}`;
      const tex = mesh.texture;
      const texName = `tex_${nodeName}_${meshIndex}`;

      const obj = this.writeMeshOBJ(meshName, texName, node, mesh, exclude);
      fs.appendFileSync(path.join(this.ctx.objDir, 'model.obj'), obj);

      const { buffer: buf, extension: ext } = decodeTexture(tex);
      fs.appendFileSync(
        path.join(this.ctx.objDir, 'model.mtl'),
        `
        newmtl ${texName}
        Kd 1.000 1.000 1.000
        d 1.0
        illum 0
        map_Kd ${texName}.${ext}
      `
          .split('\n')
          .map((s) => s.trim())
          .join('\n'),
      );

      fs.writeFileSync(path.join(this.ctx.objDir, `${texName}.${ext}`), buf);
    }
  }

  private writeMeshOBJ(meshName: string, texName: string, payload: Node, mesh: Mesh, exclude: number[]): string {
    const shouldExclude = (w: number): boolean => {
      return Array.isArray(exclude) ? exclude.indexOf(w) >= 0 : false;
    };

    let str = '';
    const indices = mesh.indices;
    const vertices = mesh.vertices;
    const normals = mesh.normals;

    const _c_v = this.ctx.c_v;
    const _c_n = this.ctx.c_n;
    const _c_u = this.ctx.c_u;

    let c_v = _c_v;
    let c_n = _c_n;
    let c_u = _c_u;

    const console = {
      log: (s: string) => {
        str += s + '\n';
      },
    };

    console.log(`usemtl ${texName}`);
    console.log(`o planet_${meshName}`);

    // Write vertices
    console.log('# vertices');
    for (let i = 0; i < vertices.length; i += 8) {
      let x = vertices[i + 0];
      let y = vertices[i + 1];
      let z = vertices[i + 2];
      let w = 1;

      let _x = 0;
      let _y = 0;
      let _z = 0;
      let _w = 0;

      // Note: matrixGlobeFromMesh is not in the Node type, using identity matrix as fallback
      const ma = payload.matrixGlobeFromMesh; // Identity matrix
      _x = x * ma[0] + y * ma[4] + z * ma[8] + w * ma[12];
      _y = x * ma[1] + y * ma[5] + z * ma[9] + w * ma[13];
      _z = x * ma[2] + y * ma[6] + z * ma[10] + w * ma[14];
      _w = x * ma[3] + y * ma[7] + z * ma[11] + w * ma[15];

      x = _x;
      y = _y;
      z = _z;

      console.log(`v ${x} ${y} ${z}`);
      c_v++;
    }

    // Write UV coordinates
    if (mesh.uvOffsetAndScale) {
      console.log('# UV');
      for (let i = 0; i < vertices.length; i += 8) {
        const u1 = vertices[i + 4];
        const u2 = vertices[i + 5];
        const v1 = vertices[i + 6];
        const v2 = vertices[i + 7];

        const u = u2 * 256 + u1;
        const v = v2 * 256 + v1;

        const ut = (u + mesh.uvOffsetAndScale[0]) * mesh.uvOffsetAndScale[2];
        const vt = (v + mesh.uvOffsetAndScale[1]) * mesh.uvOffsetAndScale[3];

        const tex = mesh.texture;
        if (tex.textureFormat == 6) {
          console.log(`vt ${ut} ${1 - vt}`);
        } else {
          console.log(`vt ${ut} ${vt}`);
        }
        c_u++;
      }
    }

    // Write normals
    if (normals) {
      console.log('# Normals');
      for (let i = 0; i < normals.length; i += 4) {
        let x = normals[i + 0] - 127;
        let y = normals[i + 1] - 127;
        let z = normals[i + 2] - 127;
        let w = 0;

        let _x = 0;
        let _y = 0;
        let _z = 0;
        let _w = 0;

        // Note: matrixGlobeFromMesh is not in the Node type, using identity matrix as fallback
        const ma = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; // Identity matrix
        _x = x * ma[0] + y * ma[4] + z * ma[8] + w * ma[12];
        _y = x * ma[1] + y * ma[5] + z * ma[9] + w * ma[13];
        _z = x * ma[2] + y * ma[6] + z * ma[10] + w * ma[14];
        _w = x * ma[3] + y * ma[7] + z * ma[11] + w * ma[15];

        x = _x;
        y = _y;
        z = _z;

        console.log(`vn ${x} ${y} ${z}`);
        c_n++;
      }
    }

    // Write faces
    console.log('# faces');
    const triangleGroups: Record<number, number[][]> = {};

    for (let i = 0; i < indices.length - 2; i += 1) {
      if (mesh.layerBounds && i === mesh.layerBounds[3]) break;

      const a = indices[i + 0];
      const b = indices[i + 1];
      const c = indices[i + 2];

      if (a == b || a == c || b == c) {
        continue;
      }

      if (!(vertices[a * 8 + 3] === vertices[b * 8 + 3] && vertices[b * 8 + 3] === vertices[c * 8 + 3])) {
        throw new Error('vertex w mismatch');
      }

      const w = vertices[a * 8 + 3];
      if (shouldExclude(w)) continue;

      if (!triangleGroups[w]) {
        triangleGroups[w] = [];
      }
      triangleGroups[w].push(this.isOdd(i) ? [a, c, b] : [a, b, c]);
    }

    for (const k in triangleGroups) {
      if (!triangleGroups.hasOwnProperty(k)) throw new Error('no k property');
      const triangles = triangleGroups[k];

      for (const t in triangles) {
        if (!triangles.hasOwnProperty(t)) throw new Error('no t property');
        const v = triangles[t];
        const a = v[0] + 1,
          b = v[1] + 1,
          c = v[2] + 1;

        if (mesh.uvOffsetAndScale && normals) {
          console.log(
            `f ${a + _c_v}/${a + _c_u}/${a + _c_n} ${b + _c_v}/${b + _c_u}/${b + _c_n} ${c + _c_v}/${c + _c_u}/${c + _c_n}`,
          );
        } else {
          console.log(`f ${a + _c_v} ${b + _c_v} ${c + _c_v}`);
        }
      }
    }

    this.ctx.c_v = c_v;
    this.ctx.c_u = c_u;
    this.ctx.c_n = c_n;

    return str;
  }

  private isOdd(number: number): boolean {
    return Boolean(number & 1);
  }
}

/**
 * Класс для поиска и загрузки узлов
 */
class NodeSearcher {
  private rootEpoch: number;
  private semaphore: Semaphore;
  private nodeFoundCallback?: (path: string) => void;
  private nodeDownloadedCallback?: (path: string, node: Node, octantsToExclude: number[]) => void;

  constructor(
    rootEpoch: number,
    numParallelBranches: number = 1,
    nodeFound?: (path: string) => void,
    nodeDownloaded?: (path: string, node: Node, octantsToExclude: number[]) => void,
  ) {
    this.rootEpoch = rootEpoch;
    this.semaphore = new Semaphore(numParallelBranches - 1);
    this.nodeFoundCallback = nodeFound;
    this.nodeDownloadedCallback = nodeDownloaded;
  }

  async search(k: string, maxLevel: number = 999): Promise<boolean> {
    if (k.length > maxLevel) return false;

    let check: NodeCheckResult | null;
    try {
      check = await this.checkNodeAtNodePath(k);
      if (check === null) return false;
    } catch (ex) {
      console.error(ex);
      return false;
    }

    try {
      this.nodeFoundCallback?.(k);
    } catch (ex) {
      console.error('Unhandled nodeFound callback error', ex);
      return false;
    }

    const promises: Promise<void>[] = [];
    const results: Array<{ oct: number; res: boolean }> = [];

    const downloadNodes = async (oct: number): Promise<void> => {
      try {
        results.push({ oct, res: await this.search(k + oct, maxLevel) });
        if (results.length === 8) {
          const octs = results.filter(({ res }) => res).map(({ oct }) => oct);
          const node = await getNode(k, check!.bulk, check!.index);
          try {
            this.nodeDownloadedCallback?.(k, node, octs);
          } catch (ex) {
            console.error('Unhandled nodeDownload callback error');
            throw ex;
          }
        }
      } finally {
        await new Promise((r) => setImmediate(r));
        this.semaphore.signal();
      }
    };

    for (const oct of [0, 1, 2, 3, 4, 5, 6, 7]) {
      const downloadsPromises = downloadNodes(oct);
      promises.push(downloadsPromises);
      await this.semaphore.wait(true);
    }

    try {
      await Promise.all(promises);
    } catch (ex) {
      console.error(ex);
      return false;
    }
    return true;
  }

  private async checkNodeAtNodePath(nodePath: string): Promise<NodeCheckResult | null> {
    let bulk: Bulk | null = null;
    let index = -1;

    for (let epoch = this.rootEpoch, i = 4; i < nodePath.length + 4; i += 4) {
      const bulkPath = nodePath.substring(0, i - 4);
      const subPath = nodePath.substring(0, i);

      if (bulk) {
        const idx = getIndexByPath(bulk, bulkPath);
        if (hasBulkMetadataAtIndex(bulk, idx)) return null;
      }

      const nextBulk = await getBulk(bulkPath, epoch);
      bulk = nextBulk;
      index = getIndexByPath(bulk, subPath);
      epoch = bulk.bulkMetadataEpoch[index];
    }

    if (index < 0) return null;
    if (!hasNodeAtIndex(bulk!, index)) return null;
    return { bulk: bulk!, index };
  }
}

/**
 * Основной класс приложения
 */
export class DumpObjApp {
  private objWriter?: ObjWriter;
  private octantsCount = 0;

  async run(octants: string[], maxLevel: number): Promise<string | undefined> {
    const planetoid = await getPlanetoid();
    let modelOutDir: string | undefined;

    const rootEpoch = planetoid.bulkMetadataEpoch[0];

    if (DUMP_OBJ) {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      modelOutDir = path.join(DUMP_OBJ_DIR, timestamp);
      fs.removeSync(modelOutDir);
      fs.ensureDirSync(modelOutDir);
      this.objWriter = new ObjWriter(modelOutDir);
    }

    const searcher = new NodeSearcher(
      rootEpoch,
      PARALLEL_SEARCH ? 16 : 1,
      this.nodeFound.bind(this),
      this.nodeDownloaded.bind(this),
    );

    for (const oct of octants) {
      await searcher.search(oct, maxLevel);
    }

    console.log('octants', this.octantsCount);

    return modelOutDir;
  }

  private nodeFound(path: string): void {
    console.log('found', path);
    this.octantsCount++;
  }

  private nodeDownloaded(path: string, node: Node, octantsToExclude: number[]): void {
    console.log('downloaded', path);
    if (DUMP_OBJ && this.objWriter) {
      this.objWriter.writeNode(node, path, octantsToExclude);
    }
  }
}
