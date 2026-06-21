// Resolve the Cotto spine directory so the SAME engine files run locally and in the cloud.
// Canonical home is the Dropbox spine — the ONLY local write target (see the data contract).
// Resolution order (auto-detect so no local writer can ever silently default into a repo copy):
//   1. COTTO_SPINE env var          — explicit override, always wins
//   2. the live Dropbox spine       — IF it exists on this machine -> every LOCAL run hits canonical
//   3. the repo's own ../spine      — the CLOUD case, where Dropbox doesn't exist
const fs = require('fs');
const path = require('path');
const DROPBOX = 'C:\\Users\\kenda\\Dropbox\\Cotto';
let SPINE = process.env.COTTO_SPINE;
if (!SPINE) SPINE = fs.existsSync(DROPBOX) ? DROPBOX : path.resolve(__dirname, '..', 'spine');
module.exports = { SPINE };
