// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0
import { ThemedView } from "@/components/ThemedView";
import ProductList from "@/components/ProductList";
import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import ApiGateway from "@/gateways/Api.gateway";
import Bugsnag from "@bugsnag/expo";
import BugsnagPerformance from "@bugsnag/react-native-performance";
import React from "react";

const apiKey = process.env.EXPO_PUBLIC_BUGSNAG_API_KEY as string;

Bugsnag.start({ apiKey: apiKey });

const ErrorBoundary = Bugsnag.getPlugin("react").createErrorBoundary(React);

BugsnagPerformance.start({
  apiKey: apiKey,
  appVersion: process.env.EXPO_PUBLIC_BUGSNAG_APP_VERSION,
  releaseStage: process.env.EXPO_PUBLIC_BUGSNAG_RELEASE_STAGE,
  autoInstrumentAppStarts: true,
  tracePropagationUrls: [/^(http(s)?(:\/\/))?(www\.)?([0-9A-Za-z-\\.@:%_\+~#=]+)(\.[a-zA-Z]{2,3})?(\/.*)?$/],
});

function Index() {
  const { data: productList = [] } = useQuery({
    // TODO simplify react native demo for now by hard-coding the selected currency
    queryKey: ["products", "USD"],
    queryFn: () => ApiGateway.listProducts("USD"),
  });

  return (
    <ErrorBoundary>
      <ThemedView style={styles.container}>
        <ScrollView>
          {productList.length ? (
            <ProductList productList={productList} />
          ) : (
            <ThemedText>
              No products found, make sure the backend services for the
              OpenTelemetry demo are running
            </ThemedText>
          )}
        </ScrollView>
      </ThemedView>
    </ErrorBoundary>
  );
}

export default BugsnagPerformance.withInstrumentedAppStarts(Index);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
