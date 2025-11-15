from datetime import date
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Query as FastAPIQuery,
    Response
)
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth.auth_handler import (
    get_current_active_user,
    get_password_hash,
    get_user,
    verify_password,
    get_current_user
)
from db.database import get_db
from schemas.users import ChangePassword
from schemas.auth import StatusMessage
from schemas.interest import InterestResponse
from schemas.parent import (
    ChildRegistrationRequest,
    ChildRegistrationResponse,
    ParentViewChildAccountsResponse,
    ChildProfileUpdate,
    ChildSummary, ParentMeResponse, TierChangePreviewResponse, ChangeTierRequest
)
from models.tables import Interest, User, Role, UserRole, SubscriptionTier, ChatConversation, ChatMessage, Review, ChildFavoriteBook, ChildFavoriteVideo, ChildInterest

router = APIRouter(
    prefix="/parent",
    tags=["Parent Actions"],
)

# Constants / plan rules
FREE_CHILD_LIMIT = 1  # how many child accounts are allowed on FREE


# Internal helper functions (kept inside this router, not global)
def _assert_is_parent(user: User):
    """Only allow real parents to hit tier endpoints."""
    if not user.role or user.role.name.value != "PARENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can access this resource.",
        )


def _get_children_for_parent(db: Session, parent_id: int) -> List[User]:
    """Return all children (regardless of 'active' flag)."""
    return (
        db.query(User)
        .join(Role)
        .filter(
            User.primary_parent_id == parent_id,
            Role.name == UserRole.CHILD,
        )
        .all()
    )


def _serialize_parent_with_children(parent: User, children: List[User]):
    return {
        "id": parent.id,
        "username": parent.username,
        "email": parent.email,
        "tier": parent.tier.value if parent.tier else "FREE",
        "first_name": parent.first_name,
        "last_name": parent.last_name,
        "country": parent.country,
        "gender": parent.gender,
        "birthday": parent.birthday,
        "race": parent.race,
        "role_name": parent.role.name.value if parent.role else None,
        "children": [
            {
                "id": c.id,
                "username": c.username,
                "first_name": c.first_name,
                "last_name": c.last_name,
                "tier": c.tier.value if c.tier else None,
                "is_active": bool(c.is_active),
            }
            for c in children
        ],
    }



def _build_preview_payload(
    current_tier: str,
    target_tier: str,
    children: List[User],
):
    """
    Describe what will happen if parent switches tier.
    - gain_features: benefits they'll gain
    - lose_features: what they'll lose
    - requires_child_choice: whether they must pick which kid to keep
    """
    upgrading = (current_tier != "PRO" and target_tier == "PRO")
    downgrading = (current_tier == "PRO" and target_tier == "FREE")

    gain_features: List[str] = []
    lose_features: List[str] = []
    requires_child_choice = False

    if upgrading:
        # FREE -> PRO
        gain_features = [
            "Unlimited access to books & videos",
            "Multiple child profiles (up to 5 or more)",
            "Parental dashboard & analytics",
            "Priority support",
        ]
        lose_features = []
        requires_child_choice = False

    elif downgrading:
        # PRO -> FREE
        gain_features = []
        lose_features = [
            "Unlimited access to books & videos",
            "Multiple child profiles (limit will drop to 1)",
            "Parental dashboard & analytics",
            "Priority support",
        ]
        # If more kids than FREE limit, they must choose
        if len(children) > FREE_CHILD_LIMIT:
            requires_child_choice = True

    child_list_for_frontend = [
        {
            "id": c.id,
            "username": c.username,
            "first_name": c.first_name,
            "last_name": c.last_name,
        }
        for c in children
    ]

    return {
        "current_tier": current_tier,
        "target_tier": target_tier,
        "gain_features": gain_features,
        "lose_features": lose_features,
        "requires_child_choice": requires_child_choice,
        "children": child_list_for_frontend,
        "max_children_allowed": FREE_CHILD_LIMIT,
    }


# Interests list for dropdown
@router.get("/interests", response_model=List[InterestResponse])
def get_all_interests(db: Session = Depends(get_db)):
    interests = db.query(Interest).all()
    return interests



# 2. Create child account
#    (inherits current parent's tier for the child)
@router.post(
    "/create-child",
    status_code=status.HTTP_201_CREATED,
    response_model=ChildRegistrationResponse,
)
async def create_child_account(
    child_data: ChildRegistrationRequest,
    db: Session = Depends(get_db),
    current_parent_user: User = Depends(get_current_active_user),
):
    # Must be parent
    if not current_parent_user.role or current_parent_user.role.name.value != "PARENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can create child accounts.",
        )

    # Enforce FREE plan limit
    parent_tier_str = (
        current_parent_user.tier.value
        if hasattr(current_parent_user.tier, "value")
        else (current_parent_user.tier or "FREE")
    ).upper()

    if parent_tier_str == "FREE":
        # Count ACTIVE children for this parent
        active_child_count = (
            db.query(User)
            .join(Role)
            .filter(
                User.primary_parent_id == current_parent_user.id,
                Role.name == UserRole.CHILD,
                User.is_active == True,
            )
            .count()
        )

        if active_child_count >= FREE_CHILD_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You are on the FREE plan, which allows only 1 active child "
                    "account. Upgrade to PRO to add more children."
                ),
            )

    # Username must be unique
    if get_user(db, child_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered.",
        )

    # Resolve interests into Interest rows
    interests_from_db: List[Interest] = (
        db.query(Interest)
        .filter(Interest.name.in_(child_data.interests))
        .all()
    )

    # Create the new child
    hashed_password = get_password_hash(child_data.password)

    new_child = User(
        username=child_data.username,
        email=None,
        hashed_password=hashed_password,
        first_name=child_data.first_name,
        last_name=child_data.last_name,
        country=child_data.country,
        gender=child_data.gender,
        birthday=child_data.birthday,
        race=child_data.race,
        role_id=3,  # Child role PK in your DB
        primary_parent_id=current_parent_user.id,
        is_verified=1,
        is_active=True,  # new kid starts active
        tier=current_parent_user.tier or "FREE",
    )
    new_child.interests = interests_from_db

    db.add(new_child)
    db.commit()
    db.refresh(new_child)

    return new_child



# View child accounts
@router.get(
    "/my-children",
    summary="List this parent's children with tier / active info",
)
def get_children_for_current_parent(
    db: Session = Depends(get_db),
    current_parent: User = Depends(get_current_active_user),
):
    # Only parents can view this
    _assert_is_parent(current_parent)

    # Get a fresh parent row
    parent = (
        db.query(User)
        .filter(User.id == current_parent.id)
        .first()
    )
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found.")

    # Get all kids
    kids = _get_children_for_parent(db, parent.id)

    # Shape each kid into plain JSON that the frontend can trust
    shaped_children = []
    for k in kids:
        shaped_children.append(
            {
                "id": k.id,
                "username": k.username,
                "first_name": k.first_name,
                "last_name": k.last_name,
                "birthday": k.birthday,
                "country": k.country,
                "gender": k.gender,
                "race": k.race,
                # turn Enum -> string like "PRO", "FREE", "DEACTIVATED"
                "tier": (k.tier.value if k.tier else None),
                "is_active": bool(k.is_active),
                # interests -> ["FANTASY", "SCIENCE", ...]
                "interests": [
                    {"name": i.name}
                    for i in getattr(k, "interests", [])
                ],
            }
        )

    return shaped_children




# Update a child profile
@router.patch(
    "/update-child/{child_id}",
    response_model=ParentViewChildAccountsResponse,
)
def update_child_profile(
    child_id: int,
    update_data: ChildProfileUpdate,
    db: Session = Depends(get_db),
    current_parent: User = Depends(get_current_active_user),
):
    # Fetch child
    child_to_update = db.query(User).filter(User.id == child_id).first()

    if not child_to_update:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found",
        )

    # Validate ownership
    if child_to_update.primary_parent_id != current_parent.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to modify this child's profile.",
        )

    # Convert request data to dict of changes
    update_dict = update_data.model_dump(exclude_unset=True)

    # Handle 'interests' separately (many-to-many)
    if "interests" in update_dict:
        interest_names = update_dict.pop("interests")
        interests_from_db = (
            db.query(Interest)
            .filter(Interest.name.in_(interest_names))
            .all()
        )

        if len(interests_from_db) != len(set(interest_names)):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more selected interests are invalid.",
            )

        child_to_update.interests = interests_from_db

    # Update simple scalar fields
    for key, value in update_dict.items():
        setattr(child_to_update, key, value)

    db.commit()
    db.refresh(child_to_update)
    return child_to_update


# Delete a child
@router.delete(
    "/delete-child/{child_id}",
    response_model=StatusMessage,
)
def delete_child_account(
    child_id: int,
    db: Session = Depends(get_db),
    current_parent: User = Depends(get_current_active_user),
):
    # 1) Fetch child to verify existence + ownership
    child_to_delete = (
        db.query(User)
        .filter(User.id == child_id)
        .first()
    )

    if not child_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found",
        )

    if child_to_delete.primary_parent_id != current_parent.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this child account.",
        )

    try:
        # 2) Bulk-delete the child user row.
        #    This issues: DELETE FROM user WHERE id = :child_id
        #    and lets ON DELETE CASCADE clean up:
        #    - chat_conversation / chat_message
        #    - child_favorite_book / child_favorite_video
        #    - childinterest
        #    - review
        (
            db.query(User)
            .filter(User.id == child_id)
            .delete(synchronize_session=False)
        )

        db.commit()

    except IntegrityError as e:
        db.rollback()
        print(f"[ERROR] IntegrityError while deleting child {child_id}: {repr(e)}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Failed to delete child due to related records.",
        ) from e

    return StatusMessage(
        status="success",
        message="Child account deleted successfully.",
    )

# Parent changes their kid's password
@router.patch(
    "/change-kid-password/{child_id}",
    response_model=ParentViewChildAccountsResponse,
)
def edit_child_password(
    child_id: int,
    child_data: ChangePassword,
    db: Session = Depends(get_db),
    current_parent: User = Depends(get_current_active_user),
):
    child_to_edit = db.query(User).filter(User.id == child_id).first()

    if not child_to_edit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found",
        )

    if child_to_edit.primary_parent_id != current_parent.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit this child's password.",
        )

    # Confirm the current password
    if not verify_password(
        child_data.current_password, child_to_edit.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The current password provided is incorrect.",
        )

    # Update password
    child_to_edit.hashed_password = get_password_hash(child_data.new_password)
    db.add(child_to_edit)
    db.commit()
    db.refresh(child_to_edit)

    return child_to_edit



# Get the parent's profile
@router.get(
    "/me",
    response_model=ParentMeResponse,
    summary="Get the authenticated parent's profile (fresh from DB)",
)
def get_parent_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _assert_is_parent(current_user)

    parent = (
        db.query(User)
        .filter(User.id == current_user.id)
        .first()
    )
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found.")

    kids = _get_children_for_parent(db, parent.id)

    return _serialize_parent_with_children(parent, kids)


# Preview the tier change (Upgrade to PRO or Downgrade to FREE)
# Frontend calls this when user clicks "Upgrade to Pro" or "Switch to Free".
@router.get(
    "/tier-preview",
    response_model=TierChangePreviewResponse,
    summary="Preview what will happen if this parent changes tiers",
)
def preview_tier_change(
    target_tier: str = FastAPIQuery(...),  # expects "FREE" or "PRO"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _assert_is_parent(current_user)

    parent = (
        db.query(User)
        .filter(User.id == current_user.id)
        .first()
    )
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found.")

    requested = (target_tier or "").upper().strip()
    if requested not in ("FREE", "PRO"):
        raise HTTPException(
            status_code=400,
            detail="target_tier must be 'FREE' or 'PRO'.",
        )

    current_tier = parent.tier or "FREE"
    if requested == current_tier:
        raise HTTPException(
            status_code=400,
            detail="You are already on that plan.",
        )

    kids = _get_children_for_parent(db, parent.id)

    # Build preview
    preview_raw = _build_preview_payload(
        current_tier=current_tier,
        target_tier=requested,
        children=kids,
    )

    # Convert children from dict to ChildSummary models so it matches Pydantic
    preview_children = [
        ChildSummary(
            id=c["id"],
            username=c["username"],
            first_name=c.get("first_name"),
            last_name=c.get("last_name"),
            tier=None,  # we don't need kid.tier for preview
        )
        for c in preview_raw["children"]
    ]

    return TierChangePreviewResponse(
        current_tier=preview_raw["current_tier"],
        target_tier=preview_raw["target_tier"],
        gain_features=preview_raw["gain_features"],
        lose_features=preview_raw["lose_features"],
        requires_child_choice=preview_raw["requires_child_choice"],
        children=preview_children,
        max_children_allowed=preview_raw["max_children_allowed"],
    )



# Actually apply the tier change
# Frontend calls this when parent confirms in the modal.
# handles child limits when downgrading.
@router.patch(
    "/change-tier",
    response_model=ParentMeResponse,
    summary="Apply the tier change (and update children tiers)",
)
def change_parent_tier(
    body: ChangeTierRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    _assert_is_parent(current_user)

    # --- load full parent row fresh from DB
    parent: User = (
        db.query(User)
        .filter(User.id == current_user.id)
        .first()
    )
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found.")

    # convert parent tier enum -> "PRO"/"FREE"/"DEACTIVATED"
    current_tier_str = (
        parent.tier.value if parent.tier else "FREE"
    ).upper()

    # normalize request target tier string
    requested_tier_str = (body.target_tier or "").upper().strip()

    if requested_tier_str not in ("FREE", "PRO"):
        raise HTTPException(
            status_code=400,
            detail="target_tier must be 'FREE' or 'PRO'.",
        )

    if requested_tier_str == current_tier_str:
        raise HTTPException(
            status_code=400,
            detail="You are already on that plan.",
        )

    # grab *all* kids for this parent
    kids: list[User] = _get_children_for_parent(db, parent.id)

    # UPGRADE to PRO
    if requested_tier_str == "PRO":
        # parent becomes PRO (enum)
        parent.tier = SubscriptionTier.PRO

        # every child becomes PRO and active
        for kid in kids:
            kid.tier = SubscriptionTier.PRO
            kid.is_active = True  # reactivate any that were off

        db.commit()
        db.refresh(parent)

    # DOWNGRADE to FREE
    else:
        # We allow only one active child on FREE.
        # Count which kids are currently "active"
        active_kids = [k for k in kids if k.is_active]

        # if more than the allowed limit, we must keep only one active
        if len(active_kids) > FREE_CHILD_LIMIT:
            if body.keep_child_id is None:
                raise HTTPException(
                    status_code=400,
                    detail="Multiple child accounts. Please choose which child to keep active.",
                )

            # find the chosen keeper
            keeper = next(
                (k for k in active_kids if k.id == body.keep_child_id),
                None,
            )
            if keeper is None:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid keep_child_id.",
                )

            # set keeper as FREE + active
            keeper.tier = SubscriptionTier.FREE
            keeper.is_active = True

            # every other *currently active* kid gets deactivated
            for kid in active_kids:
                if kid.id != keeper.id:
                    kid.tier = SubscriptionTier.DEACTIVATED
                    kid.is_active = False

            # and for completeness, any already inactive kids stay inactive/deactivated
            for kid in kids:
                if kid not in active_kids:
                    # if a kid was already inactive, keep them deactivated
                    if kid.is_active is False:
                        kid.tier = SubscriptionTier.DEACTIVATED

        else:
            # we have 0 or 1 active kids already
            for kid in kids:
                if kid.is_active:
                    # keep them active but mark as FREE
                    kid.tier = SubscriptionTier.FREE
                    kid.is_active = True
                else:
                    # already inactive -> keep them deactivated
                    kid.tier = SubscriptionTier.DEACTIVATED
                    kid.is_active = False

        # finally, parent becomes FREE
        parent.tier = SubscriptionTier.FREE

        db.commit()
        db.refresh(parent)

    # re-load after commit so we respond with current data
    fresh_kids = _get_children_for_parent(db, parent.id)

    # _serialize_parent_with_children() include both kid.tier.value and kid.is_active.
    # update inline before returning
    return {
        "id": parent.id,
        "username": parent.username,
        "email": parent.email,
        "tier": parent.tier.value if parent.tier else "FREE",
        "first_name": parent.first_name,
        "last_name": parent.last_name,
        "country": parent.country,
        "gender": parent.gender,
        "birthday": parent.birthday,
        "race": parent.race,
        "role_name": parent.role.name.value if parent.role else None,
        "children": [
            {
                "id": k.id,
                "username": k.username,
                "first_name": k.first_name,
                "last_name": k.last_name,
                "tier": k.tier.value if k.tier else None,
                "is_active": bool(k.is_active),
            }
            for k in fresh_kids
        ],
    }

@router.delete("/delete-my-account", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes the authenticated parent's account, all child accounts,
    and all associated data (favorites, interests, chats, reviews).
    Returns 204 on success.
    """

    # Treat as parent only if not a child (no primary_parent_id). 
    # If you also need a role check, add it here.
    if current_user.primary_parent_id is not None:
        raise HTTPException(status_code=403, detail="Only parent accounts can perform this action.")

    parent = db.get(User, current_user.id)
    if not parent:
        raise HTTPException(status_code=404, detail="Account not found.")

    # Collect child IDs
    child_ids = [
        row[0]
        for row in db.execute(
            select(User.id).where(User.primary_parent_id == parent.id)
        ).all()
    ]

    # We will delete reviews for both parent + children
    all_user_ids = child_ids + [parent.id]

    try:
        # ---- 1) Delete child-scoped dependents first ----
        if child_ids:
            db.execute(delete(ChildFavoriteBook).where(ChildFavoriteBook.child_id.in_(child_ids)))
            db.execute(delete(ChildFavoriteVideo).where(ChildFavoriteVideo.child_id.in_(child_ids)))
            db.execute(delete(ChildInterest).where(ChildInterest.child_id.in_(child_ids)))
            # ChatMessage cascades from ChatConversation (FK with ON DELETE CASCADE in your model),
            # so deleting conversations is enough:
            db.execute(delete(ChatConversation).where(ChatConversation.child_id.in_(child_ids)))

        # ---- 2) Delete reviews for parent and children ----
        if all_user_ids:
            db.execute(delete(Review).where(Review.user_id.in_(all_user_ids)))

        # ---- 3) Delete child users, then parent user ----
        if child_ids:
            db.execute(delete(User).where(User.id.in_(child_ids)))

        db.execute(delete(User).where(User.id == parent.id))

        # Finalize
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    except IntegrityError as e:
        db.rollback()
        # If any new FK shows up later, you’ll see this. Add a targeted delete above and retry.
        raise HTTPException(
            status_code=409,
            detail="Delete failed due to related records. Please try again after cleaning up dependent data."
        ) from e
