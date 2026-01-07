import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Explicitly import process from node:process to fix 'Property cwd does not exist on type Process' error in Vite config
import process from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');

  // GitHub Pages 通常需要一个 base 路径（如 /repo-name/）
  // 如果你在 GitHub Actions 中设置了 GITHUB_PAGES=true 且提供了 REPO_NAME
  const isGitHubPages = env.GITHUB_PAGES === 'true';
  const base = isGitHubPages ? `/${env.REPO_NAME || ''}/`.replace(/\/+/g, '/') : '/';

  return {
    plugins: [react()],
    base: base,
    define: {
      // 在构建时替换代码中的 process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    }
  };
});