# Claude Artifact HTML Downloader

A Chrome extension that downloads the HTML of the Claude artifact that is open in the current tab.

## Features

- Detects the Claude artifact frame in the active tab.
- Downloads the artifact HTML as a standalone `.html` file.
- Uses the artifact UUID as the file name.
- Falls back to the DOM source when a direct fetch is not possible.
- Downloads large artifacts from their original URL to avoid data URL size limits.

## Installation

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (top-right corner).
4. Click **Load unpacked**.
5. Select the `extension` folder.

## Usage

1. Open a Claude chat that contains an artifact.
2. Open the artifact so its frame is displayed in the tab.
3. Click the extension icon.
4. Click **Download artifact HTML**.
5. The file is saved to the default downloads folder.

## Permissions

The extension uses the following permissions:

| Permission | Reason |
| --- | --- |
| `activeTab` | Access to the current tab. |
| `scripting` | Executes the script that reads the artifact HTML. |
| `downloads` | Saves the artifact HTML file. |

The host permission `https://*.claudeusercontent.com/*` allows the extension to read artifact frames.

## How It Works

1. The popup injects a script into every frame of the active tab.
2. The script detects the frame whose hostname ends with `.frame.claudeusercontent.com`.
3. The script fetches the frame URL with cookies.
4. If the fetch fails, the script reads the DOM directly.
5. The popup downloads the HTML.
6. Small artifacts are downloaded as a data URL.
7. Large artifacts are downloaded from the original URL.

## Project Structure

```
extension/
  manifest.json   Chrome extension manifest (Manifest V3)
  popup.html      Popup interface
  popup.js        Download logic
```

## Version

Current version: 1.2.0
