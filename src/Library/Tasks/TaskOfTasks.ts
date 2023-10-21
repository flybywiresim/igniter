import chalk from 'chalk';
import { Context } from '../Contracts/Context';
import { Task, TaskStatus } from '../Contracts/Task';

export default class TaskOfTasks implements Task {
    private givenContext: Context | undefined;

    private taskStatus: TaskStatus = TaskStatus.Queued;

    public parent: Task | null = null;

    public failedString: string | null = null;

    public get status() {
        return this.taskStatus;
    }

    protected get context(): Context {
        const context = this.givenContext;

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
        this.givenContext = context;

        for (const task of this.tasks) {
            task.useContext(context, this);
        }
    }

    get key(): string {
        if (!this.context.showNestedTaskKeys) {
            return this.name;
        }

        const prefix = this.parent ? `${this.parent.key}:` : '';

        return `${prefix}${this.name}`;
    }

    /**
     * Run the task of tasks, sequentially or concurrently as required.
     */
    async run(prefix?: string) {
        this.status = TaskStatus.Running;

        const compoundPrefix = `${prefix ? `${prefix}:` : ''}${this.name}`;

        if (this.concurrent) {
            await this.concurrently(compoundPrefix);
        } else {
            await this.sequentially(compoundPrefix);
        }
    }

    willRun() {
        return this.tasks.some((task) => task.willRun());
    }

    /**
     * Run tasks concurrently. Resolves when all have ran.
     */
    private async concurrently(prefix: string) {
        await Promise.all(this.tasks.map((task) => task.run(prefix))).then(() => {
            this.status = this.tasks.every((it) => it.status === TaskStatus.Skipped)
                ? TaskStatus.Skipped
                : TaskStatus.Success;
        }).catch(() => {
            this.status = TaskStatus.Failed;
        });
    }

    /**
     * Run tasks sequentially. Resolves when all have ran.
     */
    private async sequentially(prefix: string) {
        try {
            for await (const task of this.tasks) {
                await task.run(prefix);
            }
        } catch (e) {
            this.status = TaskStatus.Failed;
            throw e;
        }

        this.status = this.tasks.every((it) => it.status === TaskStatus.Skipped)
            ? TaskStatus.Skipped
            : TaskStatus.Success;
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

    /**
     * Recursively counts and returns the number of tasks in this {@link TaskOfTasks} that will not be skipped
     */
    recursivelyCountTasksToRun(): number {
        let count = 0;

        for (const task of this.tasks) {
            if (task instanceof TaskOfTasks) {
                count += task.recursivelyCountTasksToRun();
            } else {
                count += task.willRun() ? 1 : 0;
            }
        }

        return count;
    }

    static isTaskOfTasks(subject: Task): subject is TaskOfTasks {
        return 'recursivelyCountTasksToRun' in subject;
    }
}
