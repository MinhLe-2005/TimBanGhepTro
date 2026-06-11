import requests

url = "https://rltolbnxdotqydyaxcdk.supabase.co/storage/v1/bucket"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsdG9sYm54ZG90cXlkeWF4Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDgyMTMsImV4cCI6MjA5NjM4NDIxM30.V8IXemgeS95vsaBTjx62o_pAYteBVwingQTV2Mr5DbY",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsdG9sYm54ZG90cXlkeWF4Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDgyMTMsImV4cCI6MjA5NjM4NDIxM30.V8IXemgeS95vsaBTjx62o_pAYteBVwingQTV2Mr5DbY"
}

response = requests.get(url, headers=headers)
print(response.json())
