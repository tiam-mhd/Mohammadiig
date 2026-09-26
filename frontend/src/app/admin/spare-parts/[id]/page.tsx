"use client";

import { useParams } from "next/navigation";
import { SparePartEditorPage } from "@/components/admin/SparePartEditorPage";

export default function AdminEditSparePartPage() {
  const params = useParams<{ id: string }>();
  return <SparePartEditorPage partId={params.id} />;
}
