// NOTE: we should not improt anything here

console.log("Content script loaded");

const AWSDASHCOM_WEB_URLS = ["http://localhost:5173", "https://awsdash.com"];

// Listen for messages from the web page
window.addEventListener("message", (event) => {
  if (event.source !== window || event.data.source !== "AWSDASHCOM_WEB") {
    return;
  }

  // Forward the message to the background script, including the messageId
  chrome.runtime.sendMessage(event.data.payload, (response) => {
    // Forward the response back to the web page, including the original messageId
    sendMessageToWeb({
      source: "AWSDASHCOM_EXT",
      type: "RESPONSE",
      messageId: event.data.messageId,
      response,
    });
  });
});

function sendMessageToWeb(message: any) {
  const targetOrigin = window.location.origin;
  if (AWSDASHCOM_WEB_URLS.includes(targetOrigin)) {
    window.postMessage(message, targetOrigin);
  }
}

// Send ready message again after a short delay, in case the page wasn't ready
setTimeout(() => {
  sendMessageToWeb({
    source: "AWSDASHCOM_EXT",
    type: "NOTIFICATION",
    payload: { type: "EXTENSION_READY" },
  });
}, 1000);

const port = chrome.runtime.connect({
  name: "awsdashcom-background-to-content",
});

port.onMessage.addListener((message) => {
  if (message.type === "NOTIFICATION") {
    sendMessageToWeb({
      source: "AWSDASHCOM_EXT",
      type: "NOTIFICATION",
      payload: message.payload,
    });
  }
});
