# backend/nlu_ann/train_intent_ann.py
import pickle
from sklearn.neural_network import MLPClassifier
from sklearn.feature_extraction.text import TfidfVectorizer

# 1) Tiny training set – you can expand this later
TRAIN_DATA = [
    ("hi", "greet"),
    ("hello", "greet"),
    ("hey there", "greet"),
    ("good morning", "greet"),

    ("how do I use this", "help"),
    ("what can you do", "help"),
    ("can you help me", "help"),
    ("how does this work", "help"),

    ("find books about dinosaurs", "get_recs"),
    ("recommend stories for kids", "get_recs"),
    ("suggest something for bedtime", "get_recs"),
    ("show me some books", "get_recs"),
    ("i want a story book", "get_recs"),
    ("book about animals", "get_recs"),

    ("show similar to #1", "similar_to"),
    ("something like number 2", "similar_to"),
    ("recommend similar to book 3", "similar_to"),
    ("more like #4 please", "similar_to"),
]

texts = [t for t, _ in TRAIN_DATA]
labels = [l for _, l in TRAIN_DATA]

# 2) Vectorizer
vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
X = vectorizer.fit_transform(texts)

# 3) MLP classifier
model = MLPClassifier(
    hidden_layer_sizes=(128, 64),
    activation="relu",
    max_iter=500,
    random_state=42,
)

model.fit(X, labels)

# 4) Save artifacts
with open("intent_vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

with open("intent_ann.pkl", "wb") as f:
    pickle.dump(model, f)

print("✅ Training complete. Saved:")
print(" - intent_vectorizer.pkl")
print(" - intent_ann.pkl")
