import { clusterApiUrl, Connection, Keypair, PublicKey, SYSVAR_EPOCH_SCHEDULE_PUBKEY } from "@solana/web3.js";
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
  FARM_ID: new PublicKey(process.env.FARM_PK),
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

  // USE IF CHECKING A SINGLE NFT
  /*const test = {
    mint: new PublicKey("4qJ9L99jwHBoDLLBPKDpVazMTaBEWwygbS7i6YgR6x3s"),
    rarityPoints: 8
  }

  const [rarityAddr1] = await findRarityPDA(
    farm.bank,
    test.mint
  );

  console.log("test points " + (await gf.fetchRarity(rarityAddr1)).points);
  */

  for (let offset = 0; offset < length; offset += 1) {
    const rarity = raritiesFull[offset];
    console.log(`Current Index: ${offset}`);

    try {
      const [rarityAddr] = await findRarityPDA(
        farm.bank,
        rarity.mint
      );
      
      const rarityAcc = await gf.fetchRarity(rarityAddr);
      if (rarityAcc.points !== rarity.rarityPoints) {
        throw Error;
      }
    } catch (e) {
      failures.push(rarity.mint);
      console.log(failures);
    }
  }

  console.log(failures);
})();