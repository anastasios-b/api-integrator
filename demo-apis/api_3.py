from flask import Flask, jsonify, request, abort
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Health check endpoint
@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"message": "API 3 is on!"}), 200

# Authorization decorator
def require_demo_token(func):
    def wrapper(*args, **kwargs):
        token = request.headers.get("Demo-Token")
        if token != "12345678":
            return jsonify({"error": "Unauthorized"}), 401
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__  # needed for Flask routing
    return wrapper

# GET endpoint
@app.route("/user", methods=["GET"])
@require_demo_token
def get_user():
    user_data = {
        "firstname": "John",
        "lastname": "Demoguy",
        "email": "john.demoguy@ademo.com"
    }
    return jsonify(user_data)

if __name__ == "__main__":
    app.run(port=8083, debug=True)
