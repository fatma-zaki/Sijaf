import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  addDays,
  cairoDate,
  cairoTime,
  cairoToUtc,
  type AppointmentData,
  type AppointmentDto,
  type AppointmentListQueryData,
} from '@sijaf/shared';
import { and, asc, eq, gte, lt, type SQL } from 'drizzle-orm';
import { ClientsService } from '../clients/clients.service.js';
import { DB, type Db } from '../db/db.module.js';
import type { Executor } from '../db/executor.js';
import { appointments, clients, quoteEvents, quotes, users } from '../db/schema.js';

const notFound = () => new NotFoundException('الموعد مش موجود');

/** أقصى فترة في طلب واحد (شهر ونص) */
const MAX_RANGE_DAYS = 45;

@Injectable()
export class ScheduleService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(ClientsService) private readonly clients: ClientsService,
  ) {}

  /** المواعيد في فترة (أيام بتوقيت القاهرة، والآخر داخل) */
  async list(shopId: string, query: AppointmentListQueryData): Promise<AppointmentDto[]> {
    if (query.to < query.from || addDays(query.from, MAX_RANGE_DAYS) < query.to) throw new BadRequestException('فترة غلط');
    return this.find(shopId, [
      gte(appointments.startsAt, cairoToUtc(query.from)),
      lt(appointments.startsAt, cairoToUtc(addDays(query.to, 1))),
      ...(query.technicianId ? [eq(appointments.technicianId, query.technicianId)] : []),
    ]);
  }

  /** مواعيد النهارده والموعد الجاي (للرئيسية) */
  async upcoming(shopId: string, technicianId: string | null): Promise<{ today: AppointmentDto[]; next: AppointmentDto | null }> {
    const now = new Date();
    const today = cairoDate(now);
    const mine = technicianId ? [eq(appointments.technicianId, technicianId)] : [];
    const [todayList, [next]] = await Promise.all([
      this.find(shopId, [gte(appointments.startsAt, cairoToUtc(today)), lt(appointments.startsAt, cairoToUtc(addDays(today, 1))), ...mine]),
      this.find(shopId, [gte(appointments.startsAt, now), ...mine], 1),
    ]);
    return { today: todayList, next: next ?? null };
  }

  async create(shopId: string, actorId: string, data: AppointmentData): Promise<AppointmentDto> {
    await this.validate(shopId, data);
    const id = await this.db.transaction(async (tx) => {
      const values = await this.values(tx, shopId, data);
      const [row] = await tx
        .insert(appointments)
        .values({ shopId, createdBy: actorId, ...values })
        .returning({ id: appointments.id });
      if (data.quoteId) {
        await tx.insert(quoteEvents).values({
          shopId,
          quoteId: data.quoteId,
          actorId,
          type: 'appointment_scheduled',
          payload: { appointmentType: data.type, startsAt: values.startsAt.toISOString() },
        });
      }
      return row.id;
    });
    return this.get(shopId, id);
  }

  async update(shopId: string, id: string, data: AppointmentData): Promise<AppointmentDto> {
    await this.get(shopId, id);
    await this.validate(shopId, data);
    await this.db.transaction(async (tx) => {
      const values = await this.values(tx, shopId, data);
      await tx
        .update(appointments)
        .set(values)
        .where(and(eq(appointments.id, id), eq(appointments.shopId, shopId)));
    });
    return this.get(shopId, id);
  }

  async remove(shopId: string, id: string): Promise<void> {
    const [row] = await this.db
      .delete(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.shopId, shopId)))
      .returning({ id: appointments.id });
    if (!row) throw notFound();
  }

  async get(shopId: string, id: string): Promise<AppointmentDto> {
    const [found] = await this.find(shopId, [eq(appointments.id, id)], 1);
    if (!found) throw notFound();
    return found;
  }

  // ---------- مساعدات ----------

  /** الفني والعرض لازم يكونوا من نفس المحل */
  private async validate(shopId: string, data: AppointmentData): Promise<void> {
    if (data.technicianId) {
      const [technician] = await this.db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, data.technicianId), eq(users.shopId, shopId), eq(users.isActive, true)));
      if (!technician) {
        throw new BadRequestException({ statusCode: 400, message: 'الفني مش موجود', fieldErrors: { technicianId: 'اختار فني من القايمة' } });
      }
    }
    if (data.quoteId) {
      const [quote] = await this.db
        .select({ id: quotes.id })
        .from(quotes)
        .where(and(eq(quotes.id, data.quoteId), eq(quotes.shopId, shopId)));
      if (!quote) throw new BadRequestException('العرض مش موجود');
    }
  }

  private async values(tx: Executor, shopId: string, data: AppointmentData) {
    // العميل بيتسجل برقمه (زي العروض)؛ تسليم القماش ممكن يبقى من غير رقم
    const clientId = data.clientPhone ? await this.clients.upsert(tx, shopId, data.clientName, data.clientPhone) : null;
    return {
      type: data.type,
      startsAt: cairoToUtc(data.date, data.time),
      title: data.clientName,
      clientId,
      quoteId: data.quoteId,
      technicianId: data.technicianId,
      address: data.address,
      notes: data.notes,
    };
  }

  private async find(shopId: string, conditions: SQL[], limit?: number): Promise<AppointmentDto[]> {
    const query = this.db
      .select({
        appointment: appointments,
        technicianName: users.fullName,
        clientPhone: clients.phone,
        clientArea: clients.area,
        quoteNumber: quotes.number,
      })
      .from(appointments)
      .leftJoin(users, eq(users.id, appointments.technicianId))
      .leftJoin(clients, eq(clients.id, appointments.clientId))
      .leftJoin(quotes, eq(quotes.id, appointments.quoteId))
      .where(and(eq(appointments.shopId, shopId), ...conditions))
      .orderBy(asc(appointments.startsAt));
    const rows = limit ? await query.limit(limit) : await query;
    return rows.map(({ appointment: a, technicianName, clientPhone, clientArea, quoteNumber }) => ({
      id: a.id,
      type: a.type,
      startsAt: a.startsAt.toISOString(),
      date: cairoDate(a.startsAt),
      time: cairoTime(a.startsAt),
      title: a.title,
      clientId: a.clientId,
      clientPhone: clientPhone ?? null,
      area: clientArea ?? '',
      address: a.address,
      notes: a.notes,
      technician: a.technicianId && technicianName ? { id: a.technicianId, name: technicianName } : null,
      quote: a.quoteId && quoteNumber !== null ? { id: a.quoteId, number: quoteNumber } : null,
    }));
  }
}
