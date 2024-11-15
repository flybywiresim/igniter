```
npx igniter
```

```
npx igniter --help
```

```
Usage: igniter [options]

Options:
  -V, --version               output the version number
  -c, --config <filename>     Set the configuration file name (default:
                              "igniter.config.mjs")
  -j, --num-workers <number>  Set the maximum number of workers to use
                              (default: Number.MAX_SAFE_INTEGER)
  -r, --regex <regex>         Regular expression used to filter tasks. When
                              multiple regex arguments are supplied, only
                              tasks that match all of the arguments will be
                              run
  -i, --invert                If true, the preceeding regex argument will be
                              used to reject tasks instead
  --no-cache                  Do not skip tasks, even if hash matches cache
  --no-tty                    Do not show updating output, just show a single
                              render
  -d, --dry-run               Skip all tasks to show configuration
  --debug                     Stop when an exception is thrown and show trace
  -h, --help                  display help for command
```
