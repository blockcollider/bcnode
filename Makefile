# Install deps
# Environment structure

.PHONY: build

install-deps: package.json
	npm install

build: install-deps
