from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.tables import ChatConversation, ChatMessage, User
from datetime import datetime
from app import chatbot as nlp_chatbot, ChatIn

router = APIRouter()

# Get all chat conversations for a child
@router.get("/child/{userId}/chat")
def get_user_chats(userId: int, db: Session = Depends(get_db)):
    chat = (
        db.query(ChatConversation)
        .filter(ChatConversation.child_id == userId)
        .order_by(ChatConversation.last_updated.desc())
        .all()
    )
    return [
        {
            "id": c.id,
            "title": c.title or f"Chat {c.id}",
            "started_at": c.started_at,
            "last_updated": c.last_updated,
        }
        for c in chat
    ]

@router.post("/child/{userId}/chat")
def create_new_chat(userId: int, db: Session = Depends(get_db)):

        user = db.query(User).filter(User.id == userId).first()
        if not user:
            raise HTTPException(status_code=404, detail=f"User with ID {userId} not found")

        new_chat = ChatConversation(
            child_id=userId,
            title="New chat",
            started_at=datetime.utcnow(),
            last_updated=datetime.utcnow(),
        )
        db.add(new_chat)
        db.commit()
        db.refresh(new_chat)

        return {
            "id": new_chat.id,
            "title": new_chat.title,
            "started_at": new_chat.started_at.isoformat() if new_chat.started_at else None,
            "last_updated": new_chat.last_updated.isoformat() if new_chat.last_updated else None,
            "created_at": new_chat.started_at.isoformat() if new_chat.started_at else None,
                }



# Get all messages in a chat
@router.get("/chat/{chat_id}/message")
def get_chat_messages(chat_id: int, db: Session = Depends(get_db)):
    chat = db.query(ChatConversation).filter_by(id=chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    return [
        {
            "id": m.id,
            "sender": "user" if m.sender_type == "CHILD" else "bot",
            "text": m.message_text,
            "created_at": m.timestamp,
        }
        for m in chat.messages
    ]


# Send message to chatbot (and save to DataBase)
@router.post("/chatbot")
def send_message(payload: dict, db: Session = Depends(get_db)):
    userId = payload.get("userId")
    chat_id = payload.get("chat_id")
    message_text = payload.get("message", "").strip()

    if not userId or not message_text:
        raise HTTPException(status_code=400, detail="Missing required fields")

    # Create conversation if needed
    convo = db.query(ChatConversation).filter_by(id=chat_id).first() if chat_id else None
    new_chat_created = False

    if not convo:
        convo = ChatConversation(
            child_id=userId,
            title=message_text[:30] or "New chat",
            started_at=datetime.utcnow(),
            last_updated=datetime.utcnow(),
        )
        db.add(convo)
        db.commit()
        db.refresh(convo)
        chat_id = convo.id
        new_chat_created = True

    # Save user's message
    user_msg = ChatMessage(
        conversation_id=chat_id,
        sender_type="CHILD",
        message_text=message_text,
        timestamp=datetime.utcnow(),
    )
    db.add(user_msg)
    db.commit()

    # Generate bot reply using ANN/NLU chatbot in app.py
    nlp_request = ChatIn(
        message=message_text,
        session_id=str(userId),  # or f"child-{userId}"
        k=6
    )
    nlp_result = nlp_chatbot(nlp_request)

    reply_text = nlp_result["reply"]
    recommended_items = nlp_result["items"]  # list of books


    # Save bot reply
    bot_msg = ChatMessage(
        conversation_id=chat_id,
        sender_type="ASSISTANT",
        message_text=reply_text,
        model_used="MODEL-v1",
        timestamp=datetime.utcnow(),
    )
    db.add(bot_msg)

    # Update conversation timestamp
    convo.last_updated = datetime.utcnow()
    db.commit()

    # Return both reply and chat metadata (important!)
    return {
        "reply": reply_text,
        "chat_id": chat_id,
        "new_chat": new_chat_created,
        "chat_title": convo.title,
        "started_at": convo.started_at,
        "last_updated": convo.last_updated,
        "recommendations": recommended_items,
    }
# Delete a chat conversation
@router.delete("/chat/{chat_id}")
def delete_chat(chat_id: int, db: Session = Depends(get_db)):
    chat = db.query(ChatConversation).filter_by(id=chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Also delete messages in this conversation if needed
    db.query(ChatMessage).filter_by(conversation_id=chat_id).delete()
    
    db.delete(chat)
    db.commit()
    return {"detail": f"Chat {chat_id} deleted successfully"}



