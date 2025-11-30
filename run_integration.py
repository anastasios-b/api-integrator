# Auto-generated API Integration Code - Python
import requests
import json

# Configuration for API 1
api_1_url = 'http://127.0.0.1:8081/user?demo-token=12345678'
api_1_method = 'GET'
api_1_headers = {}
api_1_update_url = 'http://127.0.0.1:8081/user?demo-token=12345678'
api_1_update_method = 'POST'
api_1_update_headers = {}

# Configuration for API 2
api_2_url = 'http://localhost:8082/get-user'
api_2_method = 'POST'
api_2_headers = {"Demo-Token":"12345678","Content-Type":"application/json"}
api_2_update_url = 'http://localhost:8082/update-user'
api_2_update_method = 'POST'
api_2_update_headers = {"Demo-Token":"12345678","Content-Type":"application/json"}

# Configuration for API 3
api_3_url = 'http://localhost:8083/user'
api_3_method = 'GET'
api_3_headers = {"Demo-Token":"12345678","Content-Type":"application/json"}


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

    # Fetch data from API 2
    print(f"Fetching data from API 2...")
    response = requests.request(method=api_2_method, url=api_2_url, headers=api_2_headers, json={})
    if response.status_code >= 200 and response.status_code < 300:
        api_2_data = response.json()
        print(f"✓ Successfully received data from API 2")
    else:
        print(f"✗ Failed to fetch from API 2: {response.status_code}")
        return
    # Fetch data from API 3
    print(f"Fetching data from API 3...")
    response = requests.request(method=api_3_method, url=api_3_url, headers=api_3_headers)
    if response.status_code >= 200 and response.status_code < 300:
        api_3_data = response.json()
        print(f"✓ Successfully received data from API 3")
    else:
        print(f"✗ Failed to fetch from API 3: {response.status_code}")
        return

    # Process all mappings using fetched data

    # Transform data from API 2 to API 1
    print(f"Transforming data from API 2 to API 1...")
    transformed_data = {}
    transformed_data['user_email'] = get_nested_value(api_2_data, 'email')

    # Send transformed data to API 1
    print(f"Sending data to API 1...")
    response = requests.request(method=api_1_update_method, url=api_1_update_url, json=transformed_data, headers=api_1_update_headers)
    if response.status_code >= 200 and response.status_code < 300:
        print(f"✓ Successfully sent data to API 1")
    else:
        print(f"✗ Failed to send to API 1: {response.status_code}")

    # Transform data from API 3 to API 2
    print(f"Transforming data from API 3 to API 2...")
    transformed_data = {}
    transformed_data['email'] = get_nested_value(api_3_data, 'email')
    transformed_data['name'] = get_nested_value(api_3_data, 'firstname')

    # Send transformed data to API 2
    print(f"Sending data to API 2...")
    response = requests.request(method=api_2_update_method, url=api_2_update_url, json=transformed_data, headers=api_2_update_headers)
    if response.status_code >= 200 and response.status_code < 300:
        print(f"✓ Successfully sent data to API 2")
    else:
        print(f"✗ Failed to send to API 2: {response.status_code}")

    # Transform data from API 3 to API 1
    print(f"Transforming data from API 3 to API 1...")
    transformed_data = {}
    transformed_data['first_name'] = get_nested_value(api_3_data, 'firstname')
    transformed_data['last_name'] = get_nested_value(api_3_data, 'lastname')

    # Send transformed data to API 1
    print(f"Sending data to API 1...")
    response = requests.request(method=api_1_update_method, url=api_1_update_url, json=transformed_data, headers=api_1_update_headers)
    if response.status_code >= 200 and response.status_code < 300:
        print(f"✓ Successfully sent data to API 1")
    else:
        print(f"✗ Failed to send to API 1: {response.status_code}")


if __name__ == '__main__':
    try:
        integrate()
        print("\n✓ Integration complete!")
    except Exception as e:
        print(f"\n✗ Error: {e}")