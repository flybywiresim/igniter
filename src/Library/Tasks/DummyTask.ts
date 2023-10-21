import { exec } from 'child_process';
import { promisify } from 'util';
import { TaskStatus } from '../Contracts/Task';
import GenericTask from './GenericTask';

type ExitStatus = TaskStatus.Success | TaskStatus.Skipped | TaskStatus.Failed;

export default class DummyTask extends GenericTask {
    constructor(key: string, delay?: number, private exitStatus: ExitStatus = TaskStatus.Success) {
        super(key, async () => {
            const d = delay || Math.floor(Math.random() * (5 + 1));
            await promisify(exec)(`sleep ${d}`);
            if (this.exitStatus === TaskStatus.Failed) throw Error();
        });
    }
}
