"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { flattenCategories, isManager, type Category } from "@/lib/models";
import { useSession } from "@/components/session";
import { Button, Card, Field, Notice, PageHeader, fieldClass } from "@/components/ui";

export default function CategoriesPage() {
  const { user } = useSession();
  const router = useRouter();
  const [tree, setTree] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && !isManager(user.role)) router.replace("/");
  }, [router, user]);

  function load() {
    api<Category[]>("/categories")
      .then(setTree)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load categories"));
  }

  useEffect(() => {
    if (user && isManager(user.role)) load();
  }, [user]);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/categories", {
        method: "POST",
        body: JSON.stringify({
          name,
          description: description || undefined,
          parentId: parentId || undefined,
        }),
      });
      setName("");
      setDescription("");
      setParentId("");
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the category");
    }
  }

  async function remove(id: string) {
    setError("");
    try {
      await api(`/categories/${id}`, { method: "DELETE" });
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete");
    }
  }

  const roots = tree.filter((node) => !node.parentId);

  return (
    <div>
      <PageHeader eyebrow="Catalog" title="Categories" />
      {error ? <div className="mb-4"><Notice>{error}</Notice></div> : null}
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <form className="grid gap-3" onSubmit={create}>
            <Field label="Name"><input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} required /></Field>
            <Field label="Description"><input className={fieldClass} value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
            <Field label="Parent" hint="Leave empty for a top-level category. A sub-category cannot have children.">
              <select className={fieldClass} value={parentId} onChange={(event) => setParentId(event.target.value)}>
                <option value="">None</option>
                {roots.map((node) => (
                  <option key={node.id} value={node.id}>{node.name}</option>
                ))}
              </select>
            </Field>
            <Button type="submit">Add category</Button>
          </form>
        </Card>
        <Card>
          <ul className="divide-y divide-line">
            {flattenCategories(tree).map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-3">
                <span style={{ paddingLeft: row.depth * 16 }}>{row.label}</span>
                <button className="text-sm text-danger" type="button" onClick={() => remove(row.id)}>Delete</button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
