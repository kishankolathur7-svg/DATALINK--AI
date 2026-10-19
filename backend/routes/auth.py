
from flask import Blueprint, request, jsonify
import re
import sqlite3

from werkzeug.security import check_password_hash
from models.user import create_user
from database import get_db_connection


# --------------------------------------------------
# Blueprint
# --------------------------------------------------

auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


# --------------------------------------------------
# Helpers
# --------------------------------------------------

def get_request_data():
    """Return a JSON object or None for invalid request bodies."""
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return None

    return data


def valid_email(email):
    """Basic email format validation."""
    if not email or len(email) > 254:
        return False

    return bool(
        re.fullmatch(
            r"[^@\s]+@[^@\s]+\.[^@\s]+",
            email
        )
    )


# ==================================================
# REGISTER
# ==================================================

@auth_bp.route("/register", methods=["POST"])
def register():
    data = get_request_data()

    if data is None:
        return jsonify({
            "success": False,
            "message": "A valid JSON request body is required"
        }), 400

    name = data.get("name", "")
    email = data.get("email", "")
    password = data.get("password", "")

    if not all(isinstance(value, str) for value in (
        name, email, password
    )):
        return jsonify({
            "success": False,
            "message": "Name, email and password must be text"
        }), 400

    name = name.strip()
    email = email.strip().lower()

    if not name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Name, email and password are required"
        }), 400

    if len(name) > 100:
        return jsonify({
            "success": False,
            "message": "Name must be 100 characters or fewer"
        }), 400

    if not valid_email(email):
        return jsonify({
            "success": False,
            "message": "Please enter a valid email address"
        }), 400

    if len(password) < 8:
        return jsonify({
            "success": False,
            "message": "Password must contain at least 8 characters"
        }), 400

    if len(password) > 128:
        return jsonify({
            "success": False,
            "message": "Password must be 128 characters or fewer"
        }), 400

    try:
        user_id = create_user(
            name,
            email,
            password
        )

        return jsonify({
            "success": True,
            "message": "User registered successfully",
            "user_id": user_id
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({
            "success": False,
            "message": "Email already registered"
        }), 409

    except Exception:
        # Log details on the server if needed, but do not expose
        # database paths or internal exception details to clients.
        return jsonify({
            "success": False,
            "message": "Registration failed. Please try again."
        }), 500


# ==================================================
# LOGIN
# ==================================================

@auth_bp.route("/login", methods=["POST"])
def login():
    data = get_request_data()

    if data is None:
        return jsonify({
            "success": False,
            "message": "A valid JSON request body is required"
        }), 400

    email = data.get("email", "")
    password = data.get("password", "")

    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({
            "success": False,
            "message": "Email and password must be text"
        }), 400

    email = email.strip().lower()

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required"
        }), 400

    connection = None

    try:
        connection = get_db_connection()

        user = connection.execute(
            """
            SELECT
                id,
                name,
                email,
                password_hash
            FROM users
            WHERE email = ?
            """,
            (email,)
        ).fetchone()

    except Exception:
        return jsonify({
            "success": False,
            "message": "Login failed. Please try again."
        }), 500

    finally:
        if connection is not None:
            connection.close()

    if user is None:
        return jsonify({
            "success": False,
            "message": "Invalid email or password"
        }), 401

    stored_hash = user["password_hash"]

    if not stored_hash or not check_password_hash(
        stored_hash,
        password
    ):
        return jsonify({
            "success": False,
            "message": "Invalid email or password"
        }), 401

    return jsonify({
        "success": True,
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    }), 200
