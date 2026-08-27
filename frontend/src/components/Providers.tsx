"use client";

import React, { useState } from "react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "../store";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </Provider>
  );
}
