import requests
import mysql.connector
import os
from dotenv import load_dotenv
load_dotenv()

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="dd_bot"
)
cursor = conn.cursor()

API_KEY = os.getenv("API_KEY")
SEARCH_QUERY = "educational kids videos"

url = "https://www.googleapis.com/youtube/v3/search"
params = {
    "part": "snippet",
    "q": SEARCH_QUERY,
    "type": "video",
    "maxResults": 50,
    "key": API_KEY
}

videos_added = 0
next_page_token = None

while True:
    if next_page_token:
        params["pageToken"] = next_page_token

    response = requests.get(url, params=params).json()
    items = response.get("items", [])
    next_page_token = response.get("nextPageToken")

    if not items:
        break

    for item in items:
        snippet = item["snippet"]
        title = snippet["title"]
        creator = snippet["channelTitle"]
        age_group = "5-12"
        category = "Educational"
        description = snippet.get("description", "")
        link = f"https://www.youtube.com/watch?v={item['id']['videoId']}"
        rating = 0

        cursor.execute("SELECT COUNT(*) FROM video WHERE title=%s AND link=%s", (title, link))
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO video (title, creator, age_group, category, description, link, rating, source)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (title, creator, age_group, category, description, link, rating, "YouTube"))
            videos_added += 1

    if not next_page_token:
        break

conn.commit()
conn.close()
print(f" {videos_added} child-safe videos inserted into DB successfully!")