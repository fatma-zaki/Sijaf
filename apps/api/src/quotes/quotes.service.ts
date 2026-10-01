import { randomBytes, randomUUID } from 'node:crypto';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CORNICE_LOOK,
  EMPTY_EDITS,
  MAX_QUOTE_PHOTOS,
  TRACK_LOOK,
  applyEdits,
  componentSlotLabels,
  componentSlots,
  priceTier,
  quoteTotals,
  type AnalysisStatus,
  type ComponentSlot,
  type CreateQuoteData,
  type PricingContextDto,
  type PricingEdits,
  type PricingInput,
  type PricingMaterial,
  type QuoteComponentDto,
  type QuoteDetailsData,
  type QuoteDto,
  type QuotePricingData,
} from '@sijaf/shared';
import { and, asc, eq, sql } from 'drizzle-orm';
import { CURTAIN_ANALYZER, type CurtainAnalyzer } from '../ai/curtain-analyzer.js';
import { ModelsService } from '../catalog/models.service.js';
import { DB, type Db } from '../db/db.module.js';
import type { Executor } from '../db/executor.js';
import {
  clients,
  materials,
  quoteComponents,
  quoteEvents,
  quoteItems,
  quotes,
  shops,
  users,
  type MaterialRow,
  type QuoteRow,
} from '../db/schema.js';
import { PricingRulesService } from '../pricing/pricing-rules.service.js';
import { STORAGE, type FileStorage, type StoredFile } from '../storage/storage.js';
import { mapAnalysis } from './analysis-mapping.js';

type QuoteEventType = (typeof quoteEvents.$inferInsert)['type'];

/** نوع الملف من أول bytes (مش من اسم الملف أو الـ header) */
function detectImageType(bytes: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.length > 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}
const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;

/** كل خانة لازم خامتها من الطبقة الصح (والمجرى مش كرنيشة) */
function fitsSlot(material: MaterialRow, slot: ComponentSlot): boolean {
  if (slot === 'track') return material.layer === 'track' && material.look === TRACK_LOOK;
  if (slot === 'cornice') return material.layer === 'track' && material.look === CORNICE_LOOK;
  return material.layer === slot;
}

function toPricingMaterial(row: MaterialRow): PricingMaterial {
  return { id: row.id, name: row.name, layer: row.layer, look: row.look, tier: row.tier, sellPrice: row.sellPrice, topWidthM: row.topWidthM };
}

function addDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const notFound = () => new NotFoundException('العرض مش موجود');

@Injectable()
export class QuotesService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(STORAGE) private readonly storage: FileStorage,
    @Inject(CURTAIN_ANALYZER) private readonly analyzer: CurtainAnalyzer,
    @Inject(ModelsService) private readonly models: ModelsService,
    @Inject(PricingRulesService) private readonly rules: PricingRulesService,
  ) {}

  // ---------- الخطوة 1 ----------

  async create(shopId: string, actorId: string, data: CreateQuoteData): Promise<QuoteDto> {
    const rules = await this.rules.get(shopId);
    const id = await this.db.transaction(async (tx) => {
      // العميل بيتسجل برقمه؛ لو موجود بنحدّث اسمه ومنطقته
      const [client] = await tx
        .insert(clients)
        .values({ shopId, name: data.clientName, phone: data.clientPhone, area: data.area })
        .onConflictDoUpdate({
          target: [clients.shopId, clients.phone],
          set: { name: data.clientName, ...(data.area ? { area: data.area } : {}) },
        })
        .returning({ id: clients.id });
      // الرقم بيتحجز في نفس الـ transaction عشان مايتكررش
      const [{ number }] = await tx
        .update(shops)
        .set({ nextQuoteNumber: sql`${shops.nextQuoteNumber} + 1` })
        .where(eq(shops.id, shopId))
        .returning({ number: sql<number>`${shops.nextQuoteNumber} - 1` });
      const [quote] = await tx
        .insert(quotes)
        .values({
          shopId,
          number,
          clientId: client.id,
          createdBy: actorId,
          roomLabel: data.roomLabel,
          depositPercent: rules.depositPercent,
          publicToken: randomBytes(18).toString('base64url'),
        })
        .returning({ id: quotes.id });
      await this.event(tx, shopId, quote.id, actorId, 'created', {});
      return quote.id;
    });
    return this.get(shopId, id);
  }

  async get(shopId: string, id: string): Promise<QuoteDto> {
    const [row] = await this.db
      .select({ quote: quotes, client: clients, createdByName: users.fullName })
      .from(quotes)
      .innerJoin(clients, eq(clients.id, quotes.clientId))
      .leftJoin(users, eq(users.id, quotes.createdBy))
      .where(and(eq(quotes.id, id), eq(quotes.shopId, shopId)));
    if (!row) throw notFound();

    const [componentRows, itemRows] = await Promise.all([
      this.db.select().from(quoteComponents).where(eq(quoteComponents.quoteId, id)),
      this.db.select().from(quoteItems).where(eq(quoteItems.quoteId, id)).orderBy(asc(quoteItems.sortOrder)),
    ]);
    const { quote, client } = row;
    const aiResult = quote.aiResult as { color?: string; notes?: string } | null;

    return {
      id: quote.id,
      number: quote.number,
      status: quote.status,
      client: { id: client.id, name: client.name, phone: client.phone, area: client.area },
      roomLabel: quote.roomLabel,
      widthCm: quote.widthCm,
      heightCm: quote.heightCm,
      windowCount: quote.windowCount,
      modelId: quote.modelId,
      modelName: quote.modelName,
      modelSource: quote.modelSource,
      modelConfidence: quote.modelConfidence,
      aiModelId: quote.aiModelId,
      operation: quote.operation,
      optionalItemIds: quote.optionalItemIds,
      useDefaultCornice: quote.useDefaultCornice,
      tier: quote.tier,
      photoCount: quote.photoPaths.length,
      analysis: quote.analysisStatus
        ? {
            status: quote.analysisStatus,
            confidence: quote.aiConfidence,
            color: aiResult?.color || null,
            notes: aiResult?.notes || null,
          }
        : null,
      components: componentSlots.flatMap((slot): QuoteComponentDto[] => {
        const c = componentRows.find((r) => r.slot === slot);
        return c
          ? [{ slot, materialId: c.materialId, included: c.included, source: c.source, confidence: c.confidence, aiMaterialId: c.aiMaterialId, aiIncluded: c.aiIncluded }]
          : [];
      }),
      // سعر الشراء (unit_cost) مابيطلعش هنا خالص
      items: itemRows.map((item) => ({
        key: item.key,
        kind: item.kind,
        label: item.label,
        materialId: item.materialId,
        quantity: item.quantity,
        quantityLabel: item.quantityLabel,
        unitPrice: item.unitPrice,
        total: item.lineTotal,
        source: item.source,
        isEdited: item.isEdited,
        originalQuantity: item.originalQuantity,
        originalUnitPrice: item.originalUnitPrice,
      })),
      subtotal: quote.subtotal,
      discount: quote.discount,
      total: quote.total,
      depositPercent: quote.depositPercent,
      depositAmount: quote.depositAmount,
      validUntil: quote.validUntil,
      createdAt: quote.createdAt.toISOString(),
      createdByName: row.createdByName,
    };
  }

  // ---------- الصور ----------

  async addPhoto(shopId: string, id: string, actorId: string, bytes: Buffer): Promise<QuoteDto> {
    const quote = await this.row(shopId, id);
    if (quote.photoPaths.length >= MAX_QUOTE_PHOTOS) {
      throw new BadRequestException(`أقصى عدد صور ${MAX_QUOTE_PHOTOS}`);
    }
    const contentType = detectImageType(bytes);
    if (!contentType) throw new BadRequestException('الملف لازم يبقى صورة JPG أو PNG');

    const key = `${shopId}/${id}/${randomUUID()}.${extensions[contentType]}`;
    await this.storage.put(key, { bytes, contentType });
    await this.db
      .update(quotes)
      .set({ photoPaths: sql`array_append(${quotes.photoPaths}, ${key})` })
      .where(and(eq(quotes.id, id), eq(quotes.shopId, shopId)));
    await this.event(this.db, shopId, id, actorId, 'photo_added', {});
    return this.get(shopId, id);
  }

  async getPhoto(shopId: string, id: string, index: number): Promise<StoredFile> {
    const quote = await this.row(shopId, id);
    const key = quote.photoPaths[index];
    const file = key ? await this.storage.get(key) : null;
    if (!file) throw new NotFoundException('الصورة مش موجودة');
    return file;
  }

  // ---------- التحليل ----------

  async analyze(shopId: string, id: string, actorId: string): Promise<{ status: AnalysisStatus; quote: QuoteDto }> {
    const quote = await this.row(shopId, id);
    // آخر صورة: لو الأولى مش واضحة، المستخدم بيرفع واحدة جديدة وبتتحلل هي
    const latest = quote.photoPaths.at(-1);
    const image = latest ? await this.storage.get(latest) : null;
    if (!image) {
      await this.setAnalysis(shopId, id, actorId, 'skipped', null, null);
      return { status: 'skipped', quote: await this.get(shopId, id) };
    }

    const outcome = await this.analyzer.analyze(image);
    if (outcome.status !== 'ok') {
      const status: AnalysisStatus = outcome.status === 'refused' ? 'unclear' : outcome.status;
      await this.setAnalysis(shopId, id, actorId, status, null, null);
      return { status, quote: await this.get(shopId, id) };
    }

    const { result } = outcome;
    if (!result.is_curtain || result.image_quality === 'unclear') {
      const status: AnalysisStatus = result.is_curtain ? 'unclear' : 'not_curtain';
      await this.setAnalysis(shopId, id, actorId, status, result, null);
      return { status, quote: await this.get(shopId, id) };
    }

    const [modelList, catalog] = await Promise.all([this.models.list(shopId), this.catalog(shopId)]);
    const mapped = mapAnalysis(result, modelList, catalog.map(toPricingMaterial));
    const model = modelList.find((m) => m.id === mapped.modelId);

    await this.db.transaction(async (tx) => {
      await tx.delete(quoteComponents).where(eq(quoteComponents.quoteId, id));
      await tx.insert(quoteComponents).values(
        mapped.components.map((c) => ({
          quoteId: id,
          shopId,
          slot: c.slot,
          materialId: c.materialId,
          included: c.included,
          source: 'ai' as const,
          confidence: c.confidence,
          aiMaterialId: c.materialId,
          aiIncluded: c.included,
        })),
      );
      await tx
        .update(quotes)
        .set({
          modelId: model?.id ?? null,
          modelName: model?.name ?? null,
          modelSource: model ? 'ai' : null,
          modelConfidence: model ? mapped.modelConfidence : null,
          aiModelId: model?.id ?? null,
          operation: model?.operation ?? 'manual',
          useDefaultCornice: mapped.useDefaultCornice,
        })
        .where(eq(quotes.id, id));
    });
    await this.setAnalysis(shopId, id, actorId, 'ok', result, mapped.confidence);
    return { status: 'ok', quote: await this.get(shopId, id) };
  }

  // ---------- الخطوة 2 ----------

  async saveDetails(shopId: string, id: string, actorId: string, data: QuoteDetailsData): Promise<QuoteDto> {
    const quote = await this.row(shopId, id);
    const model = await this.models.get(shopId, data.modelId).catch(() => {
      throw new BadRequestException({ statusCode: 400, message: 'الموديل مش موجود', fieldErrors: { modelId: 'اختار موديل من القايمة' } });
    });

    const catalog = new Map((await this.catalog(shopId)).map((m) => [m.id, m]));
    for (const [index, c] of data.components.entries()) {
      const material = c.materialId ? catalog.get(c.materialId) : undefined;
      if (c.materialId && (!material || !fitsSlot(material, c.slot))) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'فيه خامة مش مناسبة للخانة بتاعتها',
          fieldErrors: { [`components.${index}.materialId`]: 'اختار خامة من القايمة' },
        });
      }
    }
    const optional = new Set(model.items.filter((item) => !item.isRequired).map((item) => item.id));
    const optionalItemIds = data.optionalItemIds.filter((itemId) => optional.has(itemId));

    const previous = new Map((await this.db.select().from(quoteComponents).where(eq(quoteComponents.quoteId, id))).map((c) => [c.slot, c]));
    await this.db.transaction(async (tx) => {
      for (const c of data.components) {
        const before = previous.get(c.slot);
        // «من الذكاء الاصطناعي» طالما الاختيار زي اقتراحه بالظبط
        const matchesAi = before?.aiMaterialId !== undefined && before.aiMaterialId === c.materialId && before.aiIncluded === c.included;
        const values = {
          materialId: c.materialId,
          included: c.included && c.materialId !== null,
          source: matchesAi ? ('ai' as const) : ('manual' as const),
        };
        await tx
          .insert(quoteComponents)
          .values({ quoteId: id, shopId, slot: c.slot, ...values, confidence: null, aiMaterialId: null, aiIncluded: null })
          .onConflictDoUpdate({ target: [quoteComponents.quoteId, quoteComponents.slot], set: values });

        // «اتعدّل القماش الأساسي · ساتان تركي ← قطيفة تركي»
        if (before && before.materialId !== c.materialId && before.materialId && c.materialId) {
          await this.event(tx, shopId, id, actorId, 'component_changed', {
            slot: c.slot,
            label: componentSlotLabels[c.slot],
            from: catalog.get(before.materialId)?.name ?? null,
            to: catalog.get(c.materialId)?.name ?? null,
          });
        }
      }
      await tx
        .update(quotes)
        .set({
          modelId: model.id,
          modelName: model.name,
          modelSource: quote.aiModelId === model.id ? 'ai' : 'manual',
          operation: data.operation,
          widthCm: data.widthCm,
          heightCm: data.heightCm,
          windowCount: data.windowCount,
          roomLabel: data.roomLabel,
          optionalItemIds,
          useDefaultCornice: data.useDefaultCornice,
        })
        .where(eq(quotes.id, id));
    });

    // لو العرض اتسعّر قبل كده، الأسعار بتتحسب تاني بالتفاصيل الجديدة
    if (quote.tier) {
      await this.savePricing(shopId, id, actorId, { tier: quote.tier, edits: quote.edits ?? EMPTY_EDITS, discount: quote.discount }, false);
    }
    return this.get(shopId, id);
  }

  // ---------- الخطوة 3 ----------

  async pricingContext(shopId: string, id: string): Promise<PricingContextDto> {
    const quote = await this.row(shopId, id);
    const input = await this.pricingInput(shopId, quote);
    const rules = await this.rules.get(shopId);
    return {
      input,
      tier: quote.tier ?? 'standard',
      edits: quote.edits ?? EMPTY_EDITS,
      discount: quote.discount,
      depositPercent: rules.depositPercent,
    };
  }

  async savePricing(
    shopId: string,
    id: string,
    actorId: string,
    data: Omit<QuotePricingData, 'edits'> & { edits: PricingEdits },
    logEvent = true,
  ): Promise<QuoteDto> {
    const quote = await this.row(shopId, id);
    const [input, rules, catalog] = await Promise.all([this.pricingInput(shopId, quote), this.rules.get(shopId), this.catalog(shopId)]);
    const priced = priceTier(input, data.tier);

    // تعديلات على بنود مش موجودة (الموديل اتغيّر مثلًا) بتتشال
    const keys = new Set(priced.lines.map((line) => line.key));
    const edits: PricingEdits = {
      overrides: Object.fromEntries(Object.entries(data.edits.overrides).filter(([key]) => keys.has(key))),
      removed: data.edits.removed.filter((key) => keys.has(key)),
      manual: data.edits.manual.map((line, index) => ({ ...line, key: `manual:${index + 1}` })),
    };
    const lines = applyEdits(priced.lines, edits);
    const totals = quoteTotals(lines, data.discount, rules.depositPercent);
    const costs = new Map(catalog.map((m) => [m.id, m.purchasePrice]));

    await this.db.transaction(async (tx) => {
      await tx.delete(quoteItems).where(eq(quoteItems.quoteId, id));
      if (lines.length > 0) {
        await tx.insert(quoteItems).values(
          lines.map((line, index) => ({
            quoteId: id,
            shopId,
            key: line.key,
            kind: line.kind,
            label: line.label,
            materialId: line.materialId,
            quantity: line.quantity,
            quantityLabel: line.quantityLabel,
            unitPrice: line.unitPrice,
            unitCost: line.materialId ? (costs.get(line.materialId) ?? null) : null,
            lineTotal: line.total,
            source: line.source,
            isEdited: line.isEdited,
            originalQuantity: line.originalQuantity,
            originalUnitPrice: line.originalUnitPrice,
            sortOrder: index,
          })),
        );
      }
      await tx
        .update(quotes)
        .set({
          tier: data.tier,
          edits,
          subtotal: totals.subtotal,
          discount: totals.discount,
          total: totals.total,
          depositPercent: rules.depositPercent,
          depositAmount: totals.deposit,
          validUntil: addDays(rules.validityDays),
          // المسودة اللي اتسعّرت بتبقى «قيد المراجعة» لحد ما تتبعت
          ...(quote.status === 'draft' ? { status: 'review' as const } : {}),
        })
        .where(eq(quotes.id, id));
      if (logEvent) await this.event(tx, shopId, id, actorId, 'priced', { tier: data.tier, total: totals.total });
    });
    return this.get(shopId, id);
  }

  // ---------- مساعدات ----------

  private async row(shopId: string, id: string): Promise<QuoteRow> {
    const [row] = await this.db.select().from(quotes).where(and(eq(quotes.id, id), eq(quotes.shopId, shopId)));
    if (!row) throw notFound();
    return row;
  }

  private catalog(shopId: string): Promise<MaterialRow[]> {
    return this.db.select().from(materials).where(eq(materials.shopId, shopId));
  }

  private async pricingInput(shopId: string, quote: QuoteRow): Promise<PricingInput> {
    if (!quote.modelId || !quote.widthCm || !quote.heightCm) {
      throw new BadRequestException('كمّل تفاصيل العرض الأول (الموديل والمقاسات)');
    }
    const [model, catalog, rules, componentRows] = await Promise.all([
      this.models.get(shopId, quote.modelId),
      this.catalog(shopId),
      this.rules.get(shopId),
      this.db.select().from(quoteComponents).where(eq(quoteComponents.quoteId, quote.id)),
    ]);
    const selections: PricingInput['selections'] = {};
    for (const c of componentRows) if (c.included && c.materialId) selections[c.slot] = c.materialId;
    return {
      widthCm: quote.widthCm,
      heightCm: quote.heightCm,
      windowCount: quote.windowCount,
      model: { pricingMethod: model.pricingMethod, fullness: model.fullness, laborPerUnit: model.laborPerUnit, items: model.items },
      operation: quote.operation,
      optionalItemIds: quote.optionalItemIds,
      selections,
      useDefaultCornice: quote.useDefaultCornice && !selections.cornice,
      catalog: catalog.map(toPricingMaterial),
      rules,
    };
  }

  private async setAnalysis(
    shopId: string,
    id: string,
    actorId: string,
    status: AnalysisStatus,
    result: unknown,
    confidence: number | null,
  ): Promise<void> {
    await this.db
      .update(quotes)
      .set({ analysisStatus: status, aiResult: result ?? null, aiConfidence: confidence })
      .where(and(eq(quotes.id, id), eq(quotes.shopId, shopId)));
    await this.event(this.db, shopId, id, actorId, 'analyzed', { status, confidence });
  }

  private async event(db: Executor, shopId: string, quoteId: string, actorId: string, type: QuoteEventType, payload: Record<string, unknown>) {
    await db.insert(quoteEvents).values({ shopId, quoteId, actorId, type, payload });
  }
}
