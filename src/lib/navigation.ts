import type { Ctx } from './ctx.ts';
import type { IconName } from '../components/Icon.tsx';

export interface NavSubItem {
  href: string;
  label: string;
  desc?: string;
  icon?: IconName;
}

export interface HeaderNavItem {
  href: string;
  label: string;
  subItems: NavSubItem[];
}

export function getHeaderNavigation(ctx: Ctx): HeaderNavItem[] {
  const { lang, href } = ctx;
  const isAr = lang.code === 'ar';

  return [
    {
      href: href('/'),
      label: isAr ? 'الرئيسية' : 'Home',
      subItems: [
        {
          href: href('/'),
          label: isAr ? 'بوابة المركز الرقمية' : 'Digital Portal',
          desc: isAr ? 'الواجهة الرئيسية والمدخل الشامل للمركز' : 'Official institutional portal & entry',
          icon: 'layers',
        },
        {
          href: href('/news'),
          label: isAr ? 'الأخبار والأنشطة' : 'News & Activities',
          desc: isAr ? 'متابعة أخبار المركز والزيارات الميدانية' : 'Latest institutional news & field visits',
          icon: 'file',
        },
        {
          href: href('/videos'),
          label: isAr ? 'المرئيات والتسجيلات' : 'Videos & Recordings',
          desc: isAr ? 'برنامج كاتب وكتاب والندوات المصورة' : 'Visual archive & lecture recordings',
          icon: 'play',
        },
        {
          href: href('/timeline'),
          label: isAr ? 'الخط الزمني التاريخي' : 'Historical Timeline',
          desc: isAr ? 'تسلسل تاريخ حضرموت عبر العصور' : 'Chronological milestones of Hadramout history',
          icon: 'clock',
        },
      ],
    },
    {
      href: href('/search'),
      label: isAr ? 'الأرشيف الرقمي' : 'Digital Archive',
      subItems: [
        {
          href: href('/search'),
          label: isAr ? 'البحث الشامل في الأرشيف' : 'Archive Search',
          desc: isAr ? 'محرك بحث متقدم في المخطوطات والوثائق' : 'Full-text search in manuscripts & archives',
          icon: 'search',
        },
        {
          href: href('/topics'),
          label: isAr ? 'دليل المواضيع والحقب' : 'Topics & Eras',
          desc: isAr ? 'تصفح الأرشيف حسب الحقب والمجالات المعرفية' : 'Browse by eras & knowledge fields',
          icon: 'tag',
        },
        {
          href: href('/authors'),
          label: isAr ? 'كشاف الباحثين والمؤلفين' : 'Scholars & Authors',
          desc: isAr ? 'دليل المؤرخين والكتّاب وأعلام الفكر' : 'Directory of historians and scholars',
          icon: 'user',
        },
        {
          href: href('/saved'),
          label: isAr ? 'المحفوظات وقائمة القراءة' : 'Saved Reading List',
          desc: isAr ? 'الأبحاث المحفوظة والمطالعة دون اتصال' : 'Saved documents for offline reading',
          icon: 'bookmark',
        },
      ],
    },
    {
      href: href('/magazines'),
      label: isAr ? 'المجلات العلمية' : 'Academic Journals',
      subItems: [
        {
          href: href('/magazines'),
          label: isAr ? 'مجلة حضرموت الثقافية' : 'Hadramout Cultural Journal',
          desc: isAr ? 'كافة أعداد المجلة المحكّمة بصيغ رقمية' : 'All peer-reviewed journal issues',
          icon: 'book',
        },
        {
          href: href('/articles'),
          label: isAr ? 'الأبحاث والدراسات المنشورة' : 'Published Research & Studies',
          desc: isAr ? 'الأبحاث المحكمة والمقالات المستلة من الأعداد' : 'Peer-reviewed studies & offprints',
          icon: 'file',
        },
        {
          href: href('/contact?kind=book_request'),
          label: isAr ? 'طلب أعداد ومستلات المجلة' : 'Request Journal Issues',
          desc: isAr ? 'طلب نسخ ورقية وإلكترونية من الأعداد السابقة' : 'Request print and digital copies',
          icon: 'mail',
        },
      ],
    },
    {
      href: href('/books'),
      label: isAr ? 'الدراسات والكتب' : 'Studies & Books',
      subItems: [
        {
          href: href('/books'),
          label: isAr ? 'مكتبة إصدارات المركز' : 'Center Publications Library',
          desc: isAr ? 'الكتب والتحقيقات التاريخية الصادرة عن المركز' : 'Historical books and editions published by Center',
          icon: 'book',
        },
        {
          href: href('/articles'),
          label: isAr ? 'الدراسات والأبحاث التاريخية' : 'Historical Studies & Research',
          desc: isAr ? 'دراسات تخصصية في تاريخ وتراث حضرموت' : 'Specialized studies in history & heritage',
          icon: 'file',
        },
        {
          href: href('/forum'),
          label: isAr ? 'منتدى عميد الوفاء الثقافي' : 'Cultural Forum',
          desc: isAr ? 'محاضرات وأوراق عمل صالون الشيخ باجنيد' : 'Lectures & papers from Bajunaid Salon',
          icon: 'users',
        },
        {
          href: href('/events'),
          label: isAr ? 'المؤتمرات والندوات العلمية' : 'Conferences & Symposia',
          desc: isAr ? 'أعمال ووقائع المؤتمرات التاريخية المنعقدة' : 'Proceedings of academic conferences',
          icon: 'calendar',
        },
      ],
    },
    {
      href: href('/about'),
      label: isAr ? 'عن المشروع' : 'About Project',
      subItems: [
        {
          href: href('/about'),
          label: isAr ? 'عن المركز والرسالة والرؤية' : 'About Center & Mission',
          desc: isAr ? 'الهوية المؤسسية والأهداف التوثيقية للمركز' : 'Institutional identity & documentation goals',
          icon: 'info',
        },
        {
          href: href('/about#fields'),
          label: isAr ? 'مجالات العمل والبحث' : 'Research & Action Fields',
          desc: isAr ? 'مسارات الدراسات، التوثيق، الترجمة والنشر' : 'Historical studies, archiving & publishing',
          icon: 'briefcase',
        },
        {
          href: href('/about#programs'),
          label: isAr ? 'برامج المركز وإصداراته' : 'Programs & Platforms',
          desc: isAr ? 'المنصات والمشاريع الدورية والمطبوعات' : 'Periodic platforms and series',
          icon: 'layers',
        },
        {
          href: href('/privacy'),
          label: isAr ? 'سياسة الخصوصية والاستخدام' : 'Privacy & Terms',
          desc: isAr ? 'ضوابط المنصة وحماية البيانات الفكرية' : 'Platform terms and IP copyright guidelines',
          icon: 'check',
        },
      ],
    },
    {
      href: href('/contact'),
      label: isAr ? 'اتصل بنا' : 'Contact Us',
      subItems: [
        {
          href: href('/contact'),
          label: isAr ? 'نموذج التواصل والاستفسار' : 'Inquiry & Message Form',
          desc: isAr ? 'مراسلة إدارة المركز مباشرة لأي استفسار' : 'Contact Center management directly',
          icon: 'mail',
        },
        {
          href: href('/contact?kind=book_request'),
          label: isAr ? 'طلب الكتب والمطبوعات' : 'Request Publications',
          desc: isAr ? 'طلب نسخ ورقية من الكتب والمجلات' : 'Order print books and journals',
          icon: 'book',
        },
        {
          href: href('/contact?kind=translation_issue'),
          label: isAr ? 'ملاحظات المحتوى والترجمة' : 'Content & Translation Feedback',
          desc: isAr ? 'إرسال ملاحظات تصويب أو مقترحات بحثية' : 'Submit corrections or research suggestions',
          icon: 'globe',
        },
        {
          href: href('/contact#info'),
          label: isAr ? 'المقر والعناوين وقنوات التواصل' : 'Headquarters & Locations',
          desc: isAr ? 'مقر المكلا وأرقام التواصل المباشر' : 'Mukalla office and direct contact channels',
          icon: 'pin',
        },
      ],
    },
  ];
}
