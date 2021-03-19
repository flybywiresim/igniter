import fs from 'fs';
import path from 'path';
import hasha from 'hasha';
import findUp from 'find-up';
import { fileURLToPath } from 'url';
import { Task } from './Library/Contracts/Task';
import { Context } from './Library/Contracts/Context';

/**
 * Handles registering context and config with the dependency injection container.
 */
export const findConfigPath = async (configName: string): Promise<string> => {
    const configPath = await findUp(configName);
    if (configPath === undefined) throw Error('Igniter config file not found.');
    return configPath;
};

export const loadConfigTask = async (context: Context): Promise<Task> => {
    // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/naming-convention
    const __filename = fileURLToPath(import.meta.url);
    // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/naming-convention
    const __dirname = path.dirname(__filename);

    const relativePath = path.relative(__dirname, context.configPath).replace('\\', '/');
    return (await import(relativePath)).default;
};

/**
 * Join a relative path with the config folder path to get our storage path.
 */
export const storage = (context: Context, relativePath: string = ''): string => {
    const workingDirectory = path.dirname(context.configPath);
    return path.join(workingDirectory, relativePath);
};

/**
 * Generates a hash from an absolute path.
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
 */
export const generateHashFromPaths = (absolutePaths: string[]): string =>
    hasha(absolutePaths.map((p) => hasha(path.basename(p) + generateHashFromPath(p))).join(''));
