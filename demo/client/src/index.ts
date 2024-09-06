const { snakeToCamelCase } = await import("live-view-model");

async function main() {
  console.log("Hello, TypeScript!!!");
  console.log(snakeToCamelCase("hello_world"));
}

main().catch(console.error);
