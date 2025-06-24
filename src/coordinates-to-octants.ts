import { MAX_OCTANT_LEVEL, URL_PREFIX } from './constants/constants';

const utils = require('./utils/utils')({
  URL_PREFIX,
  DUMP_JSON_DIR: null,
  DUMP_RAW_DIR: null,
  DUMP_JSON: false,
  DUMP_RAW: false,
});
const latLongToOctant = require('./utils/convert-lat-long-to-octant')(utils);

type LevelOctants = Record<
  string,
  {
    octants: string[];
    box: {
      n: number;
      s: number;
      w: number;
      e: number;
    };
    foundOctants: any;
  }
>;

export class CoordinatesToOctants {
  public static async convert(latitude: number, longitude: number) {
    return await latLongToOctant(latitude, longitude, MAX_OCTANT_LEVEL);
  }
}

(async () => {
  const data = await CoordinatesToOctants.convert(43.723056, 10.395833);
  console.log(data);
})();
