declare module "@vendza/database" {
  export const StoreUserRole: {
    readonly owner: "owner";
    readonly manager: "manager";
    readonly operator: "operator";
  };
  export type StoreUserRole = (typeof StoreUserRole)[keyof typeof StoreUserRole];

  export const InventoryMovementType: {
    readonly manual_adjustment: "manual_adjustment";
    readonly replenishment: "replenishment";
    readonly sale: "sale";
    readonly cancellation: "cancellation";
  };
  export type InventoryMovementType =
    (typeof InventoryMovementType)[keyof typeof InventoryMovementType];

  export const OrderStatus: {
    readonly pending: "pending";
    readonly confirmed: "confirmed";
    readonly preparing: "preparing";
    readonly ready_for_delivery: "ready_for_delivery";
    readonly out_for_delivery: "out_for_delivery";
    readonly delivered: "delivered";
    readonly cancelled: "cancelled";
  };
  export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

  export const PaymentMethod: {
    readonly pix: "pix";
    readonly cash: "cash";
    readonly card_online: "card_online";
    readonly card_on_delivery: "card_on_delivery";
  };
  export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

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
