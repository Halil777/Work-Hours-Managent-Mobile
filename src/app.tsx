import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import RootNavigation from './navigation';

const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <RootNavigation />
    </QueryClientProvider>
  );
}
