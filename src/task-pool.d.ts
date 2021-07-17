declare module "task-pool" {
    export type PoolStyle = 'callback' | 'promise'

    export interface PoolInit {
        timeout: number,
        style: PoolStyle,
        limit: number,
    }

    export interface PoolTaskOptions {
        timeout: number,
        style: PoolStyle,
    }

    export type PoolTaskFunction<TArgs> = (...args: TArgs[]) => any

    export interface PoolTask<TFnArgs> {
        fn: PoolTaskFunction<TFnArgs>,
        timeout: number,
        style: PoolStyle,
        args: any[],
        on: (event: string, fn: (event: any) => void) => void,
    }

    export type PoolTaskFactory<TPoolStyle extends PoolStyle> = <TArgs>(...args: TArgs[]) =>
        (TPoolStyle extends 'callback' ?  PoolTask<TArgs> : Promise<any> & PoolTask<any>)

    export class Pool<TPoolStyle extends PoolStyle = 'callback'> {
        constructor(init: Partial<PoolInit>)

        timeout: Pick<PoolInit, 'timeout'>

        style: TPoolStyle

        limit: Pick<PoolInit, 'limit'>

        running: number

        queue: PoolTask<any>[]

        wrap(Function, options?: Partial<PoolTaskOptions>): PoolTaskFactory<TPoolStyle>

        next()

        start(): boolean

        add(task: PoolTask<any>)

        get promise(): Pool<'promise'>
    }
}
