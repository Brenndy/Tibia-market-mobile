import React from 'react';
import { useRouter } from 'expo-router';
import { WorldSelectContent } from '@/src/components/WorldSelectContent';

export default function WorldSelectScreen() {
  const router = useRouter();
  return <WorldSelectContent onSelected={() => router.back()} />;
}
