import { useMemo, useState } from "react";
import { Layers, NotebookPen, Pencil, Pin, PinOff, Plus, Search, Trash2 } from "lucide-react";
import { useStudyGrind } from "../context/StudyGrindContext";
import { PageTransition } from "../components/ui/PageTransition";
import { PressableButton } from "../components/ui/PressableButton";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/EmptyState";
import type { Note } from "../types";

export function NotesPage() {
  const { user, updateUser, setToast, goTab } = useStudyGrind();
  const [search, setSearch] = useState("");
  const [folderId, setFolderId] = useState("all");
  const [tagFilter, setTagFilter] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [draft, setDraft] = useState({ title: "", body: "", tags: "", folderId: "general" });

  const notes = user?.notes ?? [];
  const folders = user?.noteFolders ?? [{ id: "general", name: "General" }];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return notes
      .filter((n) => (folderId === "all" ? true : n.folderId === folderId))
      .filter((n) => (!tagFilter ? true : n.tags.includes(tagFilter)))
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, search, folderId, tagFilter]);

  const allTags = useMemo(() => Array.from(new Set(notes.flatMap((n) => n.tags))), [notes]);

  if (!user) return null;

  const openNew = () => {
    setEditing(null);
    setDraft({ title: "", body: "", tags: "", folderId: folders[0]?.id ?? "general" });
    setEditorOpen(true);
  };

  const saveNote = () => {
    const now = new Date().toISOString();
    const tags = draft.tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (editing) {
      updateUser({
        ...user,
        notes: user.notes.map((n) =>
          n.id === editing.id
            ? { ...n, title: draft.title || "Untitled", body: draft.body, tags, folderId: draft.folderId, updatedAt: now }
            : n,
        ),
      });
    } else {
      updateUser({
        ...user,
        notes: [
          {
            id: crypto.randomUUID(),
            title: draft.title || draft.body.slice(0, 40) || "Untitled",
            body: draft.body,
            folderId: draft.folderId,
            tags,
            pinned: false,
            createdAt: now,
            updatedAt: now,
          },
          ...user.notes,
        ],
      });
    }
    setEditorOpen(false);
    setToast("Note saved.");
  };

  const convertToFlashcards = (note: Note) => {
    const parts = note.body.split(/\n---\n|\n\n/).filter((p) => p.trim());
    const cards =
      parts.length >= 2
        ? parts.map((p, i) => ({ id: crypto.randomUUID(), q: `From: ${note.title} #${i + 1}`, a: p.trim(), ease: 1, seen: 0 }))
        : [{ id: crypto.randomUUID(), q: note.title, a: note.body, ease: 1, seen: 0 }];
    const deckId = crypto.randomUUID();
    updateUser({
      ...user,
      decks: [...user.decks, { id: deckId, name: `From: ${note.title}`, cards }],
    });
    setToast("Deck created from note.");
    goTab("cards");
  };

  return (
    <PageTransition stagger>
      <section className="notes-layout">
        <aside className="notes-sidebar card">
          <div className="row">
            <h4>
              <NotebookPen size={16} /> Notes
            </h4>
            <span className="pill">{notes.length}</span>
          </div>
          <PressableButton onClick={openNew}>
            <Plus size={16} /> New note
          </PressableButton>
          <div className="search-row row">
            <Search size={16} className="soft" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..." aria-label="Search notes" />
          </div>
          <div className="notes-filters">
            <span className="eyebrow">Folders</span>
            <div className="chip-group">
              <button type="button" className={`chip ${folderId === "all" ? "chip-active" : ""}`} onClick={() => setFolderId("all")}>
                All
              </button>
              {folders.map((f) => (
                <button key={f.id} type="button" className={`chip ${folderId === f.id ? "chip-active" : ""}`} onClick={() => setFolderId(f.id)}>
                  {f.name}
                </button>
              ))}
            </div>
            {allTags.length > 0 && (
              <>
                <span className="eyebrow">Tags</span>
                <div className="chip-group">
                  {allTags.map((t) => (
                    <button key={t} type="button" className={`chip ${tagFilter === t ? "chip-active" : ""}`} onClick={() => setTagFilter(tagFilter === t ? "" : t)}>
                      #{t}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>
        <div className="notes-main">
          {filtered.length === 0 ? (
            <EmptyState icon={<NotebookPen size={36} />} title="No notes here" hint="Create a note or change filters." actionLabel="New note" onAction={openNew} />
          ) : (
            <div className="notes-grid">
              {filtered.map((n) => (
                <article key={n.id} className={`note-card ${n.pinned ? "pinned" : ""}`}>
                  {n.pinned && <Pin size={14} className="pin-icon" />}
                  <b>{n.title}</b>
                  <p className="soft note-excerpt">{n.body.slice(0, 120)}{n.body.length > 120 ? "…" : ""}</p>
                  <small className="soft">
                    {new Date(n.updatedAt).toLocaleDateString()} · {n.tags.join(", ") || "no tags"}
                  </small>
                  <div className="row note-actions">
                    <PressableButton
                      variant="ghost"
                      className="icon-btn"
                      aria-label="Edit note"
                      onClick={() => {
                        setEditing(n);
                        setDraft({ title: n.title, body: n.body, tags: n.tags.join(", "), folderId: n.folderId });
                        setEditorOpen(true);
                      }}
                    >
                      <Pencil size={16} />
                    </PressableButton>
                    <PressableButton
                      variant="ghost"
                      className="icon-btn"
                      aria-label={n.pinned ? "Unpin note" : "Pin note"}
                      onClick={() =>
                        updateUser({
                          ...user,
                          notes: user.notes.map((x) => (x.id === n.id ? { ...x, pinned: !x.pinned } : x)),
                        })
                      }
                    >
                      {n.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </PressableButton>
                    <PressableButton variant="ghost" className="icon-btn" aria-label="Convert to flashcards" onClick={() => convertToFlashcards(n)}>
                      <Layers size={16} />
                    </PressableButton>
                    <PressableButton
                      variant="ghost"
                      className="icon-btn note-delete"
                      aria-label="Delete note"
                      onClick={() => updateUser({ ...user, notes: user.notes.filter((x) => x.id !== n.id) })}
                    >
                      <Trash2 size={16} />
                    </PressableButton>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Modal open={editorOpen} title={editing ? "Edit note" : "New note"} onClose={() => setEditorOpen(false)} footer={<PressableButton onClick={saveNote}>Save</PressableButton>}>
        <input placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <select value={draft.folderId} onChange={(e) => setDraft({ ...draft, folderId: e.target.value })}>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <input placeholder="Tags (comma separated)" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
        <textarea placeholder="Body (use --- between card fronts/backs when converting)" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
      </Modal>
    </PageTransition>
  );
}
