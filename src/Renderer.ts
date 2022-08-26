import { Task, TaskStatus } from './Library/Contracts/Task';

export default async (task: Task, refreshRate = 100) => {
    const spinner = ['◜', '◠', '◝', '◞', '◡', '◟'];

    const render = () => {
        process.stdout.write('\x1Bc');
        const spinnerChar = spinner.shift();
        spinner.push(spinnerChar);
        const view = task.render().replaceAll('⊙', spinnerChar);
        console.log(view); // eslint-disable-line no-console
    };

    // If refreshRate is zero we just want to run the root task.
    // Then we'll render ONCE to get the final output, and return.
    if (refreshRate === 0) {
        await task.run();
        render();
        if (task.status === TaskStatus.Failed) {
            process.exitCode = 1;
        }
        return;
    }

    const interval = setInterval(render, refreshRate);
    await task.run();
    clearInterval(interval);
    render();
    if (task.status === TaskStatus.Failed) {
        process.exitCode = 1;
    }
};
