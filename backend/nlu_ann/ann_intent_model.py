# backend/nlu_ann/ann_intent_model.py
import os
import pickle

class IntentANN:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.available = False
        self._load()

    def _load(self):
        try:
            base = os.path.dirname(__file__)
            with open(os.path.join(base, "intent_vectorizer.pkl"), "rb") as f:
                self.vectorizer = pickle.load(f)
            with open(os.path.join(base, "intent_ann.pkl"), "rb") as f:
                self.model = pickle.load(f)
            self.available = True
            print("[ANN-NLU] ANN intent classifier loaded.")
        except Exception as e:
            print(f"[ANN-NLU] Could not load ANN model → {e}")
            self.available = False

    def predict_intent(self, text: str) -> str | None:
        if not self.available:
            return None
        X = self.vectorizer.transform([text])
        return self.model.predict(X)[0]
