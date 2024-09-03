document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("extension-id")!.textContent = chrome.runtime.id;

  // Add copy functionality
  const copyButton = document.getElementById("copy-button");
  const extensionIdElement = document.getElementById("extension-id");

  if (copyButton && extensionIdElement) {
    copyButton.addEventListener("click", () => {
      const extensionId = extensionIdElement.textContent;
      if (extensionId) {
        navigator.clipboard
          .writeText(extensionId)
          .then(() => {
            const originalText = copyButton.textContent;
            copyButton.textContent = "Copied!";
            setTimeout(() => {
              copyButton.textContent = originalText;
            }, 2000);
          })
          .catch((err) => {
            console.error("Failed to copy text: ", err);
          });
      }
    });
  }

  // Handle AWS credentials
  const saveButton = document.getElementById("save-button");
  const awsKeyInput = document.getElementById("aws-key") as HTMLInputElement;
  const awsSecretInput = document.getElementById(
    "aws-secret"
  ) as HTMLInputElement;
  const feedbackElement = document.createElement("p");
  feedbackElement.className = "text-green-500 mt-2";
  saveButton?.parentNode?.appendChild(feedbackElement);

  if (saveButton && awsKeyInput && awsSecretInput) {
    saveButton.addEventListener("click", () => {
      const accessKeyId = awsKeyInput.value || "";
      const secretAccessKey = awsSecretInput.value || "";

      const awsCredentials = { accessKeyId, secretAccessKey };
      chrome.storage.local.set({ awsCredentials }, () => {
        const originalText = saveButton.textContent;
        saveButton.textContent = "Saved!";
        setTimeout(() => {
          saveButton.textContent = originalText;
        }, 2000);
      });
    });

    // Load saved credentials
    chrome.storage.local.get(["awsCredentials"], (result) => {
      if (
        result.awsCredentials.accessKeyId &&
        result.awsCredentials.secretAccessKey
      ) {
        awsKeyInput.value = result.awsCredentials.accessKeyId;
        awsSecretInput.value = result.awsCredentials.secretAccessKey;
      }
    });
  }
});
