"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button className="rounded-md border border-gray-300 px-4 py-2 text-sm" onClick={logout} type="button">
      Se déconnecter
    </button>
  );
}
