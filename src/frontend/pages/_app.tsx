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
import SessionGateway from '../gateways/Session.gateway';
import { OpenFeatureProvider, OpenFeature } from '@openfeature/react-sdk';
import { FlagdWebProvider } from '@openfeature/flagd-web-provider';
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
      if (networkRequestInfo.url.endsWith('flagd.evaluation.v1.Service/EventStream')) {
        return null;
      }
      networkRequestInfo.propagateTraceContext = networkRequestInfo.url?.startsWith(window.origin);
      return networkRequestInfo;
    }
  } as any);

  if (window.location) {
    const session = SessionGateway.getSession();

    // Set context prior to provider init to avoid multiple http calls
    OpenFeature.setContext({ targetingKey: session.userId, ...session }).then(() => {
      /**
       * We connect to flagd through the envoy proxy, straight from the browser,
       * for this we need to know the current hostname and port.
       */

      const useTLS = window.location.protocol === 'https:';
      let port = useTLS ? 443 : 80;
      if (window.location.port) {
        port = parseInt(window.location.port, 10);
      }

      OpenFeature.setProvider(
        new FlagdWebProvider({
          host: window.location.hostname,
          pathPrefix: 'flagservice',
          port: port,
          tls: useTLS,
          maxRetries: 3,
          maxDelay: 10000,
        })
      );
    });
  }
}

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  const bugsnagReactPlugin = Bugsnag.getPlugin('react');
  const ErrorBoundary = bugsnagReactPlugin?.createErrorBoundary(React) || React.Fragment;

  return (
    <ErrorBoundary>
      <ThemeProvider theme={Theme}>
        <OpenFeatureProvider>
          <QueryClientProvider client={queryClient}>
            <CurrencyProvider>
              <CartProvider>
                <Component {...pageProps} />
              </CartProvider>
            </CurrencyProvider>
          </QueryClientProvider>
        </OpenFeatureProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);

  return { ...appProps };
};

export default MyApp;
