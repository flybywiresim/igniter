import chalk from 'chalk';
import {Context} from '../Contracts/Context';
import {Task, TaskStatus} from '../Contracts/Task';

export default class TaskOfTasks implements Task {
    private _context: Context | undefined;

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
     * @param name The name of this task of tasks.
     * @param tasks The array of tasks for this TaskOfTasks.
     * @param concurrent Whether the tasks should run concurrently.
     */
    constructor(
        private name: string,
        public tasks: Task[],
        private concurrent = false,
    ) {}

    /**
     * Register a context with the task (and sub-tasks).
     */
    useContext(context: Context, parentTask: Task | null) {
        this.parent = parentTask;
        this._context = context;
        this.tasks.forEach((task) => task.useContext(context, this));
    }

    get key(): string {
        if (!this.context.showNestedTaskKeys) {
            return this.name;
        }

        const prefix = this.parent ? `${this.parent.key}.` : '';

        return `${prefix}${this.name}`;
    }

    /**
     * Returns the number of tasks recursively contained by this task of tasks
     */
    recursiveCount(): number {
        let count = 0;

        for (const task of this.tasks) {
            count += task instanceof TaskOfTasks ? task.recursiveCount() : 1;
        }

        return count;
    }

    /**
     * Run the task of tasks, sequentially or concurrently as required.
     */
    async run(prefix?: string) {
        this.status = TaskStatus.Running;

        const compoundPrefix = `${(prefix || '') + this.key}:`;
        if (this.concurrent) await this.concurrently(compoundPrefix);
        else await this.sequentially(compoundPrefix);
    }

    /**
     * Run tasks concurrently. Resolves when all have ran.
     */
    async concurrently(prefix: string) {
        await Promise.all(this.tasks.map((task) => task.run(prefix))).then(() => {
            this.status = TaskStatus.Success;
        }).catch(() => {
            this.status = TaskStatus.Failed;
        });
    }

    /**
     * Run tasks sequentially. Resolves when all have ran.
     */
    async sequentially(prefix: string) {
        try {
            for await (const task of this.tasks) await task.run(prefix);
        } catch (e) {
            this.status = TaskStatus.Failed;
            throw e;
        }

        this.status = TaskStatus.Success;
    }

    render(depth: number = 0): string {
        const indent = '  '.repeat(depth);

        const [symbol, colour] = ((s: TaskStatus): [string, chalk.Chalk] => {
            if (s === TaskStatus.Queued) return ['—', chalk.cyan];
            if (s === TaskStatus.Success) return ['✓', chalk.green];
            if (s === TaskStatus.Skipped) return ['↪', chalk.gray];
            if (s === TaskStatus.Failed) return ['✖', chalk.red];
            return ['⊙', chalk.magenta]; // Replaced with spinner :)
        })(this.status);

        return [colour(`${indent + symbol} ${this.key}`)]
            .concat(this.tasks.map((task) => task.render(depth + 1)))
            .join('\n');
    }

    on(event: 'statusChange', cb: (task: Task) => void) {
        this.statusChangeCallbacks.push(cb);

        for (const task of this.tasks) {
            task.on('statusChange', cb);
        }
    }

    static isTaskOfTasks(subject: Task): subject is TaskOfTasks {
        return 'recursiveCount' in subject;
    }
}
