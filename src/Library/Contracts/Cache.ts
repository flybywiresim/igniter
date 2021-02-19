export interface Cache {
    /**
     * Imports cache data from json file if it exists.
     * @param relativePath The relativePath to the cache json file.
     */
    import (relativePath?: string): Cache;

    /**
     * Get the value for a given key in the cache.
     */
    get(key: string): string;

    /**
     * Set a value for a given key in the cache.
     */
    set(key: string, value: string): void;

    /**
     * Exports the cache data as a json file.
     * @param relativePath The relativePath to the cache json file.
     */
    export(relativePath?: string): Promise<void>
}
