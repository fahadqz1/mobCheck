import { NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';

export function fieldErrors(error: ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function parseBody<T>(request: Request, schema: ZodSchema<T>) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { response: NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) } as const;
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      response: NextResponse.json(
        { error: 'Please correct the highlighted fields.', fields: fieldErrors(result.error) },
        { status: 400 }
      ),
    } as const;
  }
  return { data: result.data } as const;
}

export function serverError(context: string, error: unknown, message = 'Something went wrong. Please try again.') {
  console.error(`${context}:`, error);
  return NextResponse.json({ error: message }, { status: 500 });
}
