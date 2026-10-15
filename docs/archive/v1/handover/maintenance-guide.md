# Platform Maintenance & Operations Guide

**Platform:** Hadhramout Center Digital Platform  
**Target:** Center Administrative Staff & Web Editors  

---

## 1. How Content is Organized
All publication data, magazine issues, forum announcements, and historical milestones are structured inside a single, clean file: `data.js`.

### Adding a New Book Publication
To add a new book to the platform:
1. Open `data.js`.
2. Locate `const PUBLICATIONS = [ ... ]`.
3. Add a new object following this template:
   ```javascript
   {
     id: 'bk-new',
     slug: 'book-title-slug',
     titleAr: 'عنوان الكتاب الجديد بالعربية',
     titleEn: 'New Book Title in English',
     authorAr: 'اسم المؤلف بالعربية',
     authorEn: 'Author Name in English',
     category: 'sultanates', // Choose: linguistics | sultanates | ports-trade | archaeology | islamic
     categoryLabelAr: 'تاريخ السلطنات',
     categoryLabelEn: 'Sultanate History',
     year: 2026,
     hijriYear: 1448,
     coverImage: 'assets/covers/your-cover.jpg',
     abstractAr: 'ملخص الكتاب بالعربية...',
     abstractEn: 'Book abstract in English...',
     citationAPA: 'Author, A. (2026). Title. Mukalla: Hadramout Center.',
     citationChicago: 'Author, A. Title. Mukalla: Hadramout Center, 2026.',
     citationMLA: 'Author, A. Title. Hadramout Center, 2026.',
     featured: true
   }
   ```
4. Save the file. The website instantly reflects the new book with search, filtering, and citations automatically enabled.
