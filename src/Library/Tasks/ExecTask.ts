import { exec } from 'child_process';
import GenericTask from './GenericTask';
import { TaskStatus } from '../Contracts/Task';
import ExecTaskError from './ExecTaskError';

export default class ExecTask extends GenericTask {
    constructor(
        key: string,
        command: string|string[],
        hashFolders: string[] = [],
    ) {
        const commands = typeof command === 'string' ? [command] : command;
        super(key, async () => {
            for await (const cmd of commands) {
                const poolExec = this.context.taskPool.promise.wrap((execCmd) => new Promise((resolve, reject) => {
                    const p = exec(execCmd);

                    let stderr = '';
                    p.stderr.on('data', (data) => {
                        stderr += data;
                    });

                    p.on('exit', (code) => {
                        p.stdout.destroy();
                        p.stderr.destroy();

                        if (code === 0) {
                            resolve(code);
                        } else {
                            reject(new ExecTaskError(stderr));
                        }
                    });
                }));

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
