import { redirect } from "next/navigation";

/** Bancos vive bajo Catálogos. */
export default function BancosPage() {
  redirect("/catalogos/bancos");
}
