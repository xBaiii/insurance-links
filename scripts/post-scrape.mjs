import fetch from "node-fetch";

async function main() {
  const res = await fetch("http://localhost:3000/api/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ baseDomain: "dubbocitytoyota" }),
  });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
