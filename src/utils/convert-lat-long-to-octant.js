"use strict";

/**
 * Получает первый октант на основе координат
 * @param {number} lat - Широта (-90 до 90)
 * @param {number} lon - Долгота (-180 до 180)
 * @returns {[string, import('./convert-lat-long-to-octant').LatLonBox]} Массив с кодом октанта и границами
 */
function getFirstOctant(lat, lon) {
	if (lat < 0) {
		if (lon < -90) return ['02', { n: 0, s: -90, w: -180, e: -90 }];
		if (lon <   0) return ['03', { n: 0, s: -90, w: -90, e: 0 }];
		if (lon <  90) return ['12', { n: 0, s: -90, w: 0, e: 90 }];
		               return ['13', { n: 0, s: -90, w: 90, e: 180 }];
	}
	if (lat >= 0) {
		if (lon < -90) return ['20', { n: 90, s: 0, w: -180, e: -90 }];
		if (lon <   0) return ['21', { n: 90, s: 0, w: -90, e: 0 }];
		if (lon <  90) return ['30', { n: 90, s: 0, w: 0, e: 90 }];
		               return ['31', { n: 90, s: 0, w: 90, e: 180 }];
	}

	throw `Invalid latitude and longitude`;
}

/**
 * Вычисляет следующий октант на основе текущих границ и координат
 * @param {import('./convert-lat-long-to-octant').LatLonBox} box - Текущие границы октанта
 * @param {number} lat - Широта
 * @param {number} lon - Долгота
 * @returns {[number, import('./convert-lat-long-to-octant').LatLonBox]} Массив с ключом октанта и новыми границами
 */
function getNextOctant(box, lat, lon) {
	let { n, s, w, e } = box;
	const mid_lat = (n + s) / 2;
	const mid_lon = (w + e) / 2;

	let key = 0;

	if (lat < mid_lat) {
		// y = 0
		n = mid_lat;
	} else {
		// y = 1
		s = mid_lat;
		key += 2;
	}

	if (n === 90 || s === -90) {
		// x = 0
	} else if (lon < mid_lon) {
		// x = 0
		e = mid_lon;
	} else {
		// x = 1
		w = mid_lon;
		key += 1;
	}

	return [key, { n, s, w, e }];
}

/**
 * Инициализирует функцию конвертации координат в октанты
 * @param {import('./convert-lat-long-to-octant').Utils} utils - Утилиты для работы с данными
 * @returns {import('./convert-lat-long-to-octant').ConvertLatLongToOctant} Функция конвертации
 */
module.exports = function init({ getPlanetoid, getBulk, bulk: { getIndexByPath, hasBulkMetadataAtIndex } }) {

	/**
	 * Конвертирует координаты широты и долготы в октанты
	 * @param {number} lat - Широта (-90 до 90)
	 * @param {number} lon - Долгота (-180 до 180)
	 * @param {number} maxLevel - Максимальный уровень глубины октантов
	 * @returns {Promise<import('./convert-lat-long-to-octant').FoundOctants>} Объект с найденными октантами по уровням
	 */
	return async function convertLatLongToOctant(lat, lon, maxLevel) {

		if (isNaN(lat) || !(-90 <= lat && lat <= 90)) {
			throw `Invalid latitude: ${lat}`;
		}
		if (isNaN(lon) || !(-180 <= lon && lon <= 180)) {
			throw `Invalid longitude: ${lon}`;
		}

		const planetoid = await getPlanetoid();
		const rootEpoch = planetoid.bulkMetadataEpoch[0];

		/**
		 * Проверяет существование узла по пути
		 * @param {string} nodePath - Путь к узлу
		 * @returns {Promise<boolean>} Существует ли узел
		 */
		async function checkNodePath(nodePath) {
			let bulk = null, index = -1;
			for (let epoch = rootEpoch, i = 4; i < nodePath.length + 4; i += 4) {
				const bulkPath = nodePath.substring(0, i - 4);
				const subPath = nodePath.substring(0, i);

				if (bulk) {
					const idx = getIndexByPath(bulk, bulkPath);
					if (hasBulkMetadataAtIndex(bulk, idx)) return false;
				}

				const nextBulk = await getBulk(bulkPath, epoch);
				bulk = nextBulk;
				index = getIndexByPath(bulk, subPath);
				epoch = bulk.bulkMetadataEpoch[index];
			}
			return (index >= 0);
		}

		/** @type {import('./convert-lat-long-to-octant').FoundOctants} */
		let foundOctants = {}

		/**
		 * Рекурсивно ищет октанты
		 * @param {string} nodePath - Текущий путь узла
		 * @param {import('./convert-lat-long-to-octant').LatLonBox} box - Границы текущего октанта
		 * @param {number} maxLevel - Максимальный уровень глубины
		 */
		async function search(nodePath, box, maxLevel) {
			if (nodePath.length > maxLevel) return;
			try {
				const node_existed = await checkNodePath(nodePath);
				if (!node_existed) return;

				let octantLevel = nodePath.length;

				if (!(octantLevel in foundOctants)) {
					foundOctants[octantLevel] = {
						octants: [],
						box: box,
					}
				}
				else {
					let knownBox = foundOctants[octantLevel].box
					if (knownBox.n !== box.n || knownBox.s !== box.s || knownBox.w !== box.w || knownBox.e !== box.e) {
						throw "Different box ranges of octants, should not happen";
					}
				}

				foundOctants[octantLevel].octants.push(nodePath);

				const [next_key, next_box] = getNextOctant(box, lat, lon)

				await search(nodePath + "" + next_key, next_box, maxLevel);
				await search(nodePath + "" + (next_key + 4), next_box, maxLevel);
			} catch (ex) {
				console.error(ex)
				return;
			}
		}

		let [nodePath, latlonbox] = getFirstOctant(lat, lon)
		await search(nodePath, latlonbox, maxLevel);

		return foundOctants;		
	}
}