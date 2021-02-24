import { Command } from 'commander';
import { findConfigPath, loadConfigTask } from './Helpers';
import { Context } from './Library/Contracts/Context';
import { version } from '../package.json';
import Renderer from './Renderer';
import Cache from './Cache';

const binary = (new Command()).version(version)
    .option('-c, --config <filename>', 'set the configuration file name', 'igniter.config.mjs')
    .option('-r, --regex <regex>', 'regular expression used to filter tasks')
    .option('-i, --invert', 'if true, regex will be used to reject tasks')
    .option('--no-cache', 'do not skip tasks, even if hash matches cache')
    .option('--no-tty', 'do not show updating output, just show a single render')
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
