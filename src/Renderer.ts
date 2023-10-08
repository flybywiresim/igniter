import cliProgress, { MultiBar, SingleBar } from 'cli-progress';
import chalk from 'chalk';
import { Task, TaskOfTasks, TaskStatus } from './Library';
import { Context } from './Library/Contracts/Context';

export default function render(context: Context, configRootTask: TaskOfTasks): () => void {
    const runningTasks: Task[] = [];

    let bars: MultiBar | undefined;
    let progressBar: SingleBar | undefined;
    if (context.isTTY) {
        bars = new cliProgress.MultiBar({});
        progressBar = bars.create(
            20,
            0,
            undefined,
            {
                format: 'progress [{bar}] {percentage}% | {currentlyRunning} | {value}/{total}',
                noTTYOutput: !context.isTTY,
                notTTYSchedule: 100
            },
        );
    }

    const taskCount = configRootTask.recursiveCount();

    progressBar?.start(taskCount, 0);

    const timeouts = new Map<Task, NodeJS.Timeout>();

    function log(arg: string) {
        if (context.isTTY) {
            bars?.log(`${arg}\n`);
        } else {
            console.log(arg);
        }
    }

    function logTakingLongTime(task: Task, startTime: number, interval: number) {
        if (task.status !== TaskStatus.Running) {
            return;
        }

        const seconds = Math.floor((Date.now() - startTime) / 1_000);

        /* eslint-disable max-len */
        log(
            `${chalk.bgYellow(chalk.black(chalk.blackBright(' Warning  ')))} ${chalk.yellow(`> Task ${chalk.white(task.key)} is taking a long time (${seconds}s)`)}`,
        );
        /* eslint-enable */

        timeouts.set(task, setTimeout(() => {
            logTakingLongTime(task, startTime, interval);
        }, interval));
    }

    function clearTaskTimeout(task: Task) {
        if (timeouts.has(task)) {
            clearTimeout(timeouts.get(task) as any);
            timeouts.delete(task);
        }
    }

    configRootTask.on('statusChange', (task) => {
        if (task.status === TaskStatus.Running && !TaskOfTasks.isTaskOfTasks(task)) {
            runningTasks.push(task);

            const startTime = Date.now();
            const warningInterval = context.taskPool.timeout * 0.5;

            timeouts.set(task, setTimeout(() => logTakingLongTime(task, startTime, warningInterval), warningInterval));
        }

        if (task.status === TaskStatus.Success) {
            clearTaskTimeout(task);

            let successText: string;
            if (TaskOfTasks.isTaskOfTasks(task)) {
                successText = chalk.green(`> Group ${chalk.white(task.key)} finished`);
            } else {
                successText = task.key;
            }

            log(`${chalk.bgGreen(chalk.black(chalk.blackBright(' Finished ')))} ${successText}`);
        }

        if (task.status === TaskStatus.Failed) {
            clearTaskTimeout(task);

            const indent = ' '.repeat(11);

            const indentedFailedString = `${indent}${(task.failedString ?? '').split(/\r?\n/).join(`\n${indent}`)}`;

            /* eslint-disable max-len */
            log(
                `${chalk.bgRed(chalk.black(chalk.blackBright('  Failed  ')))} ${chalk.red(`${chalk.underline(task.key)}\n${indentedFailedString}`)}`,
            );
            /* eslint-enable */
        }

        if ((task.status === TaskStatus.Success || task.status === TaskStatus.Failed)
            && !TaskOfTasks.isTaskOfTasks(task) && runningTasks.includes(task)
        ) {
            runningTasks.splice(runningTasks.indexOf(task), 1);

            let tasks = '';
            let renderedTasks = 0;

            for (const runningTask of runningTasks) {
                if (tasks.length > 0) {
                    tasks += ', ';
                }

                tasks += runningTask.key;

                if (tasks.length > 32) {
                    tasks += `... +${runningTasks.length - renderedTasks}`;
                    break;
                }

                renderedTasks += 1;
            }

            const currentlyRunning = `${chalk.blue(`[${tasks}]`)}`;

            progressBar?.increment();
            progressBar?.update({ currentlyRunning });
        }
    });

    return () => {
        for (const [, timeout] of timeouts.entries()) {
            clearTimeout(timeout);
        }

        setTimeout(() => bars?.stop(), 100);
    };
}
