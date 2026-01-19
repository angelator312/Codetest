# Test runner

## Install

1. Clone this repo

2. In the cloned repo directory run

        npm install
        npm link


## Usage

1. Create a js file, to generate test data. See example folder, i.e testGen.js

2. Run it with:

    Codetest testGen.js N=30..31 M=5..6

### Options

Options can be specified in any order.

- **--verbose** - verbose output
- **--keep-input** - After successful test, preserve the input file

### Parameters

All parameters  must be one of:

- **<VAR>=<VALUE>** - variable named VAR will be exported in the global namespace with value VALUE

- **<VAR>=<RANGE_START>..<RANGE_END> - global variable that is iterated from RANGE_START to RANGE_END. The increment happens only if NextCase() is called.
