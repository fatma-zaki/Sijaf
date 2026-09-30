import type { Db } from './db.module.js';

/** الـ db نفسه أو transaction جواه؛ عشان نفس الدالة تشتغل في الحالتين */
export type Executor = Db | Parameters<Parameters<Db['transaction']>[0]>[0];
