import { Inject, Injectable } from '@nestjs/common';
import {
  addDays,
  cairoDate,
  cairoToUtc,
  monthStart,
  tiers,
  weekStart,
  type AccessTokenClaims,
  type DashboardDto,
  type ReportPeriod,
  type ReportsDto,
  type Tier,
} from '@sijaf/shared';
import { and, count, desc, eq, gte, inArray, isNotNull, lt, ne, sql } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module.js';
import { clients, materials, quoteItems, quotes, suppliers, users } from '../db/schema.js';
import { ScheduleService } from '../schedule/schedule.service.js';

const MONTHS_IN_CHART = 6;
const TOP_MATERIALS = 5;
const RECENT_QUOTES = 5;

const num = (value: unknown): number => Number(value ?? 0);
const money = (value: unknown): number => Math.round(num(value) * 100) / 100;

/** أول الفترة بتوقيت القاهرة */
export function periodStart(period: ReportPeriod, today: string): string {
  if (period === 'week') return weekStart(today);
  if (period === 'month') return monthStart(today);
  if (period === 'quarter') return monthStart(today, 2);
  return `${today.slice(0, 4)}-01-01`;
}

@Injectable()
export class ReportsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(ScheduleService) private readonly schedule: ScheduleService,
  ) {}

  /** لصاحب المحل بس: فيه أسعار الشراء والربح */
  async reports(shopId: string, period: ReportPeriod): Promise<ReportsDto> {
    const today = cairoDate(new Date());
    const since = cairoToUtc(periodStart(period, today));
    const chartSince = monthStart(today, MONTHS_IN_CHART - 1);
    const inPeriod = and(eq(quotes.shopId, shopId), gte(quotes.createdAt, since));
    const accepted = and(inPeriod, eq(quotes.status, 'accepted'));
    const cost = sql`(${quoteItems.unitPrice} - ${quoteItems.unitCost}) * ${quoteItems.quantity}`;

    const [[all], [sent], [acceptedRow], [profit], [accuracy], monthly, top, tierRows, supplierRows] = await Promise.all([
      this.db.select({ count: count() }).from(quotes).where(eq(quotes.shopId, shopId)),
      this.db
        .select({ count: count(), value: sql`coalesce(sum(${quotes.total}), 0)` })
        .from(quotes)
        .where(and(inPeriod, inArray(quotes.status, ['sent', 'accepted', 'rejected']))),
      this.db.select({ count: count(), value: sql`coalesce(sum(${quotes.total}), 0)` }).from(quotes).where(accepted),
      this.db
        .select({ value: sql`coalesce(sum(${cost}), 0)` })
        .from(quoteItems)
        .innerJoin(quotes, eq(quotes.id, quoteItems.quoteId))
        .where(and(accepted, isNotNull(quoteItems.unitCost))),
      this.db
        .select({ value: sql`avg(abs(${quotes.finalTotal} - ${quotes.total}) / ${quotes.total} * 100)` })
        .from(quotes)
        .where(and(inPeriod, isNotNull(quotes.finalTotal), sql`${quotes.total} > 0`)),
      this.db
        .select({ month: sql<string>`to_char(${quotes.createdAt} at time zone 'Africa/Cairo', 'YYYY-MM')`, count: count() })
        .from(quotes)
        .where(and(eq(quotes.shopId, shopId), gte(quotes.createdAt, cairoToUtc(chartSince))))
        .groupBy(sql`1`),
      this.db
        .select({ name: sql<string>`max(${quoteItems.label})`, count: sql`count(distinct ${quoteItems.quoteId})` })
        .from(quoteItems)
        .innerJoin(quotes, eq(quotes.id, quoteItems.quoteId))
        .where(and(inPeriod, eq(quoteItems.kind, 'fabric'), ne(quoteItems.key, 'fabric:lining'), isNotNull(quoteItems.materialId)))
        .groupBy(quoteItems.materialId)
        .orderBy(desc(sql`count(distinct ${quoteItems.quoteId})`), sql`max(${quoteItems.label})`)
        .limit(TOP_MATERIALS),
      this.db.select({ tier: quotes.tier, count: count() }).from(quotes).where(and(accepted, isNotNull(quotes.tier))).groupBy(quotes.tier),
      this.db
        .select({
          id: suppliers.id,
          name: suppliers.name,
          pricesUpdatedAt: suppliers.pricesUpdatedAt,
          quoteCount: sql`count(distinct ${quoteItems.quoteId})`,
          purchaseValue: sql`coalesce(sum(${quoteItems.unitCost} * ${quoteItems.quantity}) filter (where ${quotes.status} = 'accepted'), 0)`,
          profit: sql`coalesce(sum(${cost}) filter (where ${quotes.status} = 'accepted' and ${quoteItems.unitCost} is not null), 0)`,
        })
        .from(quoteItems)
        .innerJoin(quotes, eq(quotes.id, quoteItems.quoteId))
        .innerJoin(materials, eq(materials.id, quoteItems.materialId))
        .innerJoin(suppliers, eq(suppliers.id, materials.supplierId))
        .where(inPeriod)
        .groupBy(suppliers.id)
        .orderBy(desc(sql`count(distinct ${quoteItems.quoteId})`), suppliers.name),
    ]);

    const months = Array.from({ length: MONTHS_IN_CHART }, (_, index) => monthStart(today, MONTHS_IN_CHART - 1 - index).slice(0, 7));
    const tierCounts = Object.fromEntries(tiers.map((value) => [value, 0])) as Record<Tier, number>;
    for (const row of tierRows) if (row.tier) tierCounts[row.tier] = row.count;

    return {
      period,
      totalQuotes: all.count,
      sent: { count: sent.count, value: money(sent.value) },
      accepted: {
        count: acceptedRow.count,
        value: money(acceptedRow.value),
        rate: sent.count > 0 ? Math.round((acceptedRow.count / sent.count) * 100) : null,
      },
      expectedProfit: money(profit.value),
      accuracy: accuracy.value === null ? null : Math.round(num(accuracy.value) * 10) / 10,
      monthly: months.map((month) => ({ month, count: monthly.find((row) => row.month === month)?.count ?? 0 })),
      topMaterials: top.map((row) => ({ name: row.name, count: num(row.count) })),
      tiers: tierCounts,
      suppliers: supplierRows.map((row) => ({
        id: row.id,
        name: row.name,
        quoteCount: num(row.quoteCount),
        purchaseValue: money(row.purchaseValue),
        profit: money(row.profit),
        pricesUpdatedAt: row.pricesUpdatedAt.toISOString(),
      })),
    };
  }

  /** الرئيسية: أرقام العروض (للي بيعملوا عروض) ومواعيد النهارده */
  async dashboard(auth: AccessTokenClaims): Promise<DashboardDto> {
    const [user] = await this.db.select({ canQuote: users.canQuote }).from(users).where(eq(users.id, auth.sub));
    const canQuote = auth.role === 'owner' || Boolean(user?.canQuote);
    const [quoteStats, appointments] = await Promise.all([
      canQuote ? this.quoteStats(auth.shopId) : Promise.resolve(null),
      // صاحب المحل بيشوف مواعيد الكل، والفني مواعيده
      this.schedule.upcoming(auth.shopId, auth.role === 'owner' ? null : auth.sub),
    ]);
    return { quotes: quoteStats, todayAppointments: appointments.today, nextAppointment: appointments.next };
  }

  private async quoteStats(shopId: string): Promise<NonNullable<DashboardDto['quotes']>> {
    const today = cairoDate(new Date());
    const at = (date: string) => cairoToUtc(date).toISOString();
    const between = (from: string, to: string) => sql`${quotes.createdAt} >= ${at(from)} and ${quotes.createdAt} < ${at(to)}`;
    const thisMonth = monthStart(today);
    const lastMonth = monthStart(today, 1);
    const tomorrow = addDays(today, 1);
    const accepted = sql`${quotes.status} = 'accepted'`;

    const [[stats], recent] = await Promise.all([
      this.db
        .select({
          month: count(sql`case when ${between(thisMonth, tomorrow)} then 1 end`),
          lastMonth: count(sql`case when ${between(lastMonth, thisMonth)} then 1 end`),
          today: count(sql`case when ${between(today, tomorrow)} then 1 end`),
          yesterday: count(sql`case when ${between(addDays(today, -1), today)} then 1 end`),
          acceptedMonth: count(sql`case when ${accepted} and ${between(thisMonth, tomorrow)} then 1 end`),
          acceptedLastMonth: count(sql`case when ${accepted} and ${between(lastMonth, thisMonth)} then 1 end`),
        })
        .from(quotes)
        .where(and(eq(quotes.shopId, shopId), gte(quotes.createdAt, cairoToUtc(lastMonth)), lt(quotes.createdAt, cairoToUtc(tomorrow)))),
      this.db
        .select({ quote: quotes, client: clients })
        .from(quotes)
        .innerJoin(clients, eq(clients.id, quotes.clientId))
        .where(eq(quotes.shopId, shopId))
        .orderBy(desc(quotes.createdAt), desc(quotes.number))
        .limit(RECENT_QUOTES),
    ]);

    return {
      ...stats,
      recent: recent.map(({ quote, client }) => ({
        id: quote.id,
        number: quote.number,
        status: quote.status,
        clientName: client.name,
        clientPhone: client.phone,
        roomLabel: quote.roomLabel,
        modelName: quote.modelName,
        tier: quote.tier,
        total: quote.total,
        createdAt: quote.createdAt.toISOString(),
        widthCm: quote.widthCm,
        heightCm: quote.heightCm,
      })),
    };
  }
}
