"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically load R3F Canvas to prevent Next.js SSR window/canvas mismatch errors
const ThreeDUniverse = dynamic(
  () => import("./landing/ThreeDUniverse").then((mod) => mod.ThreeDUniverse),
  { ssr: false }
);

interface AuthPortalProps {
  onAuthSuccess: () => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ onAuthSuccess }) => {
  return <ThreeDUniverse onAuthSuccess={onAuthSuccess} />;
};
