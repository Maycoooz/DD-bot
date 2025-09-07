import requests
import mysql.connector
import os 
from dotenv import load_dotenv

def fetch_books_to_db():
    load_dotenv()
    # Connect DB 
    conn = mysql.connector.connect(
        host=os.getenv("host"),
        user=os.getenv("user"),     
        password=os.getenv("password"),     
        database=os.getenv("database")
    )
    cursor = conn.cursor()

    # Request Google Books API 
    url = os.getenv("url")
    params = {
        "q": "subject:juvenile",
        "maxResults": 40,
        "printType": "books",
        "langRestrict": "en"
    }

    books_added = 0
    startIndex = 0

    while books_added < 100:  # Max 100 
        params["startIndex"] = startIndex
        response = requests.get(url, params=params).json()
        items = response.get("items", [])
        if not items:
            break

        for item in items:
            volume = item.get("volumeInfo", {})
            title = volume.get("title", "Unknown Title")
            author = ", ".join(volume.get("authors", ["Unknown"]))
            age_group = "5-12"
            category = ", ".join(volume.get("categories", ["Children"]))
            description = volume.get("description", "")
            link = volume.get("infoLink", "")
            rating = volume.get("averageRating", 0)

            # Insert DB
            cursor.execute("""
                INSERT INTO books (title, author, age_group, category, description, link, rating, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (title, author, age_group, category, description, link, rating, "available"))

            books_added += 1
            if books_added >= 100:
                break

        startIndex += 40  #Next page 

    conn.commit()
    conn.close()
    print(f" {books_added} children's books inserted into DB")

if __name__ == "__main__":
    fetch_books_to_db()
