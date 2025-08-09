import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { parseDMS } from './convertor';
import { Bbox } from './types/types';
import { CoordinatesToOctants } from './coordinates-to-octants';
import { DumpObjApp } from './dump-obj';
import { centerScaleObj } from './center-scale-obj';
import { OBJ_DIR } from './constants/constants';

const argv = yargs(hideBin(process.argv))
  .option('bbox', {
    type: 'string',
    demandOption: true,
    describe: 'Bbox coordinates in lat1:lon1;lat2:lon2 format',
  })
  .parseSync();

function parseBBox(bboxStr: string): { bbox: Bbox } {
  const [minLat, minLng, maxLat, maxLng] = bboxStr.replace(' ', '').split(',').map(Number);

  if (!minLat || !minLng || !maxLat || !maxLng) {
    throw new Error('Wrong --bbox forma. Use lat1:lon1;lat2:lon2');
  }

  return {
    bbox: [
      { longitude: maxLng, latitude: maxLat },
      { longitude: minLng, latitude: minLat },
    ],
  };
}

async function bootstrap() {
  // selected aria coordinates
  const { bbox } = parseBBox(argv.bbox);

  const app = new DumpObjApp();

  const data = await CoordinatesToOctants.convertBbox(bbox, 20);
  const modelOutDir = await app.run([...data['19'].octants, ...data['20'].octants], 20);
  if (!modelOutDir) {
    throw new Error('Model out dir is undefined');
  }

  centerScaleObj(OBJ_DIR);
}

bootstrap();
