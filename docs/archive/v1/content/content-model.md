# Content Model & Schema Definitions

**Format:** TypeScript Data Interfaces  
**Platform:** Hadhramout Center Digital Platform  

---

```typescript
export interface Publication {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  authorAr: string;
  authorEn: string;
  category: 'linguistics' | 'sultanates' | 'ports-trade' | 'archaeology' | 'islamic' | 'contemporary';
  categoryLabelAr: string;
  categoryLabelEn: string;
  year: number;
  hijriYear?: number;
  pages?: number;
  isbn?: string;
  coverImage: string;
  abstractAr: string;
  abstractEn: string;
  tableOfContents?: string[];
  citationAPA: string;
  citationChicago: string;
  citationMLA: string;
  downloadUrl?: string;
  featured?: boolean;
}

export interface MagazineIssue {
  issueNumber: number;
  slug: string;
  titleAr: string;
  titleEn: string;
  publishDate: string;
  seasonAr: string;
  coverImage: string;
  descriptionAr: string;
  descriptionEn: string;
  featuredArticles: {
    titleAr: string;
    titleEn: string;
    authorAr: string;
    authorEn: string;
    sectionAr: string;
  }[];
  downloadUrl?: string;
}

export interface ForumEvent {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  speakerAr: string;
  speakerEn: string;
  speakerTitleAr: string;
  date: string;
  locationAr: string;
  locationEn: string;
  summaryAr: string;
  summaryEn: string;
  status: 'upcoming' | 'completed';
}

export interface TimelineMilestone {
  id: string;
  era: 'ancient' | 'islamic' | 'sultanate' | 'modern';
  eraLabelAr: string;
  eraLabelEn: string;
  approxDateAr: string;
  approxDateEn: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  historicalSignificanceAr: string;
  referenceSourceAr: string;
}
```
