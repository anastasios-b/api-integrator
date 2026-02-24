// Test Connections & Test Mappings logic for v1

document.addEventListener('DOMContentLoaded', function () {
    initTestMappingsSection();
});

function initTestMappingsSection() {
    const container = document.getElementById('test-mappings-container');
    if (!container) return;

    container.innerHTML = `
        <div class="test-actions">
            <button class="button secondary" id="btn-test-connections">Test Connections</button>
            <button class="button" id="btn-test-mappings">Test Mappings</button>
        </div>
        <div id="test-mappings-results" class="test-results"></div>
    `;

    const btnConn = document.getElementById('btn-test-connections');
    const btnMap = document.getElementById('btn-test-mappings');
    const resultsEl = document.getElementById('test-mappings-results');

    if (!btnConn || !btnMap || !resultsEl) return;

    btnConn.addEventListener('click', () => testConnectionsV1(resultsEl, btnConn, btnMap));
    btnMap.addEventListener('click', () => testMappingsV1(resultsEl));

    // Initial button state update
    updateTestMappingsButtonState();

    // Listen for mapping updates to enable/disable the button
    document.addEventListener('mappingsUpdated', updateTestMappingsButtonState);
}

/**
 * Update the Test Mappings button state based on available mappings
 */
function updateTestMappingsButtonState() {
    const btnMap = document.getElementById('btn-test-mappings');
    if (!btnMap) return;

    // Check if we have at least 2 sources
    let hasEnoughSources = false;
    if (typeof getAllSources === 'function') {
        const all = getAllSources();
        hasEnoughSources = all && all.length >= 2;
    }

    // Check if we have any field mappings
    let hasMappings = false;
    if (typeof getAllFieldMappings === 'function') {
        const mappings = getAllFieldMappings();
        hasMappings = mappings && Object.keys(mappings).length > 0;
    }

    // Disable button if we don't have enough sources or no mappings
    const shouldDisable = !hasEnoughSources || !hasMappings;
    btnMap.disabled = shouldDisable;
    
    // Update button title to explain why it's disabled
    if (shouldDisable) {
        if (!hasEnoughSources) {
            btnMap.title = 'Add at least 2 sources to test mappings';
        } else if (!hasMappings) {
            btnMap.title = 'Create field mappings in the Sources Map section to test';
        }
    } else {
        btnMap.title = 'Test your field mappings';
    }
}

// ---- Connections testing ----

async function testConnectionsV1(resultsEl, btnConn, btnMap) {
    if (typeof getAllSources !== 'function') {
        showTestMessage(resultsEl, 'Sources module not loaded.', 'error');
        return;
    }

    const allSources = getAllSources();
    if (!allSources.length) {
        showTestMessage(resultsEl, 'No sources to test. Please add at least one source.', 'error');
        return;
    }

    showTestMessage(resultsEl, 'Testing connections...', 'info');
    btnConn.disabled = true;
    btnMap.disabled = true;

    const results = [];
    for (const src of allSources) {
        // Test receive endpoint if configured
        if (src.receiveEndpoint && src.receiveEndpoint.trim() !== '') {
            try {
                const resp = await testReceiveEndpoint(src);
                results.push({
                    source: src.name || 'Unnamed source',
                    type: 'receive',
                    endpoint: src.receiveEndpoint,
                    status: 'success',
                    message: `Connected (${resp.status} ${resp.statusText})`,
                    data: resp.data
                });
            } catch (err) {
                results.push({
                    source: src.name || 'Unnamed source',
                    type: 'receive',
                    endpoint: src.receiveEndpoint,
                    status: 'error',
                    message: err.userMessage || err.message || 'Connection failed',
                    data: null
                });
            }
        }

        // Test update endpoint if configured
        if (src.updateEndpoint && src.updateEndpoint.trim() !== '') {
            try {
                const resp = await testUpdateEndpoint(src);
                results.push({
                    source: src.name || 'Unnamed source',
                    type: 'update',
                    endpoint: src.updateEndpoint,
                    status: 'success',
                    message: `Reachable (${resp.status} ${resp.statusText})`,
                    data: null
                });
            } catch (err) {
                results.push({
                    source: src.name || 'Unnamed source',
                    type: 'update',
                    endpoint: src.updateEndpoint,
                    status: 'error',
                    message: err.userMessage || err.message || 'Connection failed',
                    data: null
                });
            }
        }

        // If no endpoints configured, add a notice
        if ((!src.receiveEndpoint || src.receiveEndpoint.trim() === '') &&
            (!src.updateEndpoint || src.updateEndpoint.trim() === '')) {
            results.push({
                source: src.name || 'Unnamed source',
                type: 'notice',
                endpoint: null,
                status: 'info',
                message: 'No endpoints configured',
                data: null
            });
        }
    }

    displayConnectionResults(resultsEl, results);
    btnConn.disabled = false;
    if (allSources.length > 1) btnMap.disabled = false;
}

// Test receive endpoint - get data
async function testReceiveEndpoint(source) {
    const url = source.receiveEndpoint;
    const method = (source.receiveMethod || 'GET').toUpperCase();
    const headersObj = source.receiveHeaders ? safeParseJson(source.receiveHeaders) : {};
    const bodyObj = source.receiveBody ? safeParseJson(source.receiveBody) : null;

    if (!url) {
        throw { userMessage: 'Missing receive endpoint URL.' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const options = {
            method,
            headers: headersObj || {},
            signal: controller.signal
        };
        if (method !== 'GET' && bodyObj && Object.keys(bodyObj).length) {
            options.body = JSON.stringify(bodyObj);
            if (!options.headers['Content-Type']) {
                options.headers['Content-Type'] = 'application/json';
            }
        }

        const response = await fetch(url, options);
        clearTimeout(timeout);

        if (!response.ok) {
            const txt = await safeReadTextV1(response);
            throw {
                userMessage: `HTTP ${response.status} ${response.statusText}`,
                message: txt || 'Non-OK response'
            };
        }

        let data;
        try {
            data = await response.clone().json();
        } catch (_) {
            data = await response.text();
        }
        return { status: response.status, statusText: response.statusText, data };
    } catch (error) {
        if (error.name === 'AbortError') {
            throw { userMessage: 'Request timed out (10s).', message: 'Timeout' };
        }
        throw { userMessage: 'Network/CORS or parsing error.', message: (error && error.message) || String(error) };
    } finally {
        clearTimeout(timeout);
    }
}

// Test update endpoint - check reachability without sending data
async function testUpdateEndpoint(source) {
    const url = source.updateEndpoint;
    const method = (source.updateMethod || 'POST').toUpperCase();
    const headersObj = source.updateHeaders ? safeParseJson(source.updateHeaders) : {};

    if (!url) {
        throw { userMessage: 'Missing update endpoint URL.' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        // Use OPTIONS method to test reachability, fallback to HEAD, then to the configured method with empty body
        let testMethod = 'OPTIONS';
        const options = {
            method: testMethod,
            headers: headersObj || {},
            signal: controller.signal
        };

        // Try OPTIONS first
        try {
            const response = await fetch(url, options);
            clearTimeout(timeout);

            // OPTIONS successful, return
            return { status: response.status, statusText: response.statusText, data: null };
        } catch (optionsError) {
            // OPTIONS failed, try HEAD
            try {
                options.method = 'HEAD';
                const response = await fetch(url, options);
                clearTimeout(timeout);
                return { status: response.status, statusText: response.statusText, data: null };
            } catch (headError) {
                // HEAD failed, try the configured method with empty body
                options.method = method;
                if (method !== 'GET' && method !== 'HEAD') {
                    options.body = JSON.stringify({});
                    if (!options.headers['Content-Type']) {
                        options.headers['Content-Type'] = 'application/json';
                    }
                }

                const response = await fetch(url, options);
                clearTimeout(timeout);

                // We don't care if it's successful or not, just that it's reachable
                // Non-2xx responses still mean the endpoint exists
                return { status: response.status, statusText: response.statusText, data: null };
            }
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            throw { userMessage: 'Request timed out (10s).', message: 'Timeout' };
        }
        throw { userMessage: 'Network/CORS or endpoint not reachable.', message: (error && error.message) || String(error) };
    } finally {
        clearTimeout(timeout);
    }
}

async function safeReadTextV1(resp) {
    try { return await resp.text(); } catch { return ''; }
}

function displayConnectionResults(resultsEl, results) {
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const infoCount = results.filter(r => r.status === 'info').length;

    let html = `
        <div class="test-summary">
            <h3>Connection Test Results</h3>
            <p>${successCount} successful, ${errorCount} failed${infoCount > 0 ? `, ${infoCount} notices` : ''}</p>
        </div>
        <div class="test-results-list">
    `;

    results.forEach(r => {
        const typeIcon = r.type === 'receive' ? '📥' : r.type === 'update' ? '📤' : 'ℹ️';
        const statusIcon = r.status === 'success' ? '✓' : r.status === 'error' ? '✗' : 'ℹ️';

        html += `
            <div class="test-result ${r.status}">
                <div class="test-result-header">
                    <span class="test-source">${typeIcon} ${r.source} ${r.type ? `(${r.type})` : ''}</span>
                    <span class="test-status ${r.status}">${statusIcon} ${r.status}</span>
                </div>
                ${r.endpoint ? `<div class="test-endpoint">Endpoint: ${r.endpoint}</div>` : ''}
                <div class="test-message">${r.message}</div>
                ${r.data ? `<div class="test-data"><pre>${escapeHtml(JSON.stringify(r.data, null, 2))}</pre></div>` : ''}
            </div>
        `;
    });

    html += '</div>';
    resultsEl.innerHTML = html;
}

// ---- Mapping testing ----

async function testMappingsV1(resultsEl) {
    if (typeof getAllSources !== 'function' || typeof getAllFieldMappings !== 'function') {
        showTestMessage(resultsEl, 'Required modules not loaded.', 'error');
        return;
    }

    const allSources = getAllSources();
    if (allSources.length < 2) {
        showTestMessage(resultsEl, 'You need at least two sources to test mappings.', 'error');
        return;
    }

    const mappings = getAllFieldMappings();
    if (!mappings || !Object.keys(mappings).length) {
        showTestMessage(resultsEl, 'No field mappings defined yet.', 'error');
        return;
    }

    showTestMessage(resultsEl, 'Testing mappings (simulation)...', 'info');

    const results = [];

    // For each mapping key (sourceId->targetId)
    Object.entries(mappings).forEach(([key, fieldMaps]) => {
        const [sourceIdStr, targetIdStr] = key.split('->');
        const sourceId = parseInt(sourceIdStr);
        const targetId = parseInt(targetIdStr);
        const source = getSource(sourceId);
        const target = getSource(targetId);
        if (!source || !target) return;

        const sampleJson = source.receiveResponseExample ? safeParseJson(source.receiveResponseExample) : {};
        const payload = {};

        fieldMaps.forEach(map => {
            const value = getNestedValueV1(sampleJson, map.sourceField);
            if (value !== undefined) {
                setNestedValueV1(payload, map.targetField, value);
            }
        });

        results.push({
            source: source.name || 'Source',
            target: target.name || 'Target',
            method: (target.updateMethod || 'POST').toUpperCase(),
            url: target.updateEndpoint || 'No update endpoint configured',
            payload,
            status: 'success',
            message: `Mapped ${fieldMaps.length} field(s)`
        });
    });

    displayMappingResults(resultsEl, results);
}

function displayMappingResults(resultsEl, results) {
    let html = `
        <div class="test-summary">
            <h3>Mapping Test Results</h3>
            <p>Simulated updates for ${results.length} target(s)</p>
        </div>
        <div class="mapping-test-results">
    `;

    results.forEach(r => {
        html += `
            <div class="mapping-test-result">
                <div class="mapping-test-header">
                    <span class="mapping-test-source">${r.source} → ${r.target}</span>
                    <span class="mapping-test-status ${r.status}">${r.status === 'success' ? '✓' : '✗'} ${r.status}</span>
                </div>
                <div class="mapping-test-method"><strong>${r.method}</strong> ${r.url}</div>
                <div class="mapping-test-payload">
                    <h4>Payload:</h4>
                    <pre>${escapeHtml(JSON.stringify(r.payload, null, 2))}</pre>
                </div>
                <div class="mapping-test-message">${r.message}</div>
            </div>
        `;
    });

    html += '</div>';
    resultsEl.innerHTML = html;
}

// ---- Shared helpers ----

function showTestMessage(resultsEl, message, type) {
    const cls = type || 'info';
    resultsEl.innerHTML = `<div class="test-message ${cls}">${message}</div>`;
}

function safeParseJson(str) {
    if (!str || typeof str !== 'string') return null;
    try { return JSON.parse(str); } catch { return null; }
}

function getNestedValueV1(obj, path) {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
        if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {
            cur = cur[p];
        } else {
            return undefined;
        }
    }
    return cur;
}

function setNestedValueV1(obj, path, value) {
    const parts = path.split('.');
    let cur = obj;
    parts.forEach((p, idx) => {
        if (idx === parts.length - 1) {
            cur[p] = value;
        } else {
            if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
            cur = cur[p];
        }
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}