import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LINK_OPENED_COOLDOWN_MINUTES, type PublicQuoteDto } from '@sijaf/shared';
import { and, asc, desc, eq, gt } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module.js';
import { clients, quoteEvents, quoteItems, quotes, shops, type QuoteRow, type ShopRow } from '../db/schema.js';
import { STORAGE, type FileStorage, type StoredFile } from '../storage/storage.js';

const notFound = () => new NotFoundException('العرض مش موجود');

/**
 * صفحة العميل: أي حد معاه الرابط يشوف العرض (read-only).
 * التوكن عشوائي 18 byte فمش ممكن يتخمّن؛ واللي بيطلع هنا بس اللي في العرض نفسه.
 */
@Injectable()
export class PublicQuotesService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(STORAGE) private readonly storage: FileStorage,
  ) {}

  async get(token: string): Promise<PublicQuoteDto> {
    const { quote, shop, clientName } = await this.find(token);
    // العرض اللي لسه ماتسعّرش مالوش صفحة
    if (!quote.tier) throw notFound();
    const items = await this.db
      .select({ key: quoteItems.key, kind: quoteItems.kind, label: quoteItems.label, total: quoteItems.lineTotal })
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, quote.id))
      .orderBy(asc(quoteItems.sortOrder));

    return {
      number: quote.number,
      status: quote.status,
      client: { name: clientName },
      roomLabel: quote.roomLabel,
      widthCm: quote.widthCm,
      heightCm: quote.heightCm,
      windowCount: quote.windowCount,
      modelName: quote.modelName,
      tier: quote.tier,
      items,
      discount: quote.discount,
      total: quote.total,
      depositAmount: quote.depositAmount,
      validUntil: quote.validUntil,
      createdAt: quote.createdAt.toISOString(),
      hasPhoto: quote.photoPaths.length > 0,
      shop: { name: shop.name, whatsapp: shop.whatsapp, address: shop.address, hasLogo: shop.logoPath !== null },
    };
  }

  /** آخر صورة (اللي اتحللت) */
  async photo(token: string): Promise<StoredFile> {
    const { quote } = await this.find(token);
    const key = quote.photoPaths.at(-1);
    const file = key ? await this.storage.get(key) : null;
    if (!file) throw new NotFoundException('مفيش صورة');
    return file;
  }

  async logo(token: string): Promise<StoredFile> {
    const { shop } = await this.find(token);
    const file = shop.logoPath ? await this.storage.get(shop.logoPath) : null;
    if (!file) throw new NotFoundException('مفيش لوجو');
    return file;
  }

  /** «العميل فتح رابط العرض»: مرة كل نص ساعة بالكتير عشان السجل مايتملاش */
  async recordOpened(token: string): Promise<void> {
    const { quote } = await this.find(token);
    const since = new Date(Date.now() - LINK_OPENED_COOLDOWN_MINUTES * 60_000);
    const [recent] = await this.db
      .select({ id: quoteEvents.id })
      .from(quoteEvents)
      .where(and(eq(quoteEvents.quoteId, quote.id), eq(quoteEvents.type, 'link_opened'), gt(quoteEvents.createdAt, since)))
      .orderBy(desc(quoteEvents.createdAt))
      .limit(1);
    if (recent) return;
    await this.db.insert(quoteEvents).values({ shopId: quote.shopId, quoteId: quote.id, actorId: null, type: 'link_opened', payload: {} });
  }

  async recordPdfDownloaded(token: string): Promise<void> {
    const { quote } = await this.find(token);
    await this.db.insert(quoteEvents).values({ shopId: quote.shopId, quoteId: quote.id, actorId: null, type: 'pdf_downloaded', payload: {} });
  }

  private async find(token: string): Promise<{ quote: QuoteRow; shop: ShopRow; clientName: string }> {
    const [row] = await this.db
      .select({ quote: quotes, shop: shops, clientName: clients.name })
      .from(quotes)
      .innerJoin(shops, eq(shops.id, quotes.shopId))
      .innerJoin(clients, eq(clients.id, quotes.clientId))
      .where(eq(quotes.publicToken, token));
    if (!row) throw notFound();
    return row;
  }
}
