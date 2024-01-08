import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import { storage } from './Helpers';
import { Cache as CacheContract } from './Library/Contracts/Cache';
import { Context } from './Library/Contracts/Context';

export default class Cache implements CacheContract {
    private map = new Map<string, string>();

    /**
     * Create and auto-import cache from json.
     * @param relativePath The relativePath to the cache json file.
     */
    constructor(protected context: Context, relativePath = '.igniter/cache.json') {
        this.import(relativePath);
    }

    /**
     * Imports cache data from json file if it exists.
     * @param relativePath The relativePath to the cache json file.
     */
    import(relativePath = '.igniter/cache.json'): CacheContract {
        const absolutePath = storage(this.context, relativePath);
        if (!fs.existsSync(absolutePath)) return this;
        const fileContents = fs.readFileSync(absolutePath).toString();
        this.map = new Map(JSON.parse(fileContents));
        return this;
    }

    /**
     * Get the value for a given key in the cache.
     */
    get(key: string): string | undefined {
        return this.map.get(key);
    }

    /**
     * Set a value for a given key in the cache.
     */
    set(key: string, value: string) {
        this.map.set(key, value);
    }

    /**
     * Exports the cache data as a json file.
     * @param relativePath The relativePath to the cache json file.
     */
    async export(relativePath = '.igniter/cache.json'): Promise<void> {
        const fileContents = JSON.stringify([...this.map]);
        const absolutePath = storage(this.context, relativePath);
        await mkdirp(path.dirname(absolutePath));
        fs.writeFileSync(absolutePath, fileContents);
    }
}
