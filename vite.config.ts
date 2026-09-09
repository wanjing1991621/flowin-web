import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import {fileURLToPath,URL} from 'node:url';
import {sites} from '@openai/sites-vite-plugin';
export default defineConfig(({mode})=>{const env=loadEnv(mode,process.cwd(),'NEXT_PUBLIC_SUPABASE_');return {define:{'import.meta.env.NEXT_PUBLIC_SUPABASE_URL':JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL||''),'import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY':JSON.stringify(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'')},plugins:[react(),sites()],css:{postcss:{plugins:[tailwindcss()]}},resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},server:{host:'127.0.0.1',port:3000},build:{outDir:'dist/client'}}});
