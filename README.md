# ZIP Manifest Web App

This repository contains a single page application that reads a `.zip` file and generates a text manifest. The manifest lists each file name, uncompressed size and timestamp from the archive.

## Usage

1. Open `index.html` in a modern web browser.
2. Drag and drop a `.zip` file onto the drop area or use the file selector.
3. The page displays the manifest contents and enables a download button for `manifest.txt`.

The interface has a language switcher that toggles between Turkish and English.

## Dependencies

The page loads **JSZip** and **FileSaver.js** from a CDN:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
```

No additional setup is required.
