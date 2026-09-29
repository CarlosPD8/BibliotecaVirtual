"use client";

import { useActionState, useEffect, useState } from "react";
import { createBook, updateBook, type FormState } from "@/app/admin/actions";
import type { Book } from "@/lib/types";
import { CoverPicker } from "./CoverPicker";
import { Field, PrimaryButton, RatingInput } from "./controls";

/** Add a new book, or edit one when `book` is given. */
export function BookForm({ book, onDone }: { book?: Book; onDone?: () => void }) {
  const editing = Boolean(book);
  const [state, action, pending] = useActionState<FormState, FormData>(
    editing ? updateBook : createBook,
    null,
  );
  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  // A fresh form after each successful add.
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    if (!state?.ok) return;
    if (editing) {
      onDone?.();
    } else {
      // Clearing the fields is a response to the server confirming the save.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle("");
      setAuthor("");
      setGeneration((g) => g + 1);
    }
  }, [state, editing, onDone]);

  return (
    <form action={action} className="grid gap-5" key={generation}>
      {book && <input type="hidden" name="id" value={book.id} />}
      <Field label="Título" error={state?.errors?.title}>
        {(id, describedBy) => (
          <input
            id={id}
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={300}
            autoComplete="off"
            aria-invalid={Boolean(state?.errors?.title)}
            aria-describedby={describedBy}
            className="input"
          />
        )}
      </Field>
      <Field label="Autor" error={state?.errors?.author}>
        {(id, describedBy) => (
          <input
            id={id}
            name="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            maxLength={200}
            autoComplete="off"
            aria-invalid={Boolean(state?.errors?.author)}
            aria-describedby={describedBy}
            className="input"
          />
        )}
      </Field>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-base text-muted">¿Te gustó?</legend>
        <RatingInput name="rating" defaultValue={book?.rating} />
        {state?.errors?.rating && <p className="text-sm text-danger">{state.errors.rating[0]}</p>}
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-base text-muted">Portada</legend>
        <CoverPicker
          title={title}
          author={author}
          defaultCover={book?.cover_url}
          defaultKey={book?.ol_key}
        />
      </fieldset>

      {state?.message && (
        <p role={state.ok ? "status" : "alert"} className={`text-base ${state.ok ? "text-gold" : "text-danger"}`}>
          {state.message}
        </p>
      )}

      <div className="flex items-center gap-3">
        <PrimaryButton pending={pending}>{editing ? "Guardar" : "Añadir a la biblioteca"}</PrimaryButton>
        {editing && (
          <button
            type="button"
            onClick={onDone}
            className="h-11 px-3 text-base text-muted transition-colors duration-150 hover:text-ivory"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
