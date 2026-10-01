import { Global, Module } from '@nestjs/common';
import { ENV, type Env } from '../config/env.js';
import { LocalDiskStorage, STORAGE, SupabaseStorage, type FileStorage } from './storage.js';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE,
      inject: [ENV],
      useFactory: (env: Env): FileStorage =>
        env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
          ? new SupabaseStorage(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, env.STORAGE_BUCKET)
          : new LocalDiskStorage(env.STORAGE_DIR),
    },
  ],
  exports: [STORAGE],
})
export class StorageModule {}
