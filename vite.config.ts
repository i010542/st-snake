import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const electronBuild = process.env.ELECTRON_BUILD === '1';

export default defineConfig({
  base: electronBuild ? './' : '/st-snake/',
  plugins: [react()],
});
