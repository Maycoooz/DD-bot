# app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import pandas as pd
import numpy as np
import os, re, time
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
from nlu_ann.ann_intent_model import IntentANN

try:
    from ann_model.chatbot_ann import make_predictor, recommend_books
    print("[ANN-NLU] Loading ANN+BERT intent model…")
    PREDICTOR = make_predictor(head_weights_path=None)
    print("[ANN-NLU] ANN intent classifier loaded (random weights).")
except Exception as e:
    print(f"[ANN-NLU] Could not load ANN model → {e}")
    PREDICTOR = None

# ----------------- Data helpers -----------------
def parse_age_band(age_raw: str):
    if not isinstance(age_raw, str):
        age_raw = "" if pd.isna(age_raw) else str(age_raw)
    txt = age_raw.strip().lower()
    nums = list(map(int, re.findall(r"\d+", txt)))
    if not nums:
        return 3, 8
    if "+" in txt:
        return nums[0], max(nums[0] + 3, nums[0])
    if any(s in txt for s in ["to", "-", "–", "—"]):
        if len(nums) >= 2:
            lo, hi = nums[0], nums[1]
            return (lo, hi) if lo <= hi else (hi, lo)
        return nums[0], nums[0] + 2
    n = nums[0]
    return n, n + 2

class VideoCatalog:
    """
    Simple catalog for YouTube videos (from youtube_videos.csv).
    Adjust column names if your CSV uses different headers.
    """
    def __init__(self, csv_path="youtube_videos.csv"):
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"{csv_path} not found")

        df = pd.read_csv(csv_path, sep=None, engine="python")

        # Robust to slight naming differences
        cols_lower = {c.lower(): c for c in df.columns}

        def pick(*cands, default=None):
            for c in cands:
                if c.lower() in cols_lower:
                    return cols_lower[c.lower()]
            return default

        title_col   = pick("title", "name", "video_title")
        desc_col    = pick("description", "details", "synopsis")
        channel_col = pick("channel", "channel_title", "author", "uploader")
        url_col     = pick("url", "link", "watch_url", "video_url")
        age_col     = pick("age", "age_range", "age_group")

        # fallback if not found
        if title_col is None:   df["title"]   = ""
        else:                   df["title"]   = df[title_col].fillna("").astype(str)

        if desc_col is None:    df["description"] = ""
        else:                   df["description"] = df[desc_col].fillna("").astype(str)

        if channel_col is None: df["channel"] = ""
        else:                   df["channel"] = df[channel_col].fillna("").astype(str)

        if url_col is None:     df["url"] = ""
        else:                   df["url"] = df[url_col].fillna("").astype(str)

        # Age parsing – reuse your parse_age_band helper if age column exists
        if age_col is not None:
            ages = df[age_col].fillna("").astype(str).apply(parse_age_band)
            df["age_min"] = ages.apply(lambda t: int(t[0]))
            df["age_max"] = ages.apply(lambda t: int(t[1]))
        else:
            # fallback: generic age band, can tweak
            df["age_min"] = 4
            df["age_max"] = 10

        # Optional: views/likes if present, for badge
        views_col = pick("view_count", "views")
        likes_col = pick("like_count", "likes")

        if views_col is not None:
            df["view_count"] = pd.to_numeric(df[views_col], errors="coerce")
        else:
            df["view_count"] = np.nan

        if likes_col is not None:
            df["like_count"] = pd.to_numeric(df[likes_col], errors="coerce")
        else:
            df["like_count"] = np.nan

        # ID = URL or synthetic
        df["id"] = df["url"].fillna("").astype(str)
        missing = df["id"] == ""
        df.loc[missing, "id"] = ["vid_" + str(i) for i in df.index[missing]]

        self.df = df.reset_index(drop=True)

        # Build TF-IDF index over title + description + channel
        corpus = (
            self.df["title"] + " " +
            self.df["channel"] + " " +
            self.df["description"]
        ).astype(str)

        self.vectorizer = TfidfVectorizer(min_df=1, max_df=0.95, ngram_range=(1, 2))
        self.X = self.vectorizer.fit_transform(corpus)
        self.id2idx = {self.df.loc[i, "id"]: i for i in range(len(self.df))}
        self.idx2id = {i: self.df.loc[i, "id"] for i in range(len(self.df))}

    def search(self, query: str, k=6, age: Optional[int] = None):
        qv = self.vectorizer.transform([query])
        sims = linear_kernel(qv, self.X).ravel()
        order = np.argsort(-sims)[:400]
        out = []
        for i in order:
            r = self.df.iloc[i]
            if age is not None and not (r["age_min"] <= int(age) <= r["age_max"]):
                continue
            out.append(self._row_to_card(r))
            if len(out) >= k:
                break
        return out

    def top_k(self, k=6):
        df = self.df.copy()
        df = df[df["title"].str.len() > 0]
        # If views exist, sort by views
        if "view_count" in df.columns:
            df = df.sort_values(by=["view_count"], ascending=[False])
        return [self._row_to_card(r) for _, r in df.head(k).iterrows()]

    def _row_to_card(self, r, why: Optional[str] = None):
        # Build a badge string similar to books
        badge = []
        if "view_count" in r and pd.notna(r["view_count"]):
            badge.append(f"{int(r['view_count']):,} views")
        if "like_count" in r and pd.notna(r["like_count"]):
            badge.append(f"{int(r['like_count']):,} likes")
        badge_s = " | ".join(badge)

        why_text = why or (
            r["description"][:60]
            if isinstance(r["description"], str) and r["description"]
            else "Good video match"
        )

        return {
            "id": r["id"],
            "title": r["title"],
            "authors": r.get("channel", ""),  # reuse 'authors' field for channel
            "series": "",                     # you can fill playlist/category later
            "synopsis": r["description"][:900] if isinstance(r["description"], str) else "",
            "age_min": int(r["age_min"]),
            "age_max": int(r["age_max"]),
            "rating": None,
            "ratings_count": None,
            "price": None,
            "link": r["url"],
            "badge": badge_s,
            "why": why_text,
            "type": "video",
        }

class Catalog:
    EXPECTED = [
        "Name","Series","Description","Author","Age","Rating_out_of_5",
        "No_of_Ratings","Price","Price_Befor","Cover_Type","Publication_Date",
        "Product_Details","Best_Seller","Link"
    ]
    def __init__(self, csv_path="books_data.csv"):
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"{csv_path} not found")
        df = pd.read_csv(csv_path, sep=None, engine="python")
        for c in self.EXPECTED:
            if c not in df.columns:
                df[c] = ""

        # IDs: prefer Link; else synthetic
        df["id"] = df["Link"].fillna("").astype(str)
        missing = df["id"] == ""
        df.loc[missing, "id"] = ["row_" + str(i) for i in df.index[missing]]

        # Normalize
        df["title"]   = df["Name"].fillna("").astype(str)
        df["authors"] = df["Author"].fillna("").astype(str)
        df["synopsis"]= df["Description"].fillna("").astype(str)
        df["series"]  = df["Series"].fillna("").astype(str)
        ages = df["Age"].fillna("").astype(str).apply(parse_age_band)
        df["age_min"] = ages.apply(lambda t: int(t[0]))
        df["age_max"] = ages.apply(lambda t: int(t[1]))
        df["Rating_out_of_5"] = pd.to_numeric(df["Rating_out_of_5"], errors="coerce")
        df["No_of_Ratings"]   = pd.to_numeric(df["No_of_Ratings"], errors="coerce")
        df["Price"]           = pd.to_numeric(df["Price"], errors="coerce")
        df["Best_Seller"]     = df["Best_Seller"].astype(str).str.strip()

        self.df = df.reset_index(drop=True)

        # Vector index
        corpus = (self.df["title"] + " " + self.df["authors"] + " " +
                  self.df["series"] + " " + self.df["synopsis"]).astype(str)
        self.vectorizer = TfidfVectorizer(min_df=1, max_df=0.95, ngram_range=(1,2))
        self.X = self.vectorizer.fit_transform(corpus)
        self.id2idx = {self.df.loc[i,"id"]: i for i in range(len(self.df))}
        self.idx2id = {i: self.df.loc[i,"id"] for i in range(len(self.df))}

    def rerank_by_quality(self, items, top_n=None):
        # items is a list of dicts produced by _row_to_card
        def key(d):
            # higher rating, then more ratings, then presence of "Best Seller"
            return (
                (d.get("rating") or 0.0),
                (d.get("ratings_count") or 0),
                1 if (d.get("badge") and "Best Seller" in d["badge"]) else 0
            )
        ranked = sorted(items, key=key, reverse=True)
        return ranked[:top_n] if top_n else ranked

    def search(self, query: str, k=6, age: Optional[int]=None):
        qv = self.vectorizer.transform([query])
        sims = linear_kernel(qv, self.X).ravel()
        order = np.argsort(-sims)[:400]
        out = []
        for i in order:
            r = self.df.iloc[i]
            if age is not None and not (r["age_min"] <= int(age) <= r["age_max"]):
                continue
            out.append(self._row_to_card(r))
            if len(out) >= k:
                break
        return out

    def similar(self, item_id: str, k=6):
        if item_id not in self.id2idx:
            return []
        idx = self.id2idx[item_id]
        sims = linear_kernel(self.X[idx], self.X).ravel()
        order = np.argsort(-sims)
        out = []
        for i in order:
            if i == idx: continue
            r = self.df.iloc[i]
            out.append(self._row_to_card(r, why="Similar to selected title"))
            if len(out) >= k: break
        return out

    def top_k(self, k=6):
        df = self.df.copy()
        df = df[df["title"].str.len() > 0]
        if "Rating_out_of_5" in df.columns and "No_of_Ratings" in df.columns:
            df = df.sort_values(by=["Rating_out_of_5","No_of_Ratings"], ascending=[False, False])
        return [self._row_to_card(r) for _, r in df.head(k).iterrows()]

    def _row_to_card(self, r, why: Optional[str]=None):
        badge = []
        if pd.notna(r["Rating_out_of_5"]): badge.append(f"{r['Rating_out_of_5']:.1f}★")
        if pd.notna(r["No_of_Ratings"]):   badge.append(f"{int(r['No_of_Ratings'])} ratings")
        if pd.notna(r["Price"]):           badge.append(f"${r['Price']:.2f}")
        if r["Best_Seller"]:               badge.append("Best Seller")
        badge_s = " | ".join(badge)
        why_text = why or (r["series"] or (r["synopsis"][:60] if isinstance(r["synopsis"], str) else "Good match"))
        return {
            "id": r["id"],
            "title": r["title"],
            "authors": r["authors"],
            "series": r["series"],
            "synopsis": r["synopsis"][:900],
            "age_min": int(r["age_min"]),
            "age_max": int(r["age_max"]),
            "rating": (float(r["Rating_out_of_5"]) if pd.notna(r["Rating_out_of_5"]) else None),
            "ratings_count": (int(r["No_of_Ratings"]) if pd.notna(r["No_of_Ratings"]) else None),
            "price": (float(r["Price"]) if pd.notna(r["Price"]) else None),
            "link": r["Link"],
            "badge": badge_s,
            "why": why_text
        }

# ----------------- NLU (very light) -----------------
AGE_PAT = re.compile(r"(?:(?:age|ages?)\s*)?(\d{1,2})(?:\s*[\-\–to]+\s*(\d{1,2})|\s*\+)?", re.I)
K_PAT   = re.compile(r"\b(show|give|top)\s*(\d{1,2})\b", re.I)
SIM_PAT = re.compile(r"(?:#|id\s*)([\w\-]+)", re.I)

def extract_entities(text: str) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    t = text.strip()

    m = AGE_PAT.search(t)
    if m:
        a1 = int(m.group(1))
        a2 = m.group(2)
        out["age"] = a1 if not a2 else None
        out["age_min"] = a1
        if a2:
            out["age_max"] = int(a2)
        elif "+" in t:
            out["age_max"] = a1 + 3
        else:
            out["age_max"] = a1 + 2

    m = K_PAT.search(t)
    if m:
        out["k"] = int(m.group(2))

    m = SIM_PAT.search(t)
    if m:
        out["book_id"] = m.group(1)

    # crude intent routing
    lt = t.lower()
    if any(w in lt for w in ["similar", "like", "more like", "another like"]):
        out["intent"] = "similar_to"
    elif any(w in lt for w in ["hi", "hello", "hey"]):
        out["intent"] = "greet"
    elif any(w in lt for w in ["help", "how to", "what can you do"]):
        out["intent"] = "help"
    elif any(w in lt for w in ["book", "read", "story", "recommend", "suggest", "find"]):
        out["intent"] = "get_recs"
    else:
        out["intent"] = "get_recs"  # default

    # detect whether user is asking for videos, books, or generic ---
    if any(w in lt for w in ["video", "videos", "cartoon", "episode", "watch", "youtube"]):
        out["content_type"] = "video"
    elif "book" in lt or "read" in lt or "story" in lt:
        out["content_type"] = "book"
    else:
        # default: book, but you could also set 'both'
        out["content_type"] = "book"

    # very rough topic to feed search when query is short
    out["query"] = t
    return out

# ----------------- Dialog state -----------------
class Memory:
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}
    def get(self, sid: str) -> Dict[str, Any]:
        s = self.sessions.get(sid)
        if not s:
            s = {"age": None, "language": "en", "last_items": [], "ts": time.time()}
            self.sessions[sid] = s
        return s

MEM = Memory()
VIDEO_CAT = VideoCatalog(csv_path="youtube_videos.csv")
CAT = Catalog(csv_path="books_data.csv")
INTENT_ANN = IntentANN()

# ----------------- FastAPI -----------------
app = FastAPI(title="DD BOT — Kids Book NLP Chatbot", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

class ChatIn(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    k: Optional[int] = 6

@app.get("/")
def root():
    return {"ok": True, "books": len(CAT.df)}

@app.post("/chatbot")
def chatbot(req: ChatIn):
    # 1) session + light entity extraction (age, k, #id etc)
    s = MEM.get(req.session_id)
    ent = extract_entities(req.message)

    # --- merge age into session (same as before) ---
    if ent.get("age") is not None:
        s["age"] = ent["age"]
    elif ent.get("age_min") is not None and ent.get("age_max") is not None:
        # store midpoint for future turns
        s["age"] = int((ent["age_min"] + ent["age_max"]) / 2)

    # how many results to show
    k = ent.get("k", req.k or 6)

    # 2) Start with rule-based intent from regex
    intent = ent["intent"]
    content_type = ent.get("content_type", "book")

    # 3) If ANN is available, override the intent
    if INTENT_ANN.available:
        ann_pred = INTENT_ANN.predict_intent(req.message)
        if ann_pred:
            intent = ann_pred

    # ---------- INTENT HANDLING ---------- #

    # similar_to by short id (#1) mapped from last result list
    if intent == "similar_to":
        bid = ent.get("book_id")
        # allow #N where N references last_items index
        if bid and bid.isdigit() and s["last_items"]:
            idx = int(bid) - 1
            if 0 <= idx < len(s["last_items"]):
                bid = s["last_items"][idx]["id"]

        if not bid:
            return {
                "reply": "Tell me which one: say “similar to #2” after I show results.",
                "items": [],
            }

        items = CAT.similar(bid, k=k)
        if not items:
            return {
                "reply": "I couldn’t find similar titles to that one. Try another pick?",
                "items": [],
            }

        s["last_items"] = items
        return {"reply": _format_list(items), "items": items}

    # greet/help → just text, no items
    if intent in ("help", "greet"):
        return {
            "reply": (
                "Hi! Tell me what you’re after (e.g., “bedtime stories about friendship”). "
                "You can add an age: “for a 6 year old”, and how many: “show 5”. "
                "After I show a list, say “similar to #2”."
            ),
            "items": [],
        }

    # default: get_recs (or anything unknown)
    # need an age? if not in memory, ask once
    if s["age"] is None:
        # try to infer from this turn
        if "age" not in ent and "age_min" not in ent:
            return {
                "reply": "What age is the child? (e.g., 4, 6–8, or 7+)",
                "items": [],
            }

    age_for_search = s["age"]

    # Choose catalog based on content_type ---
    if content_type == "video":
        items = VIDEO_CAT.search(ent["query"], k=k, age=age_for_search)
        if not items:
            items = VIDEO_CAT.search(ent["query"], k=k, age=None)
        if not items:
            items = VIDEO_CAT.top_k(k)
        kind = "videos"
    else:
        items = CAT.search(ent["query"], k=k, age=age_for_search)
        if not items:
            items = CAT.search(ent["query"], k=k, age=None)
        if not items:
            items = CAT.top_k(k)
        kind = "books"

    items = CAT.rerank_by_quality(items, top_n=k)  # optional: reuse same quality logic
    s["last_items"] = items
    return {"reply": _format_list_generic(items, kind=kind), "items": items}


def _format_list_generic(items, kind="books"):
    lines = []
    for i, it in enumerate(items, 1):
        badge = f" [{it['badge']}]" if it.get("badge") else ""
        lines.append(
            f"{i}. {it['title']} — Age {it['age_min']}-{it['age_max']}{badge}\n{it['why']}"
        )
    header = "Here are some " + kind + ":\n\n"
    return header + "\n\n".join(lines)


def _format_list(items):
    # keep old function for backwards compatibility
    return _format_list_generic(items, kind="books")

def _compact(items):
    keep = ("id","title","authors","series","age_min","age_max","badge","why","link")
    return [{k: v for k, v in it.items() if k in keep} for it in items]
