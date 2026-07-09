const main = async () => {
  const loginRes = await fetch("https://billing.abpseeds.com/api/admin/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@company.com", password: "Admin@123" })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  if (token) {
    const res = await fetch("https://billing.abpseeds.com/api/admin/retailers", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const retailers = await res.json();
    console.log("RETAILERS:");
    retailers.forEach(r => {
      console.log(`ID: ${r.id}, Name: ${r.name}, Mobile: ${r.mobileNumber}, Email: ${r.email}`);
    });
  } else {
    console.log("Failed to log in.");
  }
};

main();
