"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CellAction } from "./cell-action"
import Image from "next/image"

export type CategoryColumn = {
  id: string
  name: string
  imageUrl?: string
  createdAt: string
}

export const columns: ColumnDef<CategoryColumn>[] = [
  {
    accessorKey: "imageUrl",
    header: "",
    cell: ({ row }) => (
      row.original.imageUrl ? (
        <Image
          src={row.original.imageUrl}
          alt={row.original.name}
          width={32}
          height={32}
          className="w-15 h-15 rounded-full object-cover"
        />
      ) : null
    ),
    size: 50, 
  },
  {
    accessorKey: "name",
    header: "Название",
  },
  {
    accessorKey: "createdAt",
    header: "Дата",
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => <CellAction data={row.original} />,
  }
]