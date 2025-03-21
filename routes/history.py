from flask import Blueprint, render_template, request, jsonify, url_for, send_from_directory
import os
import json
import glob
import logging

logger = logging.getLogger(__name__)

history_bp = Blueprint('history', __name__)
UPLOAD_FOLDER = os.path.join('data_base', 'uploads')

def calculate_average_rating(history_data):
    """Calculate the average rating from history data."""
    if not history_data:
        return 0
    ratings = [entry.get('rating', 0) for entry in history_data if entry.get('rating')]
    return round(sum(ratings)*10 / len(ratings), 2) if ratings else 0

@history_bp.route('/history')
def history():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = 5  # Number of items per page
        json_dir = os.path.join('data_base', 'json')
        history_data = []
        
        # Get all JSON files
        json_files = glob.glob(os.path.join(json_dir, '*.json'))
        
        for json_file in json_files:
            with open(json_file, 'r') as f:
                data = json.load(f)
                data['image_url'] = url_for('home.uploaded_file', 
                                          filename=os.path.basename(data['file_path']))
                history_data.append(data)
                
        # Sort by name in reverse order
        history_data.sort(key=lambda x: x['name'], reverse=True)
        
        # Calculate pagination
        total_items = len(history_data)
        total_pages = (total_items + per_page - 1) // per_page
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        current_page_data = history_data[start_idx:end_idx]
        
        average_rating = calculate_average_rating(history_data)
        
        return render_template('history.html', 
                             history=current_page_data,
                             current_page=page,
                             total_pages=total_pages,
                             average_rating=average_rating)
    except Exception as e:
        logger.error(f"Error loading history: {str(e)}")
        return render_template('history.html', history=[], error=str(e), average_rating=0)

@history_bp.route('/edit-analysis', methods=['POST'])
def edit_analysis():
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

        # Update with new data
        analysis_data['rating'] = rating
        analysis_data['comment'] = comment

        # Save updated JSON
        with open(json_path, 'w') as f:
            json.dump(analysis_data, f, indent=4)

        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error editing analysis: {str(e)}")
        return jsonify({'error': str(e)}), 500

@history_bp.route('/delete-analysis', methods=['POST'])
def delete_analysis():
    try:
        data = request.json
        image_name = data.get('image_name')

        if not image_name:
            return jsonify({'error': 'Image name is required'}), 400

        json_path = os.path.join('data_base', 'json', f"{image_name}.json")
        image_path = os.path.join('data_base', 'uploads', image_name)
        
        # Delete JSON file
        if os.path.exists(json_path):
            os.remove(json_path)
            
        # Delete image file
        if os.path.exists(image_path):
            os.remove(image_path)

        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error deleting analysis: {str(e)}")
        return jsonify({'error': str(e)}), 500
