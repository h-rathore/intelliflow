/**
 * IntelliFlow — Automated Evidence Screenshot Capture via Headless Chrome CDP
 * Captures 4 genuine application screenshots directly from the running Next.js interface.
 */

import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const FRONTEND_URL = "http://localhost:3000";
const BACKEND_URL = "http://127.0.0.1:8000";
const SCREENSHOT_DIR = join(import.meta.dirname, "..", "..", "docs", "evidence", "screenshots");

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.callbacks = new Map();
    this.eventListeners = new Map();

    this.ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id && this.callbacks.has(data.id)) {
        const { resolve, reject } = this.callbacks.get(data.id);
        this.callbacks.delete(data.id);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      } else if (data.method && this.eventListeners.has(data.method)) {
        for (const listener of this.eventListeners.get(data.method)) {
          listener(data.params);
        }
      }
    };
  }

  async ready() {
    return new Promise((resolve, reject) => {
      if (this.ws.readyState === WebSocket.OPEN) return resolve();
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(
        res.exceptionDetails.exception?.description ||
          res.exceptionDetails.text ||
          "Evaluation error"
      );
    }
    return res.result?.value;
  }

  async captureScreenshot(outputPath) {
    const res = await this.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    const buffer = Buffer.from(res.data, "base64");
    writeFileSync(outputPath, buffer);
    console.log(`[Captured] ${outputPath} (${buffer.length} bytes)`);
  }

  close() {
    try {
      this.ws.close();
    } catch {}
  }
}

async function captureEvidence() {
  console.log("=== IntelliFlow Evidence Screenshot Capture ===");

  // 1. Verify servers
  console.log("1. Verifying server health...");
  const healthRes = await fetch(`${BACKEND_URL}/api/v1/health`);
  if (!healthRes.ok) throw new Error("Backend not responding on port 8000");
  console.log("   [OK] FastAPI Backend live:", await healthRes.json());

  const feRes = await fetch(FRONTEND_URL);
  if (!feRes.ok) throw new Error("Frontend not responding on port 3000");
  console.log("   [OK] Next.js Frontend live (HTTP 200)");

  // 2. Launch Chrome
  console.log("2. Spawning Headless Chrome (1280x900)...");
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDir = join(tmpdir(), `chrome_evidence_${Date.now()}`);
  const chromeProc = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    `--user-data-dir=${userDir}`,
    "--window-size=1280,900",
    "--no-first-run",
    "--disable-background-networking",
    FRONTEND_URL,
  ]);

  let cdp;
  try {
    let targets;
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      try {
        const res = await fetch("http://127.0.0.1:9222/json/list");
        targets = await res.json();
        const pageTarget = targets.find((t) => t.type === "page");
        if (pageTarget) {
          targets = [pageTarget];
          break;
        }
      } catch {}
    }

    if (!targets || !targets[0]) {
      throw new Error("Failed to connect to Chrome DevTools Protocol");
    }

    cdp = new CDPClient(targets[0].webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    // Wait for hydration
    await sleep(2000);

    // ─────────────────────────────────────────────────────────────
    // SCREENSHOT 1: Initial Command Workspace
    // ─────────────────────────────────────────────────────────────
    console.log("3. Capturing Screenshot 1: Initial Command Workspace...");
    await cdp.captureScreenshot(join(SCREENSHOT_DIR, "01_initial_command_workspace.png"));

    // ─────────────────────────────────────────────────────────────
    // SCREENSHOT 2: Workflow Execution / Topology Canvas
    // ─────────────────────────────────────────────────────────────
    console.log("4. Submitting mission prompt...");
    await cdp.eval(`
      (() => {
        const textarea = document.querySelector("textarea");
        textarea.value = "Research enterprise AI automation platforms and evaluate multi-agent orchestration architectures.";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        const form = document.querySelector("form");
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      })()
    `);

    // Await API completion and animation
    console.log("   Waiting for multi-agent pipeline resolution...");
    await sleep(3500);

    console.log("5. Capturing Screenshot 2: Workflow Execution Topology...");
    await cdp.captureScreenshot(join(SCREENSHOT_DIR, "02_workflow_execution_topology.png"));

    // ─────────────────────────────────────────────────────────────
    // SCREENSHOT 3: Generated Artifact & Truthful Verification Badge
    // ─────────────────────────────────────────────────────────────
    console.log("6. Opening Live Draft Artifact Viewer...");
    await cdp.eval(`
      (() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const draftBtn = buttons.find(b => b.textContent && b.textContent.includes("Live Draft"));
        if (draftBtn) draftBtn.click();
      })()
    `);
    await sleep(1000);

    console.log("7. Capturing Screenshot 3: Generated Artifact & Verification Badge...");
    await cdp.captureScreenshot(join(SCREENSHOT_DIR, "03_artifact_and_verification_badge.png"));

    // ─────────────────────────────────────────────────────────────
    // SCREENSHOT 4: Failure State Handling
    // ─────────────────────────────────────────────────────────────
    console.log("8. Triggering controlled failure state demonstration...");
    // Return to command workspace
    await cdp.eval(`
      (() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const newMissionBtn = buttons.find(b => b.textContent && b.textContent.includes("New Mission"));
        if (newMissionBtn) newMissionBtn.click();
      })()
    `);
    await sleep(1000);

    // Simulate network error on next fetch
    await cdp.eval(`
      (() => {
        window.__originalFetch = window.fetch;
        window.fetch = () => Promise.reject(new Error("Connection refused: backend service unreachable"));
        const textarea = document.querySelector("textarea");
        textarea.value = "Analyze mission resilience under network partition failure";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        const form = document.querySelector("form");
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      })()
    `);
    await sleep(1500);

    console.log("9. Capturing Screenshot 4: Failure State Handling...");
    await cdp.captureScreenshot(join(SCREENSHOT_DIR, "04_failure_state_handling.png"));

    // Restore fetch
    await cdp.eval(`
      (() => {
        if (window.__originalFetch) window.fetch = window.__originalFetch;
      })()
    `);

    console.log("\n=== ALL 4 GENUINE SCREENSHOTS SUCCESSFULLY CAPTURED ===");
  } finally {
    if (cdp) cdp.close();
    if (chromeProc) chromeProc.kill("SIGTERM");
  }
}

captureEvidence()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal Error during evidence capture:", err);
    process.exit(1);
  });
