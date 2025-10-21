import requests
import re
import os
import csv  # <-- Still need this module
from dotenv import load_dotenv
load_dotenv()

#  YouTube API 설정
API_KEY = os.getenv("API_KEY")
SEARCH_QUERY = "kids learning songs stories cartoons education"
url_search = "https://www.googleapis.com/youtube/v3/search"
url_video = "https://www.googleapis.com/youtube/v3/videos"

params_search = {
    "part": "snippet",
    "q": SEARCH_QUERY,
    "type": "video",
    "maxResults": 50,
    "key": API_KEY
}

# Renamed this variable for clarity
videos_saved_to_csv = 0
next_page_token = None

#  연령대 감지 함수
def detect_age_group(title, desc):
    text = (title + " " + desc).lower()
    if re.search(r"baby|toddler|nursery|preschool", text):
        return "0-4"
    elif re.search(r"kids|children|fun|story|cartoon|song|learn", text):
        return "5-8"
    elif re.search(r"math|science|english|quiz|study|school", text):
        return "9-12"
    else:
        return "0-12"

#  카테고리 매핑
CATEGORY_MAP = {
    "1": "Film & Animation",
    "2": "Autos & Vehicles",
    "10": "Music",
    "15": "Pets & Animals",
    "17": "Sports",
    "18": "Shorts",
    "19": "Travel & Events",
    "20": "Gaming",
    "21": "Videoblogging",
    "22": "People & Blogs",
    "23": "Comedy",
    "24": "Entertainment",
    "25": "News & Politics",
    "26": "Howto & Style",
    "27": "Education",
    "28": "Science & Technology"
}

# Define CSV filename and headers
csv_filename = "youtube_videos.csv"
csv_headers = ["title", "creator", "age_group", "category", "description", "link", "rating", "source", "is_child_safe"]

# Open the CSV file to write to
with open(csv_filename, mode='w', newline='', encoding='utf-8') as csv_file:
    csv_writer = csv.writer(csv_file)
    
    # Write the header row
    csv_writer.writerow(csv_headers)

    #  API 요청 루프
    while True:
        if next_page_token:
            params_search["pageToken"] = next_page_token

        search_response = requests.get(url_search, params=params_search).json()
        items = search_response.get("items", [])
        next_page_token = search_response.get("nextPageToken")

        # 영상 ID 추출
        video_ids = [item["id"]["videoId"] for item in items]
        if not video_ids:
            break

        # 상세 정보 요청
        params_video = {
            "part": "snippet,contentDetails",
            "id": ",".join(video_ids),
            "key": API_KEY
        }
        video_response = requests.get(url_video, params=params_video).json()

        for video in video_response.get("items", []):
            snippet = video["snippet"]
            title = snippet["title"]
            creator = snippet["channelTitle"]
            description = snippet.get("description", "")
            link = f"https://www.youtube.com/watch?v={video['id']}"
            category_id = snippet.get("categoryId", "27")  # default: Education
            category = CATEGORY_MAP.get(category_id, "Other")
            age_group = detect_age_group(title, description)
            rating = 0

            # child-safe 여부
            content_rating = video.get("contentDetails", {}).get("contentRating", {})
            is_child_safe = "ytRating" not in content_rating

            # Write the video data as a new row in the CSV
            video_data_row = [title, creator, age_group, category, description, link, rating, "YouTube", is_child_safe]
            csv_writer.writerow(video_data_row)
            
            # Increment the counter
            videos_saved_to_csv += 1

        if not next_page_token:
            break

# Updated print statement
print(f" {videos_saved_to_csv} videos saved to {csv_filename}!")