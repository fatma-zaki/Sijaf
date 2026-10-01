/** بيهرّب % و _ عشان بحث المستخدم يتعامل كنص عادي في ILIKE */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
