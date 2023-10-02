export default class ExecTaskError extends Error {
    constructor(public readonly stderr: string) {
        super('Error in ExecTask spawned process');
    }
}
