import { NextResponse } from 'next/server';
import { z, ZodError, ZodTypeAny } from 'zod';

export function fieldErrors(error: ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function parseBody<S extends ZodTypeAny>(
  request: Request,
  schema: S
): Promise<{ data: z.output<S>; response?: undefined } | { data?: undefined; response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { response: NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      response: NextResponse.json(
        { error: 'Please correct the highlighted fields.', fields: fieldErrors(result.error) },
        { status: 400 }
      ),
    };
  }
  return { data: result.data };
}

export function serverError(context: string, error: unknown, message = 'Something went wrong. Please try again.') {
  console.error(`${context}:`, error);
  return NextResponse.json({ error: message }, { status: 500 });
}
