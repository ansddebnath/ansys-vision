from openai import AzureOpenAI
import os
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
import requests
from PIL import Image
import io
import base64
import logging
from config import openai_config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ImageAnalysis(BaseModel):
    name: str
    ai_output: str
    image_file_path: str
    rating: Optional[int] = None
    comment: Optional[str] = None

class OpenAIHelper:
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version="2024-02-01",
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
        # Load configuration from config
        self.max_tokens = openai_config['max_tokens']
        self.temperature = openai_config['temperature']
        self.detail_level = openai_config['detail_level']
        self.model = openai_config['model']
        
        # Load prompt from file
        prompt_path = os.path.join(os.path.dirname(__file__), 'prompts', 'prompt.txt')
        with open(prompt_path, 'r') as f:
            self.analysis_prompt = f.read()

    def analyze_image(self, image_data: bytes) -> Optional[str]:
        """
        Analyze image using Azure OpenAI's model.
        
        Args:
            image_data (bytes): Raw image data to analyze
            
        Returns:
            str: Analysis results from the model
        """
        try:
            base64_image = base64.b64encode(image_data).decode('utf-8')
            
            logger.info("Sending request to Azure OpenAI API")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": self.analysis_prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                    "detail": self.detail_level
                                }
                            }
                        ]
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            logger.info("Successfully received response from Azure OpenAI")
            # print(response.choices[0].message.content)
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error analyzing image: {str(e)}")
            raise Exception(f"OpenAI API error: {str(e)}")

    def process_image(self, image_data: bytes = None, image_url: str = None) -> Optional[ImageAnalysis]:
        try:
            # Generate filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"image_{timestamp}.jpg"
            file_path = os.path.join('data_base', 'uploads', filename)

            # Handle URL or direct image data
            if image_url:
                logger.info(f"Downloading image from URL: {image_url}")
                try:
                    response = requests.get(image_url, timeout=10)
                    response.raise_for_status()
                    image_data = response.content
                except requests.RequestException as e:
                    raise ValueError(f"Failed to fetch image from URL: {str(e)}")

            if not image_data:
                raise ValueError("No image data provided")

            # Validate image data
            try:
                img = Image.open(io.BytesIO(image_data))
                img.verify()  # Verify it's a valid image
            except Exception as e:
                raise ValueError(f"Invalid image data: {str(e)}")

            # Analyze image
            logger.info("Starting image analysis")
            analysis = self.analyze_image(image_data)
            
            # Save image
            logger.info(f"Saving image to {file_path}")
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'wb') as f:
                f.write(image_data)

            return ImageAnalysis(
                name=filename,
                ai_output=analysis,
                image_file_path=file_path
            )
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            raise Exception(f"Image processing error: {str(e)}")
