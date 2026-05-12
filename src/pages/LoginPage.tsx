import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { normalizeError } from "../services/api";

type Mode = "login" | "register";

export function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { login, register, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  useEffect(() => {
    if (token) {
      navigate(from, { replace: true });
    }
  }, [from, navigate, token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "login") {
        await login(email, password);
        navigate(from, { replace: true });
        return;
      }

      await register(email, password);
      setMessage("Conta criada com sucesso. Agora você pode fazer login.");
      setMode("login");
    } catch (caughtError) {
      setError(normalizeError(caughtError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-hero">
        <div className="brand-mark">Banana Ltda.</div>
        <h1>Sistema de reservas com autenticação e controle de salas.</h1>
        <p>
          Entre com sua conta ou crie um novo usuário para acessar a listagem de
          reservas, locais e salas.
        </p>

        <div className="auth-highlights">
          <article>
            <strong>JWT compartilhado</strong>
            <span>Login no C# e validação no Python.</span>
          </article>
          <article>
            <strong>Interface responsiva</strong>
            <span>Funciona bem em desktop e mobile.</span>
          </article>
          <article>
            <strong>Fluxo simples</strong>
            <span>Entrada, token e acesso direto ao painel.</span>
          </article>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-switcher" role="tablist" aria-label="Autenticação">
          <button
            type="button"
            className={mode === "login" ? "tab active" : "tab"}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "register" ? "tab active" : "tab"}
            onClick={() => setMode("register")}
          >
            Cadastro
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@empresa.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua senha"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
            />
          </label>

          {error ? <div className="feedback error">{error}</div> : null}
          {message ? <div className="feedback success">{message}</div> : null}

          <button
            type="submit"
            className="button primary full-width"
            disabled={loading}
          >
            {loading
              ? "Processando..."
              : mode === "login"
                ? "Entrar"
                : "Criar conta"}
          </button>
        </form>
      </section>
    </main>
  );
}
