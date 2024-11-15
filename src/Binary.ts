import { Command } from 'commander';
import { Pool } from 'task-pool';
import { findConfigPath, loadConfigTask } from './Helpers';
import { Context, FilterRegex } from './Library/Contracts/Context';
import { version } from '../package.json';
import Renderer from './Renderer';
import Cache from './Cache';

const allRegex: FilterRegex[] = [];

function addRegex(regex: string): FilterRegex[] {
    allRegex.push({
        regex: RegExp(regex),
        invert: false,
    });
    return allRegex;
}

function addRegexInvert(): void {
    if (allRegex.length === 0) {
        throw new Error('Cannot invert the last regex when there are no regex args!');
    }
    allRegex[allRegex.length - 1].invert = true;
}

const binary = (new Command()).version(version)
    .option('-c, --config <filename>', 'Set the configuration file name', 'igniter.config.mjs')
    .option('-j, --num-workers <number>', 'Set the maximum number of workers to use', `${Number.MAX_SAFE_INTEGER}`)
    .option('-r, --regex <regex>', 'Regular expression used to filter tasks. When multiple regex arguments are supplied,'
        + ' only tasks that match all of the arguments will be run', addRegex)
    .option('-i, --invert', 'If true, the preceeding regex argument will be used to reject tasks instead', addRegexInvert)
    .option('--no-cache', 'Do not skip tasks, even if hash matches cache')
    .option('--no-tty', 'Do not show updating output, just show a single render')
    .option('-d, --dry-run', 'Skip all tasks to show configuration')
    .option('--debug', 'Stop when an exception is thrown and show trace')
    .parse(process.argv);

const options = binary.opts();

// Assemble and register the Context.
const context: Context = {
    debug: options.debug,
    configPath: await findConfigPath(options.config),
    dryRun: options.dryRun,
    filterRegex: options.regex,
    taskPool: new Pool({ limit: options.numWorkers, timeout: 120000 }),
};

// Create and register a cache if needed.
if (options.cache) context.cache = new Cache(context);

// Load the Root Task from the Config file.
const configRootTask = await loadConfigTask(context);

// Set up root task (and thus children) to use our context.
configRootTask.useContext(context);

// Run and Render the config root task.
// If we have tty, render every 100ms, other perform single render.
await Renderer(configRootTask, options.tty ? 100 : 0);

// Export the new cache.
if (context.cache) context.cache.export();
