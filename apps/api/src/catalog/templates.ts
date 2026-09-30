import type {
  CurtainModelData,
  CurtainStyle,
  MaterialData,
  ModelItemData,
  SupplierData,
} from '@sijaf/shared';

/*
 * «ابدأ بأسعار نموذجية» و«8 موديلات جاهزة».
 * الأسماء والأسعار من شاشات التصميم؛ اللي مش ظاهر في التصميم (زي الجاكار الفاخر والبلاك أوت)
 * متكمّل بأسعار منطقية، وصاحب المحل بيعدّلها لأسعاره.
 */

export type TemplateSupplier = SupplierData & { key: string };

export const templateSuppliers: TemplateSupplier[] = [
  {
    key: 'nile',
    name: 'النيل للمنسوجات',
    specialty: 'خامات محلية',
    contactName: '',
    whatsapp: null,
    address: 'المحلة الكبرى',
    paymentMethod: 'cash',
    creditDays: null,
    leadTimeMinDays: 2,
    leadTimeMaxDays: 4,
  },
  {
    key: 'anadol',
    name: 'الأناضول للأقمشة',
    specialty: 'وكيل أقمشة تركية',
    contactName: '',
    whatsapp: null,
    address: 'القاهرة · الموسكي',
    paymentMethod: 'credit',
    creditDays: 30,
    leadTimeMinDays: 3,
    leadTimeMaxDays: 5,
  },
  {
    key: 'mediterranean',
    name: 'المتوسط للأقمشة المستوردة',
    specialty: 'إيطالي وإسباني',
    contactName: '',
    whatsapp: null,
    address: 'الإسكندرية',
    paymentMethod: 'credit',
    creditDays: 45,
    leadTimeMinDays: 7,
    leadTimeMaxDays: 14,
  },
  {
    key: 'delta',
    name: 'الدلتا للبلاك أوت',
    specialty: 'بلاك أوت وبطانات',
    contactName: '',
    whatsapp: null,
    address: 'العاشر من رمضان',
    paymentMethod: 'cash',
    creditDays: null,
    leadTimeMinDays: 2,
    leadTimeMaxDays: 3,
  },
  {
    key: 'amal',
    name: 'الأمل للمجاري والإكسسوارات',
    specialty: 'مجاري وكرانيش',
    contactName: '',
    whatsapp: null,
    address: 'القاهرة',
    paymentMethod: 'cash',
    creditDays: null,
    leadTimeMinDays: 1,
    leadTimeMaxDays: 2,
  },
];

export type TemplateMaterial = Omit<MaterialData, 'supplierId' | 'supplierCode' | 'stockStatus'> & { supplier: string };

const m = (
  name: string,
  layer: MaterialData['layer'],
  look: string | null,
  tier: MaterialData['tier'],
  supplier: string,
  purchasePrice: number,
  sellPrice: number,
  extra: Partial<Pick<MaterialData, 'unit' | 'topWidthM'>> = {},
): TemplateMaterial => ({
  name,
  layer,
  look,
  tier,
  supplier,
  purchasePrice,
  sellPrice,
  unit: extra.unit ?? 'meter',
  topWidthM: extra.topWidthM ?? (layer === 'sheer' || layer === 'main' || layer === 'lining' ? 3 : null),
});

/** 25 خامة زي عداد الكتالوج في التصميم + 6 موتورات وإكسسوارات بتاعة الموديلات */
export const templateMaterials: TemplateMaterial[] = [
  // شيفون
  m('شيفون سادة', 'sheer', 'سادة', 'economy', 'nile', 130, 170),
  m('شيفون لينين', 'sheer', 'لينين', 'standard', 'anadol', 215, 290),
  m('شيفون تركي مطرز', 'sheer', 'مطرز', 'premium', 'anadol', 370, 520),
  // قماش أساسي
  m('قطيفة محلي', 'main', 'قطيفة', 'economy', 'nile', 275, 360),
  m('قطيفة تركي', 'main', 'قطيفة', 'standard', 'anadol', 415, 560),
  m('قطيفة إيطالي', 'main', 'قطيفة', 'premium', 'mediterranean', 645, 900),
  m('كتان صناعي', 'main', 'كتان', 'economy', 'nile', 215, 280),
  m('كتان مخلوط', 'main', 'كتان', 'standard', 'anadol', 325, 440),
  m('كتان طبيعي', 'main', 'كتان', 'premium', 'mediterranean', 545, 760),
  m('ساتان بلاك أوت', 'main', 'ساتان', 'economy', 'delta', 175, 230),
  m('ساتان تركي', 'main', 'ساتان', 'standard', 'anadol', 250, 340),
  m('ساتان حرير صناعي', 'main', 'ساتان', 'premium', 'mediterranean', 370, 520),
  m('جاكار محلي', 'main', 'جاكار مشجر', 'economy', 'nile', 245, 320),
  m('جاكار تركي', 'main', 'جاكار مشجر', 'standard', 'anadol', 400, 540),
  m('جاكار إيطالي', 'main', 'جاكار مشجر', 'premium', 'mediterranean', 560, 780),
  m('بلاك أوت خفيف', 'main', 'سادة بلاك أوت', 'economy', 'delta', 160, 210),
  m('بلاك أوت تقيل', 'main', 'سادة بلاك أوت', 'standard', 'delta', 230, 310),
  m('بلاك أوت ثلاثي الطبقات', 'main', 'سادة بلاك أوت', 'premium', 'delta', 320, 440),
  // بطانة
  m('بطانة عادية', 'lining', 'عادية', 'standard', 'nile', 50, 70),
  m('بطانة بلاك أوت', 'lining', 'بلاك أوت', 'premium', 'delta', 90, 120),
  m('بطانة بلاك أوت حراري', 'lining', 'حراري', 'premium', 'delta', 130, 170),
  // مجاري وكرانيش (سعر المتر للمجرى الواحد؛ المزدوج = عدد 2)
  m('مجرى ألومنيوم', 'track', 'مجرى', 'economy', 'amal', 120, 160, { unit: 'linear_meter' }),
  m('مجرى ألومنيوم تقيل', 'track', 'مجرى', 'standard', 'amal', 165, 220, { unit: 'linear_meter' }),
  m('مجرى ويفي', 'track', 'مجرى', 'premium', 'amal', 260, 340, { unit: 'linear_meter' }),
  m('كرنيشة (بلمت)', 'track', 'كرنيشة', 'standard', 'amal', 330, 450, { unit: 'linear_meter' }),
  // موتورات وإكسسوارات (بتتربط ببنود الموديلات)
  m('موتور مجرى ويفي', 'motor', null, 'standard', 'amal', 3000, 3800, { unit: 'piece' }),
  m('ريموت 5 قنوات', 'motor', null, 'standard', 'amal', 330, 450, { unit: 'piece' }),
  m('ربط بالموبايل (واي فاي)', 'motor', null, 'standard', 'amal', 680, 900, { unit: 'piece' }),
  m('شريط ويفي', 'accessory', null, 'standard', 'anadol', 18, 25, { unit: 'linear_meter' }),
  m('مسكات جانبية (رباط)', 'accessory', null, 'standard', 'amal', 85, 120, { unit: 'piece' }),
  m('شراشيب', 'accessory', null, 'standard', 'anadol', 65, 90, { unit: 'linear_meter' }),
];

type TemplateItem = Omit<ModelItemData, 'id' | 'materialId'>;

const item = (
  kind: TemplateItem['kind'],
  label: string,
  unitPrice: number,
  basis: TemplateItem['basis'],
  isRequired = true,
  quantity = 1,
): TemplateItem => ({ kind, label, unitPrice, basis, isRequired, quantity });

export type TemplateModel = Omit<CurtainModelData, 'items'> & { style: CurtainStyle; items: TemplateItem[] };

const waveAccessories = [
  item('accessory', 'شريط ويفي', 25, 'per_fabric_meter'),
  item('accessory', 'مسكات جانبية (رباط)', 120, 'per_side', false),
  item('accessory', 'شراشيب', 90, 'per_width_meter', false),
];

/** الـ 8 موديلات اللي بتتعمل لكل محل جديد (بنود بأسعار ثابتة، وبتتربط بالكتالوج لو اتضاف) */
export const templateModels: TemplateModel[] = [
  {
    name: 'كسرات (بينش بليه)',
    pricingMethod: 'linear_fullness',
    fullness: 2.5,
    laborPerUnit: 80,
    operation: 'manual',
    style: 'pinch_pleat',
    technicianNote: '',
    items: [item('accessory', 'شريط كسرات', 20, 'per_fabric_meter'), item('accessory', 'مسكات جانبية (رباط)', 120, 'per_side', false)],
  },
  {
    name: 'حلقات (إيليت)',
    pricingMethod: 'linear_fullness',
    fullness: 2,
    laborPerUnit: 70,
    operation: 'manual',
    style: 'eyelet',
    technicianNote: '',
    items: [item('accessory', 'حلقات معدن', 30, 'per_fabric_meter')],
  },
  {
    name: 'ويفي (موجة)',
    pricingMethod: 'linear_fullness',
    fullness: 2.5,
    laborPerUnit: 70,
    operation: 'manual',
    style: 'wave',
    technicianNote: '',
    items: waveAccessories,
  },
  {
    name: 'ويفي بريموت',
    pricingMethod: 'linear_fullness',
    fullness: 2.3,
    laborPerUnit: 85,
    operation: 'motorized',
    style: 'wave',
    technicianNote: 'تنبيه للفني وقت المعاينة: محتاج نقطة كهربا جنب الشباك',
    items: [
      item('operation', 'موتور مجرى ويفي', 3800, 'per_window'),
      item('operation', 'ريموت 5 قنوات', 450, 'per_window'),
      item('operation', 'ربط بالموبايل (واي فاي)', 900, 'per_window', false),
      item('operation', 'تركيب وبرمجة الموتور', 300, 'per_window'),
      ...waveAccessories,
    ],
  },
  {
    name: 'كشكشة عادية (شريط)',
    pricingMethod: 'linear_fullness',
    fullness: 2,
    laborPerUnit: 50,
    operation: 'manual',
    style: 'pencil_pleat',
    technicianNote: '',
    items: [],
  },
  {
    name: 'رومانية',
    pricingMethod: 'square_meter',
    fullness: 1,
    laborPerUnit: 150,
    operation: 'manual',
    style: 'roman',
    technicianNote: '',
    items: [],
  },
  {
    name: 'رومانية بريموت',
    pricingMethod: 'square_meter',
    fullness: 1,
    laborPerUnit: 150,
    operation: 'motorized',
    style: 'roman',
    technicianNote: 'تنبيه للفني وقت المعاينة: محتاج نقطة كهربا جنب الشباك',
    items: [
      item('operation', 'موتور رومانية', 2500, 'per_window'),
      item('operation', 'ريموت 5 قنوات', 450, 'per_window'),
      item('operation', 'تركيب وبرمجة الموتور', 300, 'per_window'),
    ],
  },
  {
    name: 'رول بلاك أوت بريموت',
    pricingMethod: 'square_meter',
    fullness: 1,
    laborPerUnit: 120,
    operation: 'motorized',
    style: 'roller',
    technicianNote: 'تنبيه للفني وقت المعاينة: محتاج نقطة كهربا جنب الشباك',
    items: [
      item('operation', 'موتور رول', 2200, 'per_window'),
      item('operation', 'ريموت 5 قنوات', 450, 'per_window'),
      item('operation', 'تركيب وبرمجة الموتور', 300, 'per_window'),
      item('accessory', 'كاسيت رول', 180, 'per_width_meter', false),
    ],
  },
];
