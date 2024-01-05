const RESTREAM_STUDIO_URL = 'https://studio.restream.io/';

chrome.runtime.onMessage.addListener((request) => {
      if (request.action === "update-status") {
        updateExtensionStatus(request.icon, request.status)
      } else {
        throw new Error(`Unsupported action: ${request.action}`);
      }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const { status } = changeInfo;
  if (status == 'complete') {
    // Restream Studio opened in a new tab
    if (tab.url.startsWith(RESTREAM_STUDIO_URL)) {
      updateExtensionStatus('default', 'Starting...');
    }
  } else if (status === 'unloaded') {
    // Restrean Studio tab unloaded
    checkForRemainingTabsAndUpdateStatus();
  }
});

// Handle closed tabs
chrome.tabs.onRemoved.addListener(() => {
  checkForRemainingTabsAndUpdateStatus();
});

/**
 * Checks if Restream Studio is still open and update status accordinlgy
 */
function checkForRemainingTabsAndUpdateStatus() {
  chrome.tabs.query(
    { url: RESTREAM_STUDIO_URL +'*' },
    (tabs) => {
      if (tabs.length === 0) {
        updateExtensionStatus('default', 'Inactive: Restream Studio is not open.');
      }
    }
  );
}

function updateExtensionStatus(icon, status) {
  chrome.action.setTitle({
    title: `Restream Studio Streamdeck - ${status}`
  });
  chrome.action.setIcon({ path: {
    '16': `/icons/${icon}/icon16.png`,
    '32': `/icons/${icon}/icon32.png`,
    '48': `/icons/${icon}/icon48.png`,
    '128': `/icons/${icon}/icon128.png`
  }});
}