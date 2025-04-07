import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const deployZodaNFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Get owner address from environment variable or use deployer as fallback
  const ownerAddress = process.env.DEPLOYER_ADDRESS || deployer;

  // Configuration for different networks
  const config = {
    name: "Zoda NFT",
    symbol: "ZODA",
    baseURI: "https://api.zoda.app/nft/",
    // 0.01 ETH in wei
    mintFee: ethers.parseEther("0.01"),
  };

  // Deploy implementation
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
            config.baseURI,
            config.mintFee,
            ownerAddress, // Using environment variable or deployer address
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
    try {
      await hre.run("verify:verify", {
        address: zodaNFTDeployment.implementation,
        constructorArguments: [],
      });
      console.log("Implementation contract verified");
    } catch (error) {
      console.log("Error verifying implementation contract:", error);
    }
  }

  // Get the deployed contract instance
  const zodaNFT = await ethers.getContractAt("ZodaNFT", zodaNFTDeployment.address);

  // Log deployment info
  console.log("\n 📝 ZodaNFT Contract Info:");
  console.log("⚡️ Proxy Address:", zodaNFTDeployment.address);
  console.log("⚡️ Implementation Address:", zodaNFTDeployment.implementation);
  console.log("⚡️ Owner:", await zodaNFT.owner());
  console.log("⚡️ Mint Fee:", ethers.formatEther(await zodaNFT.mintFee()), "ETH");
};

export default deployZodaNFT;

// Tags are useful for partial deployments
deployZodaNFT.tags = ["ZodaNFT"];
deployZodaNFT.dependencies = []; 