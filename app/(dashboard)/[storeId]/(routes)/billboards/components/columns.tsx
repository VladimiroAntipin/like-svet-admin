"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CellAction } from "./cell-action"
import Image from "next/image"

export type BillboardColumn = {
  id: string
  imageUrl?: string
  label: string
  createdAt: string
}

export const columns: ColumnDef<BillboardColumn>[] = [
  {
    accessorKey: "imageUrl",
    header: "",
    cell: ({ row }) => (
      row.original.imageUrl ? (
        <Image
          src={row.original.imageUrl}
          alt={row.original.label}
          width={32}
          height={32}
          className="w-15 h-15 rounded-full object-cover"
        />
      ) : null
    ),
  },
  {
    accessorKey: "label",
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