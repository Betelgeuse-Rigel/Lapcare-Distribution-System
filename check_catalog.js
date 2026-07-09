const main = async () => {
  console.log("Checking live categories...");
  try {
    const res = await fetch("https://billing.abpseeds.com/api/categories");
    const data = await res.json();
    console.log("LIVE CATEGORIES:", data);
  } catch (err) {
    console.error("API call failed:", err);
  }
};

main();
