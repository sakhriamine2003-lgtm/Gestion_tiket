"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import api from "@/app/connexions/axios";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const user = response.data;

      console.log("Utilisateur connecté :", user);

      if (!user.user_role) {
        setError("Le rôle utilisateur est manquant.");
        return;
      }

      // Redirection selon le rôle
      switch (user.user_role) {
        case "admin":
          router.push("/products_frontend/Gestion_role/admin");
          break;

        case "responsable":
          router.push("/products_frontend/Gestion_role/responsable");
          break;

        case "utilisateur":
          router.push("/products_frontend/Gestion_role/utilisateur");
          break;

        default:
          setError("Rôle utilisateur invalide.");
          return;
      }

      router.refresh();
    } catch (error) {
      console.error("LOGIN FRONTEND ERROR:", error);

      if (isAxiosError(error)) {
        setError(
          error.response?.data?.error ||
          "Erreur lors de la connexion."
        );
      } else {
        setError("Erreur lors de la connexion.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full space-y-5 rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-semibold">
            Connexion
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Accédez à votre espace.
          </p>
        </div>

        <label className="block text-sm font-medium">
          Email

          <input
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="block text-sm font-medium">
          Mot de passe

          <input
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </main>
  );
}