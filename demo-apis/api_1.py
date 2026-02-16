from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


# Health check endpoint
@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"message": "API 1 is on!"}), 200

VALID_TOKEN = "12345678"


# Token validation from URL query parameter
def is_token_valid():
    token = request.args.get("demo-token")
    return token == VALID_TOKEN


# GET /user
@app.route("/user", methods=["GET"])
def get_user():
    if not is_token_valid():
        return jsonify({"error": "Unauthorized"}), 401

    data = {
        "first_name": "John",
        "last_name": "Demoguy",
        "user_email": "demoguy@john.me.ce"
    }

    return jsonify(data), 200


# POST /user
@app.route("/user", methods=["POST"])
def submit_user():
    if not is_token_valid():
        return jsonify({"error": "Unauthorized"}), 401

    payload = request.json or {}

    first_name = payload.get("first_name")
    last_name = payload.get("last_name")
    user_email = payload.get("user_email")

    print("Received user:")
    print(f"First name: {first_name}")
    print(f"Last name: {last_name}")
    print(f"Email: {user_email}")

    return jsonify({"message": "User data received"}), 201


if __name__ == "__main__":
    app.run(port=8081, debug=True)
