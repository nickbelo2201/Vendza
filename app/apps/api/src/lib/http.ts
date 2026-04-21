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

export function errorEnvelope(code: string, message: string) {
  return {
    data: null,
    meta: { requestedAt: new Date().toISOString(), stub: false },
    error: { code, message },
  };
}

export function notFound(message: string) {
  return errorEnvelope("NOT_FOUND", message);
}

export function badRequest(message: string) {
  return errorEnvelope("BAD_REQUEST", message);
}

export function forbidden(message: string) {
  return errorEnvelope("FORBIDDEN", message);
}
