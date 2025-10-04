import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import json
import numpy as np
import pickle
import os
from fetch_book import fetch_books
from fetch_videos import fetch_videos

# -----------------------------
# 1. Build a kid-friendly dataset
# -----------------------------
class KidChatDataset(Dataset):
    """
    Combines:
      - chat_history.json  (previous conversations)
      - books  (from fetch_book.py)
      - videos (from fetch_videos.py)
    into a single supervised dataset:
      X = vectorised context (chat + available items)
      y = index of the item the kid actually picked (0…N-1)
    """
    def __init__(self, chat_path="chat_history.json", cache="dataset_cache.pkl"):
        self.cache = cache
        if os.path.exists(cache):
            with open(cache, "rb") as f:
                self.X, self.y, self.idx2item = pickle.load(f)
            return

        # 1.1 Load chat history
        with open(chat_path, encoding="utf-8") as f:
            hist = json.load(f)        # list of dicts: {"context":"…", "picked":"…"}

        # 1.2 Fetch candidate items
        books  = fetch_books()   # list of dicts with 'title', 'embedding', …
        videos = fetch_videos()  # same format
        self.idx2item = books + videos
        self.item2idx = {tuple(v["embedding"]): i for i, v in enumerate(self.idx2item)}

        # 1.3 Build samples
        self.X, self.y = [], []
        for turn in hist:
            ctx_vec = self._text2vec(turn["context"])
            for item in self.idx2item:
                combined = np.hstack([ctx_vec, item["embedding"]])
                self.X.append(combined)
                self.y.append(1 if turn["picked"] == item["title"] else 0)

        self.X = torch.tensor(np.vstack(self.X), dtype=torch.float32)
        self.y = torch.tensor(self.y, dtype=torch.float32)

        # 1.4 Cache for speed
        with open(cache, "wb") as f:
            pickle.dump((self.X, self.y, self.idx2item), f)

    def _text2vec(self, text):
        """Simple mean-pool of GloVe vectors (or any 300-d static vectors)."""
        # Replace with your own word-vector lookup
        glove = {}  # placeholder: word -> 300-d np.array
        words = text.lower().split()
        vecs = [glove[w] for w in words if w in glove]
        return np.mean(vecs, axis=0) if vecs else np.zeros(300)

    def __len__(self):            return len(self.y)
    def __getitem__(self, idx):   return self.X[idx], self.y[idx]

# -----------------------------
# 2. ANN model
# -----------------------------
class RecommenderANN(nn.Module):
    def __init__(self, input_dim, hidden=256, dropout=0.3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden, hidden),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden, 1)   # output = relevance score
        )

    def forward(self, x):
        return torch.sigmoid(self.net(x)).squeeze()

# -----------------------------
# 3. Training loop
# -----------------------------
def train(model, loader, epochs=10, lr=1e-3, device="cpu"):
    opt = optim.Adam(model.parameters(), lr=lr)
    criterion = nn.BCELoss()
    model.to(device)
    for epoch in range(epochs):
        total_loss = 0
        for xb, yb in loader:
            xb, yb = xb.to(device), yb.to(device)
            opt.zero_grad()
            pred = model(xb)
            loss = criterion(pred, yb)
            loss.backward()
            opt.step()
            total_loss += loss.item()
        print(f"Epoch {epoch+1:02d} | loss={total_loss/len(loader):.4f}")
    torch.save(model.state_dict(), "ann_recommender.pt")

# -----------------------------
# 4. Inference helper
# -----------------------------
def recommend(context, top_k=3, device="cpu"):
    model = RecommenderANN(input_dim=dataset.X.shape[1])
    model.load_state_dict(torch.load("ann_recommender.pt", map_location=device))
    model.eval()

    dataset = KidChatDataset()  # loads cached
    ctx_vec = dataset._text2vec(context)
    scores = []
    with torch.no_grad():
        for item in dataset.idx2item:
            combined = np.hstack([ctx_vec, item["embedding"]])
            x = torch.tensor(combined, dtype=torch.float32).unsqueeze(0).to(device)
            score = model(x).item()
            scores.append((score, item))
    scores.sort(reverse=True)
    return scores[:top_k]

# -----------------------------
# 5. Main entry
# -----------------------------
if __name__ == "__main__":
    dataset = KidChatDataset()
    loader  = DataLoader(dataset, batch_size=64, shuffle=True)
    model   = RecommenderANN(input_dim=dataset.X.shape[1])
    train(model, loader, epochs=15)
