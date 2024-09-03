.PHONY: build chrome firefox

VERSION := 1.0.5

# Detect OS for sed command
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Darwin)
    SED_INPLACE := sed -i ''
else
    SED_INPLACE := sed -i
endif

build-chrome:
	@npm run build:chrome
	@$(SED_INPLACE) 's/"version": ".*"/"version": "$(VERSION)"/' dist/chrome/manifest.json

build-firefox:
	@npm run build:firefox
	@$(SED_INPLACE) 's/"version": ".*"/"version": "$(VERSION)"/' dist/firefox/manifest.json

chrome: build-chrome
	@DATETIME=$(shell date +%Y%m%d%H%M%S) && \
	(cd dist/chrome && zip -r ../../awsdash-browser-extension-$(VERSION)-$$DATETIME.zip .)

firefox: build-firefox
	@DATETIME=$(shell date +%Y%m%d%H%M%S) && \
	(cd dist/firefox && zip -r ../../awsdash-firefox-extension-$(VERSION)-$$DATETIME.zip .)