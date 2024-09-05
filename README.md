### What is this?
Companion browser extension for https://awsdash.com - A simple alternative UI to manage AWS resources.

### How to build the extenion

- OS requirement: Ubuntu 22.04 / Mac Sonoma (M1)
- Node version: 20.8.1

```
$ npm install
$ make firefox
```

### In firefox go to:

```
about:debugging#/runtime/this-firefox
```

To test the extension, click "Load Temporary Add-on" and select the `manifest.json` file in the `dist/firefox` directory.


### To inspect IndexDB stored inside background script

chrome-extension://<EXTENSION_ID>/manifest.json

Open developer tool

https://stackoverflow.com/questions/72910185/how-to-inspect-indexeddb-data-for-chrome-extension-manifest-v3
