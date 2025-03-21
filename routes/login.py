from flask import Flask, render_template, request, redirect, url_for, session, Blueprint
from config import user_cred

# Create blueprint
login_bp = Blueprint('login', __name__)

@login_bp.route('/', methods=['GET', 'POST'])
@login_bp.route('/home', methods=['GET', 'POST'])
def home():
    # Check if user is logged in
    if 'user' in session and session['user'] in user_cred:
        return render_template('home.html')
    
    # Handle login form submission
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if username in user_cred and user_cred[username] == password:
            session['user'] = username  # Store user in session
            return redirect(url_for('login.home'))  # Update endpoint name
        else:
            error = 'Invalid username or password.'
    
    # Show login page
    return render_template('login.html', error=error)

@login_bp.route('/logout')
def logout():
    # Check if 'user' exists in session before popping
    if 'user' in session:
        session.pop('user')
    return redirect(url_for('login.home'))  # Update endpoint name