# Copyright The OpenTelemetry Authors
# SPDX-License-Identifier: Apache-2.0

FROM python:3.12-slim-bookworm

WORKDIR /build

# grpcio-tools 1.59.2 imports pkg_resources, which setuptools 81+ no longer ships
RUN python -m pip install grpcio-tools==1.59.2 "setuptools<81"
