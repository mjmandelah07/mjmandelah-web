"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { flattenCategories, isManager, type Category } from "@/lib/models";
import { useSession } from "@/components/session";
import { Button, Card, Field, Notice, PageHeader, fieldClass } from "@/components/ui";

function findCategory(nodes: Category[], id: string): Category | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findCategory(node.children, id);
    if (child) return child;
  }
  return null;
}

export default function CategoriesPage() {
  const { user } = useSession();
  const router = useRouter();
  const [tree, setTree] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
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

  function resetForm() {
    setName("");
    setDescription("");
    setParentId("");
    setEditing(null);
  }

  function beginEdit(category: Category) {
    setEditing(category);
    setName(category.name);
    setDescription(category.description ?? "");
    setParentId(category.parentId ?? "");
    setError("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    const lockedParent = Boolean(editing?.children.length);
    const body = editing
      ? {
          name,
          description,
          ...(lockedParent ? {} : { parentId: parentId || null }),
        }
      : {
          name,
          description: description || undefined,
          parentId: parentId || undefined,
        };
    try {
      await api(editing ? `/categories/${editing.id}` : "/categories", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      resetForm();
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the category");
    }
  }

  async function remove(id: string) {
    setError("");
    try {
      await api(`/categories/${id}`, { method: "DELETE" });
      if (editing?.id === id) resetForm();
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete");
    }
  }

  const roots = tree.filter((node) => !node.parentId && node.id !== editing?.id);
  const parentLocked = Boolean(editing?.children.length);

  return (
    <div>
      <PageHeader eyebrow="Catalog" title="Categories" />
      {error ? <div className="mb-4"><Notice>{error}</Notice></div> : null}
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <form className="grid gap-3" onSubmit={save}>
            <p className="font-display text-2xl">{editing ? "Edit category" : "New category"}</p>
            <Field label="Name">
              <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
            </Field>
            <Field label="Description">
              <input className={fieldClass} value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
            <Field
              label="Parent"
              hint={
                parentLocked
                  ? "This category has sub-categories, so it stays at the top level."
                  : "Leave empty for a top-level category. A sub-category cannot have children."
              }
            >
              <select
                className={fieldClass}
                value={parentId}
                disabled={parentLocked}
                onChange={(event) => setParentId(event.target.value)}
              >
                <option value="">None</option>
                {roots.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex gap-2">
              <Button type="submit">{editing ? "Save changes" : "Add category"}</Button>
              {editing ? (
                <Button type="button" tone="paper" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
        <Card>
          {flattenCategories(tree).length === 0 ? (
            <p className="text-sm text-muted">No categories yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {flattenCategories(tree).map((row) => {
                const category = findCategory(tree, row.id);
                return (
                  <li key={row.id} className={`flex items-center justify-between gap-3 py-3 ${editing?.id === row.id ? "bg-sand/60 -mx-2 rounded-xl px-2" : ""}`}>
                    <div style={{ paddingLeft: row.depth * 16 }}>
                      <p>{row.label}</p>
                      {category?.description ? <p className="text-xs text-muted">{category.description}</p> : null}
                    </div>
                    <div className="flex shrink-0 gap-3">
                      <button className="text-sm font-semibold text-moss" type="button" onClick={() => category && beginEdit(category)}>
                        Edit
                      </button>
                      <button className="text-sm text-danger" type="button" onClick={() => remove(row.id)}>
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
