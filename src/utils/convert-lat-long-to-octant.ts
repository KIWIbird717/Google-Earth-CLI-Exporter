import type { Bulk } from '../../types';

export interface LatLonBox {
  n: number; // north latitude
  s: number; // south latitude
  w: number; // west longitude
  e: number; // east longitude
}

export interface BBox {
  northEast: { lat: number; lon: number }; // верхний правый угол
  southWest: { lat: number; lon: number }; // нижний левый угол
}

export interface FoundOctantLevel {
  octants: string[];
  box: LatLonBox;
}

export interface FoundOctants {
  [level: string]: FoundOctantLevel;
}

export interface Utils {
  getPlanetoid: () => Promise<any>;
  getBulk: (path: string, epoch: number) => Promise<Bulk>;
  bulk: {
    getIndexByPath: (bulk: Bulk, path: string) => number;
    hasBulkMetadataAtIndex: (bulk: Bulk, index: number) => boolean;
  };
}

/**
 * Класс для работы с октантами на основе координат
 */
export class OctantConverter {
  private utils: Utils;
  private planetoid: any;
  private rootEpoch!: number;

  constructor(utils: Utils) {
    this.utils = utils;
  }

  /**
   * Получает первый октант на основе координат
   * @param lat - Широта (-90 до 90)
   * @param lon - Долгота (-180 до 180)
   * @returns Массив с кодом октанта и границами
   */
  public getFirstOctant(lat: number, lon: number): [string, LatLonBox] {
    if (lat < 0) {
      if (lon < -90) return ['02', { n: 0, s: -90, w: -180, e: -90 }];
      if (lon < 0) return ['03', { n: 0, s: -90, w: -90, e: 0 }];
      if (lon < 90) return ['12', { n: 0, s: -90, w: 0, e: 90 }];
      return ['13', { n: 0, s: -90, w: 90, e: 180 }];
    }
    if (lat >= 0) {
      if (lon < -90) return ['20', { n: 90, s: 0, w: -180, e: -90 }];
      if (lon < 0) return ['21', { n: 90, s: 0, w: -90, e: 0 }];
      if (lon < 90) return ['30', { n: 90, s: 0, w: 0, e: 90 }];
      return ['31', { n: 90, s: 0, w: 90, e: 180 }];
    }

    throw new Error(`Invalid latitude and longitude: ${lat}, ${lon}`);
  }

  /**
   * Вычисляет следующий октант на основе текущих границ и координат
   * @param box - Текущие границы октанта
   * @param lat - Широта
   * @param lon - Долгота
   * @returns Массив с ключом октанта и новыми границами
   */
  public getNextOctant(box: LatLonBox, lat: number, lon: number): [number, LatLonBox] {
    let { n, s, w, e } = box;
    const midLat = (n + s) / 2;
    const midLon = (w + e) / 2;

    let key = 0;

    if (lat < midLat) {
      // y = 0
      n = midLat;
    } else {
      // y = 1
      s = midLat;
      key += 2;
    }

    if (n === 90 || s === -90) {
      // x = 0
    } else if (lon < midLon) {
      // x = 0
      e = midLon;
    } else {
      // x = 1
      w = midLon;
      key += 1;
    }

    return [key, { n, s, w, e }];
  }

  /**
   * Проверяет, пересекается ли октант с bbox
   * @param octantBox - Границы октанта
   * @param bbox - BBox для проверки
   * @returns true если октант пересекается с bbox
   */
  private isOctantIntersectsBBox(octantBox: LatLonBox, bbox: BBox): boolean {
    const { northEast, southWest } = bbox;

    // Проверяем пересечение по широте
    const latIntersects = octantBox.n >= southWest.lat && octantBox.s <= northEast.lat;

    // Проверяем пересечение по долготе
    const lonIntersects = octantBox.e >= southWest.lon && octantBox.w <= northEast.lon;

    return latIntersects && lonIntersects;
  }

  /**
   * Проверяет, полностью ли октант находится внутри bbox
   * @param octantBox - Границы октанта
   * @param bbox - BBox для проверки
   * @returns true если октант полностью внутри bbox
   */
  private isOctantInsideBBox(octantBox: LatLonBox, bbox: BBox): boolean {
    const { northEast, southWest } = bbox;

    return (
      octantBox.n <= northEast.lat &&
      octantBox.s >= southWest.lat &&
      octantBox.e <= northEast.lon &&
      octantBox.w >= southWest.lon
    );
  }

  /**
   * Проверяет валидность координат
   * @param lat - Широта
   * @param lon - Долгота
   * @throws Error если координаты невалидны
   */
  private validateCoordinates(lat: number, lon: number): void {
    if (isNaN(lat) || !(-90 <= lat && lat <= 90)) {
      throw new Error(`Invalid latitude: ${lat}`);
    }
    if (isNaN(lon) || !(-180 <= lon && lon <= 180)) {
      throw new Error(`Invalid longitude: ${lon}`);
    }
  }

  /**
   * Проверяет валидность bbox
   * @param bbox - BBox для проверки
   * @throws Error если bbox невалиден
   */
  private validateBBox(bbox: BBox): void {
    const { northEast, southWest } = bbox;

    this.validateCoordinates(northEast.lat, northEast.lon);
    this.validateCoordinates(southWest.lat, southWest.lon);

    if (northEast.lat <= southWest.lat) {
      throw new Error('Invalid bbox: northEast.lat must be greater than southWest.lat');
    }

    if (northEast.lon <= southWest.lon) {
      throw new Error('Invalid bbox: northEast.lon must be greater than southWest.lon');
    }
  }

  /**
   * Инициализирует данные планеты
   */
  private async initializePlanetoid(): Promise<void> {
    if (!this.planetoid) {
      this.planetoid = await this.utils.getPlanetoid();
      this.rootEpoch = this.planetoid.bulkMetadataEpoch[0];
    }
  }

  /**
   * Проверяет существование узла по пути
   * @param nodePath - Путь к узлу
   * @returns Существует ли узел
   */
  private async checkNodePath(nodePath: string): Promise<boolean> {
    let bulk: Bulk | null = null;
    let index = -1;

    for (let epoch = this.rootEpoch, i = 4; i < nodePath.length + 4; i += 4) {
      const bulkPath = nodePath.substring(0, i - 4);
      const subPath = nodePath.substring(0, i);

      if (bulk) {
        const idx = this.utils.bulk.getIndexByPath(bulk, bulkPath);
        if (this.utils.bulk.hasBulkMetadataAtIndex(bulk, idx)) return false;
      }

      const nextBulk = await this.utils.getBulk(bulkPath, epoch);
      bulk = nextBulk;
      index = this.utils.bulk.getIndexByPath(bulk, subPath);
      epoch = bulk.bulkMetadataEpoch[index];
    }

    return index >= 0;
  }

  /**
   * Рекурсивно ищет октанты для bbox
   * @param nodePath - Текущий путь узла
   * @param box - Границы текущего октанта
   * @param maxLevel - Максимальный уровень глубины
   * @param foundOctants - Объект для накопления найденных октантов
   * @param bbox - BBox для поиска
   */
  private async searchBBox(
    nodePath: string,
    box: LatLonBox,
    maxLevel: number,
    foundOctants: FoundOctants,
    bbox: BBox,
  ): Promise<void> {
    if (nodePath.length > maxLevel) return;

    // Проверяем пересечение октанта с bbox
    if (!this.isOctantIntersectsBBox(box, bbox)) return;

    try {
      const nodeExisted = await this.checkNodePath(nodePath);
      if (!nodeExisted) return;

      const octantLevel = nodePath.length;

      if (!(octantLevel in foundOctants)) {
        foundOctants[octantLevel] = {
          octants: [],
          box: box,
        };
      } else {
        const knownBox = foundOctants[octantLevel].box;
        if (knownBox.n !== box.n || knownBox.s !== box.s || knownBox.w !== box.w || knownBox.e !== box.e) {
          throw new Error('Different box ranges of octants, should not happen');
        }
      }

      foundOctants[octantLevel].octants.push(nodePath);

      // Если октант полностью внутри bbox, добавляем все его подоктанты
      if (this.isOctantInsideBBox(box, bbox)) {
        // Добавляем все 4 подоктанта
        for (let i = 0; i < 4; i++) {
          const [key, nextBox] = this.getNextOctant(
            box,
            box.n - (box.n - box.s) * 0.25,
            box.w + (box.e - box.w) * 0.25,
          );
          await this.searchBBox(nodePath + (key + i), nextBox, maxLevel, foundOctants, bbox);
        }
      } else {
        // Проверяем все 4 подоктанта и добавляем только те, которые пересекаются с bbox
        const midLat = (box.n + box.s) / 2;
        const midLon = (box.w + box.e) / 2;

        // Создаем все 4 возможных подоктанта
        const subOctants = [
          { key: 0, subBox: { n: midLat, s: box.s, w: box.w, e: midLon } }, // юго-запад
          { key: 1, subBox: { n: midLat, s: box.s, w: midLon, e: box.e } }, // юго-восток
          { key: 2, subBox: { n: box.n, s: midLat, w: box.w, e: midLon } }, // северо-запад
          { key: 3, subBox: { n: box.n, s: midLat, w: midLon, e: box.e } }, // северо-восток
        ];

        for (const subOctant of subOctants) {
          if (this.isOctantIntersectsBBox(subOctant.subBox, bbox)) {
            await this.searchBBox(nodePath + subOctant.key, subOctant.subBox, maxLevel, foundOctants, bbox);
          }
        }
      }
    } catch (ex) {
      console.error('Error in searchBBox:', ex);
      return;
    }
  }

  /**
   * Рекурсивно ищет октанты
   * @param nodePath - Текущий путь узла
   * @param box - Границы текущего октанта
   * @param maxLevel - Максимальный уровень глубины
   * @param foundOctants - Объект для накопления найденных октантов
   */
  private async search(nodePath: string, box: LatLonBox, maxLevel: number, foundOctants: FoundOctants): Promise<void> {
    if (nodePath.length > maxLevel) return;

    try {
      const nodeExisted = await this.checkNodePath(nodePath);
      if (!nodeExisted) return;

      const octantLevel = nodePath.length;

      if (!(octantLevel in foundOctants)) {
        foundOctants[octantLevel] = {
          octants: [],
          box: box,
        };
      } else {
        const knownBox = foundOctants[octantLevel].box;
        if (knownBox.n !== box.n || knownBox.s !== box.s || knownBox.w !== box.w || knownBox.e !== box.e) {
          throw new Error('Different box ranges of octants, should not happen');
        }
      }

      foundOctants[octantLevel].octants.push(nodePath);

      const [nextKey, nextBox] = this.getNextOctant(box, this.currentLat, this.currentLon);

      await this.search(nodePath + nextKey, nextBox, maxLevel, foundOctants);
      await this.search(nodePath + (nextKey + 4), nextBox, maxLevel, foundOctants);
    } catch (ex) {
      console.error('Error in search:', ex);
      return;
    }
  }

  private currentLat: number = 0;
  private currentLon: number = 0;

  /**
   * Convert bbox (selected square on map) to octants
   * @param bbox - выделенная зона на карте
   * @param maxLevel - уровень детализации
   */
  public async convertBBoxToOctants(bbox: BBox, maxLevel: number): Promise<FoundOctants> {
    this.validateBBox(bbox);
    await this.initializePlanetoid();

    const foundOctants: FoundOctants = {};
    const { northEast, southWest } = bbox;

    // Размера октанта на уровне 20 в градусах
    const octantSize = 0.0001;

    // сетка точек с шагом размера октанта
    const latStep = octantSize;
    const lonStep = octantSize;

    for (let lat = southWest.lat; lat <= northEast.lat; lat += latStep) {
      for (let lon = southWest.lon; lon <= northEast.lon; lon += lonStep) {
        try {
          const pointOctants = await this.convertLatLongToOctant(lat, lon, maxLevel);

          for (const [level, levelData] of Object.entries(pointOctants)) {
            const levelNum = parseInt(level);

            if (!(levelNum in foundOctants)) {
              foundOctants[levelNum] = {
                octants: [],
                box: levelData.box,
              };
            }

            for (const octant of levelData.octants) {
              if (!foundOctants[levelNum].octants.includes(octant)) {
                foundOctants[levelNum].octants.push(octant);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing point ${lat}, ${lon}:`, error);
        }
      }
    }

    return foundOctants;
  }

  /**
   * Конвертирует координаты широты и долготы в октанты
   * @param lat - Широта (-90 до 90)
   * @param lon - Долгота (-180 до 180)
   * @param maxLevel - Максимальный уровень глубины октантов
   * @returns Объект с найденными октантами по уровням
   */
  public async convertLatLongToOctant(lat: number, lon: number, maxLevel: number): Promise<FoundOctants> {
    this.validateCoordinates(lat, lon);
    await this.initializePlanetoid();

    this.currentLat = lat;
    this.currentLon = lon;

    const foundOctants: FoundOctants = {};
    const [nodePath, latLonBox] = this.getFirstOctant(lat, lon);

    await this.search(nodePath, latLonBox, maxLevel, foundOctants);

    return foundOctants;
  }
}

/**
 * Функция для обратной совместимости с JavaScript версией
 * @param utils - Утилиты для работы с данными
 * @returns Функция конвертации координат
 */
export default function init(utils: Utils): (lat: number, lon: number, maxLevel: number) => Promise<FoundOctants> {
  const converter = new OctantConverter(utils);
  return (lat: number, lon: number, maxLevel: number) => converter.convertLatLongToOctant(lat, lon, maxLevel);
}
