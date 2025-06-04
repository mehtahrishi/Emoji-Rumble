from flask import Flask, render_template, request, jsonify, send_from_directory
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import datetime

# Load environment variables
load_dotenv()
mongo_uri = "mongodb+srv://mehtahrishi45:mehtahrishi45@cluster0.zbozo.mongodb.net/emoji_survival_arena?retryWrites=true&w=majority&appName=Cluster0"

# Initialize Flask app
app = Flask(__name__)

# Connect to MongoDB
client = MongoClient(mongo_uri)
db = client.emoji_survival_arena
scores_collection = db.scores

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/game')
def game():
    return render_template('game.html')

@app.route('/gameover')
def gameover():
    return render_template('gameover.html')

@app.route('/leaderboard')
def leaderboard():
    return render_template('leaderboard.html')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/api/submit', methods=['POST'])
def submit_score():
    data = request.json
    
    # Validate required fields
    if not all(key in data for key in ['name', 'time_survived', 'wave']):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Create score document
    score_doc = {
        'name': data['name'],
        'time_survived': data['time_survived'],
        'wave': data['wave'],
        'date': datetime.datetime.now(datetime.timezone.utc)

    }
    
    # Insert into database
    result = scores_collection.insert_one(score_doc)
    
    return jsonify({"success": True, "message": "Score saved successfully!", "id": str(result.inserted_id)}), 201

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    # Get top 10 scores sorted by time survived
    top_scores = list(scores_collection.find({}, 
                                           {'_id': 0, 'name': 1, 'time_survived': 1, 'wave': 1, 'date': 1})
                     .sort('time_survived', -1)
                     .limit(10))
    
    # Convert datetime objects to strings for JSON serialization
    for score in top_scores:
        if 'date' in score:
            score['date'] = score['date'].strftime('%d-%m-%Y %H:%M:%S')  # Indian date format (DD-MM-YYYY)
    
    return jsonify(top_scores)

if __name__ == '__main__':
    app.run(debug=True)
