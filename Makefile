# Install deps
# Environment structure

.PHONY: build

install-deps: package.json package-lock.json yarn.lock
	yarn

build: install-deps
	npm run check
