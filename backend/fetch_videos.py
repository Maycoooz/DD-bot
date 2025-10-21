import mysql.connector
import csv
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
# Load database credentials from environment variables with default fallbacks
CSV_FILENAME = "youtube_videos.csv"

def load_csv_to_database():
    """
    Connects to the database, reads video data from a CSV file using DictReader,
    and inserts new records, avoiding duplicates.
    """
    videos_added = 0
    videos_skipped = 0

    try:
        # Establish a connection to the database using credentials from .env
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="dd_bot"
        )
        cursor = conn.cursor()
        print("Successfully connected to the database.")


        # Open the CSV file for reading
        with open(CSV_FILENAME, mode='r', newline='', encoding='utf-8') as csv_file:
            # Use DictReader to read rows as dictionaries
            csv_reader = csv.DictReader(csv_file)
            
            print(f"Reading from {CSV_FILENAME}. Columns found: {', '.join(csv_reader.fieldnames)}")

            # Loop through each row in the CSV
            for row in csv_reader:
                # Safely get data from the row dictionary with default values
                title = row.get("title", "Unknown Title")
                creator = row.get("creator", "Unknown Creator")
                age_group = row.get("age_group", "Unknown")
                category = row.get("category", "Other")
                description = row.get("description", "")
                link = row.get("link") # Link is the unique key
                rating = row.get("rating", 0)
                source = row.get("source", "YouTube")

                # If the link (unique key) is missing, skip this row
                if not link:
                    videos_skipped += 1
                    continue

                # 1. Check if the video already exists to prevent duplicates
                query_check = "SELECT id FROM video WHERE link = %s"
                cursor.execute(query_check, (link,))
                result = cursor.fetchone()

                if result:
                    # Video with this link already exists, so we skip it
                    videos_skipped += 1
                    continue

                # 2. If it doesn't exist, insert the new record
                insert_query = """
                    INSERT INTO video (title, creator, age_group, category, description, link, rating, source)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """
                # The rating in your model is a FLOAT, so we convert it here
                insert_values = (title, creator, age_group, category, description, link, float(rating), source)
                
                cursor.execute(insert_query, insert_values)
                videos_added += 1

        # Commit all the successful inserts to the database
        conn.commit()
        print("\nDatabase commit successful!")

    except FileNotFoundError:
        print(f"Error: The file '{CSV_FILENAME}' was not found. Make sure it's in the same directory.")
    except mysql.connector.Error as err:
        print(f"Database Error: {err}")
        print("Please check your DB credentials in the .env file and ensure the database server is running.")
    finally:
        # Close the connection
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
            print("Database connection closed.")
        
        # Print the final summary
        print("\n--- Load Summary ---")
        print(f"New videos added: {videos_added}")
        print(f"Duplicate/Invalid rows skipped: {videos_skipped}")
        print("--------------------")

# Run the main function when the script is executed
if __name__ == "__main__":
    load_csv_to_database()