import { Command } from 'commander';
import { Pool } from 'task-pool';
import { findConfigPath, loadConfigTask } from './Helpers';
import { Context } from './Library/Contracts/Context';
import { version } from '../package.json';
import Cache from './Cache';
import { TaskOfTasks } from './Library';
import render from './Renderer';

const binary = (new Command()).version(version)
    .option('-c, --config <filename>', 'set the configuration file name', 'igniter.config.mjs')
    .option('-j, --num-workers <number>', 'set the maximum number of workers to use', `${Number.MAX_SAFE_INTEGER}`)
    .option('-r, --regex <regex>', 'regular expression used to filter tasks')
    .option('-i, --invert', 'if true, regex will be used to reject tasks')
    .option('-n, --no-cache', 'do not skip tasks, even if hash matches cache')
    .option('-y, --no-tty', 'do not show updating output, just show a single render')
    .option('-d, --dry-run', 'skip all tasks to show configuration')
    .option('--debug', 'stop when an exception is thrown and show trace')
    .parse(process.argv);

const options = binary.opts();

// Assemble and register the Context.
const context: Context = {
    debug: options.debug,
    configPath: await findConfigPath(options.config),
    dryRun: options.dryRun,
    filterRegex: options.regex ? RegExp(options.regex) : undefined,
    invertRegex: options.invert,
    taskPool: new Pool({ limit: options.numWorkers, timeout: 120_000 }),
    showNestedTaskKeys: true,
    isTTY: process.stdout.isTTY,
};

// Create and register a cache if needed.
if (options.cache) context.cache = new Cache(context);

// Load the Root Task from the Config file.
const configRootTask = await loadConfigTask(context);

// Set up root task (and thus children) to use our context.
configRootTask.useContext(context, null);

// Run and Render the config root task.

const rootTaskCompletionCallback = render(context, configRootTask as TaskOfTasks);

configRootTask.run().finally(() => rootTaskCompletionCallback());

// Export the new cache.
if (context.cache) {
    context.cache.export();
}
