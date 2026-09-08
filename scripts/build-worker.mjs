import {mkdirSync,copyFileSync} from 'node:fs';
mkdirSync('dist/server',{recursive:true});
copyFileSync('server/worker.js','dist/server/index.js');
