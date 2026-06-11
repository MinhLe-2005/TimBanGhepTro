import io
from dotenv import load_dotenv
import os

with io.open('.env.local', 'r') as f:
    env_content = f.read()

print("Env variables:", env_content)

