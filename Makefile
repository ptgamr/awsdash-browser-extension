.PHONY: build chrome

build-chrome:
	@npm run build:chrome

build-firefox:
	@npm run build:firefox

chrome: build-chrome
	@VERSION=$(shell jq -r '.version' manifest.json) && \
	DATETIME=$(shell date +%Y%m%d%H%M%S) && \
	(cd dist/chrome && zip -r ../../awsdash-browser-extension-$$VERSION-$$DATETIME.zip .)

firefox: build-firefox
	@VERSION=$(shell jq -r '.version' manifest.json) && \
	DATETIME=$(shell date +%Y%m%d%H%M%S) && \
	(cd dist/firefox && zip -r ../../awsdash-firefox-extension-$$VERSION-$$DATETIME.zip .)