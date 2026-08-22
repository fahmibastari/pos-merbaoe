import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import IngredientTable from "./IngredientTable";

export const metadata: Metadata = { title: "Bahan Baku" };

export default async function IngredientsPage() {
  const ingredients = await prisma.ingredient.findMany({
    orderBy: { name: "asc" },
  });

  const serializedIngredients = JSON.parse(JSON.stringify(ingredients));

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1>Bahan Baku</h1>
          <p>Kelola stok dan pengaturan bahan baku kafe</p>
        </div>
      </div>
      <IngredientTable ingredients={serializedIngredients} />
    </div>
  );
}
