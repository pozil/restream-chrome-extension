# Stream Deck Restream Chrome Extension

## Overview

Chrome Extension for the unofficial Elgato Stream Deck plugin that controls Restream Studio.

![Screenshot of the Stream Deck plugin](https://github.com/pozil/streamdeck-restream-plugin/raw/main/src/org.pozil.restream.sdPlugin/previews/screenshot.png)

This solution requires three components to run:
1. [A Node.js server](https://github.com/pozil/streamdeck-restream-server)
1. A Chrome extension (this project)
1. [A Stream Deck plugin](https://github.com/pozil/streamdeck-restream-plugin)

## Chrome Extension Setup

Install this extension from the Chrome Web Store.

Once the Chrome extension is installed, install the [Streamdeck Plugin](https://github.com/pozil/streamdeck-restream-plugin).


## Troubleshooting

**Extension icon is grey with a red stroke**

This either means that the server is not running or that the server cannot reach the Streamdeck extension. Check the tooltip on the extension icon for more details.
