from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


# Health check endpoint
@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"message": "API 2 is on!"}), 200

# Validate token from request headers
def validate_header_token():
    return request.headers.get("Demo-Token") == "12345678"


# POST - get demo data
@app.route("/get-user", methods=["POST"])
def get_data():
    payload = request.json or {}

    if not validate_header_token():
        return jsonify({"error": "Unauthorized"}), 401

    response_data = {
        "firstname": "John",
        "lastname": "Demoguy",
        "email": "john.demoguy@ademo.com"
    }

    return jsonify(response_data), 200


# POST - submit user data
@app.route("/update-user", methods=["POST"])
def submit():
    payload = request.json or {}

    if not validate_header_token():
        return jsonify({"error": "Unauthorized"}), 401

    name = payload.get("name")
    surname = payload.get("surname")
    email = payload.get("email")

    print("Received data:")
    print(f"Name: {name}")
    print(f"Surname: {surname}")
    print(f"Email: {email}")

    return jsonify({"message": "Payload received"}), 201


if __name__ == "__main__":
    app.run(port=8082, debug=True)
