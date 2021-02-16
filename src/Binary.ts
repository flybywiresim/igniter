import 'reflect-metadata';
import fs from 'fs';
import minimist from 'minimist';
import { container } from 'tsyringe';
import { Config, Context, Step } from './Interfaces';
import { absolute, bootstrap, generateHashFromPaths } from './Helpers';
import Cache from './Cache';

// We'll parse the cli parameters using minimist.
const argv = minimist(process.argv.slice(2));

const hardcodedContext: Context = {
    matchStepNameRegex: new RegExp(argv._[0]),
    configFilePath: undefined,
};

// This will handle registering 'context' and 'config' with the dependency injection container.
await bootstrap(hardcodedContext);

// Load the config and context from the container.
const config = container.resolve<Config>('config');
const context = container.resolve<Context>('context');

const cache = new Cache();
if (argv.force === true || argv.cache === false) cache.clear();
container.register<Cache>(Cache, { useValue: cache });

const stepShouldRun = (step: Step): boolean => {
    // If there is a regex to run and this step name does not match the regex, we should skip this step
    if (context.matchStepNameRegex !== undefined && !context.matchStepNameRegex.test(step.name)) return false;

    // If shouldRun is null or undefined we should run.
    if (step.shouldRun === null || step.shouldRun === undefined) return true;

    // If shouldRun is a function, that function will decide whether to run or not.
    if (typeof step.shouldRun === 'function') return step.shouldRun();

    const cachedHash = cache.get(step.shouldRun.inFiles);
    // If we can't find a cached hash, we need to run.
    if (cachedHash === undefined) return true;

    // If the out files folder doesn't exist, we should run.
    if (!fs.existsSync(step.shouldRun.outFiles)) return true;
    // @todo If the in files folder doesn't exist, we should error out.
    if (!fs.existsSync(step.shouldRun.inFiles)) return false;

    const absolutePaths = [step.shouldRun.inFiles, step.shouldRun.outFiles].map(absolute);
    const currentHash = generateHashFromPaths(absolutePaths);
    return cachedHash !== currentHash; // We should run if the hashes do NOT match, and vice-versa.
};

/**
 * Run a step's executor and update the
 * @param step The step to run
 */
const runStepCallback = async (step: Step): Promise<boolean> => {
    const executed = await step.executor();
    if (!executed) return false;

    // If we managed to successfully execute, we'll update the cache.
    // We don't need to do anything if we're using a function for shouldRun.
    if (step.shouldRun === null || step.shouldRun === undefined || typeof step.shouldRun === 'function') return true;

    const absolutePaths = [step.shouldRun.inFiles, step.shouldRun.outFiles].map(absolute);
    const generatedHash = generateHashFromPaths(absolutePaths);
    cache.set(step.shouldRun.inFiles, generatedHash);
    return true;
};

(async () => {
    // Run the appropriate steps.
    for await (const stepGroup of config.steps) {
        const promises: Promise<boolean>[] = stepGroup
            .filter((step) => stepShouldRun(step))
            .map((step) => runStepCallback(step));

        await Promise.all(promises);
    }

    // Export the cache.
    if (argv.cache !== false) cache.export();
})();
