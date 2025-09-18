"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CellAction } from "./cell-action"
import Image from "next/image"

export type ProductColumn = {
  id: string
  name: string
  description?: string
  imageUrl?: string
  price: string[]
  size: string[]
  color: string[]
  category: string
  isFeatured: boolean
  isArchived: boolean
  createdAt: string
}

export const columns: ColumnDef<ProductColumn>[] = [
  {
    accessorKey: "imageUrl",
    header: "",
    cell: ({ row }) => (
      row.original.imageUrl ? (
        <Image
          width={50}
          height={50}
          src={row.original.imageUrl}
          alt={row.original.name}
          className="w-15 h-15 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-200" />
      )
    ),
  },
  {
    accessorKey: "name",
    header: "Название",
  },
  {
    accessorKey: "isArchived",
    header: "В архиве",
  },
  {
    accessorKey: "isFeatured",
    header: "Рекомендуемые товары",
  },
  {
    accessorKey: "price",
    header: "Цена",
    cell: ({ row }) => {
      const prices = row.original.price
      const chunks: string[][] = []
      for (let i = 0; i < prices.length; i += 4) {
        chunks.push(prices.slice(i, i + 4))
      }
      return (
        <div className="flex flex-col">
          {chunks.map((chunk, idx) => (
            <span key={idx}>{chunk.join(", ")}</span>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "category",
    header: "Категория",
  },
  {
    accessorKey: "size",
    header: "Размер",
    cell: ({ row }) => (
      <div className="flex flex-col">
        {row.original.size.map((s, idx) => (
          <span key={idx}>{s}</span>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "color",
    header: "Цвет",
    cell: ({ row }) => (
      <div className="flex flex-col">
        {row.original.color.map((c, idx) => (
          <span key={idx}>{c}</span>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
]
