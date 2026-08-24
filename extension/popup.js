const btn = document.getElementById('download-btn');
const statusEl = document.getElementById('status');

const DATA_URL_LIMIT = 1500000;
const POLL_INTERVAL_MS = 500;
const WAIT_TIMEOUT_MS = 60000;

let busy = false;

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = kind || '';
}

function formatBytes(n) {
  if (n < 1024) return n + ' bytes';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

async function grabArtifact() {
  if (!location.hostname.endsWith('.frame.claudeusercontent.com')) {
    return { matched: false };
  }
  const uuid = location.hostname.split('.')[0] || 'artifact';
  let html = null;
  let via = 'fetch';
  try {
    const res = await fetch(location.href, { credentials: 'include' });
    if (res.ok) {
      html = await res.text();
    }
  } catch (_) {}
  if (!html) {
    html = document.documentElement.outerHTML;
    via = 'dom';
  }
  return { matched: true, filename: uuid + '.html', via, html, url: location.href };
}

async function waitForDownload(id) {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const items = await chrome.downloads.search({ id });
    if (items.length) {
      const state = items[0].state;
      if (state === 'complete') return;
      if (state === 'interrupted') throw new Error('The download was interrupted');
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error('Timed out while waiting for the download');
}

async function startDownload(args) {
  const id = await chrome.downloads.download(args);
  await waitForDownload(id);
}

btn.addEventListener('click', async () => {
  if (busy) return;
  busy = true;
  btn.disabled = true;
  setStatus('Downloading...');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      setStatus('No active tab found.', 'error');
      return;
    }
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: grabArtifact
    });
    const hits = results.filter((r) => r.result && r.result.matched);
    if (hits.length === 0) {
      setStatus('No Claude artifact found in this tab.', 'error');
      return;
    }
    const { filename, html, url } = hits[0].result;
    if (html.length <= DATA_URL_LIMIT) {
      await startDownload({
        url: 'data:text/html;charset=utf-8,' + encodeURIComponent(html),
        filename,
        saveAs: false
      });
    } else {
      await startDownload({ url, filename, saveAs: false });
    }
    setStatus('Saved ' + filename + ' (' + formatBytes(html.length) + ').', 'ok');
  } catch (err) {
    setStatus('Error: ' + (err && err.message ? err.message : err), 'error');
  } finally {
    busy = false;
    btn.disabled = false;
  }
});
