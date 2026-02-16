// Field mappings storage (in-memory)
let fieldMappings = {};

// Expose fieldMappings to global scope
window.fieldMappings = fieldMappings;

/**
 * Save field mappings to localStorage for persistence
 */
function saveMappingsToStorage() {
    localStorage.setItem('api_integrator_mappings', JSON.stringify(fieldMappings));
    // Update the global reference
    window.fieldMappings = fieldMappings;
    // Dispatch event that mappings were updated
    document.dispatchEvent(new CustomEvent('mappingsUpdated'));
}

/**
 * Load field mappings from localStorage
 */
function loadMappingsFromStorage() {
    const data = localStorage.getItem('api_integrator_mappings');
    if (data) {
        try {
            fieldMappings = JSON.parse(data);
            // Update the global reference
            window.fieldMappings = fieldMappings;
            // Dispatch event that mappings were updated
            document.dispatchEvent(new CustomEvent('mappingsUpdated'));
        } catch (e) {
            console.error('Error parsing mappings from storage:', e);
            fieldMappings = {};
            window.fieldMappings = {};
        }
    }
}

/**
 * Recursively parse JSON and extract all fields with their types
 * @param {string} jsonString - JSON string to parse
 * @returns {Array} Array of {name, type}
 */
function parseJsonFields(jsonString) {
    try {
        if (!jsonString) return [];
        const obj = JSON.parse(jsonString);
        function extractFields(o, prefix = '') {
            let fields = [];
            for (const key in o) {
                const value = o[key];
                let type = Array.isArray(value) ? 'array' : typeof value;
                fields.push({
                    name: prefix ? `${prefix}.${key}` : key,
                    type: type
                });
                // Recursively extract nested object fields
                if (type === 'object' && value !== null && !Array.isArray(value)) {
                    fields = fields.concat(extractFields(value, prefix ? `${prefix}.${key}` : key));
                }
            }
            return fields;
        }
        return extractFields(obj);
    } catch (e) {
        console.error('Error parsing JSON:', e);
        return [];
    }
}

/**
 * Get field type badge color
 * @param {string} type - Field type
 * @returns {string} CSS color class
 */
function getFieldTypeBadgeClass(type) {
    switch (type) {
        case 'string': return 'field-type-string';
        case 'number': return 'field-type-number';
        case 'boolean': return 'field-type-boolean';
        case 'array': return 'field-type-array';
        case 'object': return 'field-type-object';
        default: return 'field-type-other';
    }
}

/**
 * Create a source field box element for the map with response and update fields
 * @param {Object} source - The source object
 * @returns {HTMLElement} The source box element
 */
function createSourceFieldBox(source) {
    const box = document.createElement('div');
    box.className = 'source-field-box';
    box.dataset.sourceId = source.id;

    // Parse response fields (what we receive FROM this source)
    const responseFields = parseJsonFields(source.receiveResponseExample || '{}');
    const responseFieldsHtml = responseFields.length > 0
        ? responseFields.map(field => `
            <div class="field-item response-field" data-field="${field.name}" data-type="${field.type}" data-field-type="response">
                <span class="field-bullet response-bullet" title="Click to connect"></span>
                ${field.name} <span class="field-type">(${field.type})</span>
            </div>`).join('')
        : '<div class="field-item disabled">No response fields</div>';

    // Parse update fields (what we SEND TO this source)
    const updateFields = parseJsonFields(source.updatePayload || '{}');
    const updateFieldsHtml = updateFields.length > 0
        ? updateFields.map(field => `
            <div class="field-item update-field" data-field="${field.name}" data-type="${field.type}" data-field-type="update">
                <span class="field-bullet update-bullet" title="Click to connect"></span>
                ${field.name} <span class="field-type">(${field.type})</span>
            </div>`).join('')
        : '<div class="field-item disabled">No update fields</div>';

    box.innerHTML = `
        <div class="source-box-header">
            <h4>${source.name}</h4>
            <p class="source-type">${source.type}</p>
        </div>
        <div class="source-box-urls">
            <div class="url-item">
                <span class="url-label">Receive:</span>
                <span class="url-value" title="${source.receiveEndpoint || 'N/A'}">${source.receiveEndpoint ? source.receiveEndpoint.substring(0, 30) + (source.receiveEndpoint.length > 30 ? '...' : '') : 'N/A'}</span>
            </div>
            <div class="url-item">
                <span class="url-label">Update:</span>
                <span class="url-value" title="${source.updateEndpoint || 'N/A'}">${source.updateEndpoint ? source.updateEndpoint.substring(0, 30) + (source.updateEndpoint.length > 30 ? '...' : '') : 'N/A'}</span>
            </div>
        </div>
        <div class="fields-section">
            <div class="fields-label">Response Fields (FROM this source):</div>
            <div class="fields-container response-container">
                ${responseFieldsHtml}
            </div>
        </div>
        <div class="fields-section">
            <div class="fields-label">Update Fields (TO this source):</div>
            <div class="fields-container update-container">
                ${updateFieldsHtml}
            </div>
        </div>
    `;
    return box;
}

/**
 * Render the sources map area with all sources and their fields
 */
function initializeSourcesMap() {
    const container = document.getElementById('sources-map-container');
    if (!container) return;
    // Clear container before rendering
    container.innerHTML = '';
    const allSources = getAllSources();
    if (allSources.length === 0) {
        container.innerHTML = '<p class="empty-map">Add sources first to create field mappings.</p>';
        return;
    }

    // Create wrapper for boxes and SVG
    const mapWrapper = document.createElement('div');
    mapWrapper.className = 'map-wrapper';
    mapWrapper.style.position = 'relative';
    mapWrapper.style.width = '100%';
    mapWrapper.style.minHeight = '400px';

    // Create SVG for drawing connection lines (positioned absolutely so it doesn't block events)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'connections-svg';
    svg.className = 'connections-canvas';
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none'; // SVG won't block drag-and-drop
    mapWrapper.appendChild(svg);

    // Create source boxes container
    const boxesContainer = document.createElement('div');
    boxesContainer.className = 'source-boxes-container';
    boxesContainer.style.position = 'relative';
    boxesContainer.style.zIndex = '1'; // Ensure boxes are above SVG
    allSources.forEach(source => {
        const box = createSourceFieldBox(source);
        boxesContainer.appendChild(box);
    });
    mapWrapper.appendChild(boxesContainer);

    container.appendChild(mapWrapper);

    // Get the boxes container and set up drag-and-drop
    const fieldsBoxesContainer = mapWrapper.querySelector('.source-boxes-container');
    if (fieldsBoxesContainer) {
        setupMapEventListeners(fieldsBoxesContainer);
    }
    // Render existing connections
    renderConnections();
}

/**
 * Handle response bullet click - toggle selection
 */
function handleResponseBulletClick(e, state) {
    console.log('Response bullet clicked');
    const fieldItem = e.target.closest('.response-field');
    if (!fieldItem) return;

    const bullet = fieldItem.querySelector('.response-bullet');
    const sourceBox = fieldItem.closest('.source-field-box');

    // If clicking the same field, toggle selection off
    if (state.selectedResponseField &&
        state.selectedResponseField.bullet === bullet) {
        clearConnectionState(state);
        return;
    }

    // Clear any existing selections first
    clearConnectionState(state);

    // Select the clicked field
    bullet.classList.add('selected');

    // Get the source box and disable its update section
    const updateContainer = sourceBox.querySelector('.update-container');
    if (updateContainer) {
        updateContainer.classList.add('disabled-section');
    }

    // Store selected field
    state.selectedResponseField = {
        element: fieldItem,
        bullet: bullet,
        sourceId: parseInt(sourceBox.dataset.sourceId),
        field: fieldItem.dataset.field,
        type: fieldItem.dataset.type,
        sourceBox: sourceBox
    };

    console.log('Selected response field:', state.selectedResponseField);
}

/**
 * Handle update bullet click - complete connection
 */
function handleUpdateBulletClick(e, state) {
    console.log('Update bullet clicked');
    const fieldItem = e.target.closest('.update-field');
    if (!fieldItem) return;

    // Check if response field is selected
    if (!state.selectedResponseField) {
        console.log('No response field selected');
        // Show visual feedback for the clicked update bullet
        const bullet = fieldItem.querySelector('.update-bullet');
        if (bullet) {
            // Only show temporary feedback if no response field is selected
            bullet.classList.add('selected');
            setTimeout(() => {
                if (bullet.classList.contains('selected') && !state.selectedResponseField) {
                    bullet.classList.remove('selected');
                }
            }, 500);
        }
        return;
    }

    // Create mapping
    const targetFieldData = {
        sourceId: parseInt(fieldItem.closest('.source-field-box').dataset.sourceId),
        field: fieldItem.dataset.field,
        type: fieldItem.dataset.type
    };

    console.log('Creating mapping:', state.selectedResponseField, '->', targetFieldData);

    if (state.selectedResponseField.sourceId !== targetFieldData.sourceId) {
        createFieldMapping(state.selectedResponseField, targetFieldData);
    } else {
        console.log('Cannot map fields within same source');
        // Show error feedback
        const bullet = fieldItem.querySelector('.update-bullet');
        if (bullet) {
            bullet.classList.add('error');
            setTimeout(() => {
                if (bullet.classList.contains('error')) {
                    bullet.classList.remove('error');
                }
            }, 1000);
        }
        return;
    }

    // Clear selection
    clearConnectionState(state);
}

/**
 * Clear connection state
 */
function clearConnectionState(state) {
    if (state.selectedResponseField && state.selectedResponseField.bullet) {
        state.selectedResponseField.bullet.classList.remove('selected');
    }
    // Re-enable the update section
    if (state.selectedResponseField && state.selectedResponseField.sourceBox) {
        const updateContainer = state.selectedResponseField.sourceBox.querySelector('.update-container');
        if (updateContainer) {
            updateContainer.classList.remove('disabled-section');
        }
    }
    state.selectedResponseField = null;
}

/**
 * Set up click-based field connection listeners and drag-to-move for source boxes
 * @param {HTMLElement} container - The source boxes container
 */
function setupMapEventListeners(container) {
    // Shared state object
    const state = {
        selectedResponseField: null
    };

    // Listen for bullet clicks
    container.addEventListener('click', function (e) {
        const responseBullet = e.target.closest('.response-bullet');
        const updateBullet = e.target.closest('.update-bullet');

        if (responseBullet) {
            handleResponseBulletClick(e, state);
        } else if (updateBullet) {
            handleUpdateBulletClick(e, state);
        }
    });
}

/**
 * Create a field mapping between source and target fields
 * @param {Object} sourceField - Source field data {sourceId, field, type}
 * @param {Object} targetField - Target field data {sourceId, field, type}
 */
function createFieldMapping(sourceField, targetField) {
    const sourceId = sourceField.sourceId;
    const targetId = targetField.sourceId;
    const key = `${sourceId}->${targetId}`;
    if (!fieldMappings[key]) {
        fieldMappings[key] = [];
    }
    // Prevent duplicate mappings
    const exists = fieldMappings[key].some(m =>
        m.sourceField === sourceField.field && m.targetField === targetField.field
    );
    if (!exists) {
        console.log(`Creating mapping: ${key} | ${sourceField.field} -> ${targetField.field}`);
        fieldMappings[key].push({
            sourceField: sourceField.field,
            sourceType: sourceField.type,
            targetField: targetField.field,
            targetType: targetField.type,
            sourceId: sourceId,
            targetId: targetId
        });
        console.log('Current mappings:', fieldMappings);
        saveMappingsToStorage();
        renderConnections();
        // Trigger code regeneration when mappings change
        if (typeof renderCode === 'function') {
            renderCode();
        }
    } else {
        console.log('Mapping already exists:', sourceField.field, '->', targetField.field);
    }
}

/**
 * Remove a field mapping
 * @param {string} key - Mapping key (sourceId->targetId)
 * @param {string} sourceField - Source field name
 * @param {string} targetField - Target field name
 */
function removeFieldMapping(key, sourceField, targetField) {
    if (fieldMappings[key]) {
        fieldMappings[key] = fieldMappings[key].filter(m =>
            !(m.sourceField === sourceField && m.targetField === targetField)
        );
        if (fieldMappings[key].length === 0) {
            delete fieldMappings[key];
        }
        saveMappingsToStorage();
        renderConnections();
        // Trigger code regeneration when mappings change
        if (typeof renderCode === 'function') {
            renderCode();
        }
    }
}

/**
 * Get all field mappings
 * @returns {Object} All field mappings
 */
function getAllFieldMappings() {
    return fieldMappings;
}

/**
 * Remove all field mappings associated with a specific source
 * @param {string|number} sourceId - The ID of the source to remove mappings for
 */
function removeMappingsForSource(sourceId) {
    const mappings = getAllFieldMappings();
    const updatedMappings = {};

    Object.keys(mappings).forEach(key => {
        const [sourceIdStr, targetIdStr] = key.split('->');
        // Keep only mappings that don't involve the deleted source
        if (sourceIdStr != sourceId && targetIdStr != sourceId) {
            updatedMappings[key] = mappings[key];
        }
    });

    // Update the fieldMappings variable
    fieldMappings = updatedMappings;
    saveMappingsToStorage();
    renderConnections();
}

/**
 * Clear all field mappings
 */
function clearAllFieldMappings() {
    fieldMappings = {};
    saveMappingsToStorage();
    renderConnections();
}

/**
 * Render connection lines on SVG with debouncing
 */
let renderConnectionsTimeout;
function renderConnections() {
    // Clear previous timeout to prevent excessive redraws
    clearTimeout(renderConnectionsTimeout);

    // Use requestAnimationFrame for smooth rendering
    renderConnectionsTimeout = requestAnimationFrame(function () {
        const svg = document.getElementById('connections-svg');
        if (!svg) return;

        // Clear existing lines
        svg.innerHTML = '';
        const container = document.getElementById('sources-map-container');

        // Draw lines for each mapping
        Object.entries(fieldMappings).forEach(([key, mappings]) => {
            const [sourceIdStr, targetIdStr] = key.split('->');
            const sourceId = parseInt(sourceIdStr);
            const targetId = parseInt(targetIdStr);
            const sourceBox = container.querySelector(`[data-source-id="${sourceId}"]`);
            const targetBox = container.querySelector(`[data-source-id="${targetId}"]`);
            if (!sourceBox || !targetBox) return;
            mappings.forEach(mapping => {
                drawConnectionLine(svg, sourceBox, targetBox, mapping);
            });
        });

        // Update connections list only after drawing is complete
        renderConnectionsList();
    });
}

/**
 * Draw a single connection line with label attached to specific fields
 * @param {SVGElement} svg - SVG element to draw on
 * @param {HTMLElement} sourceBox - Source box element
 * @param {HTMLElement} targetBox - Target box element
 * @param {Object} mapping - Mapping data
 */
function drawConnectionLine(svg, sourceBox, targetBox, mapping) {
    const containerRect = svg.parentElement.getBoundingClientRect();

    // Find the specific source field item
    const sourceFields = sourceBox.querySelectorAll('.update-field');
    let sourceFieldElement = null;
    for (const field of sourceFields) {
        if (field.getAttribute('data-field') === mapping.sourceField) {
            sourceFieldElement = field;
            break;
        }
    }

    // Find the specific target field item
    const targetFields = targetBox.querySelectorAll('.response-field');
    let targetFieldElement = null;
    for (const field of targetFields) {
        if (field.getAttribute('data-field') === mapping.targetField) {
            targetFieldElement = field;
            break;
        }
    }

    // If we found the field elements, use them; otherwise fall back to box centers
    let x1, y1, x2, y2;
    let sourceBoxRect, targetBoxRect;

    if (sourceFieldElement) {
        const sourceFieldRect = sourceFieldElement.getBoundingClientRect();
        const sourceBullet = sourceFieldElement.querySelector('.update-bullet');
        const bulletRect = sourceBullet.getBoundingClientRect();
        x1 = bulletRect.right - containerRect.left;
        y1 = bulletRect.top - containerRect.top + bulletRect.height / 2;
    } else {
        sourceBoxRect = sourceBox.getBoundingClientRect();
        x1 = sourceBoxRect.right - containerRect.left;
        y1 = sourceBoxRect.top - containerRect.top + sourceBoxRect.height / 2;
    }

    if (targetFieldElement) {
        const targetFieldRect = targetFieldElement.getBoundingClientRect();
        const targetBullet = targetFieldElement.querySelector('.response-bullet');
        const bulletRect = targetBullet.getBoundingClientRect();
        x2 = bulletRect.left - containerRect.left;
        y2 = bulletRect.top - containerRect.top + bulletRect.height / 2;
    } else {
        targetBoxRect = targetBox.getBoundingClientRect();
        x2 = targetBoxRect.left - containerRect.left;
        y2 = targetBoxRect.top - containerRect.top + targetBoxRect.height / 2;
    }

    // Get box rectangles for intersection detection
    if (!sourceBoxRect) {
        sourceBoxRect = sourceBox.getBoundingClientRect();
    }
    if (!targetBoxRect) {
        targetBoxRect = targetBox.getBoundingClientRect();
    }

    // Convert to container-relative coordinates
    const sourceBoxLeft = sourceBoxRect.left - containerRect.left;
    const sourceBoxRight = sourceBoxRect.right - containerRect.left;
    const sourceBoxTop = sourceBoxRect.top - containerRect.top;
    const sourceBoxBottom = sourceBoxRect.bottom - containerRect.top;

    const targetBoxLeft = targetBoxRect.left - containerRect.left;
    const targetBoxRight = targetBoxRect.right - containerRect.left;
    const targetBoxTop = targetBoxRect.top - containerRect.top;
    const targetBoxBottom = targetBoxRect.bottom - containerRect.top;

    // Calculate horizontal and vertical distances
    const distance = Math.abs(x2 - x1);
    const verticalDistance = Math.abs(y2 - y1);

    // Determine if boxes are overlapping horizontally (risky for straight lines)
    const boxesOverlapX = !(sourceBoxRight < targetBoxLeft || targetBoxRight < sourceBoxLeft);

    // Use aggressive smart routing to avoid box intersection
    let controlX1, controlX2, controlY1, controlY2;

    if (distance < 150 || boxesOverlapX) {
        // If sources are close or boxes overlap, route aggressively around/over them
        // Use much larger curve offset
        const routeDistance = Math.max(200, distance + 100);

        // Route upward and around for better clearance
        controlX1 = x1 + routeDistance * 0.6;
        controlX2 = x2 - routeDistance * 0.6;

        // Add vertical offset to go over boxes (route above if not enough vertical distance)
        if (verticalDistance < 100) {
            controlY1 = Math.min(y1, sourceBoxTop) - 80;
            controlY2 = Math.min(y2, targetBoxTop) - 80;
        } else {
            controlY1 = y1;
            controlY2 = y2;
        }
    } else {
        // For distant sources, use middle routing with slight upward bias
        controlX1 = (x1 + x2) / 2;
        controlX2 = (x1 + x2) / 2;
        controlY1 = (y1 + Math.min(sourceBoxTop, y1 - 40)) / 2;
        controlY2 = (y2 + Math.min(targetBoxTop, y2 - 40)) / 2;
    }

    // Create a smooth Bézier curve that avoids overlap
    const pathData = `M ${x1} ${y1} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${x2} ${y2}`;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('d', pathData);
    line.setAttribute('class', 'connection-line');
    line.setAttribute('fill', 'none');

    // Add label at a better position
    const labelX = (x1 + x2) / 2;
    const labelY = (y1 + y2) / 2 - 8;

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', labelX);
    label.setAttribute('y', labelY);
    label.setAttribute('class', 'connection-label');
    label.textContent = `${mapping.sourceField} → ${mapping.targetField}`;

    svg.appendChild(line);
    svg.appendChild(label);

    // Click to remove mapping
    line.addEventListener('click', function () {
        removeFieldMapping(
            `${mapping.sourceId}->${mapping.targetId}`,
            mapping.sourceField,
            mapping.targetField
        );
    });
    label.addEventListener('click', function () {
        removeFieldMapping(
            `${mapping.sourceId}->${mapping.targetId}`,
            mapping.sourceField,
            mapping.targetField
        );
    });
}

/**
 * Store the visual order of connections separately from the data
 */
let connectionsOrder = [];

/**
 * Save connections order to localStorage
 */
function saveConnectionsOrder() {
    localStorage.setItem('api_integrator_connections_order', JSON.stringify(connectionsOrder));
}

/**
 * Load connections order from localStorage
 */
function loadConnectionsOrder() {
    const data = localStorage.getItem('api_integrator_connections_order');
    if (data) {
        try {
            connectionsOrder = JSON.parse(data);
        } catch (e) {
            connectionsOrder = [];
        }
    }
}

/**
 * Render the connections list on the right side with drag-and-drop support
 */
function renderConnectionsList() {
    const list = document.getElementById('connections-list');
    if (!list) return;

    list.innerHTML = '';

    const allMappings = [];
    Object.entries(fieldMappings).forEach(([key, mappings]) => {
        const [sourceIdStr, targetIdStr] = key.split('->');
        const sourceId = parseInt(sourceIdStr);
        const targetId = parseInt(targetIdStr);
        const source = getSource(sourceId);
        const target = getSource(targetId);

        mappings.forEach(mapping => {
            const connectionId = `${key}|${mapping.sourceField}|${mapping.targetField}`;
            allMappings.push({
                connectionId,
                key,
                sourceId,
                targetId,
                sourceName: source ? source.name : 'Unknown',
                targetName: target ? target.name : 'Unknown',
                sourceField: mapping.sourceField,
                targetField: mapping.targetField,
                mapping
            });
        });
    });

    if (allMappings.length === 0) {
        list.innerHTML = '<li class="connections-list-empty">No connections yet. Click field bullets to create connections.</li>';
        return;
    }

    // Sort according to stored order, then append any new connections
    const sortedMappings = [];
    connectionsOrder.forEach(id => {
        const conn = allMappings.find(m => m.connectionId === id);
        if (conn) sortedMappings.push(conn);
    });
    // Add any mappings that aren't in the order list (new ones)
    allMappings.forEach(conn => {
        if (!sortedMappings.includes(conn)) {
            sortedMappings.push(conn);
            connectionsOrder.push(conn.connectionId);
        }
    });

    sortedMappings.forEach((conn, index) => {
        const li = document.createElement('li');
        li.draggable = true;
        li.dataset.connectionId = conn.connectionId;
        li.dataset.dragIndex = index;
        li.innerHTML = `
            <div class="connection-drag-handle">☰</div>
            <div class="connection-info">
                <span class="connection-source">${conn.sourceName}</span>
                <span class="connection-source">.${conn.sourceField}</span>
                <span class="connection-arrow-text">→</span>
                <span class="connection-target">${conn.targetName}</span>
                <span class="connection-target">.${conn.targetField}</span>
            </div>
            <button class="connection-remove-btn">Remove</button>
        `;

        // Add drag event listeners
        li.addEventListener('dragstart', function (e) {
            e.dataTransfer.effectAllowed = 'move';
            li.classList.add('dragging');
            e.dataTransfer.setData('text/html', li.innerHTML);
        });

        li.addEventListener('dragend', function (e) {
            li.classList.remove('dragging');
            // Remove all drag-over classes
            document.querySelectorAll('#connections-list li').forEach(item => {
                item.classList.remove('drag-over-top', 'drag-over-bottom');
            });
        });

        li.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const allItems = document.querySelectorAll('#connections-list li');
            const currentIndex = Array.from(allItems).indexOf(li);
            const draggedIndex = Array.from(allItems).findIndex(item => item.classList.contains('dragging'));

            // Remove all visual indicators
            allItems.forEach(item => {
                item.classList.remove('drag-over-top', 'drag-over-bottom');
            });

            // Add indicator based on position
            const rect = li.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            if (e.clientY < midpoint && currentIndex !== draggedIndex) {
                li.classList.add('drag-over-top');
            } else if (e.clientY >= midpoint && currentIndex !== draggedIndex) {
                li.classList.add('drag-over-bottom');
            }
        });

        li.addEventListener('dragleave', function (e) {
            li.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        li.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const draggedItem = document.querySelector('#connections-list li.dragging');
            if (!draggedItem || draggedItem === li) return;

            const rect = li.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;

            if (e.clientY < midpoint) {
                li.parentNode.insertBefore(draggedItem, li);
            } else {
                li.parentNode.insertBefore(draggedItem, li.nextSibling);
            }

            // Update order
            updateConnectionsOrder();
        });

        // Add remove handler
        const removeBtn = li.querySelector('.connection-remove-btn');
        removeBtn.addEventListener('click', function () {
            removeFieldMapping(conn.key, conn.sourceField, conn.targetField);
        });

        list.appendChild(li);
    });

    saveConnectionsOrder();
}

/**
 * Update the connections order based on current DOM order
 */
function updateConnectionsOrder() {
    const list = document.getElementById('connections-list');
    if (!list) return;

    connectionsOrder = [];
    document.querySelectorAll('#connections-list li:not(.connections-list-empty)').forEach(li => {
        const connId = li.dataset.connectionId;
        if (connId) {
            connectionsOrder.push(connId);
        }
    });

    saveConnectionsOrder();
}

// On page load, restore mappings and render map
document.addEventListener('DOMContentLoaded', function () {
    loadMappingsFromStorage();
    loadConnectionsOrder();
    document.addEventListener('sourcesUpdated', function () {
        initializeSourcesMap();
    });
    // Initial render
    initializeSourcesMap();
});