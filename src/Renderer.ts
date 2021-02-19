import { Task } from './Library/Contracts/Task';

export default async (task: Task, refreshRate = 100) => {
    const spinner = ['◜', '◠', '◝', '◞', '◡', '◟'];

    const render = () => {
        process.stdout.write('\x1Bc');
        const spinnerChar = spinner.shift();
        spinner.push(spinnerChar);
        const view = task.render().replaceAll('⊙', spinnerChar);
        console.log(view); // eslint-disable-line no-console
    };

    const interval = setInterval(render, refreshRate);
    await task.run();
    clearInterval(interval);
    render();
};
