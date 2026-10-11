// app.js — Reactive Application Controller & State Manager (V3.0 Enterprise)
// Platform: Hadhramout Center for Historical Studies, Documentation and Publishing (المكلا - حضرموت)
// Architecture: Novixa | نوڤيكسا

(function () {
  'use strict';

  // Application Reactive State
  const state = {
    currentLang: localStorage.getItem('hc_lang') || 'ar',
    currentView: 'home',
    activeCategory: 'all',
    articlesCategory: 'all',
    searchQuery: '',
    selectedPublication: null,
    theme: localStorage.getItem('hc_theme') || 'light',
    fontSize: localStorage.getItem('hc_font_size') || 'md',
    savedBooks: JSON.parse(localStorage.getItem('hc_saved_books') || '[]'),
    mediaFilter: 'all',
    booksViewMode: localStorage.getItem('hc_books_view') || 'grid',
    articlesViewMode: localStorage.getItem('hc_articles_view') || 'grid',
    booksSort: 'newest',
    articlesSort: 'newest',
    mapFilter: 'all',
    folioZoom: 1,
    folioInverted: false,
    soundEnabled: localStorage.getItem('hc_sound') === 'true'
  };

  // DOM Elements Cache
  const elements = {
    html: document.documentElement,
    siteHeader: document.getElementById('site-header'),
    navMenu: document.getElementById('nav-menu'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mobileDrawer: document.getElementById('mobile-drawer'),
    langToggleBtn: document.getElementById('lang-toggle-btn'),
    langLabel: document.getElementById('lang-label'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    fontScalerBtn: document.getElementById('font-scaler-btn'),
    btnOpenSavedList: document.getElementById('btn-open-saved-list'),
    savedCounterBadge: document.getElementById('saved-counter-badge'),
    btnOpenCommandPalette: document.getElementById('btn-open-command-palette'),
    btnOpenOgPreview: document.getElementById('btn-open-og-preview'),
    globalSearchInput: document.getElementById('global-search-input'),
    searchSuggestionsDropdown: document.getElementById('search-suggestions-dropdown'),
    categoryFilterBar: document.getElementById('category-filter-bar'),
    articlesFilterBar: document.getElementById('articles-filter-bar'),
    readingProgressBar: document.getElementById('reading-progress-bar'),

    // Grids & Containers
    homeNewsGrid: document.getElementById('home-news-grid'),
    fullNewsGrid: document.getElementById('full-news-grid'),
    homeArticlesGrid: document.getElementById('home-articles-grid'),
    fullArticlesGrid: document.getElementById('full-articles-grid'),
    homePublicationsGrid: document.getElementById('home-publications-grid'),
    fullPublicationsGrid: document.getElementById('full-publications-grid'),
    magazinesListContainer: document.getElementById('magazines-list-container'),
    homeForumGrid: document.getElementById('home-forum-grid'),
    fullForumGrid: document.getElementById('full-forum-grid'),
    homeTimelineTrack: document.getElementById('home-timeline-track'),
    fullTimelineTrack: document.getElementById('full-timeline-track'),
    homeMediaGrid: document.getElementById('home-media-grid'),
    fullMediaGrid: document.getElementById('full-media-grid'),
    aboutLeadershipGrid: document.getElementById('about-leadership-grid'),
    aboutDepartmentsGrid: document.getElementById('about-departments-grid'),
    fullManuscriptsGrid: document.getElementById('full-manuscripts-grid'),
    fullMapGrid: document.getElementById('full-map-grid'),
    mapFilterBar: document.getElementById('map-filter-bar'),

    // Toolbars & Controls
    articlesCountBadge: document.getElementById('articles-count-badge'),
    articlesSortSelect: document.getElementById('articles-sort-select'),
    btnArticlesGrid: document.getElementById('btn-articles-grid'),
    btnArticlesList: document.getElementById('btn-articles-list'),
    homeBooksSortSelect: document.getElementById('home-books-sort-select'),
    btnHomeBooksGrid: document.getElementById('btn-home-books-grid'),
    btnHomeBooksList: document.getElementById('btn-home-books-list'),
    fullBooksSortSelect: document.getElementById('full-books-sort-select'),
    btnFullBooksGrid: document.getElementById('btn-full-books-grid'),
    btnFullBooksList: document.getElementById('btn-full-books-list'),
    homeBooksCountBadge: document.getElementById('home-books-count-badge'),
    fullBooksCountBadge: document.getElementById('full-books-count-badge'),

    // Modals
    citationModal: document.getElementById('citation-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalBodyContent: document.getElementById('modal-body-content'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    savedListModal: document.getElementById('saved-list-modal'),
    savedModalBody: document.getElementById('saved-modal-body'),
    savedModalCloseBtn: document.getElementById('saved-modal-close-btn'),
    articleReaderModal: document.getElementById('article-reader-modal'),
    readerArticleTitle: document.getElementById('reader-article-title'),
    readerModalBody: document.getElementById('reader-modal-body'),
    readerModalCloseBtn: document.getElementById('reader-modal-close-btn'),
    videoPlayerModal: document.getElementById('video-player-modal'),
    videoModalTitle: document.getElementById('video-modal-title'),
    videoIframeSlot: document.getElementById('video-iframe-slot'),
    videoModalInfo: document.getElementById('video-modal-info'),
    videoModalCloseBtn: document.getElementById('video-modal-close-btn'),
    commandPaletteModal: document.getElementById('command-palette-modal'),
    commandPaletteInput: document.getElementById('command-palette-input'),
    commandResultsList: document.getElementById('command-results-list'),
    commandPaletteCloseBtn: document.getElementById('command-palette-close-btn'),
    ogPreviewModal: document.getElementById('og-preview-modal'),
    ogModalCloseBtn: document.getElementById('og-modal-close-btn'),
    ogViewImg: document.getElementById('og-view-img'),
    ogViewTitle: document.getElementById('og-view-title'),
    ogViewDesc: document.getElementById('og-view-desc'),
    pdfPreviewModal: document.getElementById('pdf-preview-modal'),
    pdfModalTitle: document.getElementById('pdf-modal-title'),
    pdfModalBody: document.getElementById('pdf-modal-body'),
    pdfModalCloseBtn: document.getElementById('pdf-modal-close-btn'),
    folioViewerModal: document.getElementById('folio-viewer-modal'),
    folioStageImg: document.getElementById('folio-stage-img'),
    btnFolioZoomIn: document.getElementById('btn-folio-zoom-in'),
    btnFolioZoomOut: document.getElementById('btn-folio-zoom-out'),
    btnFolioZoomReset: document.getElementById('btn-folio-zoom-reset'),
    btnFolioInvert: document.getElementById('btn-folio-invert'),
    folioMetaBadge: document.getElementById('folio-meta-badge'),
    folioInfoPanel: document.getElementById('folio-info-panel'),
    folioModalCloseBtn: document.getElementById('folio-modal-close-btn'),

    // Notifications & Contact
    toastNotification: document.getElementById('toast-notification'),
    toastText: document.getElementById('toast-text'),
    contactForm: document.getElementById('contact-inquiry-form'),
    newsletterForm: document.getElementById('newsletter-subscription-form'),

    // Page Views
    views: {
      home: document.getElementById('view-home'),
      about: document.getElementById('view-about'),
      news: document.getElementById('view-news'),
      articles: document.getElementById('view-articles'),
      magazines: document.getElementById('view-magazines'),
      books: document.getElementById('view-books'),
      conferences: document.getElementById('view-conferences'),
      forum: document.getElementById('view-forum'),
      manuscripts: document.getElementById('view-manuscripts'),
      map: document.getElementById('view-map'),
      timeline: document.getElementById('view-timeline'),
      media: document.getElementById('view-media'),
      contact: document.getElementById('view-contact')
    }
  };

  // Subtle Audio Feedback (Web Audio API)
  function playHapticTone() {
    if (!state.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      // AudioContext muted/unsupported
    }
  }

  // Floating Toast Notification
  function showToast(message) {
    if (!elements.toastNotification || !elements.toastText) return;
    playHapticTone();
    elements.toastText.textContent = message;
    elements.toastNotification.classList.add('show');
    setTimeout(() => {
      elements.toastNotification.classList.remove('show');
    }, 3200);
  }

  // Navigation & View Routing
  function navigateTo(viewName, scrollIntoView = true) {
    if (!elements.views[viewName]) {
      viewName = 'home';
    }
    state.currentView = viewName;
    playHapticTone();

    // Toggle active view
    Object.keys(elements.views).forEach(key => {
      if (elements.views[key]) {
        elements.views[key].style.display = (key === viewName) ? 'block' : 'none';
      }
    });

    // Update active nav links
    document.querySelectorAll('[data-nav]').forEach(el => {
      if (el.getAttribute('data-nav') === viewName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Close mobile drawer if open
    if (elements.mobileDrawer) {
      elements.mobileDrawer.classList.remove('open');
      if (elements.mobileMenuBtn) {
        elements.mobileMenuBtn.setAttribute('aria-expanded', 'false');
      }
    }

    // Scroll to top of content smoothly if requested
    if (scrollIntoView) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update Document Title and Social Meta Tags
    updateDocumentMetadata();
  }

  // Dynamic OpenGraph & Meta Tag Generator
  function updateDocumentMetadata(customTitle, customDesc, customImage, customUrl) {
    const isAr = state.currentLang === 'ar';
    const titles = {
      home: isAr ? 'مركز حضرموت للدراسات التاريخية والتوثيق والنشر | المنصة الرقمية المعرفية' : 'Hadhramout Center for Historical Studies & Documentation | Digital Platform',
      about: isAr ? 'عن المركز ورسالته وأقسامه العلمية | مركز حضرموت' : 'About the Center, Leadership & Departments | Hadhramout Center',
      news: isAr ? 'الأخبار والأنشطة والفعاليات الميدانية | مركز حضرموت' : 'News & Institutional Events | Hadhramout Center',
      articles: isAr ? 'المقالات والأبحاث التاريخية المحكمة | مركز حضرموت' : 'Peer-Reviewed Articles & Studies | Hadhramout Center',
      magazines: isAr ? 'مجلة حضرموت الثقافية (العدد 41 والأرشيف) | مركز حضرموت' : 'Hadramout Cultural Magazine Archive | Hadhramout Center',
      books: isAr ? 'سلسلة إصدارات الكتب والأبحاث المحكمة | مركز حضرموت' : 'Book Publications & Scholarly Monographs | Hadhramout Center',
      conferences: isAr ? 'المؤتمرات والندوات العلمية | مركز حضرموت' : 'Scientific Conferences & Symposia | Hadhramout Center',
      forum: isAr ? 'منتدى عميد الوفاء الثقافي بالمكلا | مركز حضرموت' : 'Ameed Al-Wafa Cultural Forum | Hadhramout Center',
      manuscripts: isAr ? 'خزانة المخطوطات والوثائق النادرة والأرشيف الأصلي | مركز حضرموت' : 'Rare Manuscripts & Archival Folios | Hadhramout Center',
      map: isAr ? 'الخريطة التفاعلية لمعالم وموانئ وحواضر حضرموت التاريخية | مركز حضرموت' : 'Interactive Map of Hadhrami Heritage Landmarks | Hadhramout Center',
      timeline: isAr ? 'الخط الزمني لتاريخ وحضارة حضرموت | مركز حضرموت' : 'Historical Timeline of Hadhramout',
      media: isAr ? 'الوسائط وبودكاست سقاية التاريخي | مركز حضرموت' : 'Media & Siqayah Podcast | Hadhramout Center',
      contact: isAr ? 'تواصل مع المركز وطلب المراجع والأبحاث | مركز حضرموت' : 'Contact & Research Inquiries | Hadhramout Center'
    };
    const descriptions = {
      home: isAr ? 'المنصة العلمية المرجعية لمركز حضرموت للدراسات التاريخية والتوثيق والنشر بالمكلا — حفظ الذاكرة وتوثيق تاريخ وتراث وحضارة حضرموت.' : 'Digital reference platform for the Hadhramout Center for Historical Studies, Documentation and Publishing in Mukalla, Yemen.',
      about: isAr ? 'تعرف على مركز حضرموت للدراسات التاريخية، مجلس الإدارة، هيئته العلمية، وأقسامه الأكاديمية بالمكلا.' : 'Learn about Hadhramout Center, its scientific board, leadership, and research departments.',
      news: isAr ? 'تغطية مستمرة لأنشطة المركز، زيارات الوفود الدولية كاليونسكو، والورش الاستراتيجية لتحقيق الاستدامة.' : 'Continuous coverage of Center fieldwork, UNESCO visits, and institutional sustainability symposia.',
      articles: isAr ? 'مقالات وأبحاث محكمة في تاريخ موانئ حضرموت، التراث الشعبي لباحريز، هجرة الحضارمة، ونقد الأدب.' : 'Scholarly articles on ancient ports, folk vernacular poetry, Hadhrami diaspora, and literary criticism.',
      magazines: isAr ? 'أرشيف مجلة حضرموت الثقافية الفصلي، أبحاث محكمة، وثائق تاريخية غير منشورة، واستعراض العدد 41.' : 'Archive of Majallat Hadramout Al-Thaqafiyyah with research papers and Issue 41.',
      books: isAr ? 'فهرس إصدارات الكتب التاريخية للمركز مع أدوات الاستشهاد العلمي الفوري (APA / Chicago / MLA).' : 'Peer-reviewed historical monographs with instant citation generators (APA, Chicago, MLA).',
      conferences: isAr ? 'المؤتمرات العلمية الدولية والندوات الأكاديمية المخصصة لتاريخ وحضارة حضرموت.' : 'Biennial international academic conferences and symposia on Hadhramout history.',
      forum: isAr ? 'منتدى عميد الوفاء الثقافي بالمكلا — فعاليات المحضار، أدب باكثير، وقضايا التاريخ والفكر.' : 'Muntada Ameed Al-Wafa cultural forum in Mukalla, lectures on Bakathir and Al-Mihdhar.',
      manuscripts: isAr ? 'تصفح وفحص أوراق المخطوطات والوثائق النادرة وسجلات الملاحة القديمة لعلماء وأعلام حضرموت.' : 'Explore and inspect high-resolution folios of rare autograph manuscripts and maritime logs of Hadhramout.',
      map: isAr ? 'استكشف أهم موانئ اللبان القديمة (سمهرم، قنا، الشحر)، ناطحات سحاب شبام، وقصور وادي دوعن.' : 'Explore ancient frankincense harbors, mud skyscrapers of Shibam, and sultanate palaces across Hadhramout.',
      timeline: isAr ? 'استكشف الخط الزمني لتاريخ حضرموت من حضارات اللبان إلى العصر الحديث.' : 'Chronological historical journey through Hadhramout eras from antiquity to modern times.',
      media: isAr ? 'المحاضرات المصورة، الأشرطة الوثائقية، برنامج كاتب وكتاب، وحلقات بودكاست سقاية التاريخي.' : 'Documentaries, lectures, and historical episodes of Siqayah Podcast.',
      contact: isAr ? 'تواصل مع إدارة المركز بالمكلا لطلب المطبوعات، الاستشارات الأكاديمية، والتعاون البحثي.' : 'Contact Center management in Mukalla for publications, consultations, and research cooperation.'
    };

    const newTitle = customTitle || titles[state.currentView] || titles.home;
    const newDesc = customDesc || descriptions[state.currentView] || descriptions.home;
    const newImage = customImage || 'https://hadramout.center/opengraph-image.jpg?opengraph-image.d1f55754.jpg';
    const newUrl = customUrl || (window.location.origin + window.location.pathname + '#' + state.currentView);

    document.title = newTitle;

    // Update <meta> tags in DOM
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', newDesc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', newTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', newDesc);
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute('content', newImage);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', newUrl);

    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', newTitle);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', newDesc);
    const twImage = document.querySelector('meta[name="twitter:image"]');
    if (twImage) twImage.setAttribute('content', newImage);
  }

  // Routing via Hash
  function handleHashChange() {
    const rawHash = window.location.hash.replace('#', '').trim();
    if (rawHash.startsWith('book-')) {
      const bookId = rawHash.replace('book-', '');
      navigateTo('books', false);
      setTimeout(() => openCitationModal(bookId), 150);
      return;
    }
    if (rawHash.startsWith('article-')) {
      const artId = rawHash.replace('article-', '');
      navigateTo('articles', false);
      setTimeout(() => openArticleReader(artId), 150);
      return;
    }
    if (rawHash && elements.views[rawHash]) {
      navigateTo(rawHash, false);
    } else {
      navigateTo('home', false);
    }
  }

  // Language & Internationalization System
  function applyLanguage(lang) {
    state.currentLang = lang;
    localStorage.setItem('hc_lang', lang);
    const isAr = lang === 'ar';
    const t = HC_DATA.translations[lang];

    elements.html.setAttribute('lang', lang);
    elements.html.setAttribute('dir', isAr ? 'rtl' : 'ltr');

    if (elements.langLabel) {
      elements.langLabel.textContent = isAr ? 'English' : 'العربية';
    }

    const txtBrandTitle = document.getElementById('txt-brand-title');
    const txtBrandSubtitle = document.getElementById('txt-brand-subtitle');
    if (txtBrandTitle) txtBrandTitle.textContent = isAr ? HC_DATA.institution.shortNameAr : HC_DATA.institution.shortNameEn;
    if (txtBrandSubtitle) txtBrandSubtitle.textContent = isAr ? "للدراسات التاريخية والتوثيق والنشر" : "Historical Studies & Documentation";

    // Nav Links
    const navHome = document.getElementById('nav-home');
    const navAbout = document.getElementById('nav-about');
    const navNews = document.getElementById('nav-news');
    const navArticles = document.getElementById('nav-articles');
    const navMag = document.getElementById('nav-magazines');
    const navBooks = document.getElementById('nav-books');
    const navConf = document.getElementById('nav-conferences');
    const navForum = document.getElementById('nav-forum');
    const navManuscripts = document.getElementById('nav-manuscripts');
    const navMap = document.getElementById('nav-map');
    const navTimeline = document.getElementById('nav-timeline');
    const navMedia = document.getElementById('nav-media');
    const navContact = document.getElementById('nav-contact');

    if (navHome) navHome.textContent = t.navHome;
    if (navAbout) navAbout.textContent = t.navAbout;
    if (navNews) navNews.textContent = t.navNews;
    if (navArticles) navArticles.textContent = t.navArticles;
    if (navMag) navMag.textContent = t.navMagazines;
    if (navBooks) navBooks.textContent = t.navBooks;
    if (navConf) navConf.textContent = t.navConferences;
    if (navForum) navForum.textContent = t.navForum;
    if (navManuscripts) navManuscripts.textContent = t.navManuscripts || (isAr ? 'المخطوطات' : 'Manuscripts');
    if (navMap) navMap.textContent = t.navMap || (isAr ? 'خريطة التراث' : 'Heritage Map');
    if (navTimeline) navTimeline.textContent = t.navTimeline;
    if (navMedia) navMedia.textContent = t.navMedia;
    if (navContact) navContact.textContent = t.navContact;

    // Hero Section
    const heroBadge = document.getElementById('hero-badge');
    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    const btnHeroBooks = document.getElementById('btn-hero-books');
    const btnHeroMag = document.getElementById('btn-hero-magazine');
    const btnHeroAbout = document.getElementById('btn-hero-about');

    if (heroBadge) heroBadge.textContent = t.heroBadge;
    if (heroTitle) heroTitle.textContent = t.heroTitle;
    if (heroSubtitle) heroSubtitle.textContent = t.heroSubtitle;
    if (btnHeroBooks) btnHeroBooks.textContent = t.exploreBooks;
    if (btnHeroMag) btnHeroMag.textContent = t.readMagazine;
    if (btnHeroAbout) btnHeroAbout.textContent = isAr ? "عن المركز ورسالته" : "About the Center";

    if (elements.globalSearchInput) {
      elements.globalSearchInput.setAttribute('placeholder', t.searchPlaceholder);
    }

    // Refresh Renders
    renderNews();
    renderArticles();
    renderPublications(elements.homePublicationsGrid, true);
    renderPublications(elements.fullPublicationsGrid, false);
    renderMagazines();
    renderForumEvents(elements.homeForumGrid, true);
    renderForumEvents(elements.fullForumGrid, false);
    renderManuscripts();
    renderHistoricalSites();
    renderTimeline(elements.homeTimelineTrack, true);
    renderTimeline(elements.fullTimelineTrack, false);
    renderMedia(elements.homeMediaGrid, true);
    renderMedia(elements.fullMediaGrid, false);
    renderLeadership();
    renderDepartments();
    updateSavedCounter();
    updateDocumentMetadata();
  }

  // Theme Management (Light / Academic Dark)
  function applyTheme(theme) {
    state.theme = theme;
    localStorage.setItem('hc_theme', theme);
    elements.html.setAttribute('data-theme', theme);

    if (elements.themeToggleBtn) {
      const isDark = theme === 'dark';
      elements.themeToggleBtn.setAttribute('title', isDark ? 'تبديل إلى الوضع النهاري' : 'تبديل إلى الوضع الليلي');
      elements.themeToggleBtn.innerHTML = isDark
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
          </svg>`;
    }
  }

  // Font Size Scaler
  function applyFontSize(size) {
    state.fontSize = size;
    localStorage.setItem('hc_font_size', size);
    elements.html.setAttribute('data-font-size', size);
    const fontScalerText = document.getElementById('font-scaler-text');
    if (fontScalerText) {
      fontScalerText.textContent = size === 'sm' ? 'A-' : (size === 'lg' ? 'A++' : 'A+');
    }
  }

  function cycleFontSize() {
    const nextSize = state.fontSize === 'sm' ? 'md' : (state.fontSize === 'md' ? 'lg' : 'sm');
    applyFontSize(nextSize);
    playHapticTone();
    showToast(state.currentLang === 'ar' ? `تم تغيير حجم الخط: ${nextSize.toUpperCase()}` : `Font scaled: ${nextSize.toUpperCase()}`);
  }

  // Bookmarking / Saved Research Library
  function isBookSaved(id) {
    return state.savedBooks.includes(id);
  }

  function toggleSaveBook(id) {
    const isAr = state.currentLang === 'ar';
    const t = HC_DATA.translations[state.currentLang];
    if (isBookSaved(id)) {
      state.savedBooks = state.savedBooks.filter(bookId => bookId !== id);
      showToast(t.removedBookmarkToast);
    } else {
      state.savedBooks.push(id);
      showToast(t.bookmarkedToast);
    }
    localStorage.setItem('hc_saved_books', JSON.stringify(state.savedBooks));
    updateSavedCounter();
    renderPublications(elements.homePublicationsGrid, true);
    renderPublications(elements.fullPublicationsGrid, false);
    renderArticles();
  }

  function updateSavedCounter() {
    if (elements.savedCounterBadge) {
      elements.savedCounterBadge.textContent = state.savedBooks.length;
      elements.savedCounterBadge.style.display = state.savedBooks.length > 0 ? 'inline-flex' : 'none';
    }
  }

  // 1. Render News Cards (الأخبار)
  function renderNews() {
    const isAr = state.currentLang === 'ar';
    const newsList = HC_DATA.news || [];

    const buildNewsCard = (item) => `
      <article class="news-card">
        <div class="news-thumb-wrap">
          <img src="${item.imageUrl}" alt="${isAr ? item.titleAr : item.titleEn}" class="news-thumb-img" loading="lazy">
          <span class="news-badge">${isAr ? item.categoryAr : item.categoryEn}</span>
        </div>
        <div class="news-content">
          <div class="news-meta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>${isAr ? item.dateAr : item.dateEn}</span>
          </div>
          <h3 class="news-title">${isAr ? item.titleAr : item.titleEn}</h3>
          <p class="news-excerpt">${isAr ? item.summaryAr : item.summaryEn}</p>
          <div class="news-footer">
            <button class="btn-primary btn-open-news-modal" data-news-id="${item.id}" style="padding: 0.4rem 0.85rem; font-size: 0.82rem;">
              ${isAr ? 'قراءة التغطية كاملة' : 'Read Full Coverage'}
            </button>
            <button class="btn-icon btn-share-item" data-type="news" data-id="${item.id}" title="${isAr ? 'مشاركة' : 'Share'}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>
          </div>
        </div>
      </article>
    `;

    if (elements.homeNewsGrid) {
      elements.homeNewsGrid.innerHTML = newsList.slice(0, 3).map(buildNewsCard).join('');
    }
    if (elements.fullNewsGrid) {
      elements.fullNewsGrid.innerHTML = newsList.map(buildNewsCard).join('');
    }
  }

  // 2. Render Articles Cards (المقالات والدراسات المحكمة)
  function renderArticles() {
    const isAr = state.currentLang === 'ar';
    let list = [...(HC_DATA.articles || [])];

    // Filter by article category if on full articles view
    if (state.articlesCategory !== 'all') {
      list = list.filter(a => a.category === state.articlesCategory);
    }

    // Sort
    if (state.articlesSort === 'views') {
      list.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (state.articlesSort === 'title') {
      list.sort((a, b) => (isAr ? a.titleAr : a.titleEn).localeCompare(isAr ? b.titleAr : b.titleEn));
    }

    if (elements.articlesCountBadge) {
      elements.articlesCountBadge.textContent = isAr ? `المقالات المعروضة: ${list.length}` : `Articles: ${list.length}`;
    }

    const buildArticleCard = (item) => `
      <article class="article-card" id="card-${item.id}">
        <div class="article-header">
          <span class="article-category">${isAr ? item.categoryAr : item.categoryEn}</span>
          <span class="article-read-time">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${item.readTime}
          </span>
        </div>
        <h3 class="article-title">${isAr ? item.titleAr : item.titleEn}</h3>
        <div class="article-author-info">
          <div>
            <div class="article-author-name">${isAr ? item.authorAr : item.authorEn}</div>
            <div class="article-author-role">${isAr ? item.authorAffiliationAr : item.authorAffiliationEn}</div>
          </div>
        </div>
        <p class="article-abstract">${isAr ? item.summaryAr : item.summaryEn}</p>
        <div class="article-tags">
          ${(item.tags || []).map(t => `<span class="article-tag">#${t}</span>`).join('')}
        </div>
        <div class="article-actions">
          <button class="btn-primary btn-read-article" data-article-id="${item.id}" style="padding: 0.45rem 0.95rem; font-size: 0.85rem;">
            ${isAr ? 'قراءة المقال والبحث المحكم' : 'Read Full Study'}
          </button>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn-icon btn-save-pub" data-pub-id="${item.id}" title="${isBookSaved(item.id) ? (isAr ? 'محفوظ' : 'Saved') : (isAr ? 'حفظ' : 'Save')}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${isBookSaved(item.id) ? 'var(--color-amber-500)' : 'none'}" stroke="currentColor" stroke-width="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
            </button>
            <button class="btn-icon btn-share-item" data-type="article" data-id="${item.id}" title="${isAr ? 'مشاركة' : 'Share'}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>
          </div>
        </div>
      </article>
    `;

    if (elements.homeArticlesGrid) {
      elements.homeArticlesGrid.innerHTML = list.slice(0, 3).map(buildArticleCard).join('');
    }
    if (elements.fullArticlesGrid) {
      elements.fullArticlesGrid.className = `articles-grid ${state.articlesViewMode === 'list' ? 'list-view' : ''}`;
      elements.fullArticlesGrid.innerHTML = list.map(buildArticleCard).join('');
    }
  }

  // 3. Render Publications (الكتب والدراسات)
  function renderPublications(container, isHome = false) {
    if (!container) return;
    const isAr = state.currentLang === 'ar';
    const t = HC_DATA.translations[state.currentLang];

    let list = [...(HC_DATA.publications || [])];

    // Filter by global category
    if (state.activeCategory !== 'all') {
      list = list.filter(b => b.category === state.activeCategory);
    }

    // Filter by search query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(b => 
        (b.titleAr && b.titleAr.toLowerCase().includes(q)) ||
        (b.titleEn && b.titleEn.toLowerCase().includes(q)) ||
        (b.authorAr && b.authorAr.toLowerCase().includes(q)) ||
        (b.authorEn && b.authorEn.toLowerCase().includes(q)) ||
        (b.abstractAr && b.abstractAr.toLowerCase().includes(q)) ||
        (b.isbn && b.isbn.toLowerCase().includes(q))
      );
    }

    // Sort
    const sortVal = isHome ? state.booksSort : (elements.fullBooksSortSelect?.value || 'newest');
    if (sortVal === 'oldest') {
      list.sort((a, b) => a.year - b.year);
    } else if (sortVal === 'pages') {
      list.sort((a, b) => b.pages - a.pages);
    } else if (sortVal === 'title') {
      list.sort((a, b) => (isAr ? a.titleAr : a.titleEn).localeCompare(isAr ? b.titleAr : b.titleEn));
    } else {
      list.sort((a, b) => b.year - a.year);
    }

    // Count badges
    if (isHome && elements.homeBooksCountBadge) {
      elements.homeBooksCountBadge.textContent = isAr ? `الإصدارات المعروضة: ${list.length}` : `Books: ${list.length}`;
    }
    if (!isHome && elements.fullBooksCountBadge) {
      elements.fullBooksCountBadge.textContent = isAr ? `الإصدارات المعروضة: ${list.length}` : `Books: ${list.length}`;
    }

    // Set view mode
    const viewMode = state.booksViewMode;
    container.className = `publications-grid ${viewMode === 'list' ? 'list-view' : ''}`;

    if (list.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--color-text-muted);">
          <p style="font-size: 1.15rem; font-weight: 600;">${isAr ? 'لم يتم العثور على إصدارات تطابق هذا البحث أو الفلتر.' : 'No publications match your search criteria.'}</p>
          <button class="btn-secondary" id="btn-reset-filter" style="margin-top: 1rem;">${isAr ? 'عرض كافة الكتب' : 'Show All Books'}</button>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(book => `
      <article class="book-card" id="card-${book.id}">
        <div class="book-cover-frame">
          <img src="${book.coverImage}" alt="${isAr ? book.titleAr : book.titleEn}" class="book-cover-img" loading="lazy">
          <span class="book-badge">${isAr ? book.categoryAr : book.categoryEn}</span>
        </div>
        <div class="book-body">
          <div class="book-meta">
            <span>${book.year}م (${book.hijriYear}هـ)</span>
            <span>·</span>
            <span>${book.pages} ${isAr ? 'صفحة' : 'pages'}</span>
          </div>
          <h3 class="book-title">${isAr ? book.titleAr : book.titleEn}</h3>
          <p class="book-author">${isAr ? book.authorAr : book.authorEn}</p>
          <p class="book-abstract">${isAr ? book.abstractAr : book.abstractEn}</p>
          <div class="book-actions">
            <button class="btn-primary btn-cite-pub" data-pub-id="${book.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 17h3l2-4V7H5v6h3"></path><path d="M15 17h3l2-4V7h-6v6h3"></path></svg>
              ${t.viewDetails}
            </button>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn-icon btn-save-pub" data-pub-id="${book.id}" title="${isBookSaved(book.id) ? (isAr ? 'محفوظ في مكتبتي' : 'Saved in Library') : (isAr ? 'حفظ في مكتبتي' : 'Save Reference')}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="${isBookSaved(book.id) ? 'var(--color-amber-500)' : 'none'}" stroke="currentColor" stroke-width="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
              </button>
              <button class="btn-icon btn-share-item" data-type="book" data-id="${book.id}" title="${isAr ? 'مشاركة' : 'Share'}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </button>
            </div>
          </div>
        </div>
      </article>
    `).join('');
  }

  // 4. Render Magazines Archive
  function renderMagazines() {
    if (!elements.magazinesListContainer) return;
    const isAr = state.currentLang === 'ar';
    const magazines = HC_DATA.magazines || [];

    elements.magazinesListContainer.innerHTML = magazines.map(mag => `
      <div class="magazine-featured-card" style="background: var(--color-surface-card); border-color: var(--color-border); color: var(--color-text-main);">
        <div class="magazine-cover-frame">
          <img src="${mag.coverImage}" alt="${isAr ? mag.titleAr : mag.titleEn}" class="magazine-cover-img" loading="lazy">
        </div>
        <div class="magazine-details">
          <span class="magazine-badge" style="background: var(--color-primary-800); color: #ffffff;">${isAr ? mag.dateAr : mag.dateEn} · العدد ${mag.issueNumber}</span>
          <h3 class="magazine-title" style="color: var(--color-primary-900);">${isAr ? mag.titleAr : mag.titleEn}</h3>
          <p class="magazine-desc" style="color: var(--color-text-muted);">${isAr ? mag.summaryAr : mag.summaryEn}</p>
          <div class="magazine-meta-list" style="color: var(--color-text-muted);">
            <span>${isAr ? 'المقالات:' : 'Articles:'} <strong>${mag.articlesCount} ${isAr ? 'بحثاً ومقالة' : 'papers'}</strong></span>
            <span>${isAr ? 'الصفحات:' : 'Pages:'} <strong>${mag.pages} ${isAr ? 'صفحة' : 'pages'}</strong></span>
            <span>${isAr ? 'الناشر:' : 'Publisher:'} <strong>مركز حضرموت للدراسات</strong></span>
          </div>
          ${mag.tableOfContents ? `
            <div style="margin-top: 1rem; padding: 0.85rem; background: var(--color-surface-subtle); border-radius: var(--radius-sm); border: 1px solid var(--color-border); font-size: 0.88rem;">
              <strong>${isAr ? 'أبرز دراسات العدد:' : 'Key Studies:'}</strong>
              <ul style="padding-inline-start: 1.25rem; margin-top: 0.35rem; display: flex; flex-direction: column; gap: 0.25rem;">
                ${mag.tableOfContents.slice(0, 4).map(c => `<li>${c}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          <div style="display: flex; gap: 0.85rem; flex-wrap: wrap; margin-top: 1rem;">
            <a href="${mag.pdfUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="background-color: var(--color-primary-800); color: #ffffff;">
              ${isAr ? 'قراءة المجلة في البوابة الأصلية' : 'Read Issue on Portal'}
            </a>
            <button class="btn-secondary btn-preview-pdf" data-issue="${mag.issueNumber}">
              ${isAr ? 'معاينة الفهرس والصفحات (PDF)' : 'Preview Index (PDF)'}
            </button>
            <button class="btn-secondary btn-share-item" data-type="magazine" data-id="${mag.id}">
              ${isAr ? 'مشاركة رابط العدد' : 'Share Issue Link'}
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // 5. Render Forum Events
  function renderForumEvents(container, isHome = false) {
    if (!container) return;
    const isAr = state.currentLang === 'ar';
    const events = HC_DATA.forumEvents || [];
    const list = isHome ? events.slice(0, 2) : events;

    container.innerHTML = list.map(ev => `
      <div class="forum-card">
        <div class="forum-badge">${isAr ? ev.dateAr : ev.dateEn}</div>
        <h3 class="forum-title">${isAr ? ev.titleAr : ev.titleEn}</h3>
        <p class="forum-speaker" style="color: var(--color-amber-600); font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem;">
          ${isAr ? ev.speakerAr : ev.speakerEn}
        </p>
        <p class="forum-desc">${isAr ? ev.summaryAr : ev.summaryEn}</p>
        <div class="forum-meta">
          <span>الموقع: ${isAr ? ev.locationAr : ev.locationEn}</span>
        </div>
      </div>
    `).join('');
  }

  // 6. Render Timeline
  function renderTimeline(container, isHome = false) {
    if (!container) return;
    const isAr = state.currentLang === 'ar';
    const milestones = HC_DATA.timelineMilestones || [];
    const list = isHome ? milestones.slice(0, 3) : milestones;

    container.innerHTML = list.map(m => `
      <div class="timeline-item">
        <div class="timeline-badge"></div>
        <div class="timeline-card">
          <span class="timeline-era">${isAr ? m.eraLabelAr : m.eraLabelEn}</span>
          <h3 class="timeline-title">${isAr ? m.titleAr : m.titleEn}</h3>
          <p class="timeline-year">${isAr ? m.yearLabelAr : m.yearLabelEn}</p>
          <p class="timeline-desc">${isAr ? m.descriptionAr : m.descriptionEn}</p>
        </div>
      </div>
    `).join('');
  }

  // 7. Render Audiovisual Media
  function renderMedia(container, isHome = false) {
    if (!container) return;
    const isAr = state.currentLang === 'ar';
    let list = HC_DATA.media || [];
    if (state.mediaFilter !== 'all') {
      list = list.filter(m => m.type === state.mediaFilter);
    }
    if (isHome) list = list.slice(0, 2);

    container.innerHTML = list.map(m => `
      <div class="media-card">
        <div class="media-thumb-frame">
          <img src="${m.coverImage}" alt="${isAr ? m.titleAr : m.titleEn}" class="media-thumb-img" loading="lazy">
          <span class="media-type-badge">${m.type === 'podcast' ? (isAr ? 'بودكاست صوتي' : 'Podcast') : (isAr ? 'فيديو مصور' : 'Video')}</span>
          <button class="media-play-overlay ${m.type === 'video' ? 'btn-play-video' : 'btn-play-audio'}" data-media-id="${m.id}" aria-label="تشغيل">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </button>
        </div>
        <div class="media-body">
          <span class="media-series">${isAr ? m.seriesAr : m.seriesEn} · ${m.duration}</span>
          <h3 class="media-title">${isAr ? m.titleAr : m.titleEn}</h3>
          <p class="media-guest"><strong>${isAr ? 'الضيف / المحاضر:' : 'Guest:'}</strong> ${isAr ? m.guestAr : m.guestEn}</p>
          <p class="media-desc">${isAr ? m.descriptionAr : m.descriptionEn}</p>
          ${m.type === 'podcast' ? `
            <div class="audio-player-bar">
              <button class="audio-play-btn" data-audio-src="${m.audioUrl}" aria-label="استماع">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </button>
              <div class="audio-progress-wrap">
                <input type="range" class="audio-slider" value="0" min="0" max="100">
                <div class="audio-time-label">
                  <span>0:00</span>
                  <span>${m.duration}</span>
                </div>
              </div>
            </div>
          ` : `
            <button class="btn-primary btn-play-video" data-youtube-id="${m.youtubeId}" data-title="${isAr ? m.titleAr : m.titleEn}" style="margin-top: 0.75rem; width: 100%; justify-content: center;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              ${isAr ? 'مشاهدة الندوة الآن (فيديو)' : 'Watch Video Now'}
            </button>
          `}
        </div>
      </div>
    `).join('');
  }

  // 8. Render Leadership & Departments
  function renderLeadership() {
    if (!elements.aboutLeadershipGrid) return;
    const isAr = state.currentLang === 'ar';
    elements.aboutLeadershipGrid.innerHTML = (HC_DATA.institution.leadership || []).map(lead => `
      <div class="leader-card">
        <h3 class="leader-name">${isAr ? lead.nameAr : lead.nameEn}</h3>
        <div class="leader-role">${isAr ? lead.roleAr : lead.roleEn}</div>
        <p class="leader-bio">${isAr ? lead.bioAr : lead.bioEn}</p>
      </div>
    `).join('');
  }

  function renderDepartments() {
    if (!elements.aboutDepartmentsGrid) return;
    const isAr = state.currentLang === 'ar';
    elements.aboutDepartmentsGrid.innerHTML = (HC_DATA.institution.departments || []).map(dept => `
      <div class="leader-card">
        <h3 class="leader-name" style="font-size: 1.15rem;">${isAr ? dept.nameAr : dept.nameEn}</h3>
        <p class="leader-bio" style="margin-top: 0.5rem;">${isAr ? dept.descAr : dept.descEn}</p>
      </div>
    `).join('');
  }

  // Modal 1: Open Academic Citation & Details Modal
  function openCitationModal(pubId) {
    const isAr = state.currentLang === 'ar';
    const t = HC_DATA.translations[state.currentLang];
    const pub = (HC_DATA.publications || []).find(p => p.id === pubId);
    if (!pub || !elements.citationModal || !elements.modalBodyContent) return;

    state.selectedPublication = pub;
    playHapticTone();
    elements.modalTitle.textContent = isAr ? pub.titleAr : pub.titleEn;

    // Update OpenGraph for this publication
    updateDocumentMetadata(
      isAr ? pub.titleAr : pub.titleEn,
      isAr ? pub.abstractAr : pub.abstractEn,
      pub.coverImage,
      `${window.location.origin}${window.location.pathname}#book-${pub.id}`
    );

    elements.modalBodyContent.innerHTML = `
      <div class="modal-pub-detail">
        <div class="modal-pub-cover-col">
          <img src="${pub.coverImage}" alt="${isAr ? pub.titleAr : pub.titleEn}" class="modal-pub-cover-img">
          <div class="modal-pub-meta-box">
            <p><strong>${isAr ? 'المؤلف:' : 'Author:'}</strong> ${isAr ? pub.authorAr : pub.authorEn}</p>
            <p><strong>${isAr ? 'سنة النشر:' : 'Year:'}</strong> ${pub.year}م / ${pub.hijriYear}هـ</p>
            <p><strong>${isAr ? 'الصفحات:' : 'Pages:'}</strong> ${pub.pages} ${isAr ? 'صفحة' : 'pages'}</p>
            <p><strong>${isAr ? 'التصنيف:' : 'Category:'}</strong> ${isAr ? pub.categoryAr : pub.categoryEn}</p>
            <p><strong>ISBN:</strong> <span dir="ltr">${pub.isbn || 'N/A'}</span></p>
            <p><strong>${isAr ? 'الناشر:' : 'Publisher:'}</strong> ${isAr ? 'مركز حضرموت للدراسات التاريخية، المكلا' : 'Hadhramout Center, Mukalla'}</p>
          </div>
          <button class="btn-primary btn-save-pub" data-pub-id="${pub.id}" style="width: 100%; justify-content: center; margin-top: 0.75rem;">
            ${isBookSaved(pub.id) ? (isAr ? 'محفوظ في مكتبتي البحثية' : 'Saved in Research List') : (isAr ? 'إضافة إلى مكتبتي البحثية' : 'Add to Research List')}
          </button>
        </div>

        <div class="modal-pub-info-col">
          <h4 style="font-size: 1.15rem; margin-bottom: 0.5rem; color: var(--color-primary-900);">${isAr ? 'المستخلص العلمي المعتمد:' : 'Scholarly Abstract:'}</h4>
          <p style="font-size: 0.95rem; line-height: 1.8; color: var(--color-text-main); margin-bottom: 1.5rem; background: var(--color-surface-subtle); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
            ${isAr ? pub.abstractAr : pub.abstractEn}
          </p>

          <h4 style="font-size: 1.15rem; margin-bottom: 0.75rem; color: var(--color-primary-900);">${isAr ? 'صيغ الاستشهاد والتوثيق الأكاديمي:' : 'Scholarly Citations:'}</h4>
          
          <div class="citation-box">
            <div class="citation-box-header">
              <span class="citation-format-tag">APA Style (7th ed.)</span>
              <button class="btn-copy-citation" data-citation="${encodeURIComponent(pub.citationAPA)}">${isAr ? 'نسخ' : 'Copy'}</button>
            </div>
            <div class="citation-text" dir="rtl">${pub.citationAPA}</div>
          </div>

          <div class="citation-box">
            <div class="citation-box-header">
              <span class="citation-format-tag">Chicago Manual of Style (17th ed.)</span>
              <button class="btn-copy-citation" data-citation="${encodeURIComponent(pub.citationChicago)}">${isAr ? 'نسخ' : 'Copy'}</button>
            </div>
            <div class="citation-text" dir="rtl">${pub.citationChicago}</div>
          </div>

          <div class="citation-box">
            <div class="citation-box-header">
              <span class="citation-format-tag">MLA Style (9th ed.)</span>
              <button class="btn-copy-citation" data-citation="${encodeURIComponent(pub.citationMLA)}">${isAr ? 'نسخ' : 'Copy'}</button>
            </div>
            <div class="citation-text" dir="rtl">${pub.citationMLA}</div>
          </div>

          <div class="citation-export-bar">
            <span style="font-size: 0.85rem; font-weight: 600; align-self: center;">${isAr ? 'تصدير للبرامج الأكاديمية:' : 'Export to Reference Managers:'}</span>
            <button class="btn-export-format btn-download-ris" data-pub-id="${pub.id}">Zotero / EndNote (.RIS)</button>
            <button class="btn-export-format btn-download-bibtex" data-pub-id="${pub.id}">BibTeX (.bib)</button>
            <button class="btn-export-format btn-share-item" data-type="book" data-id="${pub.id}">${isAr ? 'مشاركة بطاقة الكتاب' : 'Share Card'}</button>
          </div>

          <div style="margin-top: 1.5rem; display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <a href="https://wa.me/00967773570194?text=${encodeURIComponent(`طلب اقتناء كتاب من مركز حضرموت:\nالعنوان: ${pub.titleAr}\nالرقم: ${pub.id}`)}" target="_blank" rel="noopener noreferrer" class="btn-primary">
              ${t.requestBook}
            </a>
            <button class="btn-secondary btn-preview-pdf" data-pub-id="${pub.id}">
              ${isAr ? 'معاينة صفحات الكتاب (PDF)' : 'Preview Book (PDF)'}
            </button>
          </div>
        </div>
      </div>
    `;

    elements.citationModal.classList.add('open');
  }

  // Modal 2: Open Full Article Reader Modal
  function openArticleReader(articleId) {
    const isAr = state.currentLang === 'ar';
    const article = (HC_DATA.articles || []).find(a => a.id === articleId);
    if (!article || !elements.articleReaderModal || !elements.readerModalBody) return;

    playHapticTone();
    elements.readerArticleTitle.textContent = isAr ? article.titleAr : article.titleEn;

    // Update OpenGraph for this article
    updateDocumentMetadata(
      isAr ? article.titleAr : article.titleEn,
      isAr ? article.summaryAr : article.summaryEn,
      'https://files.hadramout.center/media/2026/09/image-6.png',
      `${window.location.origin}${window.location.pathname}#article-${article.id}`
    );

    elements.readerModalBody.innerHTML = `
      <div class="article-reader-header">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <span class="article-category">${isAr ? article.categoryAr : article.categoryEn}</span>
          <span class="article-read-time">${article.readTime} · ${article.views} ${isAr ? 'قراءة' : 'views'}</span>
        </div>
        <h2 style="font-size: 1.65rem; color: var(--color-primary-900); line-height: 1.4; margin-bottom: 0.85rem;">
          ${isAr ? article.titleAr : article.titleEn}
        </h2>
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; background: var(--color-surface-subtle); padding: 0.85rem 1.25rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
          <div>
            <strong>${isAr ? article.authorAr : article.authorEn}</strong>
            <div style="font-size: 0.82rem; color: var(--color-text-subtle);">${isAr ? article.authorAffiliationAr : article.authorAffiliationEn}</div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn-icon btn-share-item" data-type="article" data-id="${article.id}" title="${isAr ? 'مشاركة' : 'Share'}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>
            <button class="btn-icon btn-save-pub" data-pub-id="${article.id}" title="${isBookSaved(article.id) ? (isAr ? 'محفوظ' : 'Saved') : (isAr ? 'حفظ' : 'Save')}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${isBookSaved(article.id) ? 'var(--color-amber-500)' : 'none'}" stroke="currentColor" stroke-width="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="article-reader-body">
        ${isAr ? article.contentAr : article.contentEn}
      </div>

      <div style="margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--color-border);">
        <h4 style="font-size: 1rem; color: var(--color-primary-900); margin-bottom: 0.65rem;">${isAr ? 'توثيق واقتباس هذه المقالة:' : 'Cite This Article:'}</h4>
        <div class="citation-box" style="margin-bottom: 1rem;">
          <div class="citation-text" dir="rtl">${article.citationAPA}</div>
          <button class="btn-copy-citation" data-citation="${encodeURIComponent(article.citationAPA)}" style="margin-top: 0.5rem;">${isAr ? 'نسخ الاقتباس' : 'Copy Citation'}</button>
        </div>
        <div class="article-tags">
          ${(article.tags || []).map(t => `<span class="article-tag">#${t}</span>`).join('')}
        </div>
      </div>
    `;

    elements.articleReaderModal.classList.add('open');
  }

  // Modal 3: Open Responsive YouTube Video Player Modal
  function openVideoPlayer(youtubeId, title, desc) {
    if (!elements.videoPlayerModal || !elements.videoIframeSlot) return;
    playHapticTone();
    elements.videoModalTitle.textContent = title || (state.currentLang === 'ar' ? 'المكتبة المرئية' : 'Video Library');
    elements.videoIframeSlot.innerHTML = `
      <iframe src="https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    `;
    if (elements.videoModalInfo) {
      elements.videoModalInfo.innerHTML = `
        <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">${title}</h3>
        <p style="font-size: 0.9rem; color: #cbd5e1; line-height: 1.6;">${desc || ''}</p>
      `;
    }
    elements.videoPlayerModal.classList.add('open');
  }

  function closeVideoPlayer() {
    if (elements.videoPlayerModal) {
      elements.videoPlayerModal.classList.remove('open');
      if (elements.videoIframeSlot) elements.videoIframeSlot.innerHTML = '';
    }
  }

  // Modal 4: Open Command Palette (Ctrl+K)
  function openCommandPalette() {
    if (!elements.commandPaletteModal || !elements.commandPaletteInput) return;
    playHapticTone();
    elements.commandPaletteModal.classList.add('open');
    elements.commandPaletteInput.value = '';
    elements.commandPaletteInput.focus();
    renderCommandPaletteResults('');
  }

  function renderCommandPaletteResults(query) {
    if (!elements.commandResultsList) return;
    const isAr = state.currentLang === 'ar';
    const q = (query || '').toLowerCase().trim();

    const sections = [
      { name: isAr ? 'الرئيسية' : 'Home', view: 'home', badge: 'Section' },
      { name: isAr ? 'عن المركز' : 'About Center', view: 'about', badge: 'Section' },
      { name: isAr ? 'الأخبار والأنشطة' : 'News & Activities', view: 'news', badge: 'Section' },
      { name: isAr ? 'المقالات والأبحاث' : 'Articles & Research', view: 'articles', badge: 'Section' },
      { name: isAr ? 'مجلة حضرموت الثقافية' : 'Cultural Magazine', view: 'magazines', badge: 'Section' },
      { name: isAr ? 'سلسلة إصدارات الكتب' : 'Publications Archive', view: 'books', badge: 'Section' },
      { name: isAr ? 'المؤتمرات العلمية' : 'Scientific Conferences', view: 'conferences', badge: 'Section' },
      { name: isAr ? 'منتدى عميد الوفاء' : 'Ameed Al-Wafa Forum', view: 'forum', badge: 'Section' },
      { name: isAr ? 'خزانة المخطوطات والوثائق' : 'Rare Manuscripts', view: 'manuscripts', badge: 'Section' },
      { name: isAr ? 'الخريطة التفاعلية لمعالم حضرموت' : 'Heritage Map', view: 'map', badge: 'Section' },
      { name: isAr ? 'خط تاريخ حضرموت' : 'Historical Timeline', view: 'timeline', badge: 'Section' },
      { name: isAr ? 'الوسائط وبودكاست سقاية' : 'Media & Podcast', view: 'media', badge: 'Section' },
      { name: isAr ? 'تواصل معنا' : 'Contact Center', view: 'contact', badge: 'Section' }
    ];

    let items = [];

    // Filter Sections
    sections.forEach(s => {
      if (!q || s.name.toLowerCase().includes(q)) {
        items.push({
          type: 'navigation',
          title: s.name,
          badge: s.badge,
          action: () => {
            navigateTo(s.view);
            elements.commandPaletteModal.classList.remove('open');
          }
        });
      }
    });

    // Books
    (HC_DATA.publications || []).forEach(b => {
      const title = isAr ? b.titleAr : b.titleEn;
      const author = isAr ? b.authorAr : b.authorEn;
      if (!q || title.toLowerCase().includes(q) || author.toLowerCase().includes(q)) {
        items.push({
          type: 'book',
          title: `${title} — ${author}`,
          badge: isAr ? 'كتاب' : 'Book',
          action: () => {
            navigateTo('books');
            openCitationModal(b.id);
            elements.commandPaletteModal.classList.remove('open');
          }
        });
      }
    });

    // Articles
    (HC_DATA.articles || []).forEach(a => {
      const title = isAr ? a.titleAr : a.titleEn;
      if (!q || title.toLowerCase().includes(q)) {
        items.push({
          type: 'article',
          title: title,
          badge: isAr ? 'مقال' : 'Article',
          action: () => {
            navigateTo('articles');
            openArticleReader(a.id);
            elements.commandPaletteModal.classList.remove('open');
          }
        });
      }
    });

    // Rare Manuscripts
    (HC_DATA.manuscripts || []).forEach(m => {
      const title = isAr ? m.titleAr : m.titleEn;
      const scribe = isAr ? m.scribeAr : m.scribeEn;
      if (!q || title.toLowerCase().includes(q) || scribe.toLowerCase().includes(q)) {
        items.push({
          type: 'manuscript',
          title: `${title} — ${scribe}`,
          badge: isAr ? 'مخطوط' : 'Manuscript',
          action: () => {
            navigateTo('manuscripts');
            openManuscriptFolioViewer(m.id);
            elements.commandPaletteModal.classList.remove('open');
          }
        });
      }
    });

    // Historical Landmarks & Sites
    (HC_DATA.historicalSites || []).forEach(site => {
      const name = isAr ? site.nameAr : site.nameEn;
      if (!q || name.toLowerCase().includes(q)) {
        items.push({
          type: 'site',
          title: name,
          badge: isAr ? 'معلم تاريخي' : 'Landmark',
          action: () => {
            navigateTo('map');
            elements.commandPaletteModal.classList.remove('open');
          }
        });
      }
    });

    if (items.length === 0) {
      elements.commandResultsList.innerHTML = `<li style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">${isAr ? 'لا توجد نتائج مطابقة' : 'No matching results'}</li>`;
      return;
    }

    elements.commandResultsList.innerHTML = items.slice(0, 10).map((it, idx) => `
      <li class="command-item ${idx === 0 ? 'selected' : ''}" data-idx="${idx}">
        <div class="command-item-left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span>${it.title}</span>
        </div>
        <span class="command-item-badge">${it.badge}</span>
      </li>
    `).join('');

    // Attach click events
    elements.commandResultsList.querySelectorAll('.command-item').forEach((li, idx) => {
      li.addEventListener('click', () => {
        items[idx].action();
      });
    });
  }

  // Modal 5: Open Social Share Card Previewer (OpenGraph & Twitter Card)
  function openOgPreview(type = 'general', id = null) {
    if (!elements.ogPreviewModal) return;
    playHapticTone();
    const isAr = state.currentLang === 'ar';

    let title = isAr ? 'مركز حضرموت للدراسات التاريخية والتوثيق والنشر' : 'Hadhramout Center for Historical Studies & Documentation';
    let desc = isAr ? 'المنصة العلمية المرجعية لمركز حضرموت للدراسات التاريخية والتوثيق والنشر بالمكلا — حفظ الذاكرة وتوثيق تاريخ وتراث وحضارة حضرموت.' : 'Digital reference platform documenting the heritage, history, and civilization of Hadhramout.';
    let image = 'https://hadramout.center/opengraph-image.jpg?opengraph-image.d1f55754.jpg';
    let url = window.location.href;

    if (type === 'book' && id) {
      const book = (HC_DATA.publications || []).find(b => b.id === id);
      if (book) {
        title = isAr ? book.titleAr : book.titleEn;
        desc = (isAr ? book.abstractAr : book.abstractEn).substring(0, 160) + '...';
        image = book.coverImage;
        url = `${window.location.origin}${window.location.pathname}#book-${book.id}`;
      }
    } else if (type === 'article' && id) {
      const article = (HC_DATA.articles || []).find(a => a.id === id);
      if (article) {
        title = isAr ? article.titleAr : article.titleEn;
        desc = (isAr ? article.summaryAr : article.summaryEn).substring(0, 160) + '...';
        image = 'https://files.hadramout.center/media/2026/09/image-6.png';
        url = `${window.location.origin}${window.location.pathname}#article-${article.id}`;
      }
    }

    if (elements.ogViewTitle) elements.ogViewTitle.textContent = title;
    if (elements.ogViewDesc) elements.ogViewDesc.textContent = desc;
    if (elements.ogViewImg) elements.ogViewImg.src = image;

    // Attach share triggers
    const btnShareWa = document.getElementById('btn-share-whatsapp');
    const btnShareX = document.getElementById('btn-share-x');
    const btnShareFb = document.getElementById('btn-share-facebook');
    const btnShareTg = document.getElementById('btn-share-telegram');
    const btnShareCopy = document.getElementById('btn-share-copylink');

    if (btnShareWa) {
      btnShareWa.onclick = () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${title}\n${url}`)}`, '_blank');
    }
    if (btnShareX) {
      btnShareX.onclick = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}&via=HadramoutCenter`, '_blank');
    }
    if (btnShareFb) {
      btnShareFb.onclick = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    }
    if (btnShareTg) {
      btnShareTg.onclick = () => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
    }
    if (btnShareCopy) {
      btnShareCopy.onclick = () => {
        navigator.clipboard.writeText(url).then(() => {
          showToast(isAr ? 'تم نسخ الرابط المباشر إلى الحافظة!' : 'Direct link copied to clipboard!');
        });
      };
    }

    elements.ogPreviewModal.classList.add('open');
  }

  // Modal 6: Open Academic PDF Preview Simulator
  function openPdfPreview(type = 'issue', id = '41') {
    if (!elements.pdfPreviewModal || !elements.pdfModalBody) return;
    playHapticTone();
    const isAr = state.currentLang === 'ar';

    elements.pdfModalTitle.textContent = isAr ? 'معاينة الوثيقة الأكاديمية (PDF Preview)' : 'Scholarly Document Preview (PDF)';

    let contentHtml = '';
    if (type === 'issue' || id === '41') {
      contentHtml = `
        <div class="pdf-mockup-sheet" dir="rtl">
          <div style="text-align: center; border-bottom: 2px double #000; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
            <p style="font-size: 1rem; margin-bottom: 0.25rem;">الجمهورية اليمنية — المكلا</p>
            <h2 style="font-size: 1.85rem; font-weight: 700; margin-bottom: 0.25rem;">مركز حضرموت للدراسات التاريخية والتوثيق والنشر</h2>
            <h3 style="font-size: 1.4rem; color: #b45309;">مجلة حضرموت الثقافية — العدد (41)</h3>
            <p style="font-size: 0.85rem; color: #555;">دورية علمية فصلية محكمة · ردمد: 978-9923-81-012-4</p>
          </div>

          <h4 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 0.5rem;">
            فهرس محتويات العدد (Table of Contents):
          </h4>
          <ol style="padding-inline-start: 1.5rem; line-height: 2; font-size: 1.05rem;">
            <li><strong>افتتاحية العدد:</strong> حضرموت في مسار التاريخ العالمي (ص 5 - 12)</li>
            <li><strong>موانئ حضرموت القديمة:</strong> ميناء سمهرم نموذجاً — د. صلاح دويل لرضي (ص 13 - 44)</li>
            <li><strong>باحريز أمير الشعر الشعبي في حضرموت (ج2):</strong> أ.د. عبد العزيز الصيغ (ص 45 - 78)</li>
            <li><strong>هجرة الحضارمة لأريتريا ودورهم الاقتصادي:</strong> الباحثة منى العماري (ص 79 - 110)</li>
            <li><strong>ابن شهاب ناقداً أدبياً:</strong> د. أحمد هادي باحارثة (ص 111 - 138)</li>
            <li><strong>مِن عينات إلى المقطّم.. رحلة عالم تقيّ:</strong> أنس علي باحنان (ص 139 - 168)</li>
            <li><strong>مكتبة المعارف في غيل باوزير:</strong> أنور سالم باكركر (ص 169 - 196)</li>
          </ol>

          <div style="margin-top: 2.5rem; text-align: center; border-top: 1px solid #ccc; padding-top: 1rem; font-size: 0.9rem; color: #555;">
            خاتم الاعتماد والتوثيق الأكاديمي — مركز حضرموت للدراسات التاريخية
          </div>
        </div>
      `;
    } else {
      const book = (HC_DATA.publications || []).find(b => b.id === id);
      contentHtml = `
        <div class="pdf-mockup-sheet" dir="rtl">
          <div style="text-align: center; border-bottom: 2px double #000; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.85rem; font-weight: 700; margin-bottom: 0.25rem;">${book ? book.titleAr : 'كتاب تاريخي'}</h2>
            <h3 style="font-size: 1.3rem; color: #b45309;">تأليف: ${book ? book.authorAr : ''}</h3>
            <p style="font-size: 0.85rem; color: #555;">منشورات مركز حضرموت للدراسات التاريخية والتوثيق والنشر · المكلا (${book ? book.year : 2026}م)</p>
          </div>

          <h4 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.75rem;">المستخلص والتقديم:</h4>
          <p style="font-size: 1.05rem; line-height: 1.9; margin-bottom: 1.5rem;">
            ${book ? book.abstractAr : ''}
          </p>

          <div style="background: #fdfdfd; padding: 1rem; border: 1px dashed #bbb; border-radius: 4px; font-size: 0.9rem; margin-top: 2rem;">
            <strong>بيانات الفهرسة أثناء النشر:</strong><br>
            ردمك: ${book ? book.isbn : ''}<br>
            عدد الصفحات: ${book ? book.pages : ''} صفحة · المقاس: 17×24 سم
          </div>
        </div>
      `;
    }

    elements.pdfModalBody.innerHTML = contentHtml;
    elements.pdfPreviewModal.classList.add('open');
  }

  // Modal 7: Saved Research Bibliography Modal & Exporters
  function openSavedListModal() {
    const isAr = state.currentLang === 'ar';
    const t = HC_DATA.translations[state.currentLang];
    if (!elements.savedListModal || !elements.savedModalBody) return;

    playHapticTone();

    const savedIds = state.savedBooks;
    const allItems = [...(HC_DATA.publications || []), ...(HC_DATA.articles || [])];
    const savedItems = allItems.filter(item => savedIds.includes(item.id));

    if (savedItems.length === 0) {
      elements.savedModalBody.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--color-text-muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 1rem; opacity: 0.6;"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
          <p style="font-size: 1.05rem; font-weight: 500;">${t.savedEmptyState}</p>
        </div>
      `;
    } else {
      elements.savedModalBody.innerHTML = `
        <div style="margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <span style="font-weight: 600;">${isAr ? `إجمالي المراجع المحفوظة: ${savedItems.length}` : `Saved References: ${savedItems.length}`}</span>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn-export-format" id="btn-export-all-ris">تصدير Zotero (.RIS)</button>
            <button class="btn-export-format" id="btn-export-all-bib">تصدير BibTeX (.bib)</button>
            <button class="btn-export-format" id="btn-export-all-md">تصدير Markdown (.md)</button>
            <button class="btn-export-format" id="btn-copy-all-apa">${isAr ? 'نسخ كافة الاقتباسات' : 'Copy All APA'}</button>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1rem; max-height: 400px; overflow-y: auto; padding-inline-end: 0.5rem;">
          ${savedItems.map(item => `
            <div style="padding: 1rem; background: var(--color-surface-subtle); border-radius: var(--radius-sm); border: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
              <div>
                <h4 style="font-size: 1rem; margin-bottom: 0.25rem; color: var(--color-primary-900);">${isAr ? item.titleAr : item.titleEn}</h4>
                <p style="font-size: 0.82rem; color: var(--color-text-muted);">${isAr ? (item.authorAr || '') : (item.authorEn || '')}</p>
                <div style="font-size: 0.78rem; font-family: monospace; color: var(--color-text-subtle); margin-top: 0.35rem;" dir="rtl">${item.citationAPA || ''}</div>
              </div>
              <button class="btn-icon btn-remove-saved" data-id="${item.id}" title="${isAr ? 'إزالة' : 'Remove'}" style="color: #ef4444;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          `).join('')}
        </div>
      `;

      // Export Actions
      document.getElementById('btn-export-all-ris')?.addEventListener('click', () => exportBibliography('ris', savedItems));
      document.getElementById('btn-export-all-bib')?.addEventListener('click', () => exportBibliography('bib', savedItems));
      document.getElementById('btn-export-all-md')?.addEventListener('click', () => exportBibliography('md', savedItems));
      document.getElementById('btn-copy-all-apa')?.addEventListener('click', () => {
        const text = savedItems.map(i => i.citationAPA).join('\n\n');
        navigator.clipboard.writeText(text).then(() => {
          showToast(isAr ? 'تم نسخ جميع الاقتباسات إلى الحافظة!' : 'All citations copied!');
        });
      });

      elements.savedModalBody.querySelectorAll('.btn-remove-saved').forEach(btn => {
        btn.addEventListener('click', () => {
          toggleSaveBook(btn.getAttribute('data-id'));
          openSavedListModal();
        });
      });
    }

    elements.savedListModal.classList.add('open');
  }

  // Bibliography Exporter File Generator (.ris, .bib, .md)
  function exportBibliography(format, items) {
    let content = '';
    let mimeType = 'text/plain';
    let filename = `hadhramout-center-bibliography.${format}`;

    if (format === 'ris') {
      mimeType = 'application/x-research-info-systems';
      content = items.map(item => `
TY  - BOOK
TI  - ${item.titleAr || item.titleEn}
AU  - ${item.authorAr || item.authorEn}
PY  - ${item.year || 2026}
PB  - مركز حضرموت للدراسات التاريخية والتوثيق والنشر
CY  - المكلا
SN  - ${item.isbn || ''}
ER  - 
      `.trim()).join('\n\n');
    } else if (format === 'bib') {
      mimeType = 'application/x-bibtex';
      content = items.map(item => `
@book{hc_${item.id.replace('-', '_')},
  title = {${item.titleAr || item.titleEn}},
  author = {${item.authorAr || item.authorEn}},
  year = {${item.year || 2026}},
  publisher = {مركز حضرموت للدراسات التاريخية والتوثيق والنشر},
  address = {المكلا، حضرموت},
  isbn = {${item.isbn || ''}}
}
      `.trim()).join('\n\n');
    } else if (format === 'md') {
      mimeType = 'text/markdown';
      content = `# قائمة المراجع والتوثيق الأكاديمي — مركز حضرموت للدراسات التاريخية\n\n` +
        items.map(i => `* **${i.titleAr}** (${i.year || 2026}م).\n  * ${i.citationAPA}\n  * ردمك: \`${i.isbn || 'N/A'}\``).join('\n\n');
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(state.currentLang === 'ar' ? `تم تحميل ملف المراجع بنجاح (${format.toUpperCase()})` : `Bibliography downloaded (${format.toUpperCase()})`);
  }

  // Rare Manuscripts Renderer
  function renderManuscripts() {
    if (!elements.fullManuscriptsGrid) return;
    const isAr = state.currentLang === 'ar';
    const items = HC_DATA.manuscripts || [];

    elements.fullManuscriptsGrid.innerHTML = items.map(ms => `
      <article class="manuscript-card">
        <div class="manuscript-thumb-wrap">
          <img src="${ms.folioImageUrl}" alt="${isAr ? ms.titleAr : ms.titleEn}" loading="lazy">
          <span class="manuscript-era-badge">${ms.yearHijri} / ${ms.yearGregorian}</span>
        </div>
        <div class="manuscript-body">
          <h3 class="manuscript-title">${isAr ? ms.titleAr : ms.titleEn}</h3>
          <div class="manuscript-meta-list">
            <div class="manuscript-meta-row">
              <span class="manuscript-meta-label">${isAr ? 'الناسخ / الكاتب:' : 'Scribe / Author:'}</span>
              <span class="manuscript-meta-val">${isAr ? ms.scribeAr : ms.scribeEn}</span>
            </div>
            <div class="manuscript-meta-row">
              <span class="manuscript-meta-label">${isAr ? 'نوع الخط:' : 'Script:'}</span>
              <span class="manuscript-meta-val">${isAr ? ms.scriptTypeAr : ms.scriptTypeEn}</span>
            </div>
            <div class="manuscript-meta-row">
              <span class="manuscript-meta-label">${isAr ? 'خزانة الحفظ:' : 'Vault:'}</span>
              <span class="manuscript-meta-val">${isAr ? ms.custodyAr : ms.custodyEn}</span>
            </div>
            <div class="manuscript-meta-row">
              <span class="manuscript-meta-label">${isAr ? 'الأوراق والمقاس:' : 'Folios & Size:'}</span>
              <span class="manuscript-meta-val">${ms.folios} (${ms.dimensions})</span>
            </div>
          </div>
          <p class="manuscript-summary">${isAr ? ms.summaryAr : ms.summaryEn}</p>
          <button class="btn-inspect-folio" data-manuscript-id="${ms.id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
            ${isAr ? 'فحص أوراق المخطوط' : 'Inspect Folio Page'}
          </button>
        </div>
      </article>
    `).join('');
  }

  // Historical Geography & Landmarks Renderer
  function renderHistoricalSites() {
    if (!elements.fullMapGrid) return;
    const isAr = state.currentLang === 'ar';
    let sites = HC_DATA.historicalSites || [];

    if (state.mapFilter && state.mapFilter !== 'all') {
      sites = sites.filter(s => s.type === state.mapFilter);
    }

    elements.fullMapGrid.innerHTML = sites.map(site => `
      <div class="heritage-site-card">
        <div class="site-card-header">
          <h3 class="site-name">${isAr ? site.nameAr : site.nameEn}</h3>
          <span class="site-type-pill">${isAr ? (site.type === 'coastal-port' ? 'ميناء بحري' : (site.type === 'world-heritage' ? 'تراث عالمي' : 'معلم تاريخي')) : site.type}</span>
        </div>
        <div class="site-era">${isAr ? site.eraAr : site.eraEn}</div>
        <div class="site-landmark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-amber-600)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 21s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>${isAr ? site.landmarkAr : site.landmarkEn}</span>
        </div>
        <p class="site-desc">${isAr ? site.descriptionAr : site.descriptionEn}</p>
        <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center;">
          <span class="site-coord-tag">GPS: ${site.coordinates.lat.toFixed(4)}° N, ${site.coordinates.lng.toFixed(4)}° E</span>
          <button class="folio-tool-btn btn-share-item" data-type="general" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">
            ${isAr ? 'مشاركة' : 'Share'}
          </button>
        </div>
      </div>
    `).join('');
  }

  // Manuscript Folio Inspector Modal
  function openManuscriptFolioViewer(msId) {
    if (!elements.folioViewerModal) return;
    const isAr = state.currentLang === 'ar';
    const ms = (HC_DATA.manuscripts || []).find(m => m.id === msId);
    if (!ms) return;

    playHapticTone();
    state.folioZoom = 1;
    state.folioInverted = false;

    if (elements.folioStageImg) {
      elements.folioStageImg.src = ms.folioImageUrl;
      elements.folioStageImg.style.transform = 'scale(1)';
      elements.folioStageImg.classList.remove('inverted');
    }

    if (elements.folioMetaBadge) {
      elements.folioMetaBadge.textContent = `${ms.yearHijri} · ${isAr ? ms.custodyAr : ms.custodyEn}`;
    }

    const titleEl = document.getElementById('folio-modal-title');
    if (titleEl) {
      titleEl.textContent = `${isAr ? 'فاحص المخطوط:' : 'Folio Inspector:'} ${isAr ? ms.titleAr : ms.titleEn}`;
    }

    if (elements.folioInfoPanel) {
      elements.folioInfoPanel.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div><strong>${isAr ? 'الناسخ / الكاتب:' : 'Scribe:'}</strong> ${isAr ? ms.scribeAr : ms.scribeEn}</div>
          <div><strong>${isAr ? 'نوع الخط والحبر:' : 'Script & Ink:'}</strong> ${isAr ? ms.scriptTypeAr : ms.scriptTypeEn}</div>
          <div><strong>${isAr ? 'القياس وعدد الأوراق:' : 'Dimensions:'}</strong> ${ms.folios} (${ms.dimensions})</div>
          <div><strong>${isAr ? 'مكان الحفظ الأرشيفي:' : 'Vault:'}</strong> ${isAr ? ms.custodyAr : ms.custodyEn}</div>
        </div>
        <p style="margin-top: 0.75rem; line-height: 1.6;">${isAr ? ms.summaryAr : ms.summaryEn}</p>
      `;
    }

    elements.folioViewerModal.classList.add('open');
  }

  // Live Search Auto-Complete & Suggestions
  function handleLiveSearch(query) {
    if (!elements.searchSuggestionsDropdown) return;
    const q = (query || '').toLowerCase().trim();
    if (!q || q.length < 2) {
      elements.searchSuggestionsDropdown.style.display = 'none';
      return;
    }

    const isAr = state.currentLang === 'ar';
    const books = (HC_DATA.publications || []).filter(b => 
      (b.titleAr && b.titleAr.toLowerCase().includes(q)) ||
      (b.titleEn && b.titleEn.toLowerCase().includes(q)) ||
      (b.authorAr && b.authorAr.toLowerCase().includes(q))
    ).slice(0, 4);

    const articles = (HC_DATA.articles || []).filter(a => 
      (a.titleAr && a.titleAr.toLowerCase().includes(q)) ||
      (a.authorAr && a.authorAr.toLowerCase().includes(q))
    ).slice(0, 3);

    const results = [
      ...books.map(b => ({ type: 'book', id: b.id, title: isAr ? b.titleAr : b.titleEn, tag: isAr ? 'كتاب' : 'Book' })),
      ...articles.map(a => ({ type: 'article', id: a.id, title: isAr ? a.titleAr : a.titleEn, tag: isAr ? 'مقال' : 'Article' }))
    ];

    if (results.length === 0) {
      elements.searchSuggestionsDropdown.style.display = 'none';
      return;
    }

    elements.searchSuggestionsDropdown.innerHTML = results.map(r => `
      <div class="search-suggestion-item" data-type="${r.type}" data-id="${r.id}">
        <span>${r.title}</span>
        <span class="command-item-badge">${r.tag}</span>
      </div>
    `).join('');

    elements.searchSuggestionsDropdown.style.display = 'block';

    elements.searchSuggestionsDropdown.querySelectorAll('.search-suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.getAttribute('data-type');
        const id = item.getAttribute('data-id');
        elements.searchSuggestionsDropdown.style.display = 'none';
        if (type === 'book') {
          navigateTo('books');
          openCitationModal(id);
        } else if (type === 'article') {
          navigateTo('articles');
          openArticleReader(id);
        }
      });
    });
  }

  // Reading Progress Scroll Listener
  function initReadingProgress() {
    window.addEventListener('scroll', () => {
      if (!elements.readingProgressBar) return;
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      elements.readingProgressBar.style.width = `${scrolled}%`;
    });
  }

  // Event Listeners Initialization
  function initEventListeners() {
    // Navigation routing
    window.addEventListener('hashchange', handleHashChange);

    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const href = btn.getAttribute('href');
        if (href && href.startsWith('#')) {
          const target = href.replace('#', '');
          navigateTo(target);
        }
      });
    });

    // Mobile Drawer
    elements.mobileMenuBtn?.addEventListener('click', () => {
      const isOpen = elements.mobileDrawer?.classList.toggle('open');
      elements.mobileMenuBtn?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      playHapticTone();
    });

    // Language Toggle
    elements.langToggleBtn?.addEventListener('click', () => {
      const nextLang = state.currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(nextLang);
    });

    // Theme Toggle
    elements.themeToggleBtn?.addEventListener('click', () => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
      playHapticTone();
    });

    // Font Scaler
    elements.fontScalerBtn?.addEventListener('click', cycleFontSize);

    // Command Palette Open & Controls
    elements.btnOpenCommandPalette?.addEventListener('click', openCommandPalette);
    elements.commandPaletteCloseBtn?.addEventListener('click', () => {
      elements.commandPaletteModal?.classList.remove('open');
    });
    elements.commandPaletteInput?.addEventListener('input', (e) => {
      renderCommandPaletteResults(e.target.value);
    });

    // Global Keyboard Shortcuts (Ctrl+K, Cmd+K, Escape)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCommandPalette();
      } else if (e.key === 'Escape') {
        elements.commandPaletteModal?.classList.remove('open');
        elements.citationModal?.classList.remove('open');
        elements.articleReaderModal?.classList.remove('open');
        closeVideoPlayer();
        elements.ogPreviewModal?.classList.remove('open');
        elements.pdfPreviewModal?.classList.remove('open');
        elements.savedListModal?.classList.remove('open');
        elements.folioViewerModal?.classList.remove('open');
        if (elements.searchSuggestionsDropdown) elements.searchSuggestionsDropdown.style.display = 'none';
      }
    });

    // Folio Viewer Controls & Modal
    elements.folioModalCloseBtn?.addEventListener('click', () => {
      elements.folioViewerModal?.classList.remove('open');
    });

    elements.btnFolioZoomIn?.addEventListener('click', () => {
      state.folioZoom = Math.min(3, state.folioZoom + 0.25);
      if (elements.folioStageImg) elements.folioStageImg.style.transform = `scale(${state.folioZoom})`;
    });

    elements.btnFolioZoomOut?.addEventListener('click', () => {
      state.folioZoom = Math.max(0.5, state.folioZoom - 0.25);
      if (elements.folioStageImg) elements.folioStageImg.style.transform = `scale(${state.folioZoom})`;
    });

    elements.btnFolioZoomReset?.addEventListener('click', () => {
      state.folioZoom = 1;
      if (elements.folioStageImg) elements.folioStageImg.style.transform = 'scale(1)';
    });

    elements.btnFolioInvert?.addEventListener('click', () => {
      state.folioInverted = !state.folioInverted;
      elements.folioStageImg?.classList.toggle('inverted', state.folioInverted);
    });

    // Map Filter Chips
    elements.mapFilterBar?.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        elements.mapFilterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.mapFilter = chip.getAttribute('data-map-filter') || 'all';
        playHapticTone();
        renderHistoricalSites();
      });
    });

    // Newsletter Subscription Form
    elements.newsletterForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletter-email-input');
      const email = emailInput?.value || '';
      if (email) {
        const t = HC_DATA.translations[state.currentLang];
        showToast(t.newsletterSuccessToast || 'تم اشتراكك في النشرة التوثيقية بنجاح!');
        elements.newsletterForm.reset();
      }
    });

    // Social Share / OpenGraph Previewer Button
    elements.btnOpenOgPreview?.addEventListener('click', () => openOgPreview('general'));
    elements.ogModalCloseBtn?.addEventListener('click', () => elements.ogPreviewModal?.classList.remove('open'));

    // Saved Library Modal
    elements.btnOpenSavedList?.addEventListener('click', openSavedListModal);
    elements.savedModalCloseBtn?.addEventListener('click', () => elements.savedListModal?.classList.remove('open'));

    // Citation Modal Close
    elements.modalCloseBtn?.addEventListener('click', () => elements.citationModal?.classList.remove('open'));

    // Article Reader Modal Close
    elements.readerModalCloseBtn?.addEventListener('click', () => elements.articleReaderModal?.classList.remove('open'));

    // Video Player Close
    elements.videoModalCloseBtn?.addEventListener('click', closeVideoPlayer);

    // PDF Previewer Close
    elements.pdfModalCloseBtn?.addEventListener('click', () => elements.pdfPreviewModal?.classList.remove('open'));

    // Close Modals on Overlay Backdrop Click
    [
      elements.citationModal,
      elements.articleReaderModal,
      elements.videoPlayerModal,
      elements.commandPaletteModal,
      elements.ogPreviewModal,
      elements.pdfPreviewModal,
      elements.savedListModal,
      elements.folioViewerModal
    ].forEach(modal => {
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
          if (modal === elements.videoPlayerModal) closeVideoPlayer();
        }
      });
    });

    // Global Search Input
    elements.globalSearchInput?.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      handleLiveSearch(state.searchQuery);
      renderPublications(elements.homePublicationsGrid, true);
      renderPublications(elements.fullPublicationsGrid, false);
    });

    // Category Filter Chips (Books & Global)
    elements.categoryFilterBar?.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        elements.categoryFilterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.activeCategory = chip.getAttribute('data-category') || 'all';
        playHapticTone();
        renderPublications(elements.homePublicationsGrid, true);
        renderPublications(elements.fullPublicationsGrid, false);
      });
    });

    // Articles Filter Bar
    elements.articlesFilterBar?.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        elements.articlesFilterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.articlesCategory = chip.getAttribute('data-article-category') || 'all';
        playHapticTone();
        renderArticles();
      });
    });

    // Sort Dropdowns
    elements.homeBooksSortSelect?.addEventListener('change', (e) => {
      state.booksSort = e.target.value;
      renderPublications(elements.homePublicationsGrid, true);
    });
    elements.fullBooksSortSelect?.addEventListener('change', (e) => {
      state.booksSort = e.target.value;
      renderPublications(elements.fullPublicationsGrid, false);
    });
    elements.articlesSortSelect?.addEventListener('change', (e) => {
      state.articlesSort = e.target.value;
      renderArticles();
    });

    // View Mode Toggles (Grid / List)
    elements.btnHomeBooksGrid?.addEventListener('click', () => {
      state.booksViewMode = 'grid';
      elements.btnHomeBooksGrid.classList.add('active');
      elements.btnHomeBooksList?.classList.remove('active');
      renderPublications(elements.homePublicationsGrid, true);
    });
    elements.btnHomeBooksList?.addEventListener('click', () => {
      state.booksViewMode = 'list';
      elements.btnHomeBooksList.classList.add('active');
      elements.btnHomeBooksGrid?.classList.remove('active');
      renderPublications(elements.homePublicationsGrid, true);
    });

    elements.btnFullBooksGrid?.addEventListener('click', () => {
      state.booksViewMode = 'grid';
      localStorage.setItem('hc_books_view', 'grid');
      elements.btnFullBooksGrid.classList.add('active');
      elements.btnFullBooksList?.classList.remove('active');
      renderPublications(elements.fullPublicationsGrid, false);
    });
    elements.btnFullBooksList?.addEventListener('click', () => {
      state.booksViewMode = 'list';
      localStorage.setItem('hc_books_view', 'list');
      elements.btnFullBooksList.classList.add('active');
      elements.btnFullBooksGrid?.classList.remove('active');
      renderPublications(elements.fullPublicationsGrid, false);
    });

    elements.btnArticlesGrid?.addEventListener('click', () => {
      state.articlesViewMode = 'grid';
      localStorage.setItem('hc_articles_view', 'grid');
      elements.btnArticlesGrid.classList.add('active');
      elements.btnArticlesList?.classList.remove('active');
      renderArticles();
    });
    elements.btnArticlesList?.addEventListener('click', () => {
      state.articlesViewMode = 'list';
      localStorage.setItem('hc_articles_view', 'list');
      elements.btnArticlesList.classList.add('active');
      elements.btnArticlesGrid?.classList.remove('active');
      renderArticles();
    });

    // Event Delegation for Dynamic Buttons (Book, Article, News, Audio, Video, PDF)
    document.addEventListener('click', (e) => {
      const citeBtn = e.target.closest('.btn-cite-pub');
      if (citeBtn) {
        const pubId = citeBtn.getAttribute('data-pub-id');
        openCitationModal(pubId);
        return;
      }

      const saveBtn = e.target.closest('.btn-save-pub');
      if (saveBtn) {
        const pubId = saveBtn.getAttribute('data-pub-id');
        toggleSaveBook(pubId);
        return;
      }

      const readArtBtn = e.target.closest('.btn-read-article');
      if (readArtBtn) {
        const artId = readArtBtn.getAttribute('data-article-id');
        openArticleReader(artId);
        return;
      }

      const readNewsBtn = e.target.closest('.btn-open-news-modal');
      if (readNewsBtn) {
        const newsId = readNewsBtn.getAttribute('data-news-id');
        const newsItem = (HC_DATA.news || []).find(n => n.id === newsId);
        if (newsItem) {
          openOgPreview('news', newsId);
        }
        return;
      }

      const copyCiteBtn = e.target.closest('.btn-copy-citation');
      if (copyCiteBtn) {
        const citation = decodeURIComponent(copyCiteBtn.getAttribute('data-citation') || '');
        navigator.clipboard.writeText(citation).then(() => {
          showToast(state.currentLang === 'ar' ? 'تم نسخ الاقتباس الأكاديمي إلى الحافظة!' : 'Citation copied to clipboard!');
        });
        return;
      }

      const playVidBtn = e.target.closest('.btn-play-video');
      if (playVidBtn) {
        const ytId = playVidBtn.getAttribute('data-youtube-id') || '8mLzjsj-kw0';
        const title = playVidBtn.getAttribute('data-title') || 'محاضرة وثائقية';
        openVideoPlayer(ytId, title);
        return;
      }

      const pdfPreviewBtn = e.target.closest('.btn-preview-pdf');
      if (pdfPreviewBtn) {
        const pubId = pdfPreviewBtn.getAttribute('data-pub-id');
        const issue = pdfPreviewBtn.getAttribute('data-issue');
        if (pubId) openPdfPreview('book', pubId);
        else openPdfPreview('issue', issue || '41');
        return;
      }

      const inspectFolioBtn = e.target.closest('.btn-inspect-folio');
      if (inspectFolioBtn) {
        const msId = inspectFolioBtn.getAttribute('data-manuscript-id');
        openManuscriptFolioViewer(msId);
        return;
      }

      const shareItemBtn = e.target.closest('.btn-share-item');
      if (shareItemBtn) {
        const type = shareItemBtn.getAttribute('data-type') || 'general';
        const id = shareItemBtn.getAttribute('data-id');
        openOgPreview(type, id);
        return;
      }

      const exportRisBtn = e.target.closest('.btn-download-ris');
      if (exportRisBtn) {
        const pubId = exportRisBtn.getAttribute('data-pub-id');
        const item = (HC_DATA.publications || []).find(b => b.id === pubId);
        if (item) exportBibliography('ris', [item]);
        return;
      }

      const exportBibBtn = e.target.closest('.btn-download-bibtex');
      if (exportBibBtn) {
        const pubId = exportBibBtn.getAttribute('data-pub-id');
        const item = (HC_DATA.publications || []).find(b => b.id === pubId);
        if (item) exportBibliography('bib', [item]);
        return;
      }

      const resetFilterBtn = e.target.closest('#btn-reset-filter');
      if (resetFilterBtn) {
        state.activeCategory = 'all';
        state.searchQuery = '';
        if (elements.globalSearchInput) elements.globalSearchInput.value = '';
        elements.categoryFilterBar?.querySelectorAll('.filter-chip').forEach(c => {
          if (c.getAttribute('data-category') === 'all') c.classList.add('active');
          else c.classList.remove('active');
        });
        renderPublications(elements.homePublicationsGrid, true);
        renderPublications(elements.fullPublicationsGrid, false);
        return;
      }
    });

    // Contact Form Submission
    elements.contactForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('inquiry-name')?.value || '';
      const email = document.getElementById('inquiry-email')?.value || '';
      const phone = document.getElementById('inquiry-phone')?.value || '';
      const type = document.getElementById('inquiry-type')?.value || '';
      const msg = document.getElementById('inquiry-message')?.value || '';

      const t = HC_DATA.translations[state.currentLang];
      showToast(t.formSuccessToast);
      elements.contactForm.reset();

      setTimeout(() => {
        const waText = encodeURIComponent(`طلب جديد من منصة مركز حضرموت:\nالاسم: ${name}\nالنوع: ${type}\nالرسالة: ${msg}\nهاتف: ${phone}\nبريد: ${email}`);
        const waUrl = `https://wa.me/00967773570194?text=${waText}`;
        if (confirm(state.currentLang === 'ar' ? 'تم تسجيل رسالتك بنجاح! هل تود أيضاً فتح محادثة واتساب مباشرة مع إدارة المركز لإرسال التفاصيل فوراً؟' : 'Inquiry registered! Would you also like to open a direct WhatsApp chat with the Center?')) {
          window.open(waUrl, '_blank');
        }
      }, 1200);
    });

    // Header scroll elevation
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        elements.siteHeader?.classList.add('scrolled');
      } else {
        elements.siteHeader?.classList.remove('scrolled');
      }
    });
  }

  // Application Bootstrapper
  function init() {
    initEventListeners();
    initReadingProgress();
    applyTheme(state.theme);
    applyFontSize(state.fontSize);
    applyLanguage(state.currentLang);
    handleHashChange();
    // PWA Service Worker Registration
    registerServiceWorker();
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
          console.log('[PWA] Service Worker active with scope:', reg.scope);
        }).catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
