import type { PricingMaterial } from '@sijaf/shared';
import type { CurtainAnalysis } from '../ai/analysis.schema.js';
import { normalizeAnalysis } from '../ai/analysis.schema.js';
import { mapAnalysis } from './analysis-mapping.js';

const mat = (id: string, layer: PricingMaterial['layer'], look: string | null, tier: PricingMaterial['tier']): PricingMaterial => ({
  id,
  name: id,
  layer,
  look,
  tier,
  sellPrice: 100,
  topWidthM: 3,
});

const catalog = [
  mat('sheer-eco', 'sheer', 'سادة', 'economy'),
  mat('sheer-std', 'sheer', 'لينين', 'standard'),
  mat('velvet-std', 'main', 'قطيفة', 'standard'),
  mat('velvet-eco', 'main', 'قطيفة', 'economy'),
  mat('satin-std', 'main', 'ساتان', 'standard'),
  mat('linen-eco', 'main', 'كتان', 'economy'),
  mat('lining-std', 'lining', 'عادية', 'standard'),
  mat('rail-std', 'track', 'مجرى', 'standard'),
  mat('cornice-std', 'track', 'كرنيشة', 'standard'),
];

const models = [
  { id: 'wave-motor', style: 'wave' as const, operation: 'motorized' as const },
  { id: 'wave', style: 'wave' as const, operation: 'manual' as const },
  { id: 'roman', style: 'roman' as const, operation: 'manual' as const },
];

const result = (overrides: Partial<CurtainAnalysis> = {}): CurtainAnalysis => ({
  is_curtain: true,
  image_quality: 'clear',
  style: 'wave',
  fabric_look: 'velvet',
  has_sheer: true,
  has_main: true,
  lining_likely: true,
  track: 'double',
  valance: false,
  color: 'بيج',
  confidence: { style: 90, fabric_look: 88, sheer: 92, main: 95, lining: 85, track: 78, valance: 64 },
  notes: '',
  ...overrides,
});

describe('mapAnalysis', () => {
  it('maps the design example to the shop catalog', () => {
    const mapped = mapAnalysis(result(), models, catalog);
    expect(mapped.modelId).toBe('wave');
    expect(mapped.modelConfidence).toBe(90);
    expect(mapped.components).toEqual([
      { slot: 'sheer', materialId: 'sheer-std', included: true, confidence: 92 },
      { slot: 'main', materialId: 'velvet-std', included: true, confidence: 88 },
      { slot: 'lining', materialId: 'lining-std', included: true, confidence: 85 },
      { slot: 'track', materialId: 'rail-std', included: true, confidence: 78 },
      // ثقة 64% أقل من 70: الكرنيشة بتظهر متشالة
      { slot: 'cornice', materialId: 'cornice-std', included: false, confidence: 64 },
    ]);
    expect(mapped.useDefaultCornice).toBe(false);
    expect(mapped.confidence).toBe(87);
  });

  it('prefers the matching fabric look, then the standard tier, then any tier', () => {
    expect(mapAnalysis(result({ fabric_look: 'satin' }), models, catalog).components[1].materialId).toBe('satin-std');
    expect(mapAnalysis(result({ fabric_look: 'linen' }), models, catalog).components[1].materialId).toBe('linen-eco');
    // شكل مش في الكتالوج → أي قماش أساسي متوسط
    expect(mapAnalysis(result({ fabric_look: 'jacquard' }), models, catalog).components[1].materialId).toBe('velvet-std');
  });

  it('leaves out layers the photo does not show', () => {
    const mapped = mapAnalysis(result({ has_sheer: false, lining_likely: false, track: 'none' }), models, catalog);
    expect(mapped.components.filter((c) => c.included).map((c) => c.slot)).toEqual(['main']);
  });

  it('includes a confident cornice, falling back to the shop price when the catalog has none', () => {
    const confident = result({ valance: true, confidence: { ...result().confidence, valance: 85 } });
    expect(mapAnalysis(confident, models, catalog).components[4]).toMatchObject({ included: true, materialId: 'cornice-std' });
    const noCornice = mapAnalysis(confident, models, catalog.filter((m) => m.id !== 'cornice-std'));
    expect(noCornice.components[4]).toMatchObject({ included: false, materialId: null });
    expect(noCornice.useDefaultCornice).toBe(true);
  });

  it('does not guess a model when no model has that style', () => {
    const mapped = mapAnalysis(result({ style: 'eyelet' }), models, catalog);
    expect(mapped.modelId).toBeNull();
    expect(mapped.modelConfidence).toBe(0);
  });

  it('never includes a layer the catalog cannot price', () => {
    const mapped = mapAnalysis(result(), models, []);
    expect(mapped.components.every((c) => !c.included && c.materialId === null)).toBe(true);
  });
});

describe('normalizeAnalysis', () => {
  it('scales fractional confidence and clamps out-of-range values', () => {
    const fractional = normalizeAnalysis(result({ confidence: { style: 0.9, fabric_look: 0.5, sheer: 1, main: 0, lining: 0.25, track: 0.7, valance: 0.1 } }));
    expect(fractional.confidence.style).toBe(90);
    const wild = normalizeAnalysis(result({ confidence: { style: 150, fabric_look: -5, sheer: 50, main: 50, lining: 50, track: 50, valance: 50 } }));
    expect(wild.confidence).toMatchObject({ style: 100, fabric_look: 0 });
  });
});
