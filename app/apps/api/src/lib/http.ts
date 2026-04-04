import { Type, type TSchema } from "@sinclair/typebox";

export function envelopeSchema<T extends TSchema>(data: T) {
  return Type.Object({
    data,
    meta: Type.Object({
      requestedAt: Type.String({ format: "date-time" }),
      stub: Type.Optional(Type.Boolean()),
    }),
    error: Type.Optional(
      Type.Union([
        Type.Object({
          statusCode: Type.Integer(),
          message: Type.String(),
        }),
        Type.Null(),
      ]),
    ),
  });
}

export function ok<T>(data: T, meta: Record<string, unknown> = {}) {
  return {
    data,
    meta: {
      requestedAt: new Date().toISOString(),
      ...meta,
    },
    error: null,
  };
}
