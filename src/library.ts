import { exec } from 'child_process';
import { promisify } from 'util';
import { Executor } from './types';

/**
 * Lorem Ipsum Dolor Sit Amet.
 */
export const generateCliExecutor = (command: string): Executor => async () => {
    try {
        await promisify(exec)(command);
        console.log(`${command}.`);
        return true;
    } catch (error) {
        return false;
    }
};

/**
 * Lorem Ipsum Dolor Sit Amet.
 */
export const generateDummyExecutor = (name: string): Executor => async () => {
    try {
        console.log(`Starting ${name}.`);
        await promisify(exec)('sleep 3');
        console.log(`Finished ${name}.`);
        return true;
    } catch (error) {
        return false;
    }
};
