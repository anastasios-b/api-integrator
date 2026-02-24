// Sources data storage (in-memory)
let sources = [];

// Expose sources to global scope
window.sources = sources;

/**
 * Save sources to localStorage for persistence
 */
function saveSourcesToStorage() {
    localStorage.setItem('api_integrator_sources', JSON.stringify(sources));
    // Update the global reference
    window.sources = sources;
    // Dispatch event that sources were updated
    document.dispatchEvent(new CustomEvent('sourcesUpdated'));
}

/**
 * Load sources from localStorage
 */
function loadSourcesFromStorage() {
    const data = localStorage.getItem('api_integrator_sources');
    if (data) {
        try {
            sources = JSON.parse(data);
            // Update the global reference
            window.sources = sources;
            // Dispatch event that sources were updated
            document.dispatchEvent(new CustomEvent('sourcesUpdated'));
        } catch (e) {
            console.error('Error parsing sources from storage:', e);
            sources = [];
            window.sources = [];
        }
    }
}

/**
 * Render the sources list UI from sources array
 */
function renderSourcesList() {
    const container = document.getElementById('sources-container');
    if (!container) return;
    container.innerHTML = '';
    sources.forEach(source => {
        container.appendChild(createSourceElement(source));
    });
}

/**
 * Create a source item DOM element
 * @param {Object} source - Source object with name, type, and configuration
 * @returns {HTMLElement} The source item element
 */
function createSourceElement(source) {
    const sourceItem = document.createElement('div');
    sourceItem.className = 'source-item';
    sourceItem.dataset.sourceId = source.id || Date.now();
    let detailsHtml = '';
    if (source.receiveEndpoint) {
        detailsHtml += `<p>Receive from: ${source.receiveEndpoint}</p>`;
    }
    if (source.updateEndpoint) {
        detailsHtml += `<p>Update to: ${source.updateEndpoint}</p>`;
    }
    sourceItem.innerHTML = `
        <h3>${source.name || 'Unnamed Source'}</h3>
        <p>Type: ${source.type || 'Unknown'}</p>
        ${detailsHtml}
        <div class="source-item-actions">
            <div class="button edit-source-button">Edit</div>
            <div class="button delete-source-button">Delete</div>
        </div>
    `;
    return sourceItem;
}

/**
 * Add a new source to the list and persist
 * @param {Object} source - Source object
 */
function addSource(source) {
    if (!source.name || !source.type) return;
    source.id = source.id || Date.now();
    sources.push(source);
    saveSourcesToStorage();
    renderSourcesList();
    // Notify map to update
    document.dispatchEvent(new Event('sourcesUpdated'));
}

/**
 * Remove a source from the list and persist
 * @param {string|number} sourceId - The ID of the source to remove
 */
function removeSource(sourceId) {
    sources = sources.filter(source => source.id !== sourceId);
    saveSourcesToStorage();
    renderSourcesList();

    // Also remove any mappings associated with this source
    if (typeof removeMappingsForSource === 'function') {
        removeMappingsForSource(sourceId);
    }

    document.dispatchEvent(new Event('sourcesUpdated'));
}

/**
 * Get a source by ID
 * @param {string|number} sourceId - The ID of the source
 * @returns {Object|null} The source object or null if not found
 */
function getSource(sourceId) {
    return sources.find(source => source.id === sourceId) || null;
}

/**
 * Get all sources
 * @returns {Array} Array of all sources
 */
function getAllSources() {
    return [...sources];
}

/**
 * Update a source and persist
 * @param {string|number} sourceId - The ID of the source to update
 * @param {Object} updatedData - The updated source data
 */
function updateSource(sourceId, updatedData) {
    const sourceIndex = sources.findIndex(source => source.id === sourceId);
    if (sourceIndex === -1) return;
    sources[sourceIndex] = { ...sources[sourceIndex], ...updatedData };
    saveSourcesToStorage();
    renderSourcesList();
    document.dispatchEvent(new Event('sourcesUpdated'));
}

/**
 * Clear all sources from the list and persist
 */
function clearAllSources() {
    sources = [];
    saveSourcesToStorage();
    renderSourcesList();
    document.dispatchEvent(new Event('sourcesUpdated'));
}

// On page load, restore sources and render UI
document.addEventListener('DOMContentLoaded', function () {
    loadSourcesFromStorage();
    renderSourcesList();
    // Add source button handler
    const addSourceBtn = document.getElementById('add-source-button');
    if (addSourceBtn) {
        addSourceBtn.addEventListener('click', function () {
            // Show modal for adding API source
            const content = `
                <h2>Add New Source</h2>
                <form id="add-source-form">
                    <div>
                        <label for="source-name">Friendly Name:</label>
                        <input type="text" id="source-name" required>
                    </div>
                    <div>
                        <label for="source-type">Source Type:</label>
                        <select id="source-type" required>
                            <option value="API">API</option>
                        </select>
                    </div>
                    <div id="api-fields">
                        <h3>Receive Data Configuration</h3>
                        <p class="h3-description">Configure how to retrieve data from this API source including endpoint, method, headers, and expected response format.</p>
                        <div>
                            <label for="receive-endpoint">Receive Endpoint:</label>
                            <input type="text" id="receive-endpoint" placeholder="e.g., /api/data?id={id}">
                        </div>
                        <div>
                            <label for="receive-method">Receive Method:</label>
                            <select id="receive-method">
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                            </select>
                        </div>
                        <div id="receive-payload-div" style="display: none;">
                            <label for="receive-payload">Receive Payload (JSON):</label>
                            <textarea id="receive-payload" placeholder='{"key": "value"}'></textarea>
                        </div>
                        <div>
                            <label for="receive-headers">Receive Headers (JSON):</label>
                            <textarea id="receive-headers" placeholder='{"Authorization": "Bearer token"}'></textarea>
                        </div>
                        <div>
                            <label for="receive-response-example">Response Example (JSON):</label>
                            <textarea id="receive-response-example" placeholder='{"data": {}}'></textarea>
                        </div>
                        <h3>Update Data Configuration</h3>
                        <p class="h3-description">Configure how to send data updates to this API source including endpoint, method, headers, and payload structure.</p>
                        <div>
                            <label for="update-endpoint">Update Endpoint:</label>
                            <input type="text" id="update-endpoint" placeholder="e.g., /api/data?id={id}">
                        </div>
                        <div>
                            <label for="update-method">Update Method:</label>
                            <select id="update-method">
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="PATCH">PATCH</option>
                            </select>
                        </div>
                        <div>
                            <label for="update-headers">Update Headers (JSON):</label>
                            <textarea id="update-headers" placeholder='{"Authorization": "Bearer token"}'></textarea>
                        </div>
                        <div>
                            <label for="update-payload">Update Payload (JSON):</label>
                            <textarea id="update-payload" placeholder='{"key": "value"}'></textarea>
                        </div>
                    </div>
                    <button type="submit">Add Source</button>
                </form>
            `;
            openModal(content);
            // Show/hide payload field for POST
            const receiveMethodSelect = document.getElementById('receive-method');
            const receivePayloadDiv = document.getElementById('receive-payload-div');
            receiveMethodSelect.addEventListener('change', function () {
                receivePayloadDiv.style.display = this.value === 'POST' ? 'block' : 'none';
            });
            // Handle form submit
            const form = document.getElementById('add-source-form');
            if (form) {
                form.addEventListener('submit', function (e) {
                    e.preventDefault();
                    const newSource = {
                        name: document.getElementById('source-name').value,
                        type: 'API',
                        receiveEndpoint: document.getElementById('receive-endpoint').value,
                        receiveMethod: document.getElementById('receive-method').value,
                        receivePayload: document.getElementById('receive-payload').value,
                        receiveHeaders: document.getElementById('receive-headers').value,
                        receiveResponseExample: document.getElementById('receive-response-example').value,
                        updateEndpoint: document.getElementById('update-endpoint').value,
                        updateMethod: document.getElementById('update-method').value,
                        updateHeaders: document.getElementById('update-headers').value,
                        updatePayload: document.getElementById('update-payload').value
                    };
                    addSource(newSource);
                    closeModal();
                });
            }
        });
    }
    // Edit and delete button handlers
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('edit-source-button')) {
            const sourceElement = e.target.closest('.source-item');
            const sourceId = sourceElement.dataset.sourceId;
            const source = getSource(parseInt(sourceId));
            if (source) {
                // Show modal for editing API source
                const content = `
                    <h2>Edit Source</h2>
                    <form id="edit-source-form">
                        <div>
                            <label for="edit-source-name">Friendly Name:</label>
                            <input type="text" id="edit-source-name" value="${source.name}" required>
                        </div>
                        <div>
                            <label for="edit-source-type">Source Type:</label>
                            <select id="edit-source-type" disabled>
                                <option value="API" selected>API</option>
                            </select>
                        </div>
                        <div id="api-fields">
                            <h3>Receive Data Configuration</h3>
                            <p class="h3-description">Configure how to retrieve data from this API source including endpoint, method, headers, and expected response format.</p>
                            <div>
                                <label for="edit-receive-endpoint">Receive Endpoint:</label>
                                <input type="text" id="edit-receive-endpoint" value="${source.receiveEndpoint || ''}" placeholder="e.g., /api/data?id={id}">
                            </div>
                            <div>
                                <label for="edit-receive-method">Receive Method:</label>
                                <select id="edit-receive-method">
                                    <option value="GET" ${source.receiveMethod === 'GET' ? 'selected' : ''}>GET</option>
                                    <option value="POST" ${source.receiveMethod === 'POST' ? 'selected' : ''}>POST</option>
                                </select>
                            </div>
                            <div id="edit-receive-payload-div" style="display: ${source.receiveMethod === 'POST' ? 'block' : 'none'}">
                                <label for="edit-receive-payload">Receive Payload (JSON):</label>
                                <textarea id="edit-receive-payload" placeholder='{"key": "value"}'>${source.receivePayload || ''}</textarea>
                            </div>
                            <div>
                                <label for="edit-receive-headers">Receive Headers (JSON):</label>
                                <textarea id="edit-receive-headers" placeholder='{"Authorization": "Bearer token"}'>${source.receiveHeaders || ''}</textarea>
                            </div>
                            <div>
                                <label for="edit-receive-response-example">Response Example (JSON):</label>
                                <textarea id="edit-receive-response-example" placeholder='{"data": {}}'>${source.receiveResponseExample || ''}</textarea>
                            </div>
                            <h3>Update Data Configuration</h3>
                            <p class="h3-description">Configure how to send data updates to this API source including endpoint, method, headers, and payload structure.</p>
                            <div>
                                <label for="edit-update-endpoint">Update Endpoint:</label>
                                <input type="text" id="edit-update-endpoint" value="${source.updateEndpoint || ''}" placeholder="e.g., /api/data?id={id}">
                            </div>
                            <div>
                                <label for="edit-update-method">Update Method:</label>
                                <select id="edit-update-method">
                                    <option value="POST" ${source.updateMethod === 'POST' ? 'selected' : ''}>POST</option>
                                    <option value="PUT" ${source.updateMethod === 'PUT' ? 'selected' : ''}>PUT</option>
                                    <option value="PATCH" ${source.updateMethod === 'PATCH' ? 'selected' : ''}>PATCH</option>
                                </select>
                            </div>
                            <div>
                                <label for="edit-update-headers">Update Headers (JSON):</label>
                                <textarea id="edit-update-headers" placeholder='{"Authorization": "Bearer token"}'>${source.updateHeaders || ''}</textarea>
                            </div>
                            <div>
                                <label for="edit-update-payload">Update Payload (JSON):</label>
                                <textarea id="edit-update-payload" placeholder='{"key": "value"}'>${source.updatePayload || ''}</textarea>
                            </div>
                        </div>
                        <button type="submit">Update Source</button>
                    </form>
                `;
                openModal(content);
                // Show/hide payload field for POST
                const receiveMethodSelect = document.getElementById('edit-receive-method');
                const receivePayloadDiv = document.getElementById('edit-receive-payload-div');
                if (receiveMethodSelect && receivePayloadDiv) {
                    receiveMethodSelect.addEventListener('change', function () {
                        receivePayloadDiv.style.display = this.value === 'POST' ? 'block' : 'none';
                    });
                }
                // Handle form submit
                const form = document.getElementById('edit-source-form');
                if (form) {
                    form.addEventListener('submit', function (e) {
                        e.preventDefault();
                        const updatedData = {
                            name: document.getElementById('edit-source-name').value,
                            receiveEndpoint: document.getElementById('edit-receive-endpoint').value,
                            receiveMethod: document.getElementById('edit-receive-method').value,
                            receivePayload: document.getElementById('edit-receive-payload').value,
                            receiveHeaders: document.getElementById('edit-receive-headers').value,
                            receiveResponseExample: document.getElementById('edit-receive-response-example').value,
                            updateEndpoint: document.getElementById('edit-update-endpoint').value,
                            updateMethod: document.getElementById('edit-update-method').value,
                            updateHeaders: document.getElementById('edit-update-headers').value,
                            updatePayload: document.getElementById('edit-update-payload').value
                        };
                        updateSource(parseInt(sourceId), updatedData);
                        closeModal();
                    });
                }
            }
        }
        if (e.target.classList.contains('delete-source-button')) {
            const sourceElement = e.target.closest('.source-item');
            const sourceId = sourceElement.dataset.sourceId;
            if (confirm('Are you sure you want to delete this source?')) {
                removeSource(parseInt(sourceId));
            }
        }
    });
});