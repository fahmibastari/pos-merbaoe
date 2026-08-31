import { Prisma } from "@/generated/prisma";
import { ActionError } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { productCategorySlug } from "@/lib/product-category";

type CategoryInput = { name: string; sortOrder: number };
type LockedCategory = {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

async function lockCategory(
  tx: Prisma.TransactionClient,
  id: number,
): Promise<LockedCategory> {
  const [category] = await tx.$queryRaw<LockedCategory[]>(Prisma.sql`
    SELECT
      id,
      name,
      slug,
      sort_order AS "sortOrder",
      is_active AS "isActive"
    FROM product_categories
    WHERE id = ${id}
    FOR UPDATE
  `);
  if (!category) throw new ActionError("Kategori tidak ditemukan.");
  return category;
}

function categorySlugOrThrow(name: string): string {
  const slug = productCategorySlug(name);
  if (!slug) {
    throw new ActionError(
      "Nama kategori harus memuat setidaknya satu huruf atau angka.",
    );
  }
  return slug;
}

function uniqueCategoryError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new ActionError("Nama kategori tersebut sudah digunakan.");
  }
  throw error;
}

export async function createProductCategory(
  userId: number,
  input: CategoryInput,
) {
  const slug = categorySlugOrThrow(input.name);
  try {
    return await prisma.$transaction(async (tx) => {
      const category = await tx.productCategory.create({
        data: { ...input, slug, isActive: true },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: "create",
          entity: "product_category",
          entityId: category.id,
          afterData: {
            name: category.name,
            slug: category.slug,
            sortOrder: category.sortOrder,
            isActive: category.isActive,
          },
        },
      });
      return category;
    });
  } catch (error) {
    uniqueCategoryError(error);
  }
}

export async function updateProductCategory(
  userId: number,
  id: number,
  input: CategoryInput,
) {
  const slug = categorySlugOrThrow(input.name);
  try {
    return await prisma.$transaction(async (tx) => {
      const before = await lockCategory(tx, id);
      const category = await tx.productCategory.update({
        where: { id },
        data: { ...input, slug },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: "update",
          entity: "product_category",
          entityId: id,
          beforeData: before,
          afterData: {
            name: category.name,
            slug: category.slug,
            sortOrder: category.sortOrder,
            isActive: category.isActive,
          },
        },
      });
      return category;
    });
  } catch (error) {
    uniqueCategoryError(error);
  }
}

export async function setProductCategoryActive(
  userId: number,
  id: number,
  nextActive: boolean,
) {
  return prisma.$transaction(async (tx) => {
    const before = await lockCategory(tx, id);
    if (before.isActive === nextActive) return before;

    if (!nextActive) {
      const activeProducts = await tx.product.count({
        where: { categoryId: id, isActive: true },
      });
      if (activeProducts > 0) {
        throw new ActionError(
          `Kategori masih dipakai oleh ${activeProducts} menu aktif. Pindahkan atau nonaktifkan menunya terlebih dahulu.`,
        );
      }
    }

    const category = await tx.productCategory.update({
      where: { id },
      data: { isActive: nextActive },
    });
    await tx.auditLog.create({
      data: {
        userId,
        action: nextActive ? "activate" : "deactivate",
        entity: "product_category",
        entityId: id,
        beforeData: before,
        afterData: {
          name: category.name,
          slug: category.slug,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
        },
      },
    });
    return category;
  });
}
