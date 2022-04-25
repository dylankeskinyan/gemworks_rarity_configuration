# gemworks_rarity_configuration (dylie.eth fork)

Open up the script `set_rarity.ts`, and first of all read it

### DO NOT CHANGE TXN BATCH OF 7 MINTS! IT WILL BREAK!

+ change all the `stakingDefaults` to match your farm
+ set all env variables (FARM_PK, MANAGER_KEYPAIR, RPC_HOST) within a .env file
+ add all mint hashes with rarity points in the mintList.json file (same format as template)
+ test on devnet (if you'd like haha)
+ run `yarn && yarn execute` to set rarities
+ run `yarn view` to view if rarities have all been set properly