import { ethers } from "hardhat";

async function main() {
  const LandRegistry = await ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.waitForDeployment();

  const address = await landRegistry.getAddress();
  console.log("LandRegistry deployed to:", address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

