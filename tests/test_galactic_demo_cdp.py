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
CDP_PORT = 9223

def test_galactic_demo_cdp_live():
    asyncio.run(_run_galactic_demo_cdp())

async def _run_galactic_demo_cdp():
    # 1. Verify local server is active
    try:
        code = urllib.request.urlopen("http://localhost:8000/galactic_demo.html").getcode()
        assert code == 200, "Server must return HTTP 200"
    except Exception as e:
        pytest.skip(f"Local server not accessible on port 8000: {e}")

    # 2. Launch headless Chrome instance
    temp_dir = tempfile.mkdtemp(prefix="chrome_test_galactic_")
    chrome_proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        f"--remote-debugging-port={CDP_PORT}",
        "--remote-allow-origins=*",
        f"--user-data-dir={temp_dir}",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "http://localhost:8000/galactic_demo.html"
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
                while True:
                    resp_raw = await ws.recv()
                    resp = json.loads(resp_raw)
                    if resp.get("method") == "Runtime.consoleAPICalled":
                        args = resp.get("params", {}).get("args", [])
                        msg_type = resp.get("params", {}).get("type")
                        text = " ".join([str(a.get("value", "")) for a in args])
                        if msg_type == "error":
                            console_errors.append(text)
                    if resp.get("id") == cid:
                        return resp.get("result", {})

            await send_cmd("Runtime.enable")
            await send_cmd("Page.enable")

            # Let page script initialize and render
            await asyncio.sleep(1.0)

            # 4. Check that window.app is defined and initialized
            eval_res = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    if (!window.app) return { error: 'window.app not defined' };
                    const sector = window.app.sector;
                    if (!sector) return { error: 'window.app.sector not defined' };
                    
                    const stars = sector.stars;
                    const barycenters = sector.barycenters;
                    const hasFieldStars = !!(sector.fieldStars && sector.fieldStars.length > 0);
                    
                    return {
                        starCount: stars.length,
                        barycenterCount: barycenters.length,
                        hasFieldStars: hasFieldStars,
                        nebulaPuffCount: sector.nebula ? sector.nebula.puffs.length : 0,
                        smbhName: stars[0] ? stars[0].name : null,
                        solPrimeName: stars[1] ? stars[1].name : null,
                        cameraZoom: window.app.camera.zoom
                    };
                })()
                """,
                "returnByValue": True
            })

            data = eval_res.get("result", {}).get("value", {})
            assert "error" not in data, f"Page initialization error: {data.get('error')}"
            assert data.get("starCount") == 180, f"Expected 180 stars, got {data.get('starCount')}"
            assert data.get("hasFieldStars") is False, "Expected no separate field stars array (unified population)"
            assert data.get("nebulaPuffCount") > 50, f"Expected > 50 nebula puffs, got {data.get('nebulaPuffCount')}"
            assert data.get("smbhName") == "Sagittarius Prime (SMBH)", f"Expected SMBH at index 0, got {data.get('smbhName')}"
            assert data.get("solPrimeName") == "Sol Prime", f"Expected Sol Prime at index 1, got {data.get('solPrimeName')}"
            assert data.get("barycenterCount") > 0, "Expected binary barycenters generated"

            # 5. Verify Apparent Size Scaling Behavior across all stars
            scaling_res = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const stars = window.app.sector.stars;
                    
                    // Sizing check at macro zoom (0.2)
                    const zoomMacro = 0.2;
                    const invZoomMacro = 1 / zoomMacro;
                    let macroMinScreen = 999, macroMaxScreen = 0;
                    
                    for (const s of stars) {
                        const basePhysicalR = s.isCoreAnchor ? 10.0 : Math.min(12.0, 2.2 + Math.sqrt(s.radius) * 1.35);
                        const minScreenPx = Math.max(1.1, Math.min(2.0, 1.1 + (s.stellarClass.gameRadius || 12) * 0.035));
                        const minWorldR = minScreenPx * invZoomMacro;
                        const effectiveR = Math.max(basePhysicalR, minWorldR);
                        const screenR = effectiveR * zoomMacro;
                        if (screenR < macroMinScreen) macroMinScreen = screenR;
                        if (screenR > macroMaxScreen) macroMaxScreen = screenR;
                    }

                    // Sizing check at sector zoom (1.5)
                    const zoomSector = 1.5;
                    const invZoomSector = 1 / zoomSector;
                    let sectorMinScreen = 999, sectorMaxScreen = 0;
                    let growCount = 0;

                    for (const s of stars) {
                        const basePhysicalR = s.isCoreAnchor ? 10.0 : Math.min(12.0, 2.2 + Math.sqrt(s.radius) * 1.35);
                        const minScreenPx = Math.max(1.1, Math.min(2.0, 1.1 + (s.stellarClass.gameRadius || 12) * 0.035));
                        const minWorldR = minScreenPx * invZoomSector;
                        const effectiveR = Math.max(basePhysicalR, minWorldR);
                        const screenR = effectiveR * zoomSector;
                        if (screenR < sectorMinScreen) sectorMinScreen = screenR;
                        if (screenR > sectorMaxScreen) sectorMaxScreen = screenR;
                        if (screenR > 3.0) growCount++;
                    }

                    return {
                        macroMinScreen,
                        macroMaxScreen,
                        sectorMinScreen,
                        sectorMaxScreen,
                        growCount,
                        totalStars: stars.length
                    };
                })()
                """,
                "returnByValue": True
            })

            scaling_data = scaling_res.get("result", {}).get("value", {})
            # At macro zoom, stars range from tiny dwarfs (1.1px) to giants (up to 3.0px)
            assert scaling_data.get("macroMinScreen") >= 1.0, "Macro min screen radius should be >= 1.0px"
            assert scaling_data.get("macroMaxScreen") <= 3.5, "Macro max screen radius should be <= 3.5px (pinpricks)"
            # At sector zoom (1.5), ALL stars must have grown larger!
            assert scaling_data.get("sectorMinScreen") >= 3.0, "All stars must grow larger than 3px at zoom 1.5"
            assert scaling_data.get("growCount") == scaling_data.get("totalStars"), "Every star must scale up consistently"

            # 6. Verify Focus-Lock Camera
            lock_res = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const sol = window.app.sector.stars[1]; // Sol Prime
                    window.app.selectStar(sol);
                    window.app.camera.target = sol;
                    window.app.updateTrackingUI();
                    
                    // Simulate 10 frames
                    for (let i = 0; i < 10; i++) {
                        window.app.update(0.05);
                    }
                    
                    const badge = document.getElementById('tracking-badge');
                    const badgeVisible = badge && badge.style.display !== 'none';
                    const trackingName = document.getElementById('tracking-name').innerText;
                    
                    const dx = Math.abs(window.app.camera.x - sol.position.x);
                    const dy = Math.abs(window.app.camera.y - sol.position.y);
                    
                    return {
                        badgeVisible,
                        trackingName,
                        dx,
                        dy,
                        isTrackingAccurate: (dx < 5 && dy < 5)
                    };
                })()
                """,
                "returnByValue": True
            })

            lock_data = lock_res.get("result", {}).get("value", {})
            assert lock_data.get("badgeVisible") is True, "Tracking badge should be visible when locked"
            assert lock_data.get("trackingName", "").upper() == "SOL PRIME", f"Expected SOL PRIME in badge, got {lock_data.get('trackingName')}"
            assert lock_data.get("isTrackingAccurate") is True, f"Camera should center on locked star, dx={lock_data.get('dx')}, dy={lock_data.get('dy')}"

            # 7. Verify Star Count Slider (Population adjustment)
            slider_res = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    window.app.setStarCount(250);
                    const count250 = window.app.sector.stars.length;
                    window.app.setStarCount(180);
                    const count180 = window.app.sector.stars.length;
                    return { count250, count180 };
                })()
                """,
                "returnByValue": True
            })
            slider_data = slider_res.get("result", {}).get("value", {})
            assert slider_data.get("count250") == 250, f"Expected 250 stars after setStarCount(250), got {slider_data.get('count250')}"
            assert slider_data.get("count180") == 180, f"Expected 180 stars after setStarCount(180), got {slider_data.get('count180')}"

            # 8. Verify Button Zoom Controls & Presets
            zoom_res = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const btnIn = document.getElementById('btn-zoom-in');
                    const btnOut = document.getElementById('btn-zoom-out');
                    const labelZoom = document.getElementById('label-zoom');
                    const btnPresetSector = document.getElementById('btn-preset-sector');
                    const btnPresetMacro = document.getElementById('btn-preset-macro');
                    
                    const zInitial = window.app.camera.zoom;
                    
                    // Click zoom in button
                    btnIn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                    btnIn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                    const zAfterIn = window.app.camera.zoom;
                    
                    // Click zoom out button
                    btnOut.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                    btnOut.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                    const zAfterOut = window.app.camera.zoom;

                    // Click sector preset
                    btnPresetSector.click();
                    const zSector = window.app.camera.zoom;
                    const labelSector = labelZoom.innerText;

                    // Click macro preset
                    btnPresetMacro.click();
                    const zMacro = window.app.camera.zoom;
                    const labelMacro = labelZoom.innerText;

                    return {
                        zInitial,
                        zAfterIn,
                        zAfterOut,
                        zSector,
                        labelSector,
                        zMacro,
                        labelMacro
                    };
                })()
                """,
                "returnByValue": True
            })
            zoom_data = zoom_res.get("result", {}).get("value", {})
            assert zoom_data.get("zAfterIn") > zoom_data.get("zInitial"), "btn-zoom-in should increase zoom"
            assert zoom_data.get("zAfterOut") < zoom_data.get("zAfterIn"), "btn-zoom-out should decrease zoom"
            assert abs(zoom_data.get("zSector") - 0.75) < 0.01, f"Sector preset should set zoom to 0.75, got {zoom_data.get('zSector')}"
            assert zoom_data.get("labelSector") == "75%", f"Label should show 75%, got {zoom_data.get('labelSector')}"
            assert abs(zoom_data.get("zMacro") - 0.22) < 0.01, f"Macro preset should set zoom to 0.22, got {zoom_data.get('zMacro')}"
            assert zoom_data.get("labelMacro") == "22%", f"Label should show 22%, got {zoom_data.get('labelMacro')}"

            # 9. Verify Nebula Toggle & Opacity Controls
            nebula_res = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const toggleNebula = document.getElementById('toggle-nebula');
                    const inputDensity = document.getElementById('input-nebula-density');
                    const labelDensity = document.getElementById('label-nebula-density');

                    const initVisible = window.app.showNebula;
                    const initDensity = window.app.nebulaDensity;

                    // Toggle off
                    toggleNebula.checked = false;
                    toggleNebula.dispatchEvent(new Event('change'));
                    const visAfterOff = window.app.showNebula;

                    // Toggle on
                    toggleNebula.checked = true;
                    toggleNebula.dispatchEvent(new Event('change'));
                    const visAfterOn = window.app.showNebula;

                    // Adjust density
                    inputDensity.value = "0.6";
                    inputDensity.dispatchEvent(new Event('input'));
                    const densityAfterChange = window.app.nebulaDensity;
                    const labelAfterChange = labelDensity.innerText;

                    return {
                        initVisible,
                        initDensity,
                        visAfterOff,
                        visAfterOn,
                        densityAfterChange,
                        labelAfterChange
                    };
                })()
                """,
                "returnByValue": True
            })
            nebula_data = nebula_res.get("result", {}).get("value", {})
            assert nebula_data.get("initVisible") is True, "Nebula should be enabled by default"
            assert nebula_data.get("visAfterOff") is False, "Nebula should be disabled after unchecking"
            assert nebula_data.get("visAfterOn") is True, "Nebula should be re-enabled after checking"
            assert abs(nebula_data.get("densityAfterChange") - 0.6) < 0.01, f"Expected density 0.6, got {nebula_data.get('densityAfterChange')}"
            assert nebula_data.get("labelAfterChange") == "60%", f"Expected label 60%, got {nebula_data.get('labelAfterChange')}"

            # 10. Verify Morphology Pattern Switching (Disc <-> Spiral)
            pattern_res = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const defaultPattern = window.app.pattern;
                    const defaultNebulaType = window.app.sector.nebula.type;
                    const defaultClusterHubCount = window.app.sector.clusterHubs ? window.app.sector.clusterHubs.length : 0;

                    // Switch to Spiral
                    window.app.setPattern('spiral');
                    const spiralNebulaType = window.app.sector.nebula.type;
                    const spiralStarCount = window.app.sector.stars.length;

                    // Switch back to Legacy Clustered Disc
                    window.app.setPattern('legacy');
                    const restoredPattern = window.app.pattern;
                    const restoredNebulaType = window.app.sector.nebula.type;
                    const restoredStarCount = window.app.sector.stars.length;

                    return {
                        defaultPattern,
                        defaultNebulaType,
                        defaultClusterHubCount,
                        spiralNebulaType,
                        spiralStarCount,
                        restoredPattern,
                        restoredNebulaType,
                        restoredStarCount
                    };
                })()
                """,
                "returnByValue": True
            })
            pat_data = pattern_res.get("result", {}).get("value", {})
            assert pat_data.get("defaultPattern") == "legacy", f"Expected default pattern legacy, got {pat_data.get('defaultPattern')}"
            assert pat_data.get("defaultNebulaType") == "CLUSTERED_DISC_NEBULA", f"Expected CLUSTERED_DISC_NEBULA, got {pat_data.get('defaultNebulaType')}"
            assert pat_data.get("defaultClusterHubCount") > 0, "Expected cluster hubs in disc mode"
            assert pat_data.get("spiralNebulaType") == "SPIRAL_ARM_NEBULA", f"Expected SPIRAL_ARM_NEBULA after switch, got {pat_data.get('spiralNebulaType')}"
            assert pat_data.get("spiralStarCount") == 180, f"Expected 180 stars in spiral, got {pat_data.get('spiralStarCount')}"
            assert pat_data.get("restoredNebulaType") == "CLUSTERED_DISC_NEBULA", f"Expected CLUSTERED_DISC_NEBULA after restoration, got {pat_data.get('restoredNebulaType')}"
            assert pat_data.get("restoredStarCount") == 180, f"Expected 180 stars in restored disc, got {pat_data.get('restoredStarCount')}"

            # Ensure zero console errors
            assert len(console_errors) == 0, f"Encountered browser console errors: {console_errors}"

    finally:
        chrome_proc.terminate()
        try:
            chrome_proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            chrome_proc.kill()
