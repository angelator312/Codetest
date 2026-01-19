# Test runner

## Install

1. Clone this repo

2. In the cloned repo directory run

        npm install
        npm link


## Usage

1. Create a js file, to generate test data. See example folder, i.e testGen.js

2. Run it with:

```sh
    # Run once
    Codetest testGen.js N=30..31 M=5..6

    # Rerun on each change with verbose output and keeping input files
    Codetest testGen.js N=30..31 M=5..6 --verbose --keep-input --watch
```

### Options

Options can be specified in any order.

- **--verbose** - verbose output
- **--keep-input** - After successful test, preserve the input file
- **--watch** - Watch test file and rerun automatically on change

### Parameters

All parameters  must be one of:

- **VAR=VALUE** - variable named VAR will be exported in the global namespace with value VALUE

- **VAR=<RANGE_START>..<RANGE_END>** - global variable that is iterated from RANGE_START to RANGE_END. The increment happens only if NextCase() is called.
