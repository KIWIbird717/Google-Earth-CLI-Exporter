import { Coordinates } from './types/types';

function dmsToDecimal(degrees: string, minutes: string, seconds: string, direction: string) {
  let decimal = parseFloat(degrees) + parseFloat(minutes) / 60 + parseFloat(seconds) / 3600;
  if (direction === 'S' || direction === 'W') {
    decimal *= -1;
  }
  return decimal;
}

/**
 * @example
 * parseDMS(`43°43'23"N 10°23'45"E`) // { latitude: 43.723055555555554, longitude: 10.395833333333332 }
 */
export function parseDMS(input: string): Coordinates {
  const regex = /(\d+)°(\d+)'(\d+)"?([NSEW])/g;
  const matches = [...input.matchAll(regex)];

  if (matches.length !== 2) {
    throw new Error('Invalid input format. Expected two coordinates in DMS format.');
  }

  const [latMatch, lonMatch] = matches;

  const lat = dmsToDecimal(latMatch[1], latMatch[2], latMatch[3], latMatch[4]);
  const lon = dmsToDecimal(lonMatch[1], lonMatch[2], lonMatch[3], lonMatch[4]);

  return { latitude: lat, longitude: lon };
}
