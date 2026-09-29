"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "@/app/login/actions";
import { Field, PrimaryButton } from "./controls";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, null);
  return (
    <form action={action} className="mt-6 grid gap-5">
      <Field label="Correo">
        {(id) => (
          <input
            id={id}
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state?.email}
            className="input"
          />
        )}
      </Field>
      <Field label="Contraseña">
        {(id) => (
          <input
            id={id}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
          />
        )}
      </Field>
      {state?.message && (
        <p role="alert" className="text-base text-danger">
          {state.message}
        </p>
      )}
      <PrimaryButton pending={pending}>Entrar</PrimaryButton>
    </form>
  );
}
