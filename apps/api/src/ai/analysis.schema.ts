import { curtainStyles } from '@sijaf/shared';
import { z } from 'zod';

export const fabricLooks = ['velvet', 'linen', 'satin', 'jacquard', 'blackout', 'plain', 'other'] as const;
export type FabricLook = (typeof fabricLooks)[number];

/** الشكل بالعربي زي ما هو في الكتالوج (suggestedLooks) */
export const fabricLookNames: Record<FabricLook, string | null> = {
  velvet: 'قطيفة',
  linen: 'كتان',
  satin: 'ساتان',
  jacquard: 'جاكار مشجر',
  blackout: 'سادة بلاك أوت',
  plain: null,
  other: null,
};

/**
 * الـ JSON اللي Claude بيرجّعه (structured outputs).
 * structured outputs مابيدعمش min/max للأرقام، فالثقة بتتقصّ لـ 0–100 بعد الرد.
 */
export const curtainAnalysisSchema = z.object({
  is_curtain: z.boolean().describe('true if the photo shows curtains, drapes, blinds, or a window being measured for them'),
  image_quality: z.enum(['clear', 'unclear']).describe('unclear if too dark, blurry, cropped, or too far to judge the curtain'),
  style: z.enum(curtainStyles).describe('heading/construction style of the main curtain'),
  fabric_look: z.enum(fabricLooks).describe('look of the main (non-sheer) curtain fabric'),
  has_sheer: z.boolean().describe('a light see-through sheer/voile layer is present'),
  has_main: z.boolean().describe('a main opaque curtain layer is present'),
  lining_likely: z.boolean().describe('the main curtain appears lined (heavy drape, no light through it)'),
  track: z.enum(['single', 'double', 'none', 'hidden']).describe('visible curtain tracks/rails; double when two layers hang on separate rails'),
  valance: z.boolean().describe('a cornice/valance/pelmet box covers the top'),
  color: z.string().describe('dominant color of the main curtain, in Egyptian Arabic, one or two words'),
  confidence: z
    .object({
      style: z.number(),
      fabric_look: z.number(),
      sheer: z.number(),
      main: z.number(),
      lining: z.number(),
      track: z.number(),
      valance: z.number(),
    })
    .describe('confidence 0-100 for each judgment'),
  notes: z.string().describe('one short sentence in Egyptian Arabic for the shop technician, or empty string'),
});

export type CurtainAnalysis = z.infer<typeof curtainAnalysisSchema>;

const clamp = (value: number) => Math.round(Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0)));

/** بيقصّ الثقة لـ 0–100 (الموديل ممكن يكتب 0.9 بدل 90) */
export function normalizeAnalysis(result: CurtainAnalysis): CurtainAnalysis {
  const values = Object.values(result.confidence);
  const fractional = values.every((value) => value <= 1);
  const scale = (value: number) => clamp(fractional ? value * 100 : value);
  return {
    ...result,
    confidence: {
      style: scale(result.confidence.style),
      fabric_look: scale(result.confidence.fabric_look),
      sheer: scale(result.confidence.sheer),
      main: scale(result.confidence.main),
      lining: scale(result.confidence.lining),
      track: scale(result.confidence.track),
      valance: scale(result.confidence.valance),
    },
  };
}
