import { parseDMS } from './convertor';
import { CoordinatesToOctants } from './coordinates-to-octants';
import { DumpObjApp } from './dump-obj';

(async () => {
  const app = new DumpObjApp();

  const northEast = parseDMS(`43°43'26"N 10°23'49"E`);
  const southWest = parseDMS(`43°43'21"N 10°23'34"E`);

  const data = await CoordinatesToOctants.convertBbox(
    {
      northEast: { lat: northEast.latitude, lon: northEast.longitude },
      southWest: { lat: southWest.latitude, lon: southWest.longitude },
    },
    20,
  );
  await app.run(data['20'].octants, 20);
})();
