import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  FOLLOW_UP_DAYS,
  NEW_CLIENT_DAYS,
  cairoDate,
  cairoToUtc,
  monthStart,
  toLatinDigits,
  type ClientDto,
  type ClientListDto,
  type ClientListQueryData,
  type ClientTag,
  type CreateClientData,
} from '@sijaf/shared';
import { and, count, desc, eq, gte, ilike, sql, type SQL } from 'drizzle-orm';
import { escapeLike } from '../common/like.js';
import { DB, type Db } from '../db/db.module.js';
import type { Executor } from '../db/executor.js';
import { clients, quotes, type ClientRow } from '../db/schema.js';

const DAY_MS = 86_400_000;

function toClientDto(row: ClientRow): ClientDto {
  return { id: row.id, name: row.name, phone: row.phone, area: row.area, address: row.address };
}

@Injectable()
export class ClientsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(shopId: string, query: ClientListQueryData): Promise<ClientListDto> {
    const now = Date.now();
    const newSince = new Date(now - NEW_CLIENT_DAYS * DAY_MS);
    const staleSent = new Date(now - FOLLOW_UP_DAYS * DAY_MS);

    // ملخص العروض لكل عميل
    const summary = this.db
      .select({
        clientId: quotes.clientId,
        quoteCount: count().as('quote_count'),
        lastQuoteAt: sql<Date>`max(${quotes.createdAt})`.as('last_quote_at'),
        acceptedTotal: sql<string>`coalesce(sum(${quotes.total}) filter (where ${quotes.status} = 'accepted'), 0)`.as('accepted_total'),
        followup: sql<boolean>`bool_or(${quotes.status} = 'sent' and ${quotes.createdAt} < ${staleSent.toISOString()})`.as('followup'),
      })
      .from(quotes)
      .where(eq(quotes.shopId, shopId))
      .groupBy(quotes.clientId)
      .as('summary');

    const quoteCount = sql<number>`coalesce(${summary.quoteCount}, 0)`;
    const isFollowup = sql<boolean>`coalesce(${summary.followup}, false)`;
    const conditions: SQL[] = [eq(clients.shopId, shopId)];
    if (query.q) {
      const digits = toLatinDigits(query.q).replace(/[\s+-]/g, '');
      const search = /^\d{3,}$/.test(digits) ? ilike(clients.phone, `%${digits}%`) : ilike(clients.name, `%${escapeLike(query.q)}%`);
      conditions.push(search);
    }
    if (query.segment === 'new') conditions.push(gte(clients.createdAt, newSince));
    if (query.segment === 'repeat') conditions.push(sql`${quoteCount} >= 2`);
    if (query.segment === 'followup') conditions.push(sql`${isFollowup}`);
    const where = and(...conditions);

    const thisMonth = cairoToUtc(monthStart(cairoDate(new Date(now))));
    const lastMonth = cairoToUtc(monthStart(cairoDate(new Date(now)), 1));

    const [rows, [{ total }], [stats]] = await Promise.all([
      this.db
        .select({ client: clients, quoteCount, lastQuoteAt: summary.lastQuoteAt, acceptedTotal: summary.acceptedTotal, followup: isFollowup })
        .from(clients)
        .leftJoin(summary, eq(summary.clientId, clients.id))
        .where(where)
        .orderBy(desc(sql`coalesce(${summary.lastQuoteAt}, ${clients.createdAt})`), desc(clients.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db.select({ total: count() }).from(clients).leftJoin(summary, eq(summary.clientId, clients.id)).where(where),
      this.db
        .select({
          total: count(),
          newThisMonth: count(sql`case when ${clients.createdAt} >= ${thisMonth.toISOString()} then 1 end`),
          newLastMonth: count(
            sql`case when ${clients.createdAt} >= ${lastMonth.toISOString()} and ${clients.createdAt} < ${thisMonth.toISOString()} then 1 end`,
          ),
          repeat: count(sql`case when ${quoteCount} >= 2 then 1 end`),
        })
        .from(clients)
        .leftJoin(summary, eq(summary.clientId, clients.id))
        .where(eq(clients.shopId, shopId)),
    ]);

    return {
      items: rows.map(({ client, quoteCount: quotesNumber, lastQuoteAt, acceptedTotal, followup }) => {
        const quoteTotal = Number(quotesNumber);
        let tag: ClientTag | null = null;
        if (followup) tag = 'followup';
        else if (quoteTotal >= 2) tag = 'repeat';
        else if (client.createdAt >= newSince) tag = 'new';
        return {
          id: client.id,
          name: client.name,
          phone: client.phone,
          area: client.area,
          quoteCount: quoteTotal,
          lastQuoteAt: lastQuoteAt ? new Date(lastQuoteAt).toISOString() : null,
          acceptedTotal: Number(acceptedTotal ?? 0),
          tag,
        };
      }),
      total,
      page: query.page,
      pageSize: query.pageSize,
      stats: {
        total: stats.total,
        newThisMonth: stats.newThisMonth,
        newLastMonth: stats.newLastMonth,
        repeatPercent: stats.total > 0 ? Math.round((stats.repeat / stats.total) * 100) : 0,
      },
    };
  }

  /** «إضافة عميل» لعملاء المحل القدام؛ الرقم مايتكررش في نفس المحل */
  async create(shopId: string, data: CreateClientData): Promise<ClientDto> {
    const [row] = await this.db
      .insert(clients)
      .values({ shopId, name: data.name, phone: data.phone, area: data.area, address: data.address })
      .onConflictDoNothing({ target: [clients.shopId, clients.phone] })
      .returning();
    if (!row) {
      throw new ConflictException({ statusCode: 409, message: 'العميل ده متسجل قبل كده', fieldErrors: { phone: 'الرقم ده متسجل لعميل تاني' } });
    }
    return toClientDto(row);
  }

  /** لو الرقم موجود بيرجّع العميل (ويحدّث اسمه)، وإلا بيسجله */
  async upsert(executor: Executor, shopId: string, name: string, phone: string, area = ''): Promise<string> {
    const [row] = await executor
      .insert(clients)
      .values({ shopId, name, phone, area })
      .onConflictDoUpdate({ target: [clients.shopId, clients.phone], set: { name, ...(area ? { area } : {}) } })
      .returning({ id: clients.id });
    return row.id;
  }
}
