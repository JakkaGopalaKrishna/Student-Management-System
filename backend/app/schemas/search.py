from pydantic import BaseModel
from typing import Optional, List

class SearchResult(BaseModel):
    type: str # 'student', 'note', 'paper', 'notification', 'syllabus'
    title: str
    subtitle: Optional[str] = None
    link: str
    id: Optional[int] = None

class SearchResponse(BaseModel):
    results: List[SearchResult]
