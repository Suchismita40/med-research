import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    config.output.webassemblyModuleFilename = isServer
      ? '../static/wasm/[hash].wasm'
      : 'static/wasm/[hash].wasm';

    config.resolve.alias = {
      ...config.resolve.alias,
      '@midnight-ntwrk/bboard-api': path.resolve(__dirname, '../api/dist/index.js'),
      '@midnight-ntwrk/bboard-contract': path.resolve(__dirname, '../contract/dist/index.js'),
      'isomorphic-ws': path.resolve(__dirname, 'src/utils/ws-fallback.js'),
      'ws': path.resolve(__dirname, 'src/utils/ws-fallback.js'),
      '@midnight-ntwrk/compact-runtime': path.resolve(__dirname, '../node_modules/@midnight-ntwrk/compact-runtime/dist/index.js'),
    };

    if (isServer) {
      config.externals = [
        ...config.externals,
        '@midnight-ntwrk/midnight-js-contracts',
        '@midnight-ntwrk/midnight-js-protocol',
        '@midnight-ntwrk/midnight-js-types',
        '@midnight-ntwrk/midnight-js-fetch-zk-config-provider',
        '@midnight-ntwrk/midnight-js-http-client-proof-provider',
        '@midnight-ntwrk/midnight-js-indexer-public-data-provider',
        '@midnight-ntwrk/midnight-js-level-private-state-provider',
        '@midnight-ntwrk/midnight-js-network-id',
        '@midnight-ntwrk/midnight-js-node-zk-config-provider',
        '@midnight-ntwrk/midnight-js-utils',
        '@midnight-ntwrk/compact-js',
        '@midnight-ntwrk/compact-runtime',
        '@midnight-ntwrk/dapp-connector-api',
        '@midnight-ntwrk/bboard-contract',
        '@midnight-ntwrk/bboard-api',
      ];
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;
