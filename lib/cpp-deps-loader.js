import * as globals from './export.js';

let cppFiles = [];

const MUST_RETURN_ITERABLE = new Set([
  'ListInputFiles'
]);

const LEAVE_AS_IS = new Set([
  'SetConfig','ListSomeFiles'
]);
const OVERWRITE = { 'SubmitCode':()=> true};

// Optionally avoid overwriting existing properties
for (const [name, value] of Object.entries(globals)) {
  if(name == 'SetCpp'){
    globalThis[name] = (...args) => {
      cppFiles = [ ...cppFiles, ...args];
    };
  } else if(MUST_RETURN_ITERABLE.has(name)){
    globalThis[name] = () => { return []};
  } else if(LEAVE_AS_IS.has(name)){
      globalThis[name] = value;
  } else if (name in OVERWRITE) {
    globalThis[name] = OVERWRITE[name];
  } else {
    globalThis[name] = () => {};
  }
}

globals.__initialize(globalThis);
process.on('exit', ()=>{
  console.log(JSON.stringify({cppFiles, CFG: globals.CFG}))
})
