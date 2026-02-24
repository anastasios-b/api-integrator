# API Integrator Tool

A visual API mapping tool that simplifies complex service integrations with a drag-and-drop interface and automatic code generation.
Visit [the tool's page](https://anastasios-bolkas.tech/api-integrator) to test the tool live.

## Demo APIs

- [API 1 (Port 8081)](#api-1-port-8081)
- [API 2 (Port 8082)](#api-2-port-8082)
- [API 3 (Port 8083)](#api-3-port-8083)
- [Running the APIs](#running-the-apis)
- [Testing the APIs](#testing-the-apis)

## API 1 (Port 8081)

### Authentication

- **Method**: Query Parameter
- **Parameter**: `demo-token`
- **Valid Token**: `12345678`

### Endpoints

#### GET /user

Retrieves user information.

**Request:**

```http
GET /user?demo-token=12345678
```

**Response (200 OK):**

```json
{
  "first_name": "John",
  "last_name": "Demoguy",
  "user_email": "demoguy@john.me.ce"
}
```

#### POST /user

Submits user information.

**Request:**

```http
POST /user?token=12345678
Content-Type: application/json

{
    "first_name": "John",
    "last_name": "Doe",
    "user_email": "john.doe@example.com"
}
```

**Response (201 Created):**

```json
{
  "message": "User data received"
}
```

## API 2 (Port 8082)

### Authentication

- **Method**: HTTP Header
- **Header**: `Demo-Token`
- **Valid Token**: `12345678`

### Endpoints

#### POST /get-user

Retrieves user information.

**Request:**

```http
POST /get-user
Content-Type: application/json
Demo-Token: 12345678

{}
```

**Response (200 OK):**

```json
{
  "firstname": "John",
  "lastname": "Demoguy",
  "email": "john.demoguy@ademo.com"
}
```

#### POST /update-user

Submits user information.

**Request:**

```http
POST /update-user
Content-Type: application/json
Demo-Token: 12345678

{
    "name": "John",
    "surname": "Doe",
    "email": "john.doe@example.com"
}
```

**Response (201 Created):**

```json
{
  "message": "Payload received"
}
```

## API 3 (Port 8083)

### Authentication

- **Method**: HTTP Header
- **Header**: `Demo-Token`
- **Valid Token**: `12345678`

### Endpoints

#### GET /user

Retrieves user information.

**Request:**

```http
GET /user
Demo-Token: 12345678
```

**Response (200 OK):**

```json
{
  "firstname": "John",
  "lastname": "Demoguy",
  "email": "john.demoguy@ademo.com"
}
```

## Running the APIs

1. Ensure you have Python and Flask installed
2. Install the required dependencies:
   ```bash
   pip install flask
   ```
3. Run each API in a separate terminal:
   ```bash
   python api_1.py  # Runs on port 8081
   python api_2.py  # Runs on port 8082
   python api_3.py  # Runs on port 8083
   ```

## Testing the APIs

You can test the APIs using `curl` or any API testing tool like Postman. Here are some example `curl` commands:

### Testing API 1

```bash
# GET request
curl "http://localhost:8081/user?demo-token=12345678"

# POST request
curl -X POST -H "Content-Type: application/json" -d '{"first_name":"John","last_name":"Doe","user_email":"john.doe@example.com"}' "http://localhost:8081/user?demo-token=12345678"
```

### Testing API 2

```bash
# GET user data
curl -X POST -H "Content-Type: application/json" -H "Demo-Token: 12345678" -d '{}' http://localhost:8082/get-user

# POST user data
curl -X POST -H "Content-Type: application/json" -H "Demo-Token: 12345678" -d '{"name":"John","surname":"Doe","email":"john.doe@example.com"}' http://localhost:8082/update-user
```

### Testing API 3

```bash
# GET request
curl -H "Demo-Token: 12345678" http://localhost:8083/user
```

## Notes

- All APIs implement different authentication methods (query parameter, JSON payload, and header)
- Each API runs on a different port (8081, 8082, 8083)
- The APIs are for demonstration purposes only and should not be used in production
