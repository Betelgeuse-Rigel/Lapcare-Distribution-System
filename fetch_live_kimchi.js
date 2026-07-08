const main = async () => {
  console.log("Logging in...");
  const loginRes = await fetch("https://billing.abpseeds.com/api/admin/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@company.com", password: "Admin@123" })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  if (token) {
    console.log("Fetching products...");
    const prodRes = await fetch("https://billing.abpseeds.com/api/admin/products", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const products = await prodRes.json();
    const kimchi = products.find(p => p.name.toLowerCase() === "kimchi");
    if (kimchi) {
      console.log("FOUND KIMCHI PRODUCT IN DB:");
      console.log(JSON.stringify(kimchi, null, 2));
    } else {
      console.log("Product 'kimchi' not found.");
      console.log("Available products:", products.map(p => p.name));
    }
  } else {
    console.log("Failed to log in.");
  }
};

main();
