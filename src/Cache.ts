import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import { absolute } from './Helpers';

export default class Cache {
    private map = new Map<string, string>();

    /**
     * Constructs a new Cache object.
     * Imports cache data from json file if it exists.
     * @param relativePath The relativePath to the cache json file.
     */
    constructor(relativePath = '.igniter/cache.json') {
        const absolutePath = absolute(relativePath);
        if (!fs.existsSync(absolutePath)) return;
        const fileContents = fs.readFileSync(absolutePath).toString();
        this.map = new Map(JSON.parse(fileContents));
    }

    /**
     * Clears all values from the cache.
     */
    clear(): void {
        this.map.clear();
    }

    /**
     * Get the value for a given key in the cache.
     */
    get(key: string): string {
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
        const absolutePath = absolute(relativePath);
        await mkdirp(path.dirname(absolutePath));
        fs.writeFileSync(absolutePath, fileContents);
    }
}
