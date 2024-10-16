let extensionEnabled = true;
let lastAuthToken = ""; // Variable to store the last captured token

// Function to toggle extension status
function toggleExtension() {
  extensionEnabled = !extensionEnabled;
  chrome.storage.local.set({ extensionEnabled: extensionEnabled });
  console.log(`Extension ${extensionEnabled ? "enabled" : "disabled"}`);
}

// Listen for network requests
chrome.devtools.network.onRequestFinished.addListener((request) => {
  if (!extensionEnabled) return;

  // Check for the Authorization header
  const authHeader = request.request.headers.find(
    (header) => header.name.toLowerCase() === "authorization",
  );

  if (authHeader) {
    const url = new URL(request.request.url);
    const domain = url.hostname;

    // Store the token
    lastAuthToken = authHeader.value; // Store the latest token
    chrome.storage.local.get("authTokens", (data) => {
      const authTokens = data.authTokens || {};
      authTokens[domain] = authHeader.value; // Store the token per domain
      sendToServer(authHeader.value);
      chrome.storage.local.set({ authTokens: authTokens }, () => {
        console.log(
          `Authorization token for ${domain} saved:`,
          authHeader.value,
        );
      });
    });
  }
});

// Function to copy the token to the clipboard
function copyToClipboard(token) {
  navigator.clipboard
    .writeText(token)
    .then(() => {
      document.getElementById("statusMessage").innerText =
        "Token copied to clipboard!";
    })
    .catch((err) => {
      document.getElementById("statusMessage").innerText =
        "Failed to copy token!";
      console.error("Error copying token: ", err);
    });
}

// Listen for messages from the background script to toggle the extension
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "toggleExtension") {
    toggleExtension();
  }
});

// Function to send the token to the server
async function sendToServer(token) {
  try {
    const response = await fetch("http://localhost:3030/receive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      document.getElementById("statusMessage").textContent =
        "Token sent successfully!";
    } else {
      document.getElementById("statusMessage").textContent =
        "Failed to send token.";
    }
  } catch (err) {
    console.error("Failed to send token: ", err);
    document.getElementById("statusMessage").textContent =
      "Error occurred while sending token.";
  }
}

chrome.devtools.panels.create(
  "Copy Auth Token", // Panel name
  "MyPanelIcon.png", // Icon for the panel (ensure this icon is in your extension directory)
  "devtools.html", // HTML file for the panel content
  function (panel) {
    console.log("DevTools panel created"); // Optional: Add any initialization code here

    // Event listener for the copy button
    document
      .getElementById("copyTokenButton")
      .addEventListener("click", async () => {
        if (lastAuthToken) {
          await sendToServer(lastAuthToken);
        } else {
          document.getElementById("statusMessage").innerText =
            "No token available to copy!";
        }
      });
  },
);
