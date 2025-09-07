import requests
import mysql.connector
import os 
from dotenv import load_dotenv

load_dotenv()

# Connect to MySQL database
conn = mysql.connector.connect(
    host=os.getenv("host"),
    user=os.getenv("user"),
    password=os.getenv("password"),
    database=os.getenv("database")
)
cursor = conn.cursor()

# YouTube API details
API_KEY = os.getenv("API_KEY")
SEARCH_QUERY = os.getenv("SEARCH_QUERY")
URL = os.getenv("URL")

videos_added = 0
next_page_token = None
MAX_VIDEOS = 100

while videos_added < MAX_VIDEOS:
    params = {
        "part": "snippet",
        "q": SEARCH_QUERY,
        "type": "video",
        "maxResults": 50,
        "key": API_KEY
    }
    
    if next_page_token:
        params["pageToken"] = next_page_token
    
    response = requests.get(URL, params=params)
    
    if response.status_code != 200:
        print(f"Failed to fetch videos: {response.status_code} - {response.text}")
        break
    
    data = response.json()
    items = data.get("items", [])
    next_page_token = data.get("nextPageToken")
    
    if not items:
        print("No more videos found.")
        break
    
    for item in items:
        snippet = item["snippet"]
        title = snippet.get("title", "No title")
        creator = snippet.get("channelTitle", "Unknown")
        age_group = "5-12"
        category = "Educational"
        description = snippet.get("description", "No description found")
        video_id = item["id"]["videoId"]
        link = f"https://www.youtube.com/watch?v={video_id}".lower()
        rating = 0
        status = "available"
        
        # Try inserting, skip if duplicate (avoid crashing on duplicate entries)
        try:
            cursor.execute("""
                INSERT INTO videos (title, creator, age_group, category, description, link, rating, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (title, creator, age_group, category, description, link, rating, status))
            conn.commit()
            videos_added += 1
        except mysql.connector.IntegrityError as e:
            # Duplicate entry - skip and continue
            print(f"Skipping duplicate video: {link}")
        
        if videos_added >= MAX_VIDEOS:
            break
    
    if not next_page_token:
        break

cursor.close()
conn.close()

print(f"{videos_added} videos inserted into DB successfully!")

