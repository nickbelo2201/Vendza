import { prisma, StoreUserRole } from "@vendza/database";

export type PartnerContext = {
  userId: string;
  storeId: string;
  storeUserId: string;
  role: StoreUserRole;
};

export async function resolvePartnerContext(authUserId: string): Promise<PartnerContext | null> {
  const storeUser = await prisma.storeUser.findFirst({
    where: {
      authUserId,
      isActive: true,
    },
    select: {
      id: true,
      storeId: true,
      role: true,
    },
  });

  if (!storeUser) {
    return null;
  }

  return {
    userId: authUserId,
    storeId: storeUser.storeId,
    storeUserId: storeUser.id,
    role: storeUser.role,
  };
}
