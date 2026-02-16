/**
 * Generate Python code for API integration
 */
function generatePythonCode() {
    const sources = getAllSources();
    const mappings = getAllFieldMappings();

    let code = `# Auto-generated API Integration Code - Python
import requests
import json

`;

    // Define source configurations as variables
    sources.forEach(source => {
        const sourceVar = source.name.toLowerCase().replace(/\s+/g, '_');
        // Skip sources that have no endpoints configured at all
        if (!source.receiveEndpoint && !source.updateEndpoint) return;

        code += `# Configuration for ${source.name}
`;
        // Only include receive endpoint configuration if it's set
        if (source.receiveEndpoint && source.receiveEndpoint.trim() !== '') {
            code += `${sourceVar}_url = '${source.receiveEndpoint}'
${sourceVar}_method = '${source.receiveMethod || 'GET'}'
${sourceVar}_headers = ${JSON.stringify(source.receiveHeaders ? JSON.parse(source.receiveHeaders) : {})}
`;
        }
        // Only include update endpoint configuration if it's set
        if (source.updateEndpoint && source.updateEndpoint.trim() !== '') {
            code += `${sourceVar}_update_url = '${source.updateEndpoint}'
${sourceVar}_update_method = '${source.updateMethod || 'POST'}'
${sourceVar}_update_headers = ${JSON.stringify(source.updateHeaders ? JSON.parse(source.updateHeaders) : {})}
`;
        }
        code += `
`;
    });

    code += `
# Helper function to get nested values
def get_nested_value(data, path):
    """Navigate nested objects using dot notation."""
    keys = path.split('.')
    value = data
    for key in keys:
        if isinstance(value, dict):
            value = value.get(key)
        else:
            return None
    return value


# Main integration function
def integrate():
    """Execute all field mappings and synchronize data between sources."""
`;

    // First, collect all unique sources that need to be fetched
    const sourcesToFetch = new Set();
    Object.keys(mappings).forEach(key => {
        const [sourceId] = key.split('->');
        const source = sources.find(s => s.id == sourceId);
        if (source && source.receiveEndpoint) {
            sourcesToFetch.add(source.id);
        }
    });

    // Generate code to fetch all source data once at the beginning
    sourcesToFetch.forEach(sourceId => {
        const source = sources.find(s => s.id == sourceId);
        if (source) {
            const sourceVar = source.name.toLowerCase().replace(/\s+/g, '_');
            code += `
    # Fetch data from ${source.name}
    print(f"Fetching data from ${source.name}...")
    response = requests.request(method=${sourceVar}_method, url=${sourceVar}_url, headers=${sourceVar}_headers)
    if response.status_code >= 200 and response.status_code < 300:
        ${sourceVar}_data = response.json()
        print(f"✓ Successfully received data from ${source.name}")
    else:
        print(f"✗ Failed to fetch from ${source.name}: {response.status_code}")
        return`;
        }
    });

    code += `

    # Process all mappings using fetched data
`;

    // Generate the mappings code using pre-fetched data
    if (Object.keys(mappings).length > 0) {
        Object.entries(mappings).forEach(([key, fieldMappings]) => {
            const [sourceId, targetId] = key.split('->');
            const source = sources.find(s => s.id == sourceId);
            const target = sources.find(s => s.id == targetId);

            // Skip generating mapping code if the source has no receive URL configured
            if (source && target && source.receiveEndpoint) {
                const sourceVar = source.name.toLowerCase().replace(/\s+/g, '_');
                const targetVar = target.name.toLowerCase().replace(/\s+/g, '_');

                code += `
    # Transform data from ${source.name} to ${target.name}
    print(f"Transforming data from ${source.name} to ${target.name}...")
    transformed_data = {}
`;

                fieldMappings.forEach(mapping => {
                    code += `    transformed_data['${mapping.targetField}'] = get_nested_value(${sourceVar}_data, '${mapping.sourceField}')
`;
                });

                code += `
    # Send transformed data to ${target.name}
    print(f"Sending data to ${target.name}...")
    response = requests.request(method=${targetVar}_update_method, url=${targetVar}_update_url, json=transformed_data, headers=${targetVar}_update_headers)
    if response.status_code >= 200 and response.status_code < 300:
        print(f"✓ Successfully sent data to ${target.name}")
    else:
        print(f"✗ Failed to send to ${target.name}: {response.status_code}")
`;
            }
        });
    }

    code += `

if __name__ == '__main__':
    try:
        integrate()
        print("\\n✓ Integration complete!")
    except Exception as e:
        print(f"\\n✗ Error: {e}")
`;

    return code;
}

/**
 * Generate PHP code for API integration
 */
function generatePHPCode() {
    const sources = getAllSources();
    const mappings = getAllFieldMappings();

    let code = `<?php
// Auto-generated API Integration Code - PHP

`;

    // Define source configurations as variables
    sources.forEach(source => {
        const sourceVar = source.name.toLowerCase().replace(/\s+/g, '_');
        // Skip sources that have no endpoints configured at all
        if (!source.receiveEndpoint && !source.updateEndpoint) return;

        code += `// Configuration for ${source.name}
`;
        // Only include receive endpoint configuration if it's set
        if (source.receiveEndpoint && source.receiveEndpoint.trim() !== '') {
            code += `$${sourceVar}_url = '${source.receiveEndpoint}';
$${sourceVar}_method = '${source.receiveMethod || 'GET'}';
$${sourceVar}_headers = ${JSON.stringify(source.receiveHeaders ? JSON.parse(source.receiveHeaders) : {})};
`;
        }
        // Only include update endpoint configuration if it's set
        if (source.updateEndpoint && source.updateEndpoint.trim() !== '') {
            code += `$${sourceVar}_update_url = '${source.updateEndpoint}';
$${sourceVar}_update_method = '${source.updateMethod || 'POST'}';
$${sourceVar}_update_headers = ${JSON.stringify(source.updateHeaders ? JSON.parse(source.updateHeaders) : {})};
`;
        }
        code += `
`;
    });

    code += `
// Helper function to get nested values
function get_nested_value($data, $path) {
    $keys = explode('.', $path);
    $value = $data;
    foreach ($keys as $key) {
        if (is_array($value) && isset($value[$key])) {
            $value = $value[$key];
        } else {
            return null;
        }
    }
    return $value;
}

// Helper function to make HTTP requests
function http_request($method, $url, $headers = [], $data = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return ['code' => $httpCode, 'body' => json_decode($response, true)];
}

// Main integration function
function integrate() {
    global $`;

    // Add all source variables to global declaration
    sources.forEach((source, index) => {
        const sourceVar = source.name.toLowerCase().replace(/\s+/g, '_');
        if (index > 0) code += `, $`;
        code += sourceVar + '_url, $' + sourceVar + '_method, $' + sourceVar + '_headers, $' + sourceVar + '_update_url, $' + sourceVar + '_update_method, $' + sourceVar + '_update_headers';
    });

    code += `;

`;

    // First, collect all unique sources that need to be fetched
    const sourcesToFetch = new Set();
    Object.keys(mappings).forEach(key => {
        const [sourceId] = key.split('->');
        const source = sources.find(s => s.id == sourceId);
        if (source && source.receiveEndpoint) {
            sourcesToFetch.add(source.id);
        }
    });

    // Generate code to fetch all source data once at the beginning
    sourcesToFetch.forEach(sourceId => {
        const source = sources.find(s => s.id == sourceId);
        if (source) {
            const sourceVar = source.name.toLowerCase().replace(/\s+/g, '_');
            code += `
    // Fetch data from ${source.name}
    echo "Fetching data from ${source.name}...\\n";
    $sourceHeaders = array_map(function($k, $v) { return "$k: $v"; }, array_keys($${sourceVar}_headers), array_values($${sourceVar}_headers));
    $response = http_request($${sourceVar}_method, $${sourceVar}_url, $sourceHeaders);
    if ($response['code'] >= 200 && $response['code'] < 300) {
        $${sourceVar}_data = $response['body'];
        echo "✓ Successfully received data from ${source.name}\\n";
    } else {
        echo "✗ Failed to fetch from ${source.name}: " . $response['code'] . "\\n";
        return;
    }`;
        }
    });

    code += `

    // Process all mappings using fetched data
`;

    // Generate the mappings code using pre-fetched data
    if (Object.keys(mappings).length > 0) {
        Object.entries(mappings).forEach(([key, fieldMappings]) => {
            const [sourceId, targetId] = key.split('->');
            const source = sources.find(s => s.id == sourceId);
            const target = sources.find(s => s.id == targetId);

            // Skip generating mapping code if the source has no receive URL configured
            if (source && target && source.receiveEndpoint) {
                const sourceVar = source.name.toLowerCase().replace(/\s+/g, '_');
                const targetVar = target.name.toLowerCase().replace(/\s+/g, '_');

                code += `
    
    // Transform data from ${source.name} to ${target.name}
    echo "Transforming data from ${source.name} to ${target.name}...\\n";
    $transformed_data = [];
`;

                fieldMappings.forEach(mapping => {
                    code += `    $transformed_data['${mapping.targetField}'] = get_nested_value($${sourceVar}_data, '${mapping.sourceField}');
`;
                });

                code += `
    // Send transformed data to ${target.name}
    echo "Sending data to ${target.name}...\\n";
    $targetHeaders = array_merge(
        array_map(function($k, $v) { return "$k: $v"; }, array_keys($${targetVar}_update_headers), array_values($${targetVar}_update_headers)),
        ['Content-Type: application/json']
    );
    $response = http_request($${targetVar}_update_method, $${targetVar}_update_url, $targetHeaders, $transformed_data);
    if ($response['code'] >= 200 && $response['code'] < 300) {
        echo "✓ Successfully sent data to ${target.name}\\n";
    } else {
        echo "✗ Failed to send to ${target.name}: " . $response['code'] . "\\n";
    }
`;
            }
        });
    }

    code += `
}

// Run integration
try {
    integrate();
    echo "\\n✓ Integration complete!\\n";
} catch (Exception $e) {
    echo "\\n✗ Error: " . $e->getMessage() . "\\n";
}
?>
`;

    return code;
}

/**
 * Generate Go code for API integration
 */
function generateGoCode() {
    const sources = getAllSources();
    const mappings = getAllFieldMappings();

    let code = `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
    "strings"
)

`;

    // Define source configurations as structs
    sources.forEach(source => {
        const sourceVar = source.name.toLowerCase().replace(/\s+/g, '_');
        // Skip sources that have no endpoints configured at all
        if (!source.receiveEndpoint && !source.updateEndpoint) return;

        code += `// Configuration for ${source.name}
var (
`;
        // Only include receive endpoint configuration if it's set
        if (source.receiveEndpoint && source.receiveEndpoint.trim() !== '') {
            code += `    ${sourceVar}_url = "${source.receiveEndpoint}"
    ${sourceVar}_method = "${source.receiveMethod || 'GET'}"
    ${sourceVar}_headers = map[string]string{
`;
            const receiveHeaders = source.receiveHeaders ? JSON.parse(source.receiveHeaders) : {};
            Object.entries(receiveHeaders).forEach(([key, value]) => {
                code += `        "${key}": "${value}",\n`;
            });
            code += `    }
`;
        }
        // Only include update endpoint configuration if it's set
        if (source.updateEndpoint && source.updateEndpoint.trim() !== '') {
            code += `    ${sourceVar}_update_url = "${source.updateEndpoint}"
    ${sourceVar}_update_method = "${source.updateMethod || 'POST'}"
    ${sourceVar}_update_headers = map[string]string{
`;
            const updateHeaders = source.updateHeaders ? JSON.parse(source.updateHeaders) : {};
            Object.entries(updateHeaders).forEach(([key, value]) => {
                code += `        "${key}": "${value}",\n`;
            });
            code += `    }
`;
        }
        code += `)

`;
    });

    code += `
// Helper function to get nested values using dot notation
func getNestedValue(data map[string]interface{}, path string) interface{} {
    keys := strings.Split(path, ".")
    var value interface{} = data
    
    for _, key := range keys {
        if m, ok := value.(map[string]interface{}); ok {
            value = m[key]
        } else {
            return nil
        }
    }
    return value
}

// Helper function to make HTTP requests
func httpRequest(method, url string, headers map[string]string, data map[string]interface{}) (map[string]interface{}, int, error) {
    var reqBody *bytes.Buffer
    if data != nil {
        payload, _ := json.Marshal(data)
        reqBody = bytes.NewBuffer(payload)
    }
    
    req, err := http.NewRequest(method, url, reqBody)
    if err != nil {
        return nil, 0, err
    }
    
    req.Header.Set("Content-Type", "application/json")
    for key, value := range headers {
        req.Header.Set(key, value)
    }
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, 0, err
    }
    defer resp.Body.Close()
    
    body, _ := ioutil.ReadAll(resp.Body)
    var result map[string]interface{}
    json.Unmarshal(body, &result)
    
    return result, resp.StatusCode, nil
}

// Main integration function
func integrate() {
`;

    // First, collect all unique sources that need to be fetched
    const sourcesToFetch = new Set();
    Object.keys(mappings).forEach(key => {
        const [sourceId] = key.split('->');
        const source = sources.find(s => s.id == sourceId);
        if (source && source.receiveEndpoint) {
            sourcesToFetch.add(source.id);
        }
    });

    // Generate code to fetch all source data once at the beginning
    sourcesToFetch.forEach(sourceId => {
        const source = sources.find(s => s.id == sourceId);
        if (source) {
            const sourceVar = source.name.toLowerCase().replace(/\s+/g, '_');
            code += `
    // Fetch data from ${source.name}
    fmt.Println("Fetching data from ${source.name}...")
    ${sourceVar}_data, code, err := httpRequest(${sourceVar}_method, ${sourceVar}_url, ${sourceVar}_headers, nil)
    if err != nil || code < 200 || code >= 300 {
        fmt.Printf("✗ Failed to fetch from ${source.name}: %v\\n", err)
        return
    }
    fmt.Println("✓ Successfully received data from ${source.name}")`;
        }
    });

    code += `

    // Process all mappings using fetched data
`;

    // Generate the mappings code using pre-fetched data
    if (Object.keys(mappings).length > 0) {
        Object.entries(mappings).forEach(([key, fieldMappings]) => {
            const [sourceId, targetId] = key.split('->');
            const source = sources.find(s => s.id == sourceId);
            const target = sources.find(s => s.id == targetId);

            if (source && target && source.receiveEndpoint) {
                const sourceVar = source.name.toLowerCase().replace(/\s+/g, '_');
                const targetVar = target.name.toLowerCase().replace(/\s+/g, '_');

                code += `
    
    // Transform data from ${source.name} to ${target.name}
    fmt.Println("Transforming data from ${source.name} to ${target.name}...")
    transformed_data := make(map[string]interface{})
`;

                fieldMappings.forEach(mapping => {
                    code += `    transformed_data["${mapping.targetField}"] = getNestedValue(${sourceVar}_data, "${mapping.sourceField}")
`;
                });

                code += `
    // Send transformed data to ${target.name}
    fmt.Println("Sending data to ${target.name}...")
    _, code, err = httpRequest(${targetVar}_update_method, ${targetVar}_update_url, ${targetVar}_update_headers, transformed_data)
    if err != nil || code < 200 || code >= 300 {
        fmt.Printf("✗ Failed to send to ${target.name}: %v\\n", err)
    } else {
        fmt.Println("✓ Successfully sent data to ${target.name}")
    }
`;
            }
        });
    }

    code += `
}

func main() {
    fmt.Println("Starting API integration...")
    integrate()
    fmt.Println("\\n✓ Integration complete!")
}
`;

    return code;
}

/**
 * Render code with syntax highlighting tabs
 */
function renderCode() {
    const container = document.getElementById('code-generation-languages');
    const codeContainer = document.getElementById('generated-code');

    if (!container || !codeContainer) return;

    // Check if we have sources and mappings to generate code
    const sources = getAllSources();
    const mappings = getAllFieldMappings();
    const hasData = sources.length > 0 && Object.keys(mappings).length > 0;

    // Get currently selected language from data attribute
    let selectedLanguage = container.dataset.selectedLanguage || 'python';

    let code = '';

    if (!hasData) {
        // Show placeholder message when no sources or mappings exist
        code = `// Your generated code will appear here.
// 
// To get started:
// 1. Add at least 2 API sources in the "Sources List" section
// 2. Configure their endpoints, headers, and response/payload examples
// 3. Create field mappings in the "Sources Map" section by clicking field bullets
// 4. Once you have mappings, the integration code will be generated automatically
// 
// Supported languages: Python, PHP, Go`;
    } else {
        // Generate actual code based on selected language
        switch (selectedLanguage) {
            case 'python':
                code = generatePythonCode();
                break;
            case 'php':
                code = generatePHPCode();
                break;
            case 'go':
                code = generateGoCode();
                break;
            default:
                code = generatePythonCode();
        }
    }

    codeContainer.textContent = code;

    // Update active tab styling
    document.querySelectorAll('#code-generation-languages .button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.codeGenerationLanguage === selectedLanguage) {
            btn.classList.add('active');
        }
    });
}

/**
 * Initialize code generation
 */
function initializeCodeGeneration() {
    const container = document.getElementById('code-generation-languages');
    if (!container) return;

    // Add click handlers to language buttons
    document.querySelectorAll('#code-generation-languages .button').forEach(btn => {
        btn.addEventListener('click', function () {
            container.dataset.selectedLanguage = this.dataset.codeGenerationLanguage;
            renderCode();
        });
    });

    // Initial render
    renderCode();
}

/**
 * Listen for changes in sources and mappings
 */
document.addEventListener('DOMContentLoaded', function () {
    initializeCodeGeneration();
    // Re-render code when sources update
    document.addEventListener('sourcesUpdated', function () {
        if (typeof renderCode === 'function') {
            renderCode();
        }
    });
});