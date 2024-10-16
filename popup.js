document.addEventListener("DOMContentLoaded", () => {
  const domainSelect = document.getElementById("domainSelect");
  const copyButton = document.getElementById("copyButton");
  const status = document.getElementById("status");

  chrome.storage.local.get("authTokens", (data) => {
    const authTokens = data.authTokens || {};
    for (const domain in authTokens) {
      const option = document.createElement("option");
      option.value = domain;
      option.textContent = domain;
      domainSelect.appendChild(option);
    }
  });

  domainSelect.addEventListener("change", () => {
    copyButton.disabled = !domainSelect.value;
  });

  copyButton.addEventListener("click", () => {
    const domain = domainSelect.value;
    if (domain) {
      chrome.storage.local.get("authTokens", (data) => {
        const authTokens = data.authTokens || {};
        const authToken = authTokens[domain];

        if (authToken) {
          navigator.clipboard
            .writeText(authToken)
            .then(() => {
              status.textContent = `Token for ${domain} copied to clipboard!`;
            })
            .catch((err) => {
              console.error("Failed to copy token:", err);
              status.textContent = "Failed to copy token.";
            });
        } else {
          status.textContent = "No token found for selected domain.";
        }
      });
    }
  });
});
