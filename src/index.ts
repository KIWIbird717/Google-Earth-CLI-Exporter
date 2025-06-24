import { parseDMS } from './convertor';
import { CoordinatesToOctants } from './coordinates-to-octants';
import { DumpObjApp } from './dump-obj';

(async () => {
  const app = new DumpObjApp();

  const northEast = parseDMS(`43°43'27"N 10°23'50"E`);
  const southWest = parseDMS(`43°43'21"N 10°23'33"E`);

  const data = await CoordinatesToOctants.convertBbox(
    {
      northEast: { lat: northEast.latitude, lon: northEast.longitude },
      southWest: { lat: southWest.latitude, lon: southWest.longitude },
    },
    20,
  );
  await app.run([...data['19'].octants, ...data['20'].octants], 20);
})();
