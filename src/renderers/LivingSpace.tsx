import React from 'react';
import LivingWorld from '../world/LivingWorld';

interface LivingSpaceProps { userId: string; }

export default function LivingSpace({ userId }: LivingSpaceProps) {
  return <LivingWorld userId={userId} />;
}
