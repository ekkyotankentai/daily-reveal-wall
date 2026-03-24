import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function login(formData: FormData) {
  "use server";

  const password = String(formData.get("password") || "");
  const correctPassword = process.env.ADMIN_PASSWORD || "1234";

  if (password === correctPassword) {
    const cookieStore = await cookies();
    cookieStore.set("admin_auth", "ok", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect("/admin/applications");
  }

  redirect("/admin/login?error=1");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = (await searchParams) || {};
  const hasError = params.error === "1";

  return (
    <main
      style={{
        maxWidth: "480px",
        margin: "80px auto",
        padding: "24px",
        backgroundColor: "#ffffff",
        minHeight: "100vh",
        color: "#111827",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          marginBottom: "24px",
        }}
      >
        管理画面ログイン
      </h1>

      {hasError ? (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            fontWeight: 700,
          }}
        >
          パスワードが違います
        </div>
      ) : null}

      <form action={login} style={{ display: "grid", gap: "16px" }}>
        <div>
          <label style={labelStyle}>パスワード</label>
          <input
            type="password"
            name="password"
            style={inputStyle}
            autoComplete="current-password"
          />
        </div>

        <button type="submit" style={buttonStyle}>
          ログイン
        </button>
      </form>
    </main>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "14px",
  fontWeight: 700,
  color: "#111827",
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: "#111827",
  fontSize: "16px",
  boxSizing: "border-box" as const,
};

const buttonStyle = {
  display: "inline-block",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  border: "none",
  padding: "12px 16px",
  borderRadius: "8px",
  fontWeight: 700,
  fontSize: "16px",
  cursor: "pointer",
};