import fs from 'fs';
import path from 'path';
import hasha from 'hasha';
import findUp from 'find-up';
import { fileURLToPath } from 'url';
import { container } from 'tsyringe';
import { Context, Config } from './Interfaces';

/**
 * Handles registering context and config with the dependency injection container.
 * @param context The cli generated context.
 */
export const bootstrap = async (context: Context): Promise<void> => {
    if (context.configFilePath === undefined) {
        // We need to find the config file ourselves.
        context.configFilePath = await findUp('igniter.config.mjs');
        if (context.configFilePath === undefined) throw Error('Igniter config file not found.');
    } else if (!path.isAbsolute(context.configFilePath)) {
        // Replace the configFilePath with an absolute path instead.
        context.configFilePath = path.resolve(context.configFilePath);
    }

    // Final check whether the context file actually exists...
    if (!fs.existsSync(context.configFilePath)) throw Error(`${context.configFilePath} does not exist.`);

    // Register the final context with the dependency injection container.
    container.register<Context>('context', { useValue: context });

    // We're inside an ES module, so __filename and __dirname need to be defined.
    // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/naming-convention
    const __filename = fileURLToPath(import.meta.url);
    // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/naming-convention
    const __dirname = path.dirname(__filename);

    // Import the config from the config ES module (export default).
    const relativePath = path.relative(__dirname, context.configFilePath);
    const configModule = await import(relativePath);
    const config = configModule.default as Config;

    // Register the config with the dependency injection container.
    container.register<Config>('config', { useValue: config });
};

/**
 * Join a relative path with the context working directory to get an absolute path.
 * @param relativePath The relative path to join with the context working directory.
 * @returns The context working directory absolute path joined with relative path.
 */
export const absolute = (relativePath: string = ''): string => {
    const context = container.resolve<Context>('context');
    if (context === undefined) throw Error('Could not resolve context.');
    const workingDirectory = path.dirname(context.configFilePath);
    return path.join(workingDirectory, relativePath);
};

/**
 * Generates a hash from an absolute path.
 * @param absolutePath The absolute path.
 */
export const generateHashFromPath = (absolutePath: string): string => {
    // The hash is undefined if the path doesn't exist.
    if (!fs.existsSync(absolutePath)) return undefined;

    const stats = fs.statSync(absolutePath);
    if (stats.isFile()) return hasha(path.basename(absolutePath) + hasha.fromFileSync(absolutePath));
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return generateHashFromPaths(fs.readdirSync(absolutePath).map((i) => path.join(absolutePath, i)));
};

/**
 * Generates a hash from an array of absolute paths.
 * @param absolutePaths The array of absolute paths.
 */
export const generateHashFromPaths = (absolutePaths: string[]): string =>
    hasha(absolutePaths.map((p) => hasha(path.basename(p) + generateHashFromPath(p))).join(''));
