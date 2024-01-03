chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "update-status") {
        chrome.action.setTitle({
          title: `Restream Studio Streamdeck - ${request.status}`
        });
        chrome.action.setIcon({ path: {
          '16': `/icons/${request.icon}/icon16.png`,
          '32': `/icons/${request.icon}/icon32.png`,
          '48': `/icons/${request.icon}/icon48.png`,
          '128': `/icons/${request.icon}/icon128.png`
        }});
      } else {
        throw new Error(`Unsupported action: ${request.action}`);
      }
});
