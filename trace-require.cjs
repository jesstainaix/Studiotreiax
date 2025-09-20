const Module = require('module');
const path = require('path');
const realLoad = Module._load, realResolve = Module._resolveFilename;
const MAIN = path.resolve(__dirname, 'api/main.ts');

Module._resolveFilename = function(request, parent, isMain, options) {
  const resolved = realResolve.call(this, request, parent, isMain, options);
  if (resolved === MAIN) {
    console.error('[TRACE] require() -> api/main.ts from:', parent && parent.filename);
    console.error((new Error('require stack')).stack);
  }
  return resolved;
};

Module._load = function(request, parent, isMain) { 
  return realLoad.apply(this, arguments); 
};