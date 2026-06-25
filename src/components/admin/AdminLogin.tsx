"use client";

import { useState } from "react";

type AdminLoginProps = {
  onSuccess: () => void;
};

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      onSuccess();
    } else {
      setLoginError("Wrong password");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={handleLogin} className="card-romantic w-full max-w-sm p-8">
        <h1 className="font-display text-gradient mb-2 text-center text-3xl">
          Admin
        </h1>
        <p className="mb-6 text-center text-sm text-muted">
          Password login for now — Google sign-in after deploy.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="input-romantic mb-4 w-full px-4 py-3"
        />
        {loginError && (
          <p className="mb-4 text-center text-sm text-red-600">{loginError}</p>
        )}
        <button type="submit" className="btn-romantic w-full py-3">
          Sign in
        </button>
      </form>
    </main>
  );
}
