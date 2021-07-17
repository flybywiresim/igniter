import { exec } from 'child_process';
import { promisify } from 'util';
import GenericTask from './GenericTask';
import { TaskStatus } from '../Contracts/Task';

export default class ExecTask extends GenericTask {
    constructor(
        key: string,
        command: string|string[],
        hashFolders: string[] = [],
    ) {
        const commands = typeof command === 'string' ? [command] : command;
        super(key, async () => {
            for await (const cmd of commands) {
                const poolExec = this.context.taskPool.promise.wrap(promisify(exec));

                const task = poolExec(cmd);

                this.status = TaskStatus.Queued;
                task.on('run', () => {
                    this.status = TaskStatus.Running;
                });

                await task;
            }
        }, hashFolders);
    }
}
