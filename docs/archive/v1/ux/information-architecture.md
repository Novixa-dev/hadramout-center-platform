# Information Architecture & Sitemap Specification

**Platform:** Hadhramout Center Digital Platform  
**Target:** Hadhramout Center for Historical Studies, Documentation and Publishing  
**Architect:** Novixa Product Engineering  

---

## 1. Information Architecture Overview

The Information Architecture is structured into four primary navigation clusters:
1. **Institutional Gateway (من نحن والمركز):** Identity, mission, governance, leadership, and physical location.
2. **Academic & Research Repository (المستودع العلمي والبحثي):** Books, peer-reviewed articles, and *Majallat Hadramout Al-Thaqafiyyah*.
3. **Events, Symposia & Multimedia (الفعاليات والمحاضرات):** 'Ameed Al-Wafa Forum, scientific conferences, and video lectures.
4. **Historical Heritage & Discovery (استكشاف تاريخ حضرموت):** Interactive historical timeline and unified academic search.

---

## 2. Sitemap Diagram (ASCII / Tree Structure)

```
/ (Homepage - بوابة المركز الرئيسية)
│
├── /about (عن المركز ورسالته وهيئته الإدارية)
│   ├── /about#mission (الرسالة والرؤية والأهداف)
│   ├── /about#leadership (مجلس الإدارة ورئاسة المركز)
│   └── /about#departments (أقسام الدراسات والتوثيق والترجمة والنشر)
│
├── /magazines (مجلة حضرموت الثقافية - أرشيف الأعداد)
│   ├── /magazines#current (العدد الأخير - العدد 40)
│   └── /magazines/[id] (تفاصيل العدد وفهرس المقالات)
│
├── /books (إصدارات الكتب والدراسات التاريخية)
│   ├── /books?category=linguistics (التراث اللغوي)
│   ├── /books?category=sultanates (تاريخ السلطنات والسياسة)
│   ├── /books?category=ports-trade (الموانئ والتجارة)
│   ├── /books?category=archaeology (الآثار والنقوش)
│   └── /books/[id] (تفاصيل الكتاب، الاقتباس الأكاديمي، الفهرس)
│
├── /conferences (المؤتمرات العلمية المحكّمة)
│   └── /conferences/[id] (أوراق العمل والبيان الختامي)
│
├── /forum (منتدى عميد الوفاء الثقافي)
│   └── المحاضرات الدورية والنقاشات الفكرية
│
├── /articles (المقالات والأبحاث التاريخية)
│   └── مقالات الرأي والدراسات التوثيقية
│
├── /videos (المكتبة المرئية - برنامج كاتب وكتاب)
│
├── /timeline (المخطط الزمني التفاعلي لتاريخ حضرموت)
│   ├── العصور القديمة ومملكة حضرموت (سمهرم والعقلة وشبوة)
│   ├── العصر الإسلامي ودور الحضارمة في نشر الدعوة
│   ├── عصر السلطنات (القعيطية والكثيرية) والموانئ الحديثة
│   └── العصر الحديث والنهضة الثقافية
│
├── /search (محرك البحث الأكاديمي الموحد)
│
└── /contact (التواصل وطلب الاستشارات والكتب)
```
