import os
import json
import dotenv

dotenv.load_dotenv()

config_dir = os.path.dirname(os.path.abspath(__file__))
user_cred_path = os.path.join(config_dir, 'user_cred.json')
with open(user_cred_path, 'r') as user_cred_file:
    load_data = json.load(user_cred_file)
    user_cred = load_data.get('user_credentials', {})

# OpenAI configuration
openai_config = {
    'max_tokens': 300,
    'temperature': 0.7,
    'detail_level': 'high',
    'model': 'gpt-4o'
}