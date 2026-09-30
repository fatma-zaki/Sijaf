import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { zodFieldErrors, type ApiErrorBody } from '@sijaf/shared';
import type { z } from 'zod';

/** بيعمل validation بنفس الـ schema اللي الفرونت بيستخدمه، وبيرجّع أخطاء الحقول بالعربي */
export class ZodPipe<Schema extends z.ZodType> implements PipeTransform<unknown, z.output<Schema>> {
  constructor(private readonly schema: Schema) {}

  transform(value: unknown): z.output<Schema> {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    const body: ApiErrorBody = {
      statusCode: 400,
      message: 'راجع البيانات المكتوبة',
      fieldErrors: zodFieldErrors(result.error),
    };
    throw new BadRequestException(body);
  }
}
