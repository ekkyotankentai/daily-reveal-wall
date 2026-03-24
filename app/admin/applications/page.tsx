import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Application = {
  id?: string;
  company?: string;
  name?: string;
  email?: string;
  phone?: string;
  memo?: string;
  image?: string;
  createdAt?: string;
};

const dataFile = path.join(process.cwd(), "data", "applications.jsonl");

async function deleteApplication(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "");

  if (!fs.existsSync(dataFile)) {
    revalidatePath("/admin/applications");
    return;
  }

  const lines = fs
    .readFileSync(dataFile, "utf-8")
    .split("\n")
    .filter((line) => line.trim() !== "");

  const filtered = lines.filter((line) => {
    try {
      const item = JSON.parse(line);
      return item.id !== id;
    } catch {
      return true;
    }
  });

  fs.writeFileSync(
    dataFile,
    filtered.length ? filtered.join("\n") + "\n" : "",
    "utf-8"
  );

  revalidatePath("/admin/applications");
}

async function logout() {
  "use server";

  const cookieStore = await cookies();
  cookieStore.set("admin_auth", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  redirect("/admin/login");
}

function readApplications(): Application[] {
  if (!fs.existsSync(dataFile)) return [];

  const lines = fs
    .readFileSync(dataFile, "utf-8")
    .split("\n")
    .filter((line) => line.trim() !== "");

  const items: Application[] = [];

  for (const line of lines) {
    try {
      items.push(JSON.parse(line));
    } catch {}
  }

  return items.reverse();
}

export default async function AdminApplicationsPage() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("admin_auth")?.value === "ok";

  if (!isLoggedIn) {
    redirect("/admin/login");
  }

  const applications = readApplications();

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "40px auto",
        padding: "24px",
        backgroundColor: "#ffffff",
        color: "#111827",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            margin: 0,
            color: "#111827",
          }}
        >
          応募一覧
        </h1>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <a href="/api/admin/export" style={csvButtonStyle}>
            CSVダウンロード
          </a>

          <form action={logout}>
            <button type="submit" style={logoutButtonStyle}>
              ログアウト
            </button>
          </form>
        </div>
      </div>

      {applications.length === 0 ? (
        <p style={{ color: "#374151", fontSize: "16px" }}>
          まだ応募はありません
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "#ffffff",
              color: "#111827",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>日時</th>
                <th style={thStyle}>会社名</th>
                <th style={thStyle}>氏名</th>
                <th style={thStyle}>メール</th>
                <th style={thStyle}>電話</th>
                <th style={thStyle}>画像</th>
                <th style={thStyle}>メモ</th>
                <th style={thStyle}>削除</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((item, index) => (
                <tr key={item.id || index}>
                  <td style={tdStyle}>{item.createdAt || "-"}</td>
                  <td style={tdStyle}>{item.company || "-"}</td>
                  <td style={tdStyle}>{item.name || "-"}</td>
                  <td style={tdStyle}>{item.email || "-"}</td>
                  <td style={tdStyle}>{item.phone || "-"}</td>
                  <td style={tdStyle}>
                    {item.image ? (
                      <a
                        href={item.image}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#2563eb",
                          textDecoration: "underline",
                          fontWeight: 700,
                        }}
                      >
                        画像を見る
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={tdStyle}>{item.memo || "-"}</td>
                  <td style={tdStyle}>
                    {item.id ? (
                      <form action={deleteApplication}>
                        <input type="hidden" name="id" value={item.id} />
                        <button type="submit" style={deleteButtonStyle}>
                          削除
                        </button>
                      </form>
                    ) : (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "8px 12px",
                          backgroundColor: "#9ca3af",
                          color: "#ffffff",
                          fontWeight: 700,
                          borderRadius: "8px",
                        }}
                      >
                        IDなし
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const thStyle = {
  border: "1px solid #d1d5db",
  padding: "12px",
  textAlign: "left" as const,
  color: "#111827",
  backgroundColor: "#e5e7eb",
  fontSize: "14px",
  fontWeight: 700,
};

const tdStyle = {
  border: "1px solid #d1d5db",
  padding: "12px",
  verticalAlign: "top" as const,
  color: "#111827",
  backgroundColor: "#ffffff",
  fontSize: "14px",
};

const deleteButtonStyle = {
  display: "inline-block",
  backgroundColor: "#dc2626",
  color: "#ffffff",
  border: "2px solid #991b1b",
  padding: "10px 16px",
  borderRadius: "8px",
  fontWeight: 700,
  fontSize: "14px",
  lineHeight: "1",
  cursor: "pointer",
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
};

const csvButtonStyle = {
  display: "inline-block",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  textDecoration: "none",
  border: "2px solid #1d4ed8",
  padding: "10px 16px",
  borderRadius: "8px",
  fontWeight: 700,
  fontSize: "14px",
};

const logoutButtonStyle = {
  display: "inline-block",
  backgroundColor: "#6b7280",
  color: "#ffffff",
  border: "2px solid #4b5563",
  padding: "10px 16px",
  borderRadius: "8px",
  fontWeight: 700,
  fontSize: "14px",
  cursor: "pointer",
};