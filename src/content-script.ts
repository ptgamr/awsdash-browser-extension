import browser from "webextension-polyfill";

console.log("AwsDash - Content script loaded");

const AWSDASHCOM_WEB_URLS = ["http://localhost:5173", "https://awsdash.com"];

// Listen for messages from the web page
window.addEventListener("message", async (event) => {
  if (event.source !== window || event.data.source !== "AWSDASHCOM_WEB") {
    return;
  }

  // Forward the message to the background script, including the messageId
  const response = await browser.runtime.sendMessage(event.data.payload);

  sendMessageToWeb({
    source: "AWSDASHCOM_EXT",
    type: "RESPONSE",
    messageId: event.data.messageId,
    response,
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sendMessageToWeb(message: any) {
  const targetOrigin = window.location.origin;
  if (AWSDASHCOM_WEB_URLS.includes(targetOrigin)) {
    window.postMessage(message, targetOrigin);
  }
}

async function extensionReadyCheck() {
  const [response, manifest] = await Promise.all([
    browser.runtime.sendMessage({
      source: "AWSDASHCOM_EXT",
      type: "GET_AWS_PROFILES",
    }),
    browser.runtime.getManifest(),
  ]);

  sendMessageToWeb({
    source: "AWSDASHCOM_EXT",
    type: "NOTIFICATION",
    payload: {
      type: "EXTENSION_READY",
      profiles: response,
      version: manifest.version,
    },
  });
}

extensionReadyCheck();

// Send ready message again after a short delay, in case the page wasn't ready
setTimeout(() => {
  extensionReadyCheck();
}, 1000);

const port = browser.runtime.connect({
  name: "awsdashcom-background-to-content",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
port.onMessage.addListener((message: any) => {
  if (message.type === "NOTIFICATION") {
    console.log("content script receive notification", message.payload);
    sendMessageToWeb({
      source: "AWSDASHCOM_EXT",
      type: "NOTIFICATION",
      payload: message.payload,
    });
  }
});
