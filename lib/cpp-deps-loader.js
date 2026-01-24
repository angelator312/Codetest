import * as globals from './export.js';

let cppFiles = [];

const MUST_RETURN_ITERABLE = new Set([
  'ListInputFiles'
]);

// Optionally avoid overwriting existing properties
for (const [name, value] of Object.entries(globals)) {
  if(name == 'SetCpp'){
    globalThis[name] = (...args) => {
      cppFiles = [ ...cppFiles, ...args];
    };
  } else if(MUST_RETURN_ITERABLE.has(name)){
    globalThis[name] = () => { return []};

  } else {
    globalThis[name] = () => {};
  }
}
globals.__initialize(globalThis);
process.on('exit', ()=>{
  console.log(JSON.stringify({cppFiles}))
})