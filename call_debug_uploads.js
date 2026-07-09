const main = async () => {
  console.log("Calling live debug uploads endpoint...");
  const res = await fetch("https://billing.abpseeds.com/api/debug-uploads");
  const data = await res.json();
  console.log("DEBUG UPLOADS RESPONSE:");
  console.log(JSON.stringify(data, null, 2));
};

main();
