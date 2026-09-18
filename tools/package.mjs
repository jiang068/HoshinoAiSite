// Compatibility entry point for the old command. The production build now lives in vite.config.mjs.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const vite=join(root,'node_modules','vite','bin','vite.js');
const child=spawn(process.execPath,[vite,'build'],{cwd:root,stdio:'inherit'});
child.on('exit',code=>process.exit(code??1));
