import cliProgress, { MultiBar, SingleBar } from 'cli-progress';
import c from 'chalk';
import { Task, TaskOfTasks, TaskStatus } from './Library';
import { Context } from './Library/Contracts/Context';

import packageJson from '../package.json';

export default class Renderer {
    static finishedTag(): string {
        return c.bgGreen(c.blackBright(' Finished '));
    }

    static warningTag(): string {
        return c.bgYellow(c.blackBright(' Warning  '));
    }

    static failedTag(): string {
        return c.bgRed(c.blackBright('  Failed  '));
    }

    static debugTag(): string {
        return c.bgMagenta(c.blackBright('  Debug   '));
    }

    static progressTag(): string {
        return c.magenta(' Progress ');
    }

    static infoTag(): string {
        return c.bgBlue(c.blackBright('   Info   '));
    }

    static emptyTag(): string {
        return ' '.repeat(10);
    }

    static runningTasks: Task[] = [];

    static render(context: Context, configRootTask: TaskOfTasks): () => void {
        const startTime = Date.now();

        let doneTasks = 0;

        const cursors = ['|', '/', '-', '\\'];
        let cursorIndex = 0;

        Renderer.runningTasks.length = 0;

        let bars: MultiBar | undefined;
        let progressBar: SingleBar | undefined;
        if (context.isTTY) {
            bars = new cliProgress.MultiBar({ clearOnComplete: true }, cliProgress.Presets.shades_classic);
            progressBar = bars.create(
                20,
                0,
                undefined,
                {
                    clearOnComplete: true,
                    format: `${Renderer.progressTag()} {bar} {cursor} {percentage}% | {currentlyRunning} | {value}/{total}`,
                    noTTYOutput: !context.isTTY,
                    notTTYSchedule: 100,
                    barsize: 30,
                },
            );
        }

        const tasksToRun = configRootTask.recursivelyCountTasksToRun();

        progressBar?.start(tasksToRun, 0);

        let indent = '';

        const timeouts = new Map<Task, NodeJS.Timeout>();

        function log(arg: string) {
            if (context.isTTY) {
                bars?.log(`${arg}\n`);
            } else {
                process.stdout.write(`${arg}\n`);
            }
        }

        function updateProgressBar() {
            let tasks = '';
            let renderedTasks = 0;

            cursorIndex = (cursorIndex + 1) % cursors.length;

            if (Renderer.runningTasks.length === 0) {
                tasks = '<none>';
            }

            for (let i = 0; i < Renderer.runningTasks.length; i += 1) {
                const runningTask = Renderer.runningTasks[i];

                const maxLen = Math.max(0, process.stdout.getWindowSize()[0] - 100);

                if (tasks.length > maxLen) {
                    tasks += `... +${Renderer.runningTasks.length - renderedTasks}`;
                    break;
                }

                if (tasks.length > 0) {
                    tasks += ', ';
                }

                if (runningTask.key.length <= maxLen) {
                    tasks += runningTask.key;
                } else {
                    tasks += `+${Renderer.runningTasks.length - renderedTasks}`;
                    break;
                }

                renderedTasks += 1;
            }

            const currentlyRunning = `${c.blue(`[${tasks}]`)}`;

            progressBar?.update(doneTasks, { cursor: cursors[cursorIndex], currentlyRunning });
        }

        function logTakingLongTime(task: Task, taskStartTime: number, interval: number) {
            if (task.status !== TaskStatus.Running) {
                return;
            }

            const seconds = Math.floor((Date.now() - taskStartTime) / 1_000);

            log(`${Renderer.warningTag()} ${
                c.yellow(`> ${indent}Task ${c.white(task.key)} is taking a long time (${seconds}s)`)
            }`);

            updateProgressBar();

            timeouts.set(task, setTimeout(() => {
                logTakingLongTime(task, taskStartTime, interval);
            }, interval));
        }

        function clearTaskTimeout(task: Task) {
            if (timeouts.has(task)) {
                clearTimeout(timeouts.get(task) as any);
                timeouts.delete(task);
            }
        }

        const versionString = c.white`v${packageJson.version}`;
        const taskCountString = c.white`${tasksToRun} tasks`;
        const workersString = c.white`${context.numWorkers} workers`;

        log(`${Renderer.infoTag()} ${c.blue`> Igniter ${versionString}, queueing ${taskCountString} with ${workersString}`}`);

        configRootTask.on('statusChange', (task) => {
            if (task.status === TaskStatus.Running && !TaskOfTasks.isTaskOfTasks(task)) {
                Renderer.runningTasks.push(task);

                const taskStartTime = Date.now();
                const warningInterval = context.taskPool.timeout * 0.5;

                timeouts.set(task, setTimeout(() => logTakingLongTime(task, taskStartTime, warningInterval), warningInterval));
            }

            const isRootSequentialTaskChild = TaskOfTasks.isTaskOfTasks(task) && task.parent
                && TaskOfTasks.isTaskOfTasks(task.parent) && !task.parent.parent && !task.parent.concurrent;
            const renderAsRootSequentialTaskChild = isRootSequentialTaskChild
                && (task as TaskOfTasks).tasks.filter((it) => it.willRun()).length > 1;

            // Special styling for root sequential task children
            if (renderAsRootSequentialTaskChild) {
                if (task.status === TaskStatus.Running) {
                    log(`${Renderer.emptyTag()} ${c.green`  ┌`} ${c.underline`Starting group '${task.key}'`}`);
                    indent = '│ ';
                } else if (task.status === TaskStatus.Success) {
                    log(`${Renderer.emptyTag()} ${c.green`  └`} ${c.underline`Done with group '${task.key}'`}`);
                    indent = '';
                }
            }

            const isTaskOfTasksWithOnlyOneTaskRun = TaskOfTasks.isTaskOfTasks(task)
                && task.tasks.filter((it) => it.willRun()).length === 1;

            // We do not print a line for a task of tasks which only had one child task run
            if (!isRootSequentialTaskChild && !isTaskOfTasksWithOnlyOneTaskRun && task.status === TaskStatus.Success) {
                clearTaskTimeout(task);

                let successText: string;
                if (TaskOfTasks.isTaskOfTasks(task)) {
                    successText = c.green(`> ${indent}Group ${c.white(task.key)} finished`);
                } else {
                    successText = c.green(`> ${indent}Task ${c.white(task.key)} finished`);
                }

                doneTasks += 1;

                log(`${Renderer.finishedTag()} ${successText}`);
            }

            if (task.status === TaskStatus.Failed) {
                clearTaskTimeout(task);

                const errorIndent = ' '.repeat(13);

                const indentedFailedString = `${errorIndent}${indent}${(task.failedString ?? '')
                    .split(/\r?\n/).join(`\n${errorIndent}${indent}`)}`;

                doneTasks += 1;

                log(`${Renderer.failedTag()} ${c.red(`> ${indent}${c.underline(task.key)}\n${indentedFailedString}`)}`);
            }

            if ((task.status === TaskStatus.Success || task.status === TaskStatus.Failed)
                && !TaskOfTasks.isTaskOfTasks(task) && Renderer.runningTasks.includes(task)
            ) {
                Renderer.runningTasks.splice(Renderer.runningTasks.indexOf(task), 1);
            }

            updateProgressBar();
        });

        return () => {
            for (const [, timeout] of timeouts.entries()) {
                clearTimeout(timeout);
            }

            setTimeout(() => {
                bars?.stop();

                process.stdout.clearLine(0);

                const seconds = (Date.now() - startTime) / 1_000;

                const timeStr = c.white(`${seconds.toFixed(1)}s`);

                console.log(`${Renderer.infoTag()} ${c.blue(`> Ran ${taskCountString} in ${timeStr}`)}`);
            }, 100);
        };
    }
}
