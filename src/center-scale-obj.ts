import { SCALE } from './constants/constants';
import fs from 'fs';
import readline from 'readline';
import path from 'path';

function scaleMoveObj(file_in: string, file_out: string) {
  if (fs.existsSync(file_out)) {
    fs.unlinkSync(file_out);
  }

  const io = readline.createInterface({
    input: fs.createReadStream(file_in),
    terminal: false,
  });

  let min_x = Infinity,
    max_x = -Infinity;
  let min_y = Infinity,
    max_y = -Infinity;
  let min_z = Infinity,
    max_z = -Infinity;

  io.on('line', (line) => {
    if (!/^v /.test(line)) return;
    let [x, y, z] = line.split(' ').slice(1).map(parseFloat);
    min_x = Math.min(x, min_x);
    min_y = Math.min(y, min_y);
    min_z = Math.min(z, min_z);
    max_x = Math.max(x, max_x);
    max_y = Math.max(y, max_y);
    max_z = Math.max(z, max_z);
  }).on('close', () => {
    const center_x = (max_x + min_x) / 2;
    const center_y = (max_y + min_y) / 2;
    const center_z = (max_z + min_z) / 2;
    const distance_x = Math.abs(max_x - min_x);
    const distance_y = Math.abs(max_y - min_y);
    const distance_z = Math.abs(max_z - min_z);
    const max_distance = Math.max(distance_x, distance_y, distance_z);

    const writeStream = fs.createWriteStream(file_out);
    const readStream = readline.createInterface({
      input: fs.createReadStream(file_in),
      terminal: false,
    });

    readStream
      .on('line', (line) => {
        if (!/^v /.test(line)) {
          writeStream.write(`${line}\n`);
        } else {
          let [x, y, z] = line.split(' ').slice(1).map(parseFloat);
          x = ((x - center_x) / max_distance) * SCALE;
          y = ((y - center_y) / max_distance) * SCALE;
          z = ((z - center_z) / max_distance) * SCALE;
          writeStream.write(`v ${x} ${y} ${z}\n`);
        }
      })
      .on('close', () => {
        writeStream.end();
        console.error(`done. saved as ${file_out}`);
      });
  });

  return file_out;
}

/**
 * Centers and scales all *.obj and saves results as *.2.obj
 * Can also keep 3d viewers from jittering
 *
 * @param modelPath - path to model to scale & center
 */
export function centerScaleObj(modelPath: string) {
  console.log('Run centerScaleObj');

  for (let model of fs.readdirSync(modelPath)) {
    model = path.resolve(modelPath, model);
    if (!fs.statSync(model).isDirectory()) continue;

    for (let j of fs.readdirSync(model)) {
      j = path.resolve(model, j);

      if (!/\.obj$/.test(j) || /\.sc\.obj$/.test(j)) continue;
      if (!fs.statSync(j).isFile()) continue;

      const outFilename = j.match(/(.*)\.obj$/);
      if (!outFilename) {
        console.error('New filename if null or undefined');
        continue;
      }

      const savedFilePath = scaleMoveObj(j, `${outFilename[0].replace('.obj', '')}.sc.obj`);

      console.log(`save scaled object to ${savedFilePath}`);
    }
  }
}
