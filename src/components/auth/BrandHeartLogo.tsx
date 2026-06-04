import React from 'react';
import { Logo } from '../Logo';

interface Props {
  size?: number;
}

export function BrandHeartLogo({ size = 72 }: Props) {
  return <Logo size={size} />;
}
