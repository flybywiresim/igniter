import { Context } from './Context';

export type TaskRunner = (prefix?: string) => Promise<void>;

export enum TaskStatus {
    /**
     * This task has not started yet.
     * If group, all sub-tasks queued.
     */
    Queued,

    /**
     * This task is currently running.
     * If group, at least one sub-tasks is running.
     */
    Running,

    /**
     * This task has ran successfully.
     * If group, all sub-tasks success.
     */
    Success,

    /**
     * This task failed.
     * If group, all sub-tasks failed.
     */
    Failed,

    /**
     * This task was skipped.
     * If group, all sub-tasks skipped.
     */
    Skipped,
}

export interface Task {
    /**
     * The key of the task.
     */
    key: string;

    /**
     * Running this function actually runs the task.
     */
    run: TaskRunner;

    /**
     * The current status of this generic task.
     */
    status: TaskStatus;

    /**
     * Register a context with the task (and sub-tasks).
     */
    useContext(context: Context): void;

    /**
     * Render the task.
     */
    render(depth?: number): string;
}
