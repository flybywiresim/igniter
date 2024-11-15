import fs from 'fs';
import chalk from 'chalk';
import { TaskRunner, Task, TaskStatus } from '../Contracts/Task';
import { generateHashFromPaths, storage } from '../../Helpers';
import { Context } from '../Contracts/Context';
import ExecTaskError from './ExecTaskError';

export default class GenericTask implements Task {
    protected context: Context;

    protected errorOutput: string;

    public status: TaskStatus = TaskStatus.Queued;

    /**
     * @param key The key of this generic task.
     * @param executor The TaskRunner used to run this task.
     * @param hashFolders Folders used to create caching hash.
     */
    constructor(
        public key: string,
        private executor: TaskRunner,
        private hashFolders: string[] = [],
    ) {}

    /**
     * Register a context with the task (and sub-tasks).
     */
    useContext(context: Context) {
        this.context = context;
    }

    /**
     * Run the task executor.
     */
    async run(prefix?: string) {
        const taskKey = (prefix || '') + this.key;
        if (this.shouldSkip(taskKey)) {
            this.status = TaskStatus.Skipped;
            return;
        }

        try {
            this.status = TaskStatus.Running;
            await this.executor(prefix);
            this.status = TaskStatus.Success;

            // Set the cache value (will be saved when the overall cache is exported).
            if (this.context.cache) {
                const generateHash = generateHashFromPaths(this.hashFolders.map((path) => storage(this.context, path)));
                this.context.cache.set(taskKey, generateHash);
            }
        } catch (error) {
            if (this.context.debug) {
                throw error;
            }

            this.status = TaskStatus.Failed;

            if (error instanceof ExecTaskError) {
                this.errorOutput = error.stderr;
            }
        }
    }

    protected shouldSkip(taskKey?: string) {
        return this.shouldSkipRegex(taskKey) || this.shouldSkipCache(taskKey);
    }

    protected shouldSkipRegex(taskKey: string) {
        if (this.context.dryRun) {
            return true;
        }
        return !this.context.filterRegex.every((r) => (r.regex.test(taskKey) ? !r.invert : r.invert));
    }

    protected shouldSkipCache(taskKey: string) {
        if (this.context.cache === undefined || this.hashFolders.length === 0) return false;

        const cachedHash = this.context.cache.get(taskKey);
        if (cachedHash === undefined) return false;

        // If any of the hash folders doesn't exist, we shouldn't skip.
        if (this.hashFolders.some((path) => !fs.existsSync(path))) return false;

        return cachedHash === generateHashFromPaths(
            this.hashFolders.map((path) => storage(this.context, path)),
        );
    }

    render(depth: number = 0): string {
        const indent = '  '.repeat(depth);
        const [symbol, colour] = ((s: TaskStatus): [string, chalk.Chalk] => {
            if (s === TaskStatus.Queued) return ['—', chalk.cyan];
            if (s === TaskStatus.Success) return ['✓', chalk.green];
            if (s === TaskStatus.Failed) return ['✖', chalk.red];
            if (s === TaskStatus.Skipped) return ['↪', chalk.gray];
            return ['⊙', chalk.magenta]; // Replaced with spinner :)
        })(this.status);
        if (this.status === TaskStatus.Failed && this.errorOutput !== undefined) {
            const error = `${indent}  ${this.errorOutput.split(/\r?\n/).join(`\n${indent}  `)}`;
            return colour(`${indent + symbol} ${this.key}\n${error}`);
        }
        return colour(`${indent + symbol} ${this.key}`);
    }
}
