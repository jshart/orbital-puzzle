import asyncio
import json
import os
import subprocess
import tempfile
import time
import urllib.request
import pytest
import websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
CDP_PORT = 9222

def test_continuum_e2e_cdp_live():
    asyncio.run(_run_continuum_e2e_cdp())

async def _run_continuum_e2e_cdp():
    # 1. Verify local server is active
    try:
        code = urllib.request.urlopen("http://localhost:8000/continuum_demo.html").getcode()
        assert code == 200, "Server must return HTTP 200"
    except Exception as e:
        pytest.skip(f"Local server not accessible on port 8000: {e}")

    # 2. Launch headless Chrome instance on unique debugging port
    temp_dir = tempfile.mkdtemp(prefix="chrome_test_cdp_")
    chrome_proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        f"--remote-debugging-port={CDP_PORT}",
        "--remote-allow-origins=*",
        f"--user-data-dir={temp_dir}",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "http://localhost:8000/continuum_demo.html"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    try:
        # Wait up to 5 seconds for Chrome CDP endpoint
        ws_url = None
        for _ in range(25):
            await asyncio.sleep(0.2)
            try:
                res = urllib.request.urlopen(f"http://localhost:{CDP_PORT}/json").read().decode('utf-8')
                targets = json.loads(res)
                pages = [t for t in targets if t.get('type') == 'page']
                if pages:
                    ws_url = pages[0]['webSocketDebuggerUrl']
                    break
            except Exception:
                pass

        assert ws_url is not None, "Failed to connect to Chrome CDP endpoint"

        # 3. Connect to page WebSocket
        async with websockets.connect(ws_url) as ws:
            msg_id = 1
            console_errors = []

            async def send_cmd(method, params=None):
                nonlocal msg_id
                cid = msg_id
                msg_id += 1
                payload = {"id": cid, "method": method, "params": params or {}}
                await ws.send(json.dumps(payload))
                return cid

            async def eval_js(expression):
                cid = await send_cmd("Runtime.evaluate", {
                    "expression": expression,
                    "returnByValue": True
                })
                while True:
                    raw = await ws.recv()
                    data = json.loads(raw)
                    if data.get("id") == cid:
                        res = data.get("result", {}).get("result", {})
                        if "value" in res:
                            return res["value"]
                        return res
                    elif data.get("method") == "Runtime.exceptionThrown":
                        console_errors.append(data["params"])

            # Enable Runtime and Console domain
            await send_cmd("Runtime.enable")
            await send_cmd("Console.enable")

            # Wait for app bootstrap
            app_ready = False
            for _ in range(30):
                await asyncio.sleep(0.2)
                ready = await eval_js("Boolean(window.continuumApp && window.continuumApp.director)")
                if ready:
                    app_ready = True
                    break

            assert app_ready, "window.continuumApp was not initialized on page"

            # Accelerate time scale to 5x so full multi-stage journey finishes quickly
            await eval_js("window.continuumApp.director.timeScale = 5.0")

            stages_visited = set()
            max_wait_seconds = 25.0
            start_time = time.time()
            is_docked = False

            while time.time() - start_time < max_wait_seconds:
                stage = await eval_js("window.continuumApp.director.stage")
                if stage:
                    stages_visited.add(stage)

                docked = await eval_js("window.continuumApp.director.probe.isDocked")
                if docked:
                    is_docked = True
                    stages_visited.add("STAGE_4_COMPLETE")
                    break

                await asyncio.sleep(0.4)

            # Assert zero runtime console exceptions
            assert len(console_errors) == 0, f"Encountered JS console errors: {console_errors}"

            # Assert all 3 major stages were traversed
            assert "STAGE_1_GALACTIC" in stages_visited, "Must visit Stage 1 Galactic"
            assert "STAGE_2_SOLAR" in stages_visited, "Must visit Stage 2 Solar"
            assert "STAGE_3_PLANETARY" in stages_visited, "Must visit Stage 3 Planetary"
            assert is_docked, f"Probe must achieve final docking. Visited: {stages_visited}"

    finally:
        chrome_proc.kill()
        try:
            chrome_proc.wait(timeout=2)
        except Exception:
            pass
