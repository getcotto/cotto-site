// Resolve the Cotto spine directory.
//
// Cloud routines clone this repo and run from /pipeline, so the spine lives at ../spine.
// During the local-to-cloud migration you can point the scripts at the live Dropbox copy
// by setting COTTO_SPINE, e.g.:
//   $env:COTTO_SPINE = 'C:\Users\kenda\Dropbox\Cotto'   # PowerShell
//   COTTO_SPINE=/path/to/spine node pipeline/emit-snapshot.js
//
// With no env set, scripts use the repo's own spine/ folder — which is what cloud runs do.
const path = require('path');

const SPINE = process.env.COTTO_SPINE || path.resolve(__dirname, '..', 'spine');

module.exports = { SPINE };
