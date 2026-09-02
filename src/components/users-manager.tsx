"use client";

import { useEffect, useState } from "react";
import { ROLE_LABELS, ROLES, type RoleKey } from "@/shared/modules";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  status: "activo" | "inactivo";
};

type EditForm = {
  name: string;
  email: string;
  role: RoleKey;
  password: string;
};

export function UsersManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "vendedor" as RoleKey });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", email: "", role: "vendedor", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al crear");
      return;
    }
    setForm({ name: "", email: "", password: "", role: "vendedor" });
    await load();
  }

  function startEdit(user: UserRow) {
    setEditId(user.id);
    setEditForm({ name: user.name, email: user.email, role: user.role, password: "" });
    setError("");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    const body: Record<string, string> = {
      id: editId,
      name: editForm.name,
      email: editForm.email,
      role: editForm.role,
    };
    if (editForm.password) body.password = editForm.password;
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar");
      return;
    }
    setEditId(null);
    await load();
  }

  async function toggleStatus(user: UserRow) {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: user.id,
        status: user.status === "activo" ? "inactivo" : "activo",
      }),
    });
    await load();
  }

  if (loading) return <p className="text-[var(--muted)]">Cargando…</p>;

  return (
    <div className="space-y-6">
      <form onSubmit={createUser} className="card grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 font-medium">Nuevo usuario</h2>
        <div className="field">
          <label>Nombre</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="field">
          <label>Correo</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
        </div>
        <div className="field">
          <label>Rol</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as RoleKey })}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        {error && !editId && <p className="md:col-span-2 text-[var(--danger)] text-sm">{error}</p>}
        <div className="md:col-span-2">
          <button type="submit" className="btn btn-primary">Crear usuario</button>
        </div>
      </form>

      {editId && (
        <form onSubmit={saveEdit} className="card grid gap-4 md:grid-cols-2 border border-[var(--border)]">
          <h2 className="md:col-span-2 font-medium">Editar usuario</h2>
          <div className="field">
            <label>Nombre</label>
            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
          </div>
          <div className="field">
            <label>Correo</label>
            <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
          </div>
          <div className="field">
            <label>Nueva contraseña (opcional)</label>
            <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} minLength={8} />
          </div>
          <div className="field">
            <label>Rol</label>
            <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as RoleKey })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          {error && <p className="md:col-span-2 text-[var(--danger)] text-sm">{error}</p>}
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="btn btn-primary">Guardar</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditId(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estatus</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{ROLE_LABELS[u.role]}</td>
                <td><span className={`badge ${u.status === "activo" ? "badge-success" : "badge-muted"}`}>{u.status}</span></td>
                <td className="flex gap-1">
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => startEdit(u)}>Editar</button>
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => toggleStatus(u)}>
                    {u.status === "activo" ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
