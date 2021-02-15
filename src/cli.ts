import path from 'path';
import findUp from 'find-up';
import { fileURLToPath } from 'url';
import { Config, Context, defaultContext, Step } from './types';
import { hashElement } from 'folder-hash';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url); // eslint-disable-line
const __dirname = path.dirname(__filename); // eslint-disable-line

const absolutePath = await findUp('igniter.config.mjs');
const basePath = path.dirname(absolutePath);
if (absolutePath === undefined) throw Error('Igniter config file not found.');
const relativePath = path.relative(__dirname, absolutePath);
const configModule = await import(relativePath);
const config = configModule.default;

const absolute = (relative: string): string => `${basePath}/${relative}`;

const stepShouldRun = async (step: Step, context: Context): Promise<boolean> => {
    if (context.matchStepNameRegex !== undefined && !context.matchStepNameRegex.test(step.name))
        return false;

    if (typeof step.shouldRun === 'function')
        return step.shouldRun();

    // If there is no cache, we need to run.
    if (!existsSync(absolute('.igniter-cache.json')))
        return true;

    const cache = JSON.parse(readFileSync(absolute('.igniter-cache.json')).toString()) || {};
    const cachedHash = cache[step.shouldRun.inFiles];

    // If we didn't find this in the cache, we need to run.
    if (cachedHash === undefined)
        return true;

    try {
        const currentHash =
            (await hashElement(absolute(step.shouldRun.inFiles))).hash +
            (await hashElement(absolute(step.shouldRun.outFiles))).hash;
        return currentHash !== cachedHash;
    } catch (error) {
        return true;
    }
}

const run = async (config: Config, context: Context) => {
    let cache = {};
    for await (const stepGroup of config.steps) {
        const shouldRuns = await Promise.all(stepGroup.map((step) => stepShouldRun(step, context)));
        const filteredSteps = stepGroup.filter((_, index) => shouldRuns[index]);
        await Promise.all(filteredSteps.map((step) => step.executor()));

        for await (const step of filteredSteps) {
            if (typeof step.shouldRun === 'function') continue;

            const currentHash =
                (await hashElement(absolute(step.shouldRun.inFiles))).hash +
                (await hashElement(absolute(step.shouldRun.outFiles))).hash;

            cache[step.shouldRun.inFiles] = currentHash;
        }
    }
    let oldCache = {};
    if (existsSync(absolute('.igniter-cache.json')))
        oldCache = JSON.parse(readFileSync(absolute('.igniter-cache.json')).toString()) || {};
    writeFileSync(absolute('.igniter-cache.json'), JSON.stringify({...oldCache, ...cache}));
};

const dummyContext: Context = {
    ...defaultContext,
    // matchStepNameRegex: /instruments|manifest/,
};

run(config, dummyContext)
