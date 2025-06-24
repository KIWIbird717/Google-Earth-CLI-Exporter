import path from 'path';
import { UtilsConfig, Utils } from '../types';

class ConfigService {
  private readonly PLANET = 'earth';
  private readonly URL_PREFIX = `https://kh.google.com/rt/${this.PLANET}/`;
  private readonly DL_DIR = './downloaded_files';

  private readonly DUMP_OBJ_DIR = path.join(this.DL_DIR, 'obj');
  private readonly DUMP_JSON_DIR = path.join(this.DL_DIR, 'json');
  private readonly DUMP_RAW_DIR = path.join(this.DL_DIR, 'raw');

  /**
   * Gets the configuration for utils
   * @returns UtilsConfig object
   */
  public getUtilsConfig(): UtilsConfig {
    return {
      URL_PREFIX: this.URL_PREFIX,
      DUMP_JSON_DIR: this.DUMP_JSON_DIR,
      DUMP_RAW_DIR: this.DUMP_RAW_DIR,
      DUMP_JSON: false,
      DUMP_RAW: false,
    };
  }
}

class SearchService {
  private utils: Utils;

  constructor(utils: Utils) {
    this.utils = utils;
  }

  /**
   * Initializes the search service
   */
  public async init(): Promise<void> {
    // Implementation will be added here
  }
}

export { ConfigService, SearchService };
