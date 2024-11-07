```
npx igniter
```

```
npx igniter --help
```

```
Usage: igniter [options]

Options:
  -V, --version                 output the version number
  -c, --config <filename>       set the configuration file name (default:
                                "igniter.config.mjs")
  -j, --num-workers <number>    set the maximum number of workers to use
                                (default: Number.MAX_SAFE_INTEGER)
  -r, --regex <regex>           regular expression used to filter tasks, all
                                must pass if multiple args
  -i, --invert                  if true, previous regex will be used to reject
                                tasks
  --no-cache                    do not skip tasks, even if hash matches cache
  --no-tty                      do not show updating output, just show a single
                                render
  -d, --dry-run                 skip all tasks to show configuration
  --debug                       stop when an exception is thrown and show trace
  -h, --help                    display help for command
```
