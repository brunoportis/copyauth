chrome.runtime.onInstalled.addListener(() => {
  // Initialize the context menu
  chrome.contextMenus.create({
    id: "toggleExtension",
    title: "Disable Copy Authorization Header",
    contexts: ["browser_action"],
  });

  // Set initial storage
  chrome.storage.local.set({
    authTokens: {},
    extensionEnabled: true,
  });
});

// Toggle extension state via context menu
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "toggleExtension") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "toggleExtension" });
    });
  }
});
