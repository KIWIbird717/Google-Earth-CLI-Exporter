import path from 'path';
import { cwd } from 'process';

export const PLANET = 'earth';
export const URL_PREFIX = `https://kh.google.com/rt/${PLANET}/`;

/**
 * Max octant deepness level
 */
export const MAX_OCTANT_LEVEL = 21;

/**
 * Путь к рабочей директории для загрузок (вне snapshot)
 */
export const DL_DIR = path.resolve(cwd(), 'downloaded_files');
export const OBJ_DIR = path.resolve(DL_DIR, 'obj');
export const SCALE = 10;
