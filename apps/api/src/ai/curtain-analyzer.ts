import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { Logger } from '@nestjs/common';
import type { StoredFile } from '../storage/storage.js';
import { curtainAnalysisSchema, normalizeAnalysis, type CurtainAnalysis } from './analysis.schema.js';

export type AnalyzerOutcome =
  | { status: 'ok'; result: CurtainAnalysis }
  /** مفيش مفتاح أو المفتاح غلط: العرض بيتعمل يدوي */
  | { status: 'unavailable' }
  /** خطأ مؤقت (الشبكة، زحمة، رد مش مفهوم): ممكن يتعاد */
  | { status: 'failed' }
  /** الموديل رفض الطلب: بنعامله كصورة مش واضحة */
  | { status: 'refused' };

export abstract class CurtainAnalyzer {
  abstract analyze(image: StoredFile): Promise<AnalyzerOutcome>;
}

export const CURTAIN_ANALYZER = Symbol('CURTAIN_ANALYZER');

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp';
const supportedTypes: readonly ImageMediaType[] = ['image/jpeg', 'image/png', 'image/webp'];

const OUTPUT_FORMAT = zodOutputFormat(curtainAnalysisSchema);

const SYSTEM_PROMPT = `You help curtain shops in Egypt price curtains from a photo.
Look at the photo and describe only what is visible: the curtain style, the layers (sheer, main fabric, lining), the tracks, and whether there is a cornice/valance box.
Do not estimate prices or measurements; the shop's catalog and formulas handle pricing.
If the photo shows an empty window (no curtain yet), judge what you can and give low confidence for the curtain details.
Give each confidence as an integer from 0 to 100, and be honest: low confidence is useful to the technician.
Write "color" and "notes" in short Egyptian Arabic.`;

/** Claude بيشوف الصورة ويرجّع JSON مطابق للـ schema؛ أي فشل بيتحول لحالة مش exception */
export class ClaudeCurtainAnalyzer extends CurtainAnalyzer {
  private readonly logger = new Logger(ClaudeCurtainAnalyzer.name);
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    super();
    // التحليل بياخد ثواني؛ مش بنستنى أكتر من دقيقة، ومحاولة واحدة زيادة لو فشل مؤقت
    this.client = new Anthropic({ apiKey, timeout: 60_000, maxRetries: 1 });
  }

  async analyze(image: StoredFile): Promise<AnalyzerOutcome> {
    const mediaType = supportedTypes.find((type) => type === image.contentType) ?? 'image/jpeg';
    try {
      const response = await this.client.messages.parse({
        model: this.model,
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        // وصف صورة مش محتاج تفكير عميق؛ الجهد القليل بيقلل الوقت والتكلفة (Haiku مابيدعمش effort)
        output_config: this.model.includes('haiku') ? { format: OUTPUT_FORMAT } : { effort: 'low', format: OUTPUT_FORMAT },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: image.bytes.toString('base64') } },
              { type: 'text', text: 'Analyze this curtain photo.' },
            ],
          },
        ],
      });

      if (response.stop_reason === 'refusal') return { status: 'refused' };
      if (!response.parsed_output) {
        this.logger.warn(`Unparseable analysis (stop_reason=${response.stop_reason})`);
        return { status: 'failed' };
      }
      return { status: 'ok', result: normalizeAnalysis(response.parsed_output) };
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
        this.logger.error('Anthropic API key rejected; image analysis disabled until it is fixed');
        return { status: 'unavailable' };
      }
      if (error instanceof Anthropic.APIError) {
        this.logger.warn(`Anthropic API error ${error.status ?? ''}: ${error.message}`);
        return { status: 'failed' };
      }
      this.logger.warn(`Image analysis failed: ${error instanceof Error ? error.message : String(error)}`);
      return { status: 'failed' };
    }
  }
}

/** من غير ANTHROPIC_API_KEY: العرض بيكمل يدوي */
export class DisabledCurtainAnalyzer extends CurtainAnalyzer {
  analyze(): Promise<AnalyzerOutcome> {
    return Promise.resolve({ status: 'unavailable' });
  }
}
