import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RecipeBuilder from "./RecipeBuilder";

export const metadata: Metadata = { title: "Penyusun Resep" };

export default async function ProductRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();

  const [product, ingredients] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: {
        recipes: {
          orderBy: { ingredient: { name: "asc" } },
          select: {
            id: true,
            ingredientId: true,
            quantityNeeded: true,
          },
        },
      },
    }),
    prisma.ingredient.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        unit: true,
        averageCost: true,
        isActive: true,
      },
    }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--space-md)",
        }}
      >
        <div>
          <h1>Resep {product.name}</h1>
          <p>Susun bahan dan takaran untuk satu porsi menu</p>
        </div>
        <Link href="/admin/products" className="btn btn-secondary">
          <Icon name="arrow-left" /> Kembali ke Menu
        </Link>
      </div>

      <RecipeBuilder
        product={{
          id: product.id,
          name: product.name,
          sellingPrice: Number(product.sellingPrice),
          baseHpp: Number(product.baseHpp),
          hasRecipe: product.hasRecipe,
          recipes: product.recipes.map((recipe) => ({
            id: recipe.id,
            ingredientId: recipe.ingredientId,
            quantityNeeded: Number(recipe.quantityNeeded),
          })),
        }}
        ingredients={ingredients.map((ingredient) => ({
          ...ingredient,
          averageCost: Number(ingredient.averageCost),
        }))}
      />
    </div>
  );
}
