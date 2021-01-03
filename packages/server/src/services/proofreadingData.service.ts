import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/services/prisma.service';
import { LintRuleService } from '@/services/lintRule.service';
import { LintResultService } from '@/services/lintResult.service';

@Injectable()
export class ProofreadingDataService {
  constructor(
    private prismaService: PrismaService,
    private ruleService: LintRuleService,
    private resultService: LintResultService,
  ) {}

  async findMany() {
    return this.prismaService.proofreadingData.findMany();
  }

  async create(text: string, ruleNames: string[]) {
    const rules = await this.ruleService.create(ruleNames);
    const result = await this.resultService.create(text, ruleNames);
    return this.prismaService.proofreadingData.create({
      data: { text: text, rules: rules, result: result },
    });
  }
}
