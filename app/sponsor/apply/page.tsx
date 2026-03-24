import fs from "fs";
import path from "path";
import { redirect } from "next/navigation";

async function sendLine(message: string) {
  const token =
    process.env.LINE_CHANNEL_ACCESS_TOKEN || process.env.LINE_TOKEN || "";

  const userId =
    process.env.LINE_ADMIN_USER_ID || process.env.LINE_USER_ID || "";

  if (!token || !userId) {
    console.error("LINE env missing");
    return;
  }

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [
          {
            type: "text",
            text: message,
          },
        ],
      }),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("LINE送信失敗", res.status, text);
    } else {
      console.log("LINE送信成功");
    }
  } catch (error) {
    console.error("LINE送信エラー", error);
  }
}

async function submitApplication(formData: FormData) {
  "use server";

  const company = String(formData.get("company") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const memo = String(formData.get("memo") || "").trim();
  const imageFile = formData.get("image") as File | null;

  const dataDir = path.join(process.cwd(), "data");
  const publicUploadsDir = path.join(process.cwd(), "public", "uploads");
  const dataFile = path.join(dataDir, "applications.jsonl");

  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(publicUploadsDir, { recursive: true });

  let image = "";

  if (imageFile && imageFile.size > 0) {
    const originalName = imageFile.name || "image";
    const ext = path.extname(originalName) || ".png";
    const fileName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    const savePath = path.join(publicUploadsDir, fileName);

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(savePath, buffer);

    image = `/uploads/${fileName}`;
  }

  const application = {
    id: `${Date.now()}-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    company,
    name,
    email,
    phone,
    memo,
    image,
  };

  fs.appendFileSync(dataFile, JSON.stringify(application) + "\n", "utf-8");

  await sendLine(
    [
      "【新しい応募】",
      `会社: ${company || "-"}`,
      `名前: ${name || "-"}`,
      `メール: ${email || "-"}`,
      `電話: ${phone || "-"}`,
      `メモ: ${memo || "-"}`,
    ].join("\n")
  );

  redirect("/sponsor/apply?success=1");
}

export default async function SponsorApplyPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string }>;
}) {
  const params = (await searchParams) || {};
  const success = params.success === "1";

  return (
    <main
      style={{
        maxWidth: "720px",
        margin: "40px auto",
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
          color: "#111827",
        }}
      >
        スポンサー応募フォーム
      </h1>

      {success ? (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#dcfce7",
            color: "#166534",
            fontWeight: 700,
          }}
        >
          送信できました
        </div>
      ) : null}

      <form action={submitApplication} style={{ display: "grid", gap: "16px" }}>
        <div>
          <label style={labelStyle}>会社名</label>
          <input name="company" type="text" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>氏名</label>
          <input name="name" type="text" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>メール</label>
          <input name="email" type="email" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>電話</label>
          <input name="phone" type="text" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>メモ</label>
          <textarea name="memo" rows={5} style={textareaStyle} />
        </div>

        <div>
          <label style={labelStyle}>画像</label>
          <input name="image" type="file" accept="image/*" style={fileStyle} />
        </div>

        <button type="submit" style={submitButtonStyle}>
          送信
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

const textareaStyle = {
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

const fileStyle = {
  display: "block",
  width: "100%",
  padding: "10px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: "#111827",
  fontSize: "16px",
  boxSizing: "border-box" as const,
};

const submitButtonStyle = {
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