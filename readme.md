Run all steps with cache hash checking.
```
./igniter
```

Run all steps, ignoring cache hash checking, still generate a cache.
```
./igniter --force
```

Run all steps, ignoring cache hash checking, do not generate a cache.
```
./igniter --no-cache
```

Run tasks whos names match "instruments" using regex.
```
./igniter instruments
```

Run tasks whos names match "instruments" or "manifest" using regex.
```
./igniter "instruments|manifest"
```

Regex step matching and flags can be used together like this:
```
./igniter --no-cache -- "instruments|manifest"
```

or like this:
```
./igniter "behaviors|manifest" --force
```
