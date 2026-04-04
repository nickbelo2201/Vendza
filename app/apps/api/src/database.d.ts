declare module "@vendza/database" {
  export enum StoreUserRole {
    owner = "owner",
    manager = "manager",
    operator = "operator",
  }

  export enum InventoryMovementType {
    manual_adjustment = "manual_adjustment",
    replenishment = "replenishment",
    sale = "sale",
    cancellation = "cancellation",
  }

  export enum OrderStatus {
    pending = "pending",
    confirmed = "confirmed",
    preparing = "preparing",
    ready_for_delivery = "ready_for_delivery",
    out_for_delivery = "out_for_delivery",
    delivered = "delivered",
    cancelled = "cancelled",
  }

  export enum PaymentMethod {
    pix = "pix",
    cash = "cash",
    card_online = "card_online",
    card_on_delivery = "card_on_delivery",
  }

  export type PrismaClient = any;

  export namespace Prisma {
    type TransactionClient = any;
  }

  export const prisma: any;
}

declare module "pg" {
  export interface PoolConfig {
    connectionString?: string;
  }

  export class Pool {
    constructor(config?: PoolConfig);
  }
}
