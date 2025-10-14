# HOW TO SET UP BEFORE YOU START DEVELOPMENT
# ------------------------------------------

IMPORTANT!
- Make sure you have the .env file in the backend folder! If you don't have it ask Marcus.

1. Ensure you have the latest version, if not fetch origin

2. Go to the root directory of DD-BOT

3. Open 3 terminals

4. In 2 terminals run the following commands below:

    4.1 Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process  

    4.2 C:/Users/Admin/Documents/GitHub/DD-bot/venv/Scripts/Activate.ps1 <--- Change this to the path of where ur venv file is located

    4.3 cd backend in one terminal & cd frontend in the other terminal

    4.4 In backend terminal run: pip install -r requirements.txt

    4.5 In backend terminal run: uvicorn main:app --reload

    4.5 In frontend terminal run: npm install

    4.6 In frontend terminal run: npm run dev

5. In the 3rd terminal run the following commands below:

    5.1 Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

    5.2 C:/Users/Admin/Documents/GitHub/DD-bot/venv/Scripts/Activate.ps1 <--- Change this to the path of where ur venv file is located

    5.3 python fetch_books.py

    5.4 python fetch_videos.py

6. All set up is done


# OPTIONAL
# --------

1. Go to localhost:8000/docs to view all routes and documentation for routers and schemas

2. Go to localhost:5173/ to go to the landing page of the website

3. Go to localhost:5173/Login to go to the login page
