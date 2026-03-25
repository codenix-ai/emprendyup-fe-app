import React from 'react';
import Link from 'next/link';
import { FiArrowLeft } from '../assets/icons/vander';

export default function BackToHome() {
  return (
    <div className="fixed bottom-20 end-3">
      <Link
        href="/"
        className="back-button size-9 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center bg-fourth-base text-black rounded-full"
      >
        <FiArrowLeft className="h-4 w-4"></FiArrowLeft>
      </Link>
    </div>
  );
}
