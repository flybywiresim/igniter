import { Pool } from 'task-pool';
import { Cache } from './Cache';

export interface Context {
    debug: boolean,
    configPath: string,
    dryRun: boolean,
    filterRegex: RegExp | undefined,
    invertRegex: boolean,
    cache?: Cache,
    taskPool: Pool,
    showNestedTaskKeys: boolean,
    isTTY: boolean,
}
