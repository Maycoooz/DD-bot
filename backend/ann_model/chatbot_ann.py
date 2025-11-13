#backend/ann_model/chatbot_ann.py
import os
import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import BertTokenizerFast, BertModel
from typing import Tuple, Dict, Any, List

# labels used by the ANN head; keep in same order when saving/loading weights
LABELS = ["get_recs", "similar_to", "greet", "help"]

class NLP_ANN_Model(nn.Module):
    def __init__(self, bert_model_name="bert-base-uncased", hidden_dim=128, num_labels=len(LABELS), dropout=0.1, device=None):
        super().__init__()
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        # tokenizer and backbone
        self.tokenizer = BertTokenizerFast.from_pretrained(bert_model_name)
        self.bert = BertModel.from_pretrained(bert_model_name)
        bert_hidden = self.bert.config.hidden_size

        # small ANN head (no training at runtime)
        self.classifier = nn.Sequential(
            nn.Linear(bert_hidden, hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, num_labels)
        ).to(self.device)

        # move backbone to device
        self.bert.to(self.device)
        self.eval_mode()

    def eval_mode(self):
        """Put model in eval mode for inference-only usage."""
        self.bert.eval()
        self.classifier.eval()

    def load_head_weights(self, path: str):
        """Load classifier weights only (optional)."""
        if not path or not os.path.exists(path):
            # no weights available; keep random init but warn
            print(f"[NLP_ANN_Model] classifier weights not found at '{path}'. Using random init (not recommended for production).")
            return
        state = torch.load(path, map_location=self.device)
        try:
            self.classifier.load_state_dict(state)
            print(f"[NLP_ANN_Model] loaded classifier weights from {path}")
        except Exception as e:
            print(f"[NLP_ANN_Model] failed to load classifier state: {e}")

    @torch.no_grad()
    def predict(self, text: str, max_length: int = 128) -> Tuple[str, float, Dict[str, float]]:
        """Return (pred_label, confidence, scores_dict)."""
        # tokenize
        toks = self.tokenizer(
            text,
            truncation=True,
            padding="max_length",
            max_length=max_length,
            return_tensors="pt",
        )
        input_ids = toks["input_ids"].to(self.device)
        attention_mask = toks["attention_mask"].to(self.device)

        # BERT forward
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask, return_dict=True)
        # Use pooled output ([CLS]) for classification
        pooled = outputs.pooler_output  # shape (1, hidden)
        logits = self.classifier(pooled)  # shape (1, num_labels)
        probs = F.softmax(logits, dim=-1).squeeze(0).cpu().numpy()  # numpy array
        top_idx = int(probs.argmax())
        label = LABELS[top_idx]
        confidence = float(probs[top_idx])

        # convert to dict
        scores = {LABELS[i]: float(probs[i]) for i in range(len(LABELS))}
        return label, confidence, scores

# Helper functions to plug into existing app.py flow
# Note: import your app's Catalog and MEM instances from app.py where needed,
# or pass them in as arguments.
def make_predictor(bert_model_name="bert-base-uncased", head_weights_path: str = None, device=None):
    """
    Factory to create and initialize the predictor.
    head_weights_path: optional path to saved torch state_dict for just the classifier head.
    """
    model = NLP_ANN_Model(bert_model_name=bert_model_name, device=device)
    if head_weights_path:
        model.load_head_weights(head_weights_path)
    return model

def predict_intent_from_text(predictor: NLP_ANN_Model, text: str) -> Dict[str, Any]:
    """
    Return a dict like {'intent': label, 'confidence': float, 'scores': {...}}
    """
    label, conf, scores = predictor.predict(text)
    return {"intent": label, "confidence": conf, "scores": scores}

# recommend_books ties predicted intent into your Catalog-based recommend flow.
# It keeps the same function signature expectations used in your app.py.
def recommend_books(predictor: NLP_ANN_Model, msg: str, session_obj: dict, catalog, k=6):
    """
    predictor: instance created by make_predictor()
    msg: raw user message
    session_obj: session dictionary from MEM.get(session_id)
    catalog: instance of Catalog
    returns: dict like {"intent":..., "items": [...], "reply": "..."}
    """
    # 1) run the light NLU (age/num extraction) first if you want, but we'll
    # rely on the existing extract_entities in app.py. This helper expects that
    # extraction happens outside and session_obj.age may already be set.
    pred = predict_intent_from_text(predictor, msg)
    intent = pred["intent"]

    # Very small policy: if predicted 'similar_to' but user message contains an explicit id (#3 or id foo), prefer that.
    # Otherwise follow existing search behavior.
    # We'll attempt to reuse the existing entity extraction if it's available in the outer scope.
    result = {"intent": intent, "confidence": pred["confidence"], "scores": pred["scores"], "items": [], "reply": ""}

    # If it's a greeting or help intent -> short textual reply
    if intent in ("greet", "help"):
        result["reply"] = ("Hi! Tell me what you’re after (e.g., “bedtime stories about friendship”). "
                           "Add an age: “for a 6 year old”, and how many: “show 5”. After I show a list, say “similar to #2”.")
        return result

    # If similar_to intent: try to find book id in message (using patterns in app.py) or fallback to session last items
    if intent == "similar_to":
        # prefer explicit #N or id in message
        # the app.py has SIM_PAT; if you import that, reuse; otherwise simple parse here:
        import re
        sim_match = re.search(r"(?:#|id\s*)([\w\-]+)", msg, re.I)
        book_id = sim_match.group(1) if sim_match else None
        if book_id and book_id.isdigit() and session_obj.get("last_items"):
            idx = int(book_id) - 1
            if 0 <= idx < len(session_obj["last_items"]):
                book_id = session_obj["last_items"][idx]["id"]
        if not book_id:
            result["reply"] = 'Tell me which one: say “similar to #2” after I show results.'
            return result

        items = catalog.similar(book_id, k=k)
        if not items:
            result["reply"] = "I couldn’t find similar titles to that one. Try another pick?"
            return result
        session_obj["last_items"] = items
        result["items"] = items
        # small formatted reply; UI can rely on items for richer display
        lines = []
        for i, it in enumerate(items, 1):
            badge = f" [{it['badge']}]" if it.get("badge") else ""
            lines.append(f"{i}. {it['title']} — Age {it['age_min']}-{it['age_max']}{badge}\n{it['why']}")
        result["reply"] = "Here are some books:\n\n" + "\n\n".join(lines)
        return result

    # Otherwise treat as 'get_recs'
    # Use session age if present; if missing, signal that the API user should ask for age (app.py already does)
    age_for_search = session_obj.get("age", None)
    items = catalog.search(msg, k=k, age=age_for_search)
    if not items:
        items = catalog.search(msg, k=k, age=None)
    if not items:
        items = catalog.top_k(k)
    items = catalog.rerank_by_quality(items, top_n=k)
    session_obj["last_items"] = items
    result["items"] = items

    lines = []
    for i, it in enumerate(items, 1):
        badge = f" [{it['badge']}]" if it.get("badge") else ""
        lines.append(f"{i}. {it['title']} — Age {it['age_min']}-{it['age_max']}{badge}\n{it['why']}")
    result["reply"] = "Here are some books:\n\n" + "\n\n".join(lines)
    return result
