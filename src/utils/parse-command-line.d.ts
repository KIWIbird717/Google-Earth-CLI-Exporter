import { CommandLineOptions } from '../../types';

/**
 * Parses command line arguments for the application
 * @param filename - The name of the script file
 * @returns Parsed command line options
 */
declare function parseCommandLine(filename: string): CommandLineOptions;

export = parseCommandLine;
