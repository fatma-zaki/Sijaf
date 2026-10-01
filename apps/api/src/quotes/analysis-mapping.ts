import { TRACK_LOOK, CORNICE_LOOK, arabicKey, type ComponentSlot, type CurtainStyle, type PricingMaterial, type Tier } from '@sijaf/shared';
import { fabricLookNames, type CurtainAnalysis } from '../ai/analysis.schema.js';

/** الكرنيشة بتدخل العرض تلقائي لو الثقة كده أو أعلى؛ أقل من كده بتظهر متشالة و«راجعها» */
export const CORNICE_AUTO_INCLUDE = 70;

export type MappedComponent = { slot: ComponentSlot; materialId: string | null; included: boolean; confidence: number };

export type MappedAnalysis = {
  modelId: string | null;
  modelConfidence: number;
  components: MappedComponent[];
  useDefaultCornice: boolean;
  /** متوسط الثقة للي اتختار */
  confidence: number;
};

type ModelOption = { id: string; style: CurtainStyle; operation: 'manual' | 'motorized' };

// الاقتراح بيبدأ بالمتوسط (الأكثر استخدامًا)، وبعده الاقتصادي، والفاخر آخر حاجة
const TIER_PREFERENCE: Tier[] = ['standard', 'economy', 'premium'];

function pickMaterial(catalog: readonly PricingMaterial[], layer: PricingMaterial['layer'], look?: string | null): PricingMaterial | null {
  const inLayer = catalog.filter((m) => m.layer === layer);
  const lookKey = look ? arabicKey(look) : '';
  const matching = lookKey ? inLayer.filter((m) => arabicKey(m.look ?? '') === lookKey) : [];
  const pool = matching.length > 0 ? matching : inLayer;
  for (const tier of TIER_PREFERENCE) {
    const found = pool.find((m) => m.tier === tier);
    if (found) return found;
  }
  return null;
}

/** الموديل بنفس الشكل؛ الموتور مش باين في الصورة فاليدوي الأول */
function pickModel(models: readonly ModelOption[], style: CurtainStyle): ModelOption | null {
  const sameStyle = models.filter((m) => m.style === style);
  return sameStyle.find((m) => m.operation === 'manual') ?? sameStyle[0] ?? null;
}

/**
 * نتيجة التحليل ← اختيارات من كتالوج المحل.
 * التحليل بيقول «فيه شيفون وقماش قطيفة»؛ هنا بنختار «شيفون لينين» و«قطيفة تركي» من خامات المحل.
 */
export function mapAnalysis(result: CurtainAnalysis, models: readonly ModelOption[], catalog: readonly PricingMaterial[]): MappedAnalysis {
  const { confidence } = result;
  const model = pickModel(models, result.style);
  const tracks = catalog.filter((m) => m.layer === 'track');
  const rail = pickMaterial(tracks.filter((m) => m.look === TRACK_LOOK), 'track');
  const cornice = pickMaterial(tracks.filter((m) => m.look === CORNICE_LOOK), 'track');
  const mainLook = fabricLookNames[result.fabric_look];

  const component = (slot: ComponentSlot, material: PricingMaterial | null, wanted: boolean, score: number): MappedComponent => ({
    slot,
    materialId: material?.id ?? null,
    // مايدخلش العرض من غير خامة في الكتالوج
    included: wanted && material !== null,
    confidence: score,
  });

  const main = pickMaterial(catalog, 'main', mainLook);
  const wantsCornice = result.valance && confidence.valance >= CORNICE_AUTO_INCLUDE;
  const components = [
    component('sheer', pickMaterial(catalog, 'sheer'), result.has_sheer, confidence.sheer),
    component('main', main, result.has_main, mainLook ? Math.min(confidence.main, confidence.fabric_look) : confidence.main),
    component('lining', pickMaterial(catalog, 'lining'), result.has_main && result.lining_likely, confidence.lining),
    component('track', rail, result.track !== 'none', confidence.track),
    component('cornice', cornice, wantsCornice, confidence.valance),
  ];

  const scores = [...components.filter((c) => c.included).map((c) => c.confidence), ...(model ? [confidence.style] : [])];
  return {
    modelId: model?.id ?? null,
    // لو مفيش موديل بنفس الشكل، الموديل هيتختار يدوي
    modelConfidence: model ? confidence.style : 0,
    components,
    // كرنيشة ظاهرة والكتالوج مافيهوش كرنيشة: بسعر الإعدادات
    useDefaultCornice: wantsCornice && cornice === null,
    confidence: scores.length > 0 ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0,
  };
}
