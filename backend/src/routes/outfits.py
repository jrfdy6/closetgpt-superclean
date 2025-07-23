"""
Outfit management endpoints (GET operations only).
Outfit generation is handled by /api/outfit/generate.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from ..core.logging import get_logger
from ..config.firebase import db
from ..models.analytics_event import AnalyticsEvent
from ..services.analytics_service import log_analytics_event
from ..routes.auth import get_current_user_id

router = APIRouter()
logger = get_logger("outfits")

async def resolve_item_ids_to_objects(items: List[Any], user_id: str) -> List[Dict[str, Any]]:
    """
    Resolve item IDs to actual item objects from the wardrobe collection.
    If an item is already a dictionary, return it as is.
    If an item is a string ID, fetch the item from the wardrobe collection.
    """
    resolved_items = []
    
    for item in items:
        if isinstance(item, dict):
            # Item is already a complete object
            resolved_items.append(item)
        elif isinstance(item, str):
            # Item is an ID, need to fetch from wardrobe
            try:
                item_doc = db.collection('wardrobe').document(item).get()
                if item_doc.exists:
                    item_data = item_doc.to_dict()
                    # Add the ID to the item data
                    item_data['id'] = item
                    resolved_items.append(item_data)
                else:
                    logger.warning(f"Item {item} not found in wardrobe for user {user_id}")
                    # Add a placeholder item
                    resolved_items.append({
                        'id': item,
                        'name': 'Item not found',
                        'type': 'unknown',
                        'imageUrl': None
                    })
            except Exception as e:
                logger.error(f"Error fetching item {item}: {e}")
                # Add a placeholder item
                resolved_items.append({
                    'id': item,
                    'name': 'Error loading item',
                    'type': 'unknown',
                    'imageUrl': None
                })
        else:
            logger.warning(f"Unexpected item type: {type(item)} for item: {item}")
            # Add a placeholder item
            resolved_items.append({
                'id': str(item),
                'name': 'Invalid item',
                'type': 'unknown',
                'imageUrl': None
            })
    
    return resolved_items

class OutfitFeedback(BaseModel):
    outfit_id: str
    rating: int  # 1-5 scale
    feedback_type: str  # "like", "dislike", "comment"
    comment: Optional[str] = None

class OutfitResponse(BaseModel):
    id: str
    name: str
    style: str
    mood: str
    items: List[Dict[str, Any]]
    occasion: str
    confidence_score: Optional[float] = 0.0
    reasoning: str
    createdAt: datetime

@router.get("/{outfit_id}", response_model=OutfitResponse)
async def get_outfit(
    outfit_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get a specific outfit by ID."""
    try:
        outfit_doc = db.collection('outfits').document(outfit_id).get()
        
        if not outfit_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Outfit not found"
            )
        
        outfit_data = outfit_doc.to_dict()
        
        # Verify ownership
        if outfit_data['user_id'] != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Log analytics event
        analytics_event = AnalyticsEvent(
            user_id=current_user_id,
            event_type="outfit_viewed",
            metadata={
                "outfit_id": outfit_id,
                "occasion": outfit_data['occasion']
            }
        )
        log_analytics_event(analytics_event)
        
        # Resolve item IDs to actual item objects
        resolved_items = await resolve_item_ids_to_objects(outfit_data['items'], current_user_id)
        
        return OutfitResponse(
            id=outfit_id,
            name=outfit_data.get('name', ''),
            style=outfit_data.get('style', ''),
            mood=outfit_data.get('mood', ''),
            items=resolved_items,
            occasion=outfit_data['occasion'],
            confidence_score=outfit_data.get('confidence_score', 0.0),
            reasoning=outfit_data.get('reasoning', ''),
            createdAt=outfit_data['createdAt']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get outfit {outfit_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get outfit"
        )

@router.get("/", response_model=List[OutfitResponse])
async def get_user_outfits(
    current_user_id: str = Depends(get_current_user_id),
    limit: Optional[int] = 1000,  # High limit to show most outfits, but prevent performance issues
    offset: int = 0
):
    """Get user's outfit history."""
    try:
        outfits_ref = db.collection('outfits')
        outfits_query = outfits_ref.where('user_id', '==', current_user_id)\
                                  .offset(offset)
        
        # Apply limit (default is 1000, which should cover most users)
        outfits_query = outfits_query.limit(limit)
        
        outfit_docs = outfits_query.stream()
        
        outfits = []
        for doc in outfit_docs:
            outfit_data = doc.to_dict()
            
            # Resolve item IDs to actual item objects
            resolved_items = await resolve_item_ids_to_objects(outfit_data.get('items', []), current_user_id)
            
            outfits.append(OutfitResponse(
                id=doc.id,
                name=outfit_data.get('name', ''),
                style=outfit_data.get('style', ''),
                mood=outfit_data.get('mood', ''),
                items=resolved_items,
                occasion=outfit_data.get('occasion', 'Casual'),
                confidence_score=outfit_data.get('confidence_score', 0.0),
                reasoning=outfit_data.get('reasoning', ''),
                createdAt=outfit_data['createdAt']
            ))
        
        # Log analytics event
        analytics_event = AnalyticsEvent(
            user_id=current_user_id,
            event_type="outfits_listed",
            metadata={
                "outfit_count": len(outfits),
                "limit": limit,
                "offset": offset
            }
        )
        log_analytics_event(analytics_event)
        
        return outfits
        
    except Exception as e:
        logger.error(f"Failed to get outfits for user {current_user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get outfits"
        )

@router.post("/feedback")
async def submit_outfit_feedback(
    feedback: OutfitFeedback,
    current_user_id: str = Depends(get_current_user_id)
):
    """Submit feedback for an outfit."""
    try:
        # Verify outfit exists and belongs to user
        outfit_doc = db.collection('outfits').document(feedback.outfit_id).get()
        
        if not outfit_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Outfit not found"
            )
        
        outfit_data = outfit_doc.to_dict()
        if outfit_data['user_id'] != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Save feedback
        feedback_doc = {
            'outfit_id': feedback.outfit_id,
            'user_id': current_user_id,
            'rating': feedback.rating,
            'feedback_type': feedback.feedback_type,
            'comment': feedback.comment,
            'created_at': datetime.utcnow()
        }
        
        feedback_id = str(uuid.uuid4())
        db.collection('outfit_feedback').document(feedback_id).set(feedback_doc)
        
        # Update outfit with feedback
        outfit_ref = db.collection('outfits').document(feedback.outfit_id)
        outfit_ref.update({
            'last_feedback': feedback_doc,
            'updated_at': datetime.utcnow()
        })
        
        # Log analytics event
        analytics_event = AnalyticsEvent(
            user_id=current_user_id,
            event_type="outfit_feedback_submitted",
            metadata={
                "outfit_id": feedback.outfit_id,
                "rating": feedback.rating,
                "feedback_type": feedback.feedback_type,
                "has_comment": bool(feedback.comment)
            }
        )
        log_analytics_event(analytics_event)
        
        logger.info(f"Outfit feedback submitted: {feedback.outfit_id}")
        
        return {"message": "Feedback submitted successfully", "feedback_id": feedback_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to submit outfit feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit feedback"
        )

@router.delete("/{outfit_id}")
async def delete_outfit(
    outfit_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Delete an outfit."""
    try:
        # Verify outfit exists and belongs to user
        outfit_doc = db.collection('outfits').document(outfit_id).get()
        
        if not outfit_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Outfit not found"
            )
        
        outfit_data = outfit_doc.to_dict()
        if outfit_data['user_id'] != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Delete outfit
        db.collection('outfits').document(outfit_id).delete()
        
        # Log analytics event
        analytics_event = AnalyticsEvent(
            user_id=current_user_id,
            event_type="outfit_deleted",
            metadata={
                "outfit_id": outfit_id,
                "occasion": outfit_data['occasion']
            }
        )
        log_analytics_event(analytics_event)
        
        logger.info(f"Outfit deleted: {outfit_id}")
        
        return {"message": "Outfit deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete outfit {outfit_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete outfit"
        ) 