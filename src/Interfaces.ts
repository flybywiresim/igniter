/**
 * Lorem Ipsum Dolor Sit Amet.
 */
export type Executor = () => Promise<boolean>;

/**
 * Lorem Ipsum Dolor Sit Amet.
 */
export type ShouldRunConfig = { inFiles: string, outFiles: string } | (() => boolean);

/**
 * Lorem Ipsum Dolor Sit Amet.
 */
export interface Step {
    /**
     * The name of the task.
     */
    name: string,

    /**
   * Run this step using a async callback.
   */
    executor: Executor,

    /**
   * Whether this step should run.
   * Can either define in/out Files, or a callback returning a Boolean.
   */
    shouldRun?: ShouldRunConfig,
}

export interface Config {
    /**
     * The name of the current igniter project.
     */
    name: string,

    /**
   * The current version of this igniter project.
   */
    version: string,

    /**
   * The project build steps, defined as an array of arrays single array.
   * Outer array defines sequential steps, inner array defines parallel steps.
   */
    steps: Step[][],
}

export interface Context {
    matchStepNameRegex: RegExp|undefined,
    configFilePath: string|undefined,
}
