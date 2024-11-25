from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import goodfire
import os
from dotenv import load_dotenv
import asyncio
from typing import Dict, List, Tuple

# Load environment variables
load_dotenv()

app = FastAPI()
client = goodfire.Client(os.getenv('GOODFIRE_API_KEY'))

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_advisor_variants() -> Dict[str, str]:
    """Create and store variants for each advisor type."""
    advisor_variants = {}
    
    # Define all available Goodfire features
    professional_features = [
        "Financial topics and analysis",
        "Professional and technical discussions of risk assessment and management",
        "Defining or explaining technical terms and concepts",
        "Risk and risk management concepts",
        "Careful analysis and comparison of relevant information",
        "References to industries or industrial sectors",
        "Introducing specific aspects or categories in explanations",
        "Request or provision of detailed analysis and explanation",
        "Human social structures and organizational systems",
        "The model is providing analytical summaries or recommendations"
    ]
    
    informal_features = [
        "Informal or casual language and communication",
        "Instructions for informal, friendly writing style",
        "The model should provide a general response or disclaimer",
        "Nuanced language and qualifications when discussing sensitive topics",
        "Instructions to avoid specific language or constructions",
        "Tone in writing and communication",
        "Simplification or making things simpler",
        "Request for concise AI responses",
        "Instructions for tone and style in text generation",
        "The model should provide an explanation for its answer"
    ]
    
    # Map features to each advisor type
    advisor_feature_maps = {
        'finance': {
            'enhance': [
                "Financial topics and analysis",
                "Professional and technical discussions of risk assessment and management",
                "Risk and risk management concepts",
                "Careful analysis and comparison of relevant information",
                "The model is providing analytical summaries or recommendations"
            ],
            'suppress': [
                "Informal or casual language and communication",
                "Simplification or making things simpler",
                "Instructions for informal, friendly writing style"
            ]
        },
        'strategy': {
            'enhance': [
                "References to industries or industrial sectors",
                "Careful analysis and comparison of relevant information",
                "Human social structures and organizational systems",
                "Introducing specific aspects or categories in explanations",
                "The model is providing analytical summaries or recommendations"
            ],
            'suppress': [
                "Informal or casual language and communication",
                "Instructions for informal, friendly writing style",
                "The model should provide a general response or disclaimer"
            ]
        },
        'mergers': {
            'enhance': [
                "Professional and technical discussions of risk assessment and management",
                "Defining or explaining technical terms and concepts",
                "Request or provision of detailed analysis and explanation",
                "Human social structures and organizational systems",
                "The model is providing analytical summaries or recommendations"
            ],
            'suppress': [
                "Informal or casual language and communication",
                "Simplification or making things simpler",
                "Request for concise AI responses"
            ]
        },
        'ipo': {
            'enhance': [
                "Financial topics and analysis",
                "Professional and technical discussions of risk assessment and management",
                "Introducing specific aspects or categories in explanations",
                "Request or provision of detailed analysis and explanation",
                "The model is providing analytical summaries or recommendations"
            ],
            'suppress': [
                "Informal or casual language and communication",
                "Instructions for informal, friendly writing style",
                "Simplification or making things simpler"
            ]
        }
    }
    
    for advisor_id, feature_map in advisor_feature_maps.items():
        try:
            # Create variant
            model = goodfire.Variant(base_model="meta-llama/Meta-Llama-3-8B-Instruct")
            
            # Search and set enhance features
            for feature in feature_map['enhance']:
                features, _ = client.features.search(
                    feature[:100],  # Keep within character limit
                    model="meta-llama/Meta-Llama-3-8B-Instruct",
                    top_k=1
                )
                if features:
                    model.set(features, 0.9)
            
            # Search and set suppress features
            for feature in feature_map['suppress']:
                features, _ = client.features.search(
                    feature[:100],  # Keep within character limit
                    model="meta-llama/Meta-Llama-3-8B-Instruct",
                    top_k=1
                )
                if features:
                    model.set(features, -0.7)
            
            # Store the variant
            variant_id = client.variants.create(model, f"{advisor_id.capitalize()} Advisor Model")
            advisor_variants[advisor_id] = variant_id
            print(f"Created variant for {advisor_id}: {variant_id}")
            
        except Exception as e:
            print(f"Error creating variant for {advisor_id}: {str(e)}")
    
    return advisor_variants

# Initialize at startup
ADVISOR_VARIANTS = create_advisor_variants()

def get_advisor_variant(advisor_id: str) -> goodfire.Variant:
    """Get the stored variant for a specific advisor type."""
    variant_id = ADVISOR_VARIANTS.get(advisor_id)
    if not variant_id:
        print(f"No variant found for advisor: {advisor_id}")
        return goodfire.Variant(base_model="meta-llama/Meta-Llama-3-8B-Instruct")
    
    return client.variants.get(variant_id)

def clear_variant(model: goodfire.Variant) -> goodfire.Variant:
    """
    Clear all features from a model variant.
    
    Args:
        model: The goodfire.Variant instance to clear
        
    Returns:
        The cleared model variant
    """
    try:
        for feature in list(model.edits.keys()):
            model.clear(feature)
        print("Cleared all features from variant")
    except Exception as e:
        print(f"Error clearing variant features: {str(e)}")
    
    return model

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print("New WebSocket connection attempt")
    await websocket.accept()
    print("WebSocket connection accepted")
    
    try:
        while True:
            data = await websocket.receive_json()
            print(f"Received data: {data}")
            
            # Original CIM generation case
            if data.get('type') == 'generate':
                company_details = data.get('companyDetails', {})
                section_id = data.get('sectionId')
                
                prompt = f"Generate a {section_id} for {company_details.get('companyName')}, "
                prompt += f"a company in the {company_details.get('sector')} sector, "
                prompt += f"for a {company_details.get('transactionType')} transaction."
                
                print(f"Processing prompt for section {section_id}: {prompt}")
                
                try:
                    model = goodfire.Variant(base_model="meta-llama/Meta-Llama-3-8B-Instruct")
                    stream = client.chat.completions.create(
                        [{"role": "user", "content": prompt}],
                        model=model,
                        stream=True,
                        max_completion_tokens=200,
                    )
                    
                    print("Stream created successfully")
                    for chunk in stream:
                        if chunk and chunk.choices and len(chunk.choices) > 0:
                            content = chunk.choices[0].delta.content
                            if content:
                                await websocket.send_json({
                                    "type": "token",
                                    "content": content,
                                    "sectionId": section_id
                                })
                                await asyncio.sleep(0.01)

                    await websocket.send_json({
                        "type": "done",
                        "sectionId": section_id
                    })
                    print(f"Section {section_id} completed")

                except Exception as e:
                    print(f"Error during generation: {str(e)}")
                    await websocket.send_json({
                        "type": "error",
                        "message": str(e)
                    })

            # Modified regeneration case with streaming fixes
            elif data.get('type') == 'regenerate':
                try:
                    section_id = data.get('sectionId')
                    original_content = data.get('content', '')
                    advisor_id = data.get('advisor')
                    
                    model = get_advisor_variant(advisor_id)
                    
                    prompt = f"""Provide a professional analysis of the following content, focusing on key insights and avoiding repetition.

Content to analyze:
{original_content}

Requirements:
- Maintain professional language
- Focus on specific insights
- No repetition
- Clear structure
- Concise response"""
                    
                    # Initialize tracking
                    accumulated_content = ""
                    last_word = ""
                    
                    stream = client.chat.completions.create(
                        [{"role": "user", "content": prompt}],
                        model=model,
                        stream=True,
                        max_completion_tokens=500,
                        temperature=0.3
                    )
                    
                    for chunk in stream:
                        if chunk and chunk.choices and len(chunk.choices) > 0:
                            if hasattr(chunk.choices[0].delta, 'content'):
                                content = chunk.choices[0].delta.content
                                if content:
                                    # Add new content
                                    accumulated_content += content
                                    
                                    # Check for word repetition
                                    current_words = accumulated_content.split()
                                    if len(current_words) >= 2 and current_words[-1] == current_words[-2]:
                                        print("Detected word repetition, stopping generation")
                                        raise Exception("Word repetition detected")
                                    
                                    await websocket.send_json({
                                        "type": "token",
                                        "content": content,
                                        "sectionId": section_id
                                    })
                    
                    if accumulated_content.strip():
                        # Clean up the content
                        cleaned_content = ' '.join(accumulated_content.split())
                        if not cleaned_content.endswith(('.', '!', '?')):
                            cleaned_content += '.'
                        
                        await websocket.send_json({
                            "type": "done",
                            "sectionId": section_id,
                            "content": cleaned_content
                        })
                        print(f"Generation completed successfully for section {section_id}")
                        
                except Exception as e:
                    error_msg = str(e)
                    print(f"Error during regeneration: {error_msg}")
                    
                    # If we have partial content, try to clean it up
                    if accumulated_content and "Excessive repetition detected" in error_msg:
                        try:
                            # Clean up the partial content
                            final_content = ' '.join(accumulated_content.split())
                            # Remove any trailing repeated characters
                            while len(final_content) > 1 and final_content[-1] == final_content[-2]:
                                final_content = final_content[:-1]
                            if not final_content.endswith(('.', '!', '?')):
                                final_content += '.'
                                
                            await websocket.send_json({
                                "type": "done",
                                "sectionId": section_id,
                                "content": final_content
                            })
                            print(f"Saved partial content for section {section_id}")
                            return
                        except Exception as e:
                            print(f"Error cleaning up partial content: {str(e)}")
                    
                    await websocket.send_json({
                        "type": "error",
                        "message": "Generation failed due to quality issues. Please try again.",
                        "sectionId": section_id
                    })

    except Exception as e:
        print(f"WebSocket error: {str(e)}")
    finally:
        print("WebSocket connection closing normally")