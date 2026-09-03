"use client";

import { useEffect, useState } from "react";
import { QuickAddField } from "@/components/quick-add-field";
import { MoneyInput } from "@/components/money-input";
import { SearchableSelect } from "@/components/searchable-select";

const TIMEZONE_OPTIONS = [
  "America/Mexico_City",
  "America/Tijuana",
  "America/Cancun",
  "America/Monterrey",
  "America/Mazatlan",
] as const;

type CatalogData = {
  periodicities?: { id: string; name: string; intervalMonths: number; status: string }[];
  services?: {
    id: string;
    name: string;
    basePrice: number;
    incomeCategoryId: string | null;
    incomeCategoryName: string | null;
    generatesProject: boolean;
    status: string;
  }[];
  subscriptionTemplates?: {
    id: string;
    name: string;
    description: string | null;
    basePrice: number;
    periodicityId: string;
    periodicityName: string;
    incomeCategoryId: string | null;
    incomeCategoryName: string | null;
    status: string;
  }[];
  paymentConditions?: { id: string; name: string; status: string }[];
  incomeCategories?: { id: string; name: string }[];
  expenseCategories?: { id: string; name: string }[];
  providers?: { id: string; name: string }[];
};

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "activo";
  return <span className={`badge ${active ? "badge-success" : "badge-muted"}`}>{status}</span>;
}

function SimpleNameRow({
  label,
  onRename,
}: {
  label: string;
  onRename: (name: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(label);

  if (editing) {
    return (
      <form
        className="flex flex-wrap gap-2 items-center"
        onSubmit={(e) => {
          e.preventDefault();
          void onRename(name).then(() => setEditing(false));
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm"
        />
        <button type="submit" className="btn btn-primary text-sm">
          Guardar
        </button>
        <button
          type="button"
          className="btn btn-ghost text-sm"
          onClick={() => {
            setName(label);
            setEditing(false);
          }}
        >
          Cancelar
        </button>
      </form>
    );
  }

  return (
    <span className="flex items-center gap-2">
      {label}
      <button
        type="button"
        className="btn btn-ghost text-xs"
        onClick={() => {
          setName(label);
          setEditing(true);
        }}
      >
        Editar
      </button>
    </span>
  );
}

function CategorySelect({
  value,
  onChange,
  categories,
  required,
  className = "",
}: {
  value: string;
  onChange: (id: string) => void;
  categories: { id: string; name: string }[];
  required?: boolean;
  className?: string;
}) {
  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      required={required}
      className={className}
      placeholder="Categoría de ingreso"
      options={categories.map((c) => ({ value: c.id, label: c.name }))}
    />
  );
}

function PeriodicitySelect({
  value,
  onChange,
  periodicities,
  required,
  className = "",
}: {
  value: string;
  onChange: (id: string) => void;
  periodicities: { id: string; name: string; status: string }[];
  required?: boolean;
  className?: string;
}) {
  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      required={required}
      className={className}
      placeholder="Periodicidad"
      options={periodicities
        .filter((p) => p.status === "activo")
        .map((p) => ({ value: p.id, label: p.name }))}
    />
  );
}

type CatalogsManagerProps = {
  isAdmin?: boolean;
};

export function CatalogsManager({ isAdmin = false }: CatalogsManagerProps) {
  const [data, setData] = useState<CatalogData>({});
  const [timezone, setTimezone] = useState("America/Mexico_City");
  const [savingTimezone, setSavingTimezone] = useState(false);
  const [emailSettings, setEmailSettingsState] = useState({
    enabled: false,
    fromEmail: "",
    fromName: "VectorIA",
    apiKey: "",
    subjectBase: "Documento fiscal",
    bodyBase: "Adjunto encontrará su documento.",
    apiKeyConfigured: false,
  });
  const [facturapiSettings, setFacturapiSettingsState] = useState({
    enabled: false,
    apiKey: "",
    apiKeyConfigured: false,
  });
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingFacturapi, setSavingFacturapi] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsOk, setSettingsOk] = useState("");

  const [periodicity, setPeriodicity] = useState({ name: "", intervalMonths: 1 });
  const [service, setService] = useState({
    name: "",
    generatesProject: false,
  });
  const [subscription, setSubscription] = useState({
    name: "",
    description: "",
    basePrice: 0,
    periodicityId: "",
    incomeCategoryId: "",
  });
  const [payment, setPayment] = useState({ name: "" });

  const [editPeriodicity, setEditPeriodicity] = useState<{
    id: string;
    name: string;
    intervalMonths: number;
  } | null>(null);
  const [editService, setEditService] = useState<{
    id: string;
    name: string;
    generatesProject: boolean;
  } | null>(null);
  const [editSubscription, setEditSubscription] = useState<{
    id: string;
    name: string;
    description: string;
    basePrice: number;
    periodicityId: string;
    incomeCategoryId: string;
  } | null>(null);
  const [editPayment, setEditPayment] = useState<{ id: string; name: string } | null>(null);

  async function load() {
    const res = await fetch("/api/catalogs");
    if (res.ok) setData(await res.json());
  }

  async function loadTimezone() {
    if (!isAdmin) return;
    const res = await fetch("/api/settings");
    if (res.ok) {
      const json = await res.json();
      setTimezone(json.operationalTimezone ?? "America/Mexico_City");
      if (json.email) {
        setEmailSettingsState({
          enabled: json.email.enabled ?? false,
          fromEmail: json.email.fromEmail ?? "",
          fromName: json.email.fromName ?? "VectorIA",
          apiKey: "",
          subjectBase: json.email.subjectBase ?? "Documento fiscal",
          bodyBase: json.email.bodyBase ?? "Adjunto encontrará su documento.",
          apiKeyConfigured: json.email.apiKeyConfigured ?? false,
        });
      }
      if (json.facturapi) {
        setFacturapiSettingsState({
          enabled: json.facturapi.enabled ?? false,
          apiKey: "",
          apiKeyConfigured: json.facturapi.apiKeyConfigured ?? false,
        });
      }
    }
  }

  useEffect(() => {
    void load();
    void loadTimezone();
  }, [isAdmin]);

  async function post(body: Record<string, unknown>) {
    await fetch("/api/catalogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  }

  async function patch(body: Record<string, unknown>) {
    await fetch("/api/catalogs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  }

  async function saveTimezone(e: React.FormEvent) {
    e.preventDefault();
    setSavingTimezone(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationalTimezone: timezone }),
      });
    } finally {
      setSavingTimezone(false);
    }
  }

  async function saveEmailSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingEmail(true);
    setSettingsError("");
    setSettingsOk("");
    try {
      const payload: Record<string, unknown> = {
        enabled: emailSettings.enabled,
        fromEmail: emailSettings.fromEmail,
        fromName: emailSettings.fromName,
        subjectBase: emailSettings.subjectBase,
        bodyBase: emailSettings.bodyBase,
      };
      if (emailSettings.apiKey) payload.apiKey = emailSettings.apiKey;
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: payload }),
      });
      if (!res.ok) {
        setSettingsError((await res.json()).error ?? "Error al guardar SendGrid");
        return;
      }
      setSettingsOk("SendGrid guardado correctamente.");
      await loadTimezone();
    } finally {
      setSavingEmail(false);
    }
  }

  async function saveFacturapiSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingFacturapi(true);
    setSettingsError("");
    setSettingsOk("");
    try {
      const payload: Record<string, unknown> = { enabled: facturapiSettings.enabled };
      if (facturapiSettings.apiKey) payload.apiKey = facturapiSettings.apiKey;
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facturapi: payload }),
      });
      if (!res.ok) {
        setSettingsError((await res.json()).error ?? "Error al guardar Facturapi");
        return;
      }
      setSettingsOk("Facturapi guardado correctamente.");
      await loadTimezone();
    } finally {
      setSavingFacturapi(false);
    }
  }

  const incomeCategories = data.incomeCategories ?? [];
  const periodicities = data.periodicities ?? [];

  return (
    <div className="space-y-8">
      {isAdmin && (
        <section className="card space-y-3">
          <h2 className="font-medium">Configuración del sistema</h2>
          {settingsError && <p className="text-sm text-[var(--danger)]">{settingsError}</p>}
          {settingsOk && <p className="text-sm text-green-600">{settingsOk}</p>}
          <p className="text-sm text-[var(--muted)]">
            Zona horaria operativa para fechas, vencimientos y ciclos de suscripción.
          </p>
          <form className="flex flex-wrap gap-2 items-end" onSubmit={(e) => void saveTimezone(e)}>
            <label className="text-sm">
              <span className="text-[var(--muted)]">Zona horaria</span>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1 block bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 min-w-[16rem]"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary" type="submit" disabled={savingTimezone}>
              {savingTimezone ? "Guardando…" : "Guardar"}
            </button>
          </form>

          <form className="space-y-3 pt-4 border-t border-[var(--border)]" onSubmit={(e) => void saveEmailSettings(e)}>
            <h3 className="font-medium">SendGrid</h3>
            <p className="text-sm text-[var(--muted)]">
              Configure la API Key y el remitente aquí. Timbrado y envío de correos requieren credenciales activas.
            </p>
            <p className="text-sm">
              Estado:{" "}
              <span className="badge">
                {emailSettings.enabled && emailSettings.apiKeyConfigured ? "Configurado" : "Pendiente"}
              </span>
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={emailSettings.enabled}
                onChange={(e) => setEmailSettingsState({ ...emailSettings, enabled: e.target.checked })}
              />
              Envío automático activo
            </label>
            <div className="grid gap-2 md:grid-cols-2">
              <input
                value={emailSettings.fromEmail}
                onChange={(e) => setEmailSettingsState({ ...emailSettings, fromEmail: e.target.value })}
                placeholder="Correo remitente"
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
              />
              <input
                value={emailSettings.fromName}
                onChange={(e) => setEmailSettingsState({ ...emailSettings, fromName: e.target.value })}
                placeholder="Nombre remitente"
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
              />
              <input
                type="password"
                value={emailSettings.apiKey}
                onChange={(e) => setEmailSettingsState({ ...emailSettings, apiKey: e.target.value })}
                placeholder={emailSettings.apiKeyConfigured ? "API Key configurada — dejar vacío para mantener" : "API Key SendGrid"}
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 md:col-span-2"
              />
              <input
                value={emailSettings.subjectBase}
                onChange={(e) => setEmailSettingsState({ ...emailSettings, subjectBase: e.target.value })}
                placeholder="Asunto base"
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
              />
              <textarea
                value={emailSettings.bodyBase}
                onChange={(e) => setEmailSettingsState({ ...emailSettings, bodyBase: e.target.value })}
                placeholder="Texto base del correo"
                rows={2}
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 md:col-span-2"
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={savingEmail}>
              {savingEmail ? "Guardando…" : "Guardar SendGrid"}
            </button>
          </form>

          <form className="space-y-3 pt-4 border-t border-[var(--border)]" onSubmit={(e) => void saveFacturapiSettings(e)}>
            <h3 className="font-medium">Facturapi</h3>
            <p className="text-sm text-[var(--muted)]">
              API Key de Facturapi para timbrado real. Sin credenciales activas el timbrado no estará disponible.
            </p>
            <p className="text-sm">
              Estado:{" "}
              <span className="badge">
                {facturapiSettings.enabled && facturapiSettings.apiKeyConfigured ? "Configurado" : "Pendiente"}
              </span>
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={facturapiSettings.enabled}
                onChange={(e) => setFacturapiSettingsState({ ...facturapiSettings, enabled: e.target.checked })}
              />
              Integración activa
            </label>
            <input
              type="password"
              value={facturapiSettings.apiKey}
              onChange={(e) => setFacturapiSettingsState({ ...facturapiSettings, apiKey: e.target.value })}
              placeholder={
                facturapiSettings.apiKeyConfigured ? "API Key configurada — dejar vacío para mantener" : "API Key Facturapi"
              }
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <button className="btn btn-primary" type="submit" disabled={savingFacturapi}>
              {savingFacturapi ? "Guardando…" : "Guardar Facturapi"}
            </button>
          </form>
        </section>
      )}

      <section className="card space-y-3">
        <h2 className="font-medium">Periodicidades</h2>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void post({ type: "periodicity", ...periodicity }).then(() =>
              setPeriodicity({ name: "", intervalMonths: 1 }),
            );
          }}
        >
          <input
            placeholder="Nombre"
            value={periodicity.name}
            onChange={(e) => setPeriodicity({ ...periodicity, name: e.target.value })}
            required
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
          <input
            type="number"
            min={1}
            value={periodicity.intervalMonths}
            onChange={(e) => setPeriodicity({ ...periodicity, intervalMonths: Number(e.target.value) })}
            required
            className="w-24 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
          <button className="btn btn-primary" type="submit">
            Agregar
          </button>
        </form>
        {editPeriodicity && (
          <form
            className="flex flex-wrap gap-2 p-3 rounded-lg bg-[var(--surface-2)]"
            onSubmit={(e) => {
              e.preventDefault();
              void patch({
                type: "periodicity",
                id: editPeriodicity.id,
                name: editPeriodicity.name,
                intervalMonths: editPeriodicity.intervalMonths,
              }).then(() => setEditPeriodicity(null));
            }}
          >
            <input
              value={editPeriodicity.name}
              onChange={(e) => setEditPeriodicity({ ...editPeriodicity, name: e.target.value })}
              required
              className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <input
              type="number"
              min={1}
              value={editPeriodicity.intervalMonths}
              onChange={(e) =>
                setEditPeriodicity({ ...editPeriodicity, intervalMonths: Number(e.target.value) })
              }
              className="w-24 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <button className="btn btn-primary" type="submit">
              Guardar
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditPeriodicity(null)}>
              Cancelar
            </button>
          </form>
        )}
        <ul className="text-sm space-y-2">
          {periodicities.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 justify-between">
              <span>
                {p.name} — {p.intervalMonths} mes(es)
              </span>
              <span className="flex items-center gap-2">
                <StatusBadge status={p.status} />
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() =>
                    setEditPeriodicity({ id: p.id, name: p.name, intervalMonths: p.intervalMonths })
                  }
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() =>
                    void patch({
                      type: "periodicity",
                      id: p.id,
                      status: p.status === "activo" ? "cancelado" : "activo",
                    })
                  }
                >
                  {p.status === "activo" ? "Cancelar" : "Activar"}
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="font-medium">Servicios</h2>
        <form
          className="flex flex-wrap gap-2 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            void post({ type: "service", ...service }).then(() =>
              setService({ name: "", generatesProject: false }),
            );
          }}
        >
          <input
            placeholder="Nombre"
            value={service.name}
            onChange={(e) => setService({ ...service, name: e.target.value })}
            required
            className="flex-1 min-w-[12rem] bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
          <label className="flex items-center gap-2 text-sm pb-2">
            <input
              type="checkbox"
              checked={service.generatesProject}
              onChange={(e) => setService({ ...service, generatesProject: e.target.checked })}
            />
            Genera proyecto
          </label>
          <button className="btn btn-primary" type="submit">
            Agregar
          </button>
        </form>
        {editService && (
          <form
            className="flex flex-wrap gap-2 p-3 rounded-lg bg-[var(--surface-2)] items-end"
            onSubmit={(e) => {
              e.preventDefault();
              void patch({ type: "service", ...editService }).then(() => setEditService(null));
            }}
          >
            <input
              value={editService.name}
              onChange={(e) => setEditService({ ...editService, name: e.target.value })}
              required
              className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <label className="flex items-center gap-2 text-sm pb-2">
              <input
                type="checkbox"
                checked={editService.generatesProject}
                onChange={(e) => setEditService({ ...editService, generatesProject: e.target.checked })}
              />
              Genera proyecto
            </label>
            <button className="btn btn-primary" type="submit">
              Guardar
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditService(null)}>
              Cancelar
            </button>
          </form>
        )}
        <ul className="text-sm space-y-2">
          {data.services?.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 justify-between">
              <span>
                {s.name}
                {s.generatesProject ? " · Genera proyecto" : ""}
              </span>
              <span className="flex items-center gap-2">
                <StatusBadge status={s.status} />
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() =>
                    setEditService({
                      id: s.id,
                      name: s.name,
                      generatesProject: s.generatesProject,
                    })
                  }
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() =>
                    void patch({
                      type: "service",
                      id: s.id,
                      status: s.status === "activo" ? "inactivo" : "activo",
                    })
                  }
                >
                  {s.status === "activo" ? "Desactivar" : "Activar"}
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="font-medium">Suscripciones (catálogo)</h2>
        <form
          className="flex flex-wrap gap-2 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            void post({
              type: "subscription_template",
              name: subscription.name,
              description: subscription.description || null,
              basePrice: subscription.basePrice,
              periodicityId: subscription.periodicityId,
              incomeCategoryId: subscription.incomeCategoryId,
            }).then(() =>
              setSubscription({
                name: "",
                description: "",
                basePrice: 0,
                periodicityId: "",
                incomeCategoryId: "",
              }),
            );
          }}
        >
          <input
            placeholder="Nombre"
            value={subscription.name}
            onChange={(e) => setSubscription({ ...subscription, name: e.target.value })}
            required
            className="flex-1 min-w-[10rem] bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
          <input
            placeholder="Descripción (opcional)"
            value={subscription.description}
            onChange={(e) => setSubscription({ ...subscription, description: e.target.value })}
            className="flex-1 min-w-[10rem] bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
          <MoneyInput
            valueCents={subscription.basePrice}
            onChangeCents={(basePrice) => setSubscription({ ...subscription, basePrice })}
            required
            className="min-w-[8rem]"
          />
          <PeriodicitySelect
            value={subscription.periodicityId}
            onChange={(periodicityId) => setSubscription({ ...subscription, periodicityId })}
            periodicities={periodicities}
            required
          />
          <CategorySelect
            value={subscription.incomeCategoryId}
            onChange={(incomeCategoryId) => setSubscription({ ...subscription, incomeCategoryId })}
            categories={incomeCategories}
            required
          />
          <button className="btn btn-primary" type="submit">
            Agregar
          </button>
        </form>
        {editSubscription && (
          <form
            className="flex flex-wrap gap-2 p-3 rounded-lg bg-[var(--surface-2)] items-end"
            onSubmit={(e) => {
              e.preventDefault();
              void patch({
                type: "subscription_template",
                id: editSubscription.id,
                name: editSubscription.name,
                description: editSubscription.description || null,
                basePrice: editSubscription.basePrice,
                periodicityId: editSubscription.periodicityId,
                incomeCategoryId: editSubscription.incomeCategoryId,
              }).then(() => setEditSubscription(null));
            }}
          >
            <input
              value={editSubscription.name}
              onChange={(e) => setEditSubscription({ ...editSubscription, name: e.target.value })}
              required
              className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <input
              value={editSubscription.description}
              onChange={(e) => setEditSubscription({ ...editSubscription, description: e.target.value })}
              placeholder="Descripción"
              className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <MoneyInput
              valueCents={editSubscription.basePrice}
              onChangeCents={(basePrice) => setEditSubscription({ ...editSubscription, basePrice })}
              required
            />
            <PeriodicitySelect
              value={editSubscription.periodicityId}
              onChange={(periodicityId) => setEditSubscription({ ...editSubscription, periodicityId })}
              periodicities={periodicities}
              required
            />
            <CategorySelect
              value={editSubscription.incomeCategoryId}
              onChange={(incomeCategoryId) =>
                setEditSubscription({ ...editSubscription, incomeCategoryId })
              }
              categories={incomeCategories}
              required
            />
            <button className="btn btn-primary" type="submit">
              Guardar
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditSubscription(null)}>
              Cancelar
            </button>
          </form>
        )}
        <ul className="text-sm space-y-2">
          {data.subscriptionTemplates?.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 justify-between">
              <span>
                {s.name} — {formatMoney(s.basePrice)} · {s.periodicityName}
                {s.incomeCategoryName ? ` · ${s.incomeCategoryName}` : ""}
                {s.description ? ` — ${s.description}` : ""}
              </span>
              <span className="flex items-center gap-2">
                <StatusBadge status={s.status} />
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() =>
                    setEditSubscription({
                      id: s.id,
                      name: s.name,
                      description: s.description ?? "",
                      basePrice: s.basePrice,
                      periodicityId: s.periodicityId,
                      incomeCategoryId: s.incomeCategoryId ?? "",
                    })
                  }
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() =>
                    void patch({
                      type: "subscription_template",
                      id: s.id,
                      status: s.status === "activo" ? "inactivo" : "activo",
                    })
                  }
                >
                  {s.status === "activo" ? "Desactivar" : "Activar"}
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="font-medium">Condiciones de pago</h2>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void post({ type: "payment_condition", name: payment.name }).then(() => setPayment({ name: "" }));
          }}
        >
          <input
            placeholder="Nombre"
            value={payment.name}
            onChange={(e) => setPayment({ ...payment, name: e.target.value })}
            required
            className="flex-1 min-w-[12rem] bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2"
          />
          <button className="btn btn-primary" type="submit">
            Agregar
          </button>
        </form>
        {editPayment && (
          <form
            className="flex flex-wrap gap-2 p-3 rounded-lg bg-[var(--surface-2)]"
            onSubmit={(e) => {
              e.preventDefault();
              void patch({
                type: "payment_condition",
                id: editPayment.id,
                name: editPayment.name,
              }).then(() => setEditPayment(null));
            }}
          >
            <input
              value={editPayment.name}
              onChange={(e) => setEditPayment({ ...editPayment, name: e.target.value })}
              required
              className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2"
            />
            <button className="btn btn-primary" type="submit">
              Guardar
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditPayment(null)}>
              Cancelar
            </button>
          </form>
        )}
        <ul className="text-sm space-y-2">
          {data.paymentConditions?.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 justify-between">
              <span>{p.name}</span>
              <span className="flex items-center gap-2">
                <StatusBadge status={p.status} />
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() => setEditPayment({ id: p.id, name: p.name })}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() =>
                    void patch({
                      type: "payment_condition",
                      id: p.id,
                      status: p.status === "activo" ? "cancelado" : "activo",
                    })
                  }
                >
                  {p.status === "activo" ? "Cancelar" : "Activar"}
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid md:grid-cols-3 gap-4">
        {(
          [
            { title: "Ingresos", type: "income" as const, items: data.incomeCategories },
            { title: "Egresos", type: "expense" as const, items: data.expenseCategories },
            { title: "Proveedores", type: "provider" as const, items: data.providers },
          ] as const
        ).map(({ title, type, items }) => (
          <section key={type} className="card space-y-3">
            <h2 className="font-medium">{title}</h2>
            <QuickAddField placeholder="Nombre" onAdd={(name) => post({ type, name })} />
            <ul className="text-sm space-y-2">
              {items?.map((item) => (
                <li key={item.id}>
                  <SimpleNameRow label={item.name} onRename={(name) => patch({ type, id: item.id, name })} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
