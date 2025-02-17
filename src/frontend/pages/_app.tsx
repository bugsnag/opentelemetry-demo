// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import '../styles/globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App, { AppContext, AppProps } from 'next/app';
import CurrencyProvider from '../providers/Currency.provider';
import CartProvider from '../providers/Cart.provider';
import { ThemeProvider } from 'styled-components';
import Theme from '../styles/Theme';
import BugsnagPerformance, { DefaultRoutingProvider } from '@bugsnag/browser-performance';
import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact from '@bugsnag/plugin-react';

declare global {
  interface Window {
    ENV: {
      NEXT_PUBLIC_PLATFORM?: string;
      NEXT_PUBLIC_OTEL_SERVICE_NAME?: string;
      NEXT_PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?: string;
      IS_SYNTHETIC_REQUEST?: string;
      BUGSNAG_API_KEY: string;
      OTEL_SERVICE_NAME: string;
      BUGSNAG_APP_VERSION: string;
      BUGSNAG_RELEASE_STAGE: string;
    };
  }
}

const resolveRoute = function resolveRoute(url: URL): string {
  const pathname = url.pathname

  if (pathname.startsWith('/product')) {
    return '/product/{product-id}'
  }

  if (pathname.startsWith('/api/products/')) {
    return '/api/products/{product-id}'
  }

  if (pathname.startsWith('/cart/checkout/')) {
    return '/cart/checkout/{order-id}'
  }

  return pathname
}

if (typeof window !== 'undefined') {
  Bugsnag.start({
    apiKey: window.ENV.BUGSNAG_API_KEY,
    plugins: [new BugsnagPluginReact()],
  });
  
  BugsnagPerformance.start({
    apiKey: window.ENV.BUGSNAG_API_KEY,
    appVersion: window.ENV.BUGSNAG_APP_VERSION,
    releaseStage: window.ENV.BUGSNAG_RELEASE_STAGE,
    bugsnag: Bugsnag,
    batchInactivityTimeoutMs: 1000,
    routingProvider: new DefaultRoutingProvider(resolveRoute),
    networkRequestCallback: (networkRequestInfo: any) => {
      networkRequestInfo.propagateTraceContext = networkRequestInfo.url?.startsWith(window.origin);
      return networkRequestInfo;
    }
  } as any);
}

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  const bugsnagReactPlugin = Bugsnag.getPlugin('react');
  const ErrorBoundary = bugsnagReactPlugin?.createErrorBoundary(React) || React.Fragment;

  return (
    <ErrorBoundary>
      <ThemeProvider theme={Theme}>
        <QueryClientProvider client={queryClient}>
          <CurrencyProvider>
            <CartProvider>
              <Component {...pageProps} />
            </CartProvider>
          </CurrencyProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);

  return { ...appProps };
};

export default MyApp;
