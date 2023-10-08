import fs from 'fs';
import chalk from 'chalk';
import { TaskRunner, Task, TaskStatus } from '../Contracts/Task';
import { generateHashFromPaths, storage } from '../../Helpers';
import { Context } from '../Contracts/Context';
import ExecTaskError from './ExecTaskError';

export default class GenericTask implements Task {
    protected _context: Context | undefined;

    private taskStatus: TaskStatus = TaskStatus.Queued;

    public parent: Task | null = null;

    public failedString: string | null = null;

    public get status() {
        return this.taskStatus;
    }

    protected get context(): Context {
        const context = this._context;

        if (!context) {
            throw new Error('.context called with no context set on task');
        }

        return context;
    }

    public set status(newStatus: TaskStatus) {
        if (this.taskStatus !== newStatus) {
            this.taskStatus = newStatus;

            for (const cb of this.statusChangeCallbacks) {
                cb(this);
            }
        }
    }

    private statusChangeCallbacks: ((task: Task) => void)[] = [];

    /**
     * @param name The name of this generic task.
     * @param executor The TaskRunner used to run this task.
     * @param hashFolders Folders used to create caching hash.
     */
    constructor(
        private name: string,
        private executor: TaskRunner,
        private hashFolders: string[] = [],
    ) {}

    get key(): string {
        if (!this.context.showNestedTaskKeys) {
            return this.name;
        }

        const prefix = this.parent ? `${this.parent.key}.` : '';

        return `${prefix}${this.name}`;
    }

    /**
     * Register a context with the task (and sub-tasks).
     */
    useContext(context: Context, parentTask: Task) {
        this._context = context;
        this.parent = parentTask;
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

            if (error instanceof ExecTaskError) {
                this.failedString = error.stderr;
            }

            this.status = TaskStatus.Failed;
        }
    }

    protected shouldSkip(taskKey: string) {
        return this.shouldSkipRegex(taskKey) || this.shouldSkipCache(taskKey);
    }

    protected shouldSkipRegex(taskKey: string) {
        if (this.context.dryRun) return true;
        if (this.context.filterRegex === undefined) return this.context.invertRegex;
        const regexMatches = this.context.filterRegex.test(taskKey);
        return this.context.invertRegex ? regexMatches : !regexMatches;
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
        if (this.status === TaskStatus.Failed && this.failedString !== undefined) {
            const error = `${indent}  ${this.failedString?.split(/\r?\n/).join(`\n${indent}  `) ?? `${indent}  <no error output>`}`;
            return colour(`${indent + symbol} ${this.key}\n${error}`);
        }
        return colour(`${indent + symbol} ${this.key}`);
    }

    on(event: 'statusChange', cb: (task: Task) => void) {
        this.statusChangeCallbacks.push(cb);
    }
}
