# Content Management & Editor Guide (دليل المحررين وإدارة المحتوى)

**Platform:** Hadhramout Center Digital Platform  
**Target:** Publication Editors & Administrative Staff at Hadhramout Center  

---

## 1. Structure of `data.js`
All site records are organized cleanly in `data.js`. No coding or programming knowledge is required to update or add items.

### 1.1 Adding a New Issue of Majallat Hadramout Al-Thaqafiyyah
1. Open `data.js`.
2. Locate `magazines: [ ... ]`.
3. Add a new object at the top:
   ```javascript
   {
     id: "mag-41",
     issueNumber: 41,
     titleAr: "مجلة حضرموت الثقافية — العدد 41",
     titleEn: "Hadramout Cultural Magazine — Issue 41",
     dateAr: "صيف 2026",
     dateEn: "Summer 2026",
     featured: true,
     coverImage: "https://your-domain.com/path-to-cover.jpg",
     summaryAr: "ملخص موضوعات ودراسات العدد...",
     summaryEn: "Summary of issue studies in English...",
     articlesCount: 16,
     pages: 190,
     pdfUrl: "https://your-domain.com/issue-41.pdf"
   },
   ```

### 1.2 Adding a New Ameed Al-Wafa Forum Lecture
1. Open `data.js`.
2. Locate `forumEvents: [ ... ]`.
3. Add:
   ```javascript
   {
     id: "forum-new",
     titleAr: "عنوان المحاضرة الجديدة",
     titleEn: "New Lecture Title in English",
     speakerAr: "اسم المحاضر والباحث",
     speakerEn: "Speaker Name in English",
     dateAr: "تشرين الأول 2026",
     dateEn: "October 2026",
     locationAr: "قاعة منتدى عميد الوفاء، مقر المركز، المكلا",
     locationEn: "Ameed Al-Wafa Hall, Center HQ, Mukalla",
     summaryAr: "ملخص ما تناولته المحاضرة...",
     summaryEn: "Lecture synopsis in English...",
     status: "upcoming" // or "completed"
   },
   ```
