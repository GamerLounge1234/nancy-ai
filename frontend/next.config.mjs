import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['onnxruntime-node'],
  },
  webpack: (config) => {
    // This tricks the AI library into using our empty mock file
    config.resolve.alias.sharp = path.resolve(__dirname, 'sharp-mock.js');
    return config;
  },
};

export default nextConfig;