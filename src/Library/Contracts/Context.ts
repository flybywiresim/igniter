import { Pool } from 'task-pool';
import { Cache } from './Cache';

export interface FilterRegex {
    regex: RegExp,
    invert: boolean,
}

export interface Context {
    debug: boolean,
    configPath: string,
    dryRun: boolean,
    filterRegex: FilterRegex[],
    cache?: Cache,
    taskPool: Pool,
}
