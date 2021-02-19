import { exec } from 'child_process';
import { promisify } from 'util';
import GenericTask from './GenericTask';

export default class ExecTask extends GenericTask {
    constructor(
        key: string,
        command: string|string[],
        hashFolders: string[] = [],
    ) {
        const commands = typeof command === 'string' ? [command] : command;
        super(key, async () => {
            for await (const cmd of commands) await promisify(exec)(cmd);
        }, hashFolders);
    }
}
