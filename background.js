let extensionEnabled = true;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "toggleExtension",
    title: "Disable Copy Authorization Header",
    contexts: ["browser_action"],
  });

  chrome.storage.local.set({
    authTokens: {},
    extensionEnabled: extensionEnabled,
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "toggleExtension") {
    extensionEnabled = !extensionEnabled;
    chrome.storage.local.set({ extensionEnabled: extensionEnabled }, () => {
      chrome.contextMenus.update("toggleExtension", {
        title: extensionEnabled
          ? "Disable Copy Authorization Header"
          : "Enable Copy Authorization Header",
      });
      console.log(`Extension ${extensionEnabled ? "enabled" : "disabled"}`);
    });
  }
});

chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    if (!extensionEnabled) return;

    let authToken = null;
    for (const header of details.requestHeaders) {
      if (header.name.toLowerCase() === "authorization") {
        authToken = header.value;
        break;
      }
    }

    if (authToken) {
      const url = new URL(details.url);
      const domain = url.hostname;

      chrome.storage.local.get("authTokens", (data) => {
        const authTokens = data.authTokens || {};
        authTokens[domain] = authToken;
        chrome.storage.local.set({ authTokens: authTokens }, () => {
          console.log(`Authorization token for ${domain} saved:`, authToken);
        });
      });
    }
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"],
);

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get("extensionEnabled", (data) => {
    extensionEnabled =
      data.extensionEnabled !== undefined ? data.extensionEnabled : true;
    chrome.contextMenus.update("toggleExtension", {
      title: extensionEnabled
        ? "Disable Copy Authorization Header"
        : "Enable Copy Authorization Header",
    });
  });
});
