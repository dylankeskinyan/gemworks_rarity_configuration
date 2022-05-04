require('dotenv').config()
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { NodeWallet } from "@metaplex/js";
import { Wallet } from "@project-serum/anchor";
import farmIdl from "./idl/gem_farm.json";
import bankIdl from "./idl/gem_bank.json";
import {
  findRarityPDA,
  GemFarmClient,
  RarityConfig,
} from "@gemworks/gem-farm-ts";
const fs = require("fs");

export const stakingDefaults = {
  CLUSTER: "mainnet-beta",
  GEM_BANK_PROG_ID: new PublicKey("bankHHdqMuaaST4qQk6mkzxGeKPHWmqdgor6Gs8r88m"),
  GEM_FARM_PROG_ID: new PublicKey("farmL4xeBFVXJqtfxCzU9b28QACM7E2W2ctT6epAjvE"),
  FARM_ID: new PublicKey(process.env.FARM_PK!),
};

const mintList = JSON.parse(fs.readFileSync("./mintList.json")).map(e => { e.mint = new PublicKey(e.mint); return e; });
const length = mintList.length;

// This is the rarity array that you configure, each object consists of the
// NFT mint address and the rarity points associated with it.
let raritiesFull: RarityConfig[] = mintList;

(async () => {
  // This keypair needs to be the farm manager
  const manager = Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.MANAGER_KEYPAIR as string)));

  const connection = new Connection(
    process.env.RPC_HOST,
    "confirmed"
  );

  let gf = new GemFarmClient(
    connection,
    new NodeWallet(manager) as Wallet,
    farmIdl as any,
    stakingDefaults.GEM_FARM_PROG_ID,
    bankIdl as any,
    stakingDefaults.GEM_BANK_PROG_ID
  );

  const farm = await gf.fetchFarmAcc(stakingDefaults.FARM_ID);

  const failures = [];

  for (let offset = 0; offset < length; offset += 1) {
    const rarities = raritiesFull.slice(offset, offset + 1);
    console.log(`Current Index: ${offset}`);

    try {
      const { txSig } = await gf.addRaritiesToBank(
        stakingDefaults.FARM_ID,
        manager.publicKey,
        rarities
      );

      await connection.confirmTransaction(txSig, "confirmed");
      console.log(txSig);

      // Checks if the first mint address within the current batch was set properly
      const [rarityAddr] = await findRarityPDA(
          farm.bank,
          rarities[0].mint
      );

      const rarityAcc = await gf.fetchRarity(rarityAddr);
      console.log(rarityAcc);
    } catch (error) {
      console.log(error);
      failures.push(offset);
    }
  }

  console.log(failures);
})();