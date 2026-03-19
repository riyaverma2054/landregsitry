import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import hardhatPkg from "hardhat";

const { ethers } = hardhatPkg;

async function main() {
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  const LandRegistry = await ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.waitForDeployment();

  const address = await landRegistry.getAddress();
  console.log(`LandRegistry deployed to (${chainId}):`, address);

  // Write frontend env so "clone -> deploy -> run frontend" works.
  // This is safe to overwrite locally; it's gitignored by default conventions (.env.local).
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoRoot = path.resolve(__dirname, "..", "..");
  const frontendEnvLocalPath = path.resolve(repoRoot, "frontend", ".env.local");
  const key = `VITE_LAND_REGISTRY_ADDRESS_${chainId}`;
  const content = `${key}=${address}\n`;
  try {
    fs.mkdirSync(path.dirname(frontendEnvLocalPath), { recursive: true });
    fs.appendFileSync(frontendEnvLocalPath, content, { encoding: "utf8" });
    console.log("Wrote frontend config:", frontendEnvLocalPath);
  } catch (e) {
    console.warn("Could not write frontend .env.local:", e);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

