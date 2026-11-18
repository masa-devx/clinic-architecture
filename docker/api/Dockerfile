# 手元の開発とテストで使う Rails のイメージ。本番用ではない（本番のイメージは段階7で作る）
# Ruby の版は、ここと apps/api/.ruby-version を同じにする
FROM ruby:4.0.9-slim

# pg（libpq-dev）・psych（libyaml-dev）・ネイティブ拡張のビルド（build-essential）に要るもの
RUN apt-get update -qq \
  && apt-get install -y --no-install-recommends build-essential libpq-dev libyaml-dev git \
  && rm -rf /var/lib/apt/lists/*

# gem は、イメージではなくボリューム（/bundle）に入れる。Gemfile を変えても、イメージを作り直さなくてよい
ENV BUNDLE_PATH=/bundle \
    BUNDLE_JOBS=4

WORKDIR /app/apps/api
