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
  const awsKeyInput = document.getElementById("aws-key") as HTMLInputElement;
  const awsSecretInput = document.getElementById(
    "aws-secret"
  ) as HTMLInputElement;
  const feedbackElement = document.createElement("p");
  feedbackElement.className = "text-green-500 mt-2";
  awsSecretInput.parentNode?.appendChild(feedbackElement);

  let saveTimeout: number | null = null;

  const saveCredentials = () => {
    const accessKeyId = awsKeyInput.value.trim();
    const secretAccessKey = awsSecretInput.value.trim();

    const awsCredentials = { accessKeyId, secretAccessKey };
    chrome.storage.local.set({ awsCredentials }, () => {
      feedbackElement.textContent = "Saved!";
      setTimeout(() => {
        feedbackElement.textContent = "";
      }, 2000);
    });
  };

  const debounceSave = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(saveCredentials, 200) as unknown as number;
  };

  if (awsKeyInput && awsSecretInput) {
    awsKeyInput.addEventListener("input", debounceSave);
    awsSecretInput.addEventListener("input", debounceSave);

    // Load saved credentials
    chrome.storage.local.get(["awsCredentials"], (result) => {
      if (result.awsCredentials) {
        awsKeyInput.value = result.awsCredentials.accessKeyId || "";
        awsSecretInput.value = result.awsCredentials.secretAccessKey || "";
      }
    });
  }
});
