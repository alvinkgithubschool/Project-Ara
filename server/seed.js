// Seed admin test user
const BASE = "http://127.0.0.1:8787";
const EMAIL = "admin@ara.local";
const PASSWORD = "ara-admin-2026";

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:1420",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

console.log("Creating admin user...");
let r = await post("/api/auth/sign-up/email", {
  email: EMAIL,
  password: PASSWORD,
  name: "Admin",
});

if (r.status >= 200 && r.status < 300) {
  console.log("Admin created!");
} else if (r.data?.message?.includes("already")) {
  console.log("Admin already exists");
} else {
  console.log("Sign-up response:", r.status, JSON.stringify(r.data));
  console.log("Trying sign-in to verify...");
  r = await post("/api/auth/sign-in/email", {
    email: EMAIL,
    password: PASSWORD,
  });
  console.log("Sign-in:", r.status, JSON.stringify(r.data));
}

console.log(`\nCredentials:`);
console.log(`  Email:    ${EMAIL}`);
console.log(`  Password: ${PASSWORD}`);
