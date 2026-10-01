import { Inject, Injectable } from '@nestjs/common';
import { DEFAULT_PRICING_RULES, type PricingRules } from '@sijaf/shared';
import { eq } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module.js';
import { pricingRules, type PricingRulesRow } from '../db/schema.js';

function toRules(row: PricingRulesRow): PricingRules {
  return {
    installationPerWindow: row.installationPerWindow,
    cornicePerMeter: row.cornicePerMeter,
    defaultTopWidthM: row.defaultTopWidthM,
    depositPercent: row.depositPercent,
    validityDays: row.validityDays,
    allowances: { rail: row.railAllowance, flat: row.flatAllowance, drop: row.dropAllowance, roundingStep: row.roundingStep },
  };
}

function toColumns(rules: PricingRules) {
  return {
    installationPerWindow: rules.installationPerWindow,
    cornicePerMeter: rules.cornicePerMeter,
    defaultTopWidthM: rules.defaultTopWidthM,
    depositPercent: rules.depositPercent,
    validityDays: rules.validityDays,
    railAllowance: rules.allowances.rail,
    flatAllowance: rules.allowances.flat,
    dropAllowance: rules.allowances.drop,
    roundingStep: rules.allowances.roundingStep,
  };
}

@Injectable()
export class PricingRulesService {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** القواعد الافتراضية لحد ما صاحب المحل يعدّلها */
  async get(shopId: string): Promise<PricingRules> {
    const [row] = await this.db.select().from(pricingRules).where(eq(pricingRules.shopId, shopId));
    return row ? toRules(row) : DEFAULT_PRICING_RULES;
  }

  async update(shopId: string, rules: PricingRules): Promise<PricingRules> {
    const [row] = await this.db
      .insert(pricingRules)
      .values({ shopId, ...toColumns(rules) })
      .onConflictDoUpdate({ target: pricingRules.shopId, set: toColumns(rules) })
      .returning();
    return toRules(row);
  }
}
