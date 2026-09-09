# VI Designs website

Static HTML, CSS and JavaScript portfolio. Serve the project with `python -m http.server 8000` and open `http://localhost:8000`. ES modules require an HTTP server rather than opening the HTML file directly.

Build the public files with `python script/build.py`; output is written to `dist/`. The original root files remain compatible with the existing static hosting setup.

The portfolio supports category filters, search, project deep links, keyboard and swipe gallery navigation, and a native modal image viewer. The layout supports mobile screens, browser zoom and reduced-motion preferences.

The contact form prepares an email to `info@videsignsplc.com` in the visitor's email application. It does not send or store messages on a server. Mailbox provisioning and delivery are managed separately by the domain's email provider.
