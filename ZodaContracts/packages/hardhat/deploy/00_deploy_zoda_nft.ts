import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const deployZodaNFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Get owner address from environment variable
  const ownerAddress = process.env.DEPLOYER_ADDRESS;
  if (!ownerAddress) {
    throw new Error("DEPLOYER_ADDRESS environment variable not set");
  }
  console.log("\n👤 Using owner address:", ownerAddress);
  
  // Get treasury address from environment variable or use owner address as fallback
  const treasuryAddress = process.env.TREASURY_ADDRESS || ownerAddress;
  console.log("💰 Using treasury address:", treasuryAddress);

  // Configuration for different networks
  const config = {
    name: "Zoda NFT",
    symbol: "ZODA",
    // 0.0005 ETH in wei
    mintFee: ethers.parseEther("0.0005"),
  };

  console.log("\n📝 Deployment Configuration:");
  console.log("- Name:", config.name);
  console.log("- Symbol:", config.symbol);
  console.log("- Mint Fee:", ethers.formatEther(config.mintFee), "ETH");

  // Deploy implementation
  console.log("\n🚀 Deploying ZodaNFT...");
  const zodaNFTDeployment = await deploy("ZodaNFT", {
    from: deployer,
    proxy: {
      proxyContract: "UUPS",
      execute: {
        init: {
          methodName: "initialize",
          args: [
            config.name,
            config.symbol,
            config.mintFee,
            ownerAddress, // Contract owner
            treasuryAddress, // Treasury address for fee collection
          ],
        },
      },
    },
    log: true,
    autoMine: true,
  });

  // Verify the implementation contract if we're on a live network
  if (
    !hre.network.tags.local &&
    process.env.ETHERSCAN_API_KEY &&
    process.env.VERIFY_ON_DEPLOY
  ) {
    console.log("\n🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: zodaNFTDeployment.implementation,
        constructorArguments: [],
      });
      console.log("✅ Implementation contract verified");
    } catch (error) {
      console.log("❌ Error verifying implementation contract:", error);
    }
  }

  // Get the deployed contract instance
  const zodaNFT = await ethers.getContractAt("ZodaNFT", zodaNFTDeployment.address);

  // Verify owner and treasury are set correctly
  const contractOwner = await zodaNFT.owner();
  const contractTreasury = await zodaNFT.treasuryAddress();

  if (contractOwner.toLowerCase() !== ownerAddress.toLowerCase()) {
    throw new Error(`Owner not set correctly. Expected ${ownerAddress}, got ${contractOwner}`);
  }

  if (contractTreasury.toLowerCase() !== treasuryAddress.toLowerCase()) {
    throw new Error(`Treasury not set correctly. Expected ${treasuryAddress}, got ${contractTreasury}`);
  }

  // Log deployment info
  console.log("\n📝 ZodaNFT Contract Info:");
  console.log("⚡️ Proxy Address:", zodaNFTDeployment.address);
  console.log("⚡️ Implementation Address:", zodaNFTDeployment.implementation);
  console.log("⚡️ Owner:", contractOwner);
  console.log("⚡️ Treasury:", contractTreasury);
  console.log("⚡️ Mint Fee:", ethers.formatEther(await zodaNFT.mintFee()), "ETH");

  console.log("\n✅ Deployment completed successfully!");
};

export default deployZodaNFT;

// Tags are useful for partial deployments
deployZodaNFT.tags = ["ZodaNFT"];
deployZodaNFT.dependencies = []; 