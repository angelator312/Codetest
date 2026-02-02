# Test runner

## Install

1.  Clone this repo

2.  In the cloned repo directory run

        npm install
        npm link

## Usage

1. Create a js file, to generate test data. See example folder, i.e testGen.js

2. Run it with:

```sh
    # Run once
    codetest testGen.js N=30..31 M=5..6

    # Rerun on each change with verbose output and keeping input files
    codetest testGen.js N=30..31 M=5..6 --verbose --keep-input --watch
```

### Dev

```sh
    codetest dev CPP=sum.cpp DIR=test.in.d
```

The script will run the tests(from the DIR or `nameOfCPP.d`) and compare the output with the expected output.
Tests starting whith '.someName' are ignored.
See example folder.

### Options

Options can be specified in any order.

- **--verbose** - verbose output
- **--keep-input** - After successful test, preserve the input file
- **--watch** - Watch test file and rerun automatically on change

### Parameters

All parameters must be one of:

- **VAR=VALUE** - variable named VAR will be exported in the global namespace with value VALUE

- **VAR=<RANGE_START>..<RANGE_END>** - global variable that is iterated from RANGE_START to RANGE_END. The increment happens only if NextCase() is called.

### Commands

Press Ctrl-G while the command is running(watch mode is required) for help.

### Sending to judges

Press Ctr-F
If CPP file first line is like `// judge.orc/...` and the judge is supported. The file 'll be submitted.

There's also way to authenticate

1. Cses
   - Run `codetest --auth cses`
   - You'll be prompted to type your username and password
   - If you typed it correctly the command is going to exit with OK.

## TODO:

1. Add more onilne judges
2. Make a blog post about Codetest
3. More examples
4. Remade sender
5. Make a new command for getting constrains of the problem
6. Make generateble templates for code

- with dynamic constraints
- dynamic input logic
- codesender new CPP=... URL=...

7. Support other languages(not only c++)
