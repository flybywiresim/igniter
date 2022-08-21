import chalk from 'chalk';
import { Context } from '../Contracts/Context';
import { Task, TaskStatus } from '../Contracts/Task';

export default class TaskOfTasks implements Task {
    private context: Context;

    /**
     * @param key The key of this task of tasks.
     * @param tasks The array of tasks for this TaskOfTasks.
     * @param concurrent Whether the tasks should run concurrently.
     */
    constructor(
        public key: string,
        public tasks: Task[],
        private concurrent = false,
    ) {}

    /**
     * Register a context with the task (and sub-tasks).
     */
    useContext(context: Context) {
        this.context = context;
        this.tasks.forEach((task) => task.useContext(context));
    }

    /**
     * Get the status - dynamically determined depending on sub-statuses.
     */
    get status(): TaskStatus {
        if (this.tasks.every((task) => task.status === TaskStatus.Queued)) return TaskStatus.Queued;
        if (this.tasks.every((task) => task.status === TaskStatus.Success)) return TaskStatus.Success;
        if (this.tasks.every((task) => task.status === TaskStatus.Skipped)) return TaskStatus.Skipped;
        if (this.tasks.every((task) => task.status === TaskStatus.Failed)) return TaskStatus.Failed;
        if (this.tasks.some((task) => task.status === TaskStatus.Running)) return TaskStatus.Running;
        if (this.tasks.some((task) => task.status === TaskStatus.Failed)) return TaskStatus.Failed;
        return TaskStatus.Success;
    }

    /**
     * Run the task of tasks, sequentially or concurrently as required.
     */
    async run(prefix?: string) {
        const compoundPrefix = `${(prefix || '') + this.key}:`;
        if (this.concurrent) await this.concurrently(compoundPrefix);
        else await this.sequentially(compoundPrefix);
    }

    /**
     * Run tasks concurrently. Resolves when all have ran.
     */
    async concurrently(prefix: string) {
        await Promise.all(this.tasks.map((task) => task.run(prefix)));
    }

    /**
     * Run tasks sequentially. Resolves when all have ran.
     */
    async sequentially(prefix: string) {
        for await (const task of this.tasks) await task.run(prefix);
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
}
