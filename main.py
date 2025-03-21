from flask import Flask
from routes import login_bp, home_bp, history_bp
import logging

# Create Flask app
app = Flask(__name__)

# Set secret key (required for session management)
app.secret_key = 'secret-key'

# Register blueprints
app.register_blueprint(login_bp)
app.register_blueprint(home_bp)
app.register_blueprint(history_bp)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)