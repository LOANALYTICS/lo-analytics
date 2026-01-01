import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    config.module.rules.push({
      test: /\.html$/,
      exclude: [
        /node_modules/,
        /\@mapbox\/node-pre-gyp/
      ],
      type: 'asset/source'
    });
    return config;
  }
};

export default nextConfig;
