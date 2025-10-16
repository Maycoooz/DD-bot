import csv
import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="dd_bot"
)
cursor = conn.cursor()

csv_file = "books_data.csv"

with open(csv_file, newline='', encoding="utf-8") as f:
    reader = csv.DictReader(f)
    books_added = 0

    for row in reader:
        title = row.get("Name", "Unknown Title")
        author = row.get("Author", "Unknown")
        age_group = row.get("Age", "Unknown")[:255]
        description = row.get("Description", "") or row.get("Product_Details", "")
        link = row.get("Link", "")
        rating = 0

        cursor.execute("SELECT COUNT(*) FROM book WHERE title=%s AND link=%s", (title, link))
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO book (title, author, age_group, category, description, link, rating, source)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (title, author, age_group, "Children", description, link, rating, "Kaggle"))
            books_added += 1

conn.commit()
conn.close()
print(f" {books_added} child-safe books inserted into DB successfully!")
