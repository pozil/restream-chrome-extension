console.log('Restream Studio Streamdeck extension starting on page '+ window.location);

const WEBSOCKET_URL = 'ws://127.0.0.1:5000/?client-type=browser';
const WEBSOCKET_RETRY_DELAY = 1000;
const STATE_REFRESH_DELAY = 500;

const DESIGN_TYPE_INDEXES = {
  "overlay": 3,
  "video": 4,
  "background": 5
}

/**
 * @typedef {Object} Source
 * @property {string} type Source type: "Webcam" or "Screen sharing"
 * @property {string} label
 * @property {boolean} isActive
 */

var websocket;
var isConnected = false;
connectWebSocket();
setInterval(reportState, STATE_REFRESH_DELAY);

function handleWsMessage(event) {
  console.log('WS message: ', event.data);  
  const message = JSON.parse(event.data);
  const { action } = message;

  if (action !== 'not-delivered') {
    updateExtensionStatus('green', 'Connected.');
  }

  try {
    switch (action) {
      case 'toggle-cam':
        click('#liveStudioToggleVideoButton');
      break;
      case 'toggle-design': {
        if (typeof message.type === 'undefined') {
          throw new Error('Missing design type');
        }
        const sectionIndex = DESIGN_TYPE_INDEXES[message.type];
        if (typeof sectionIndex === 'undefined') {
          throw new Error(`Unsupported design type: ${message.type}`);
        }
        const index = parseIndexValue(message, 'index');
        click(`#Graphics section:nth-child(${sectionIndex}) button[class^="ImageOption_button__"]`, index);
      }
      break;
      case 'toggle-layout': {
        const index = parseIndexValue(message, 'index');
        click('article[class^="LayoutSwitch_root__"] button', index);
      }
      break;
      case 'toggle-mic':
        click('#liveStudioToggleAudioButton');
      break;
      case 'toggle-share-screen':
        click('button[class*="ScreenSharingButton_root__"]');
      break;
      case 'toggle-source': {
          const index = parseIndexValue(message, 'index');
          click('[class^="ClientSources_sources__"] input[type="checkbox"]', index);
      }
      break;
      case 'not-delivered':
        updateExtensionStatus('red', 'Server failed to connect to Streamdeck.');
      break;
      case 'sd-connected':
      break;
      default:
        console.error(`Unsupported action: ${action}`);
      break;
    }
  } catch (error) {
    console.error(`${action} action failed: ${error}`);
  }
}

/**
 * Establish websocket connection with the WS server.
 * @returns {Promise<void>}
 */
async function connectWebSocket() {
  return new Promise((resolve) => {
    websocket = new WebSocket(WEBSOCKET_URL);

    websocket.onmessage = handleWsMessage;
  
    websocket.onerror = (error) => {
      if (isConnected) {
        console.error('WS error: ', error);
      }
    }

    websocket.onclose = async () => {
      if (isConnected) {
        console.log('WS closed');
      }
      isConnected = false;
      websocket = undefined;
      updateExtensionStatus('red', 'Failed to connect to server.');
      console.log(`Retrying WS connection in ${WEBSOCKET_RETRY_DELAY}ms...`);
      await wait(WEBSOCKET_RETRY_DELAY);
      await connectWebSocket();
    };

    websocket.onopen = () => {
      console.log('WS connected');
      isConnected = true;
      updateExtensionStatus('green', 'Connected.');
      resolve();
    };
  });
}

async function reportState() {
  const isLoaded = document.getElementById('root-loader').classList.contains('hidden');
  if (!isConnected || !isLoaded) {
    return;
  }
  const state = {
    isMicEnabled: getIsMicEnabled(),
    isCameraEnabled: getIsCameraEnabled(),
    sources: getSources(),
    activeLayoutIndex: getActiveLayoutIndex(),
    activeOverlayIndex: getActiveDesignItemIndex(3),
    activeVideoClipIndex: getActiveDesignItemIndex(4),
    activeBackgroundIndex: getActiveDesignItemIndex(5)
  };
  websocket.send(JSON.stringify({ type: 'state', state }));
}

/**
 * Clicks on an element
 * @param {string} selector 
 * @param {number} [index] optional element index. Zero by default.
 */
function click(selector, index=0) {
  if (index < 0) {
    console.error(`Invalid index value: ${index}`);
    return;
  }
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) {
    console.error(`Failed to locate selector ${selector}`);
  } else if (index >= elements.length) {
    console.error(`Failed to locate ${index}th element with selector ${selector}`);
  } else {
    elements[index].click();
  }
}

/**
 * Get current sources (webcams and screens)
 * @returns {[Source]}
 */
function getSources() {
  const sources = [];
  const sourceElements = document.querySelectorAll('[class^="ClientSources_sources__"]>section');
  sourceElements.forEach(el => {
    const headerEl = el.childNodes[0];
    const type = headerEl.querySelector('svg').ariaLabel;
    const label = headerEl.innerText;
    const isActive = el.childNodes[1].querySelector('input').checked;
    sources.push({ type, label, isActive });
  });
  return sources;
}

function getActiveDesignItemIndex(sectionIndex) {
  const elements = document.querySelectorAll(`#Graphics section:nth-child(${sectionIndex}) button[class^="ImageOption_button__"]`);
  return Array.from(elements).findIndex(el => el.className.indexOf('ImageOption_button--isSelected') !== -1);
}

function getActiveLayoutIndex() {
  const elements = document.querySelectorAll('article[class^="LayoutSwitch_root__"] button');
  return Array.from(elements).findIndex(el => el.className.indexOf('LayoutSwitch_active') !== -1);
}

function getIsMicEnabled() {
  const el = document.getElementById('liveStudioToggleAudioButton');
  return el.ariaLabel === 'Mute';
}

function getIsCameraEnabled() {
  const el = document.getElementById('liveStudioToggleVideoButton');
  return el.ariaLabel === 'Disable camera';
}

/**
 * Parses an index value out of a string property
 * @param {Object} parentObject 
 * @param {string} propertyName 
 * @returns {number} index value
 */
function parseIndexValue(parentObject, propertyName) {
  if (typeof parentObject[propertyName] === 'undefined') {
    throw new Error(`Missing ${propertyName} value`);
  }
  const index = Number.parseInt(parentObject[propertyName], 10);
  if (!Number.isSafeInteger(index)) {
    throw new Error(`${propertyName} value is not a safe integer`);
  }
  if (index < 0) {
    throw new Error(`${propertyName} value is negative`);
  }
  return index;
}

/**
 * Waits for a given duration.
 * @param {number} duration duration in milliseconds
 * @returns {Promise<void>} promise that resolves when the wait is over.
 */
async function wait(duration) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
}

function updateExtensionStatus(icon, status) {
  chrome.runtime.sendMessage({action: 'update-status', icon, status});
}
