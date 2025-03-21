from flask import Blueprint, render_template, request, jsonify, send_from_directory, url_for
from llm.openai import OpenAIHelper
import json
import os
from werkzeug.utils import secure_filename
import logging
import glob

home_bp = Blueprint('home', __name__)
ai_helper = OpenAIHelper()

UPLOAD_FOLDER = os.path.join('data_base', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

logger = logging.getLogger(__name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.lower().split('.')[-1] in ALLOWED_EXTENSIONS

def get_feedback(image_name):
    """Get existing feedback for an image from its JSON file"""
    json_path = os.path.join('data_base', 'json', f"{image_name}.json")
    if os.path.exists(json_path):
        with open(json_path, 'r') as f:
            data = json.load(f)
            return {
                'rating': data.get('rating'),
                'comment': data.get('comment')
            }
    return None

@home_bp.route('/analyze', methods=['POST'])
def analyze_image():
    try:
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)

        if 'image' in request.files:
            image = request.files['image']
            if not image or not allowed_file(image.filename):
                return jsonify({'error': 'Invalid file format. Please upload a PNG, JPG, JPEG, or GIF file.'}), 400
            try:
                result = ai_helper.process_image(image_data=image.read())
                result_dict = result.dict()
                result_dict['image_url'] = url_for('home.uploaded_file', filename=result.name)
                
                # Get existing feedback
                feedback = get_feedback(result.name)
                if feedback:
                    result_dict.update(feedback)
                
                return jsonify(result_dict)
            except Exception as e:
                logger.error(f"Error processing uploaded image: {str(e)}")
                return jsonify({'error': str(e)}), 500
                
        elif 'url' in request.form:
            url = request.form['url']
            if not url:
                return jsonify({'error': 'URL cannot be empty'}), 400
            try:
                result = ai_helper.process_image(image_url=url)
                result_dict = result.dict()
                result_dict['image_url'] = url_for('home.uploaded_file', filename=result.name)
                return jsonify(result_dict)
            except Exception as e:
                logger.error(f"Error processing image URL: {str(e)}")
                return jsonify({'error': str(e)}), 500
        else:
            return jsonify({'error': 'No image or URL provided'}), 400

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@home_bp.route('/save-analysis', methods=['POST'])
def save_analysis():
    try:
        data = request.json
        json_dir = os.path.join('data_base', 'json')
        os.makedirs(json_dir, exist_ok=True)
        
        json_path = os.path.join(json_dir, f"{data['name']}.json")
        with open(json_path, 'w') as f:
            json.dump(data, f, indent=4)
        
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error saving analysis: {str(e)}")
        return jsonify({'error': str(e)}), 500

@home_bp.route('/submit-feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.json
        image_name = data.get('image_name')
        rating = data.get('rating')
        comment = data.get('comment')

        if not image_name:
            return jsonify({'error': 'Image name is required'}), 400

        json_path = os.path.join('data_base', 'json', f"{image_name}.json")
        
        if not os.path.exists(json_path):
            return jsonify({'error': 'Analysis not found'}), 404

        # Read existing JSON
        with open(json_path, 'r') as f:
            analysis_data = json.load(f)

        # Update with feedback
        analysis_data['rating'] = rating
        analysis_data['comment'] = comment

        # Save updated JSON
        with open(json_path, 'w') as f:
            json.dump(analysis_data, f, indent=4)

        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        return jsonify({'error': str(e)}), 500

@home_bp.route('/data_base/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@home_bp.route('/')
def home():
    return render_template('home.html')
