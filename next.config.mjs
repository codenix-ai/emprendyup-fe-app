/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    // allow images from Unsplash domains and from the S3 bucket used for uploads
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'emprendyup-images.s3.us-east-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
    domains: [
      'images.unsplash.com',
      'source.unsplash.com',
      'emprendyup-images.s3.us-east-1.amazonaws.com',
      'example.com',
    ],
  },
};

export default nextConfig;
