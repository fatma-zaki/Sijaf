import { Global, Module } from '@nestjs/common';
import { ENV, type Env } from '../config/env.js';
import { CURTAIN_ANALYZER, ClaudeCurtainAnalyzer, DisabledCurtainAnalyzer, type CurtainAnalyzer } from './curtain-analyzer.js';

@Global()
@Module({
  providers: [
    {
      provide: CURTAIN_ANALYZER,
      inject: [ENV],
      useFactory: (env: Env): CurtainAnalyzer =>
        env.ANTHROPIC_API_KEY ? new ClaudeCurtainAnalyzer(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL) : new DisabledCurtainAnalyzer(),
    },
  ],
  exports: [CURTAIN_ANALYZER],
})
export class AiModule {}
