from openai import OpenAI
import os

client = OpenAI(
  base_url="https://api.featherless.ai/v1",
  api_key="FEATHERLESS",
)

response = client.chat.completions.create(
  model='google/medgemma-27b-text-it',
  messages=[
    {"role": "system", "content": "You are a helpful medical assistant."},
    {"role": "user", "content": "Hello!"}
  ],
)
print(response.model_dump()['choices'][0]['message']['content'])
