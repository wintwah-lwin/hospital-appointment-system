export default function Login() {
  return (
    <div className="max-w-md mx-auto">
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold">Login</h2>
        <p className="text-sm text-zinc-500 mt-1">
          UI only for now. Later we’ll connect JWT auth from your backend.
        </p>

        <form className="mt-6 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-600">Email</span>
            <input className="rounded-xl border px-3 py-2" placeholder="you@hospital.com" />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-zinc-600">Password</span>
            <input className="rounded-xl border px-3 py-2" type="password" placeholder="••••••••" />
          </label>

          <button
            type="button"
            className="mt-2 rounded-xl bg-zinc-900 text-white py-2 text-sm font-medium hover:bg-zinc-800"
          >
            Sign in (placeholder)
          </button>
        </form>
      </div>
    </div>
  );
}
