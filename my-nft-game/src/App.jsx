import { useState, useEffect } from "react";
import { ethers } from "ethers";
import AIWeaponABI from "./abi.json";
import MonsterABI from "./monster_abi.json";
import TokenABI from "./token_abi.json";
import MarketABI from "./market_abi.json";

// ⚠️ REPLACE THIS WITH YOUR NEW DEPLOYED ADDRESS FROM GANACHE
// const WEAPON_ADDRESS = "0x499130DEFf1b750df077daAea182c3E5b9d010C3";
// const MONSTER_ADDRESS = "0x3cE1029f60081B8adEe1D8AcA14081004Cf43d85";
// const TOKEN_ADDRESS = "0x34a7aDBB0A8609933409C2D90D0B9Aff404AE1B5";
// const MARKET_ADDRESS = "0x6D575E0194257b7cED5b2cBE9e5cA965c94da81C";
const TOKEN_ADDRESS = "0x1731a15a6cD2B593747b4a7fb41c3283602BEcDD";
const WEAPON_ADDRESS = "0x09B3c09C64CA869a317F34B9b4e056de6190C403";
const MONSTER_ADDRESS = "0x9D08800F6aCA025B023640AE0FCD9D7827b9f454";
const MARKET_ADDRESS = "0xFFd9FBa8d22A8BA1f128B71c3Ce3c4d8e28e7039";

function App() {
  // --- STATE VARIABLES ---
  const [account, setAccount] = useState(null);
  const [goldBalance, setGoldBalance] = useState("0");
  const [myWeapons, setMyWeapons] = useState([]);

  // AI / Minting State
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const [nftData, setNftData] = useState(null);

  // 🛠️ FIX 1: Consolidated State (Deleted userWeaponId, using only this one)
  // Default is NULL so we know when nothing is equipped
  const [selectedWeaponId, setSelectedWeaponId] = useState(null);

  // Battle State
  const [monsterHP, setMonsterHP] = useState(100);
  const [killCount, setKillCount] = useState(0);
  const [battleLog, setBattleLog] = useState([]);

  // Market State
  const [marketItems, setMarketItems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [monsterName, setMonsterName] = useState("Unknown Entity");
  const [monsterMaxHP, setMonsterMaxHP] = useState(100);
  const [globalKillCount, setGlobalKillCount] = useState(0);

  // --- INITIALIZATION ---
  useEffect(() => {
    fetchMonsterStats();
    fetchLeaderboard();
  }, []);

  // --- 1. WALLET CONNECTION ---
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setAccount(signer.address);
      } catch (err) {
        console.error("User rejected connection", err);
      }
    } else {
      alert("Please install Metamask!");
    }
  };

  useEffect(() => {
    if (account) {
      loadMyArmory();
      fetchMonsterStats();
      fetchGoldBalance();
      loadMarketplace();
      fetchLeaderboard(); // Load leaderboard on start
    }
  }, [account]);

  // --- 9. LEADERBOARD SYSTEM ---
  // --- 9. LEADERBOARD SYSTEM (FIXED) ---
  const fetchLeaderboard = async () => {
    try {
      if (!account) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const monsterABI = MonsterABI.abi ? MonsterABI.abi : MonsterABI;
      const contract = new ethers.Contract(
        MONSTER_ADDRESS,
        monsterABI,
        provider
      );

      // 1. Fetch ALL "RewardLog" events
      const filter = contract.filters.RewardLog();
      const events = await contract.queryFilter(filter);

      // ✅ A. Calculate GLOBAL Kills (Total events = Total deaths)
      setGlobalKillCount(events.length);

      // ✅ B. Calculate YOUR Kills
      const myKills = events.filter(
        (event) => event.args[0].toLowerCase() === account.toLowerCase()
      ).length;
      setKillCount(myKills);

      // 2. Aggregate Scores for the Hall of Fame List
      const stats = {};
      events.forEach((event) => {
        const player = event.args[0];
        if (stats[player]) {
          stats[player] += 1;
        } else {
          stats[player] = 1;
        }
      });

      // 3. Convert to Array & Sort
      const sortedList = Object.keys(stats)
        .map((player) => ({
          address: player,
          kills: stats[player],
        }))
        .sort((a, b) => b.kills - a.kills);

      setLeaderboard(sortedList);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  };
  const fetchGoldBalance = async () => {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenABI = TokenABI.abi ? TokenABI.abi : TokenABI;
      const contract = new ethers.Contract(TOKEN_ADDRESS, tokenABI, provider);
      const bal = await contract.balanceOf(account);
      setGoldBalance(ethers.formatEther(bal));
    } catch (e) {
      console.log("Error loading gold balance:", e.message);
    }
  };

  // --- 5. LOAD ALL WEAPONS ---
  const loadMyArmory = async () => {
    if (!account) return;
    setStatus("📦 Loading your armory...");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contractABI = AIWeaponABI.abi ? AIWeaponABI.abi : AIWeaponABI;
      const contract = new ethers.Contract(
        WEAPON_ADDRESS,
        contractABI,
        provider
      );

      const totalCount = await contract.tokenCounter();
      const count = Number(totalCount);

      let ownedWeapons = [];

      for (let i = 0; i < count; i++) {
        try {
          const owner = await contract.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) {
            const tokenURI = await contract.tokenURI(i);
            const base64String = tokenURI.split(",")[1];
            const json = JSON.parse(atob(base64String));
            ownedWeapons.push({ id: i, ...json });
          }
        } catch (err) {
          console.log(`Skipping ID ${i} (Burned or Error)`);
        }
      }

      setMyWeapons(ownedWeapons);
      setStatus(`✅ Loaded ${ownedWeapons.length} weapons.`);

      // 🛠️ FIX 2: Auto-select the first weapon if none is selected
      if (ownedWeapons.length > 0 && selectedWeaponId === null) {
        setSelectedWeaponId(ownedWeapons[0].id);
        console.log(
          "🔫 Auto-selected Weapon ID:",
          ownedWeapons[0].id,
          selectedWeaponId
        );
      }
    } catch (error) {
      console.error(error);
      setStatus("❌ Error loading armory.");
    }
  };

  // --- 2. AI GENERATION & MINTING ---
  const handleGenerateAndMint = async () => {
    if (!prompt) return alert("Please enter a weapon description!");
    if (!account) return alert("Please connect your wallet first!");

    setIsGenerating(true);
    setStatus("🧠 AI is dreaming up your weapon...");
    setNftData(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/generate_weapon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt }),
      });

      if (!response.ok) throw new Error("Failed to talk to AI Backend");

      const aiData = await response.json();
      console.log("🤖 AI Generated:", aiData);
      setStatus(`✨ AI created: ${aiData.name}. Minting to Blockchain...`);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractABI = AIWeaponABI.abi ? AIWeaponABI.abi : AIWeaponABI;
      const contract = new ethers.Contract(WEAPON_ADDRESS, contractABI, signer);

      const tx = await contract.mintAIWeapon(
        aiData.name,
        aiData.description,
        aiData.level,
        aiData.svg
      );

      console.log("Tx Hash:", tx.hash);
      await tx.wait();

      setStatus("✅ Minted! Retrieving NFT...");
      setTimeout(() => {
        loadMyArmory();
      }, 2000);

      setPrompt("");

      const count = await contract.tokenCounter();
      const newTokenId = Number(count) - 1;

      // 🛠️ FIX 3: Set the NEW consolidated variable
      setSelectedWeaponId(newTokenId);

      fetchNFT(newTokenId);
    } catch (error) {
      console.error(error);
      setStatus("❌ Error: " + error.message);
    }
    setIsGenerating(false);
  };

  // --- 3. FETCH NFT DISPLAY ---
  const fetchNFT = async (tokenId) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contractABI = AIWeaponABI.abi ? AIWeaponABI.abi : AIWeaponABI;
      const contract = new ethers.Contract(
        WEAPON_ADDRESS,
        contractABI,
        provider
      );

      const tokenURI = await contract.tokenURI(tokenId);
      const base64String = tokenURI.split(",")[1];
      const jsonString = atob(base64String);
      const json = JSON.parse(jsonString);

      setNftData(json);
      setStatus("");
    } catch (error) {
      console.error("Error fetching NFT:", error);
      setStatus("❌ Error showing NFT: " + error.message);
    }
  };

  // --- 4. BATTLE SYSTEM ---
  const fetchMonsterStats = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const monsterABI = MonsterABI.abi ? MonsterABI.abi : MonsterABI;
      const contract = new ethers.Contract(
        MONSTER_ADDRESS,
        monsterABI,
        provider
      );

      const hp = await contract.currentHP();
      const max = await contract.maxHP();
      const name = await contract.monsterName();

      setMonsterHP(hp.toString());
      setMonsterMaxHP(max.toString());
      setMonsterName(name);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBattleLogs = async () => {
    // Safety check: if wallet isn't connected, we can't filter by "your" hits
    if (!account) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const monsterABI = MonsterABI.abi ? MonsterABI.abi : MonsterABI;
    const monsterContract = new ethers.Contract(
      MONSTER_ADDRESS,
      monsterABI,
      signer
    );

    try {
      if (!monsterContract) return;

      // 1. Find the last time the monster died
      const rewardFilter = monsterContract.filters.RewardLog();
      const deathEvents = await monsterContract.queryFilter(
        rewardFilter,
        0,
        "latest"
      );

      let lastDeathBlock = 0;
      if (deathEvents.length > 0) {
        const lastDeath = deathEvents[deathEvents.length - 1];
        lastDeathBlock = lastDeath.blockNumber;
      }

      // 2. Fetch all attacks since the last death
      const attackEvents = await monsterContract.queryFilter(
        "Attack",
        lastDeathBlock,
        "latest"
      );

      // 3. 🛠️ DOUBLE FILTER:
      //    A. Must be on the current monster (newer than last death)
      //    B. Must be YOUR address (event.args[0] is the attacker)
      const myAttacksOnThisMonster = attackEvents.filter((event) => {
        const isCurrentMonster = event.blockNumber > lastDeathBlock;
        const isMe = event.args[0].toLowerCase() === account.toLowerCase();
        return isCurrentMonster && isMe;
      });

      console.log(
        `Found ${myAttacksOnThisMonster.length} of YOUR hits on this monster.`
      );

      // 4. Format the logs
      const formattedLogs = await Promise.all(
        myAttacksOnThisMonster.map(async (event) => {
          let timestamp = "Loading...";
          try {
            const block = await event.getBlock();
            timestamp = new Date(block.timestamp * 1000).toLocaleTimeString();
          } catch (e) {
            console.log("Could not fetch block time");
          }
          return {
            player: event.args[0], // This will always be you now
            damage: event.args[1].toString(),
            timestamp: timestamp,
          };
        })
      );

      setBattleLog(formattedLogs.reverse());
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };
  const attackMonster = async () => {
    // 🛠️ FIX 4: Guard Clause - Block attack if ID is null
    if (selectedWeaponId === null) {
      alert("⚠️ Please select/equip a weapon first!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const monsterABI = MonsterABI.abi ? MonsterABI.abi : MonsterABI;
    const monsterContract = new ethers.Contract(
      MONSTER_ADDRESS,
      monsterABI,
      signer
    );

    if (!monsterContract) return;

    try {
      console.log("⚔️ Starting Attack with Weapon ID:", selectedWeaponId);

      const tx = await monsterContract.attackMonster(selectedWeaponId);
      console.log("Tx sent:", tx.hash);

      console.log("⏳ Waiting for confirmation...");
      const receipt = await tx.wait();
      console.log("✅ Attack Confirmed! Block:", receipt.blockNumber);

      await fetchMonsterStats();
      await fetchBattleLogs();
      await fetchGoldBalance();
      await fetchLeaderboard();
    } catch (error) {
      console.error("❌ Attack Failed:", error);
      if (error.message.includes("Not your weapon")) {
        alert("Error: You don't own this weapon!");
      } else {
        alert("Attack failed! Check console for details.");
      }
    }
  };

  const RenderSVG = ({ dataURI }) => {
    if (!dataURI) return null;
    const base64 = dataURI.split(",")[1];
    const rawSvg = atob(base64);
    const fixedSvg = rawSvg.includes("xmlns")
      ? rawSvg
      : rawSvg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg" ');

    return (
      <div
        style={{
          width: "100%",
          height: "auto",
          aspectRatio: "1/1",
          background: "#111",
          borderRadius: "8px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        dangerouslySetInnerHTML={{
          __html: fixedSvg
            .replace(/width="\d+"/, 'width="100%"')
            .replace(/height="\d+"/, 'height="100%"'),
        }}
      />
    );
  };

  // --- 7. UPGRADE SYSTEM ---
  const upgradeWeapon = async (weaponId) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tokenABI = TokenABI.abi ? TokenABI.abi : TokenABI;
      const tokenContract = new ethers.Contract(
        TOKEN_ADDRESS,
        tokenABI,
        signer
      );

      const weaponABI = AIWeaponABI.abi ? AIWeaponABI.abi : AIWeaponABI;
      const weaponContract = new ethers.Contract(
        WEAPON_ADDRESS,
        weaponABI,
        signer
      );

      const cost = ethers.parseEther("10");
      console.log("upgrading weapon", WEAPON_ADDRESS, cost);

      setStatus("⏳ Step 1/2: Approving Gold...");
      const tx1 = await tokenContract.approve(WEAPON_ADDRESS, cost);
      await tx1.wait();
      console.log("Approved Gold for upgrade", weaponId);

      setStatus("🔨 Step 2/2: Upgrading Weapon...");
      const tx2 = await weaponContract.upgradeWeapon(weaponId);
      await tx2.wait();

      setStatus("✅ Upgrade Complete! Level +1");
      loadMyArmory();
      fetchGoldBalance();
    } catch (err) {
      console.error(err);
      setStatus("❌ Upgrade Failed: " + err.message);
    }
  };

  // --- 8. MARKETPLACE ACTIONS ---
  const sellWeapon = async (id, priceInGold) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const marketABI = MarketABI.abi ? MarketABI.abi : MarketABI;
      const weaponABI = AIWeaponABI.abi ? AIWeaponABI.abi : AIWeaponABI;

      const marketContract = new ethers.Contract(
        MARKET_ADDRESS,
        marketABI,
        signer
      );
      const weaponContract = new ethers.Contract(
        WEAPON_ADDRESS,
        weaponABI,
        signer
      );

      const price = ethers.parseEther(priceInGold.toString());

      setStatus("⏳ Approving Market to sell your NFT...");
      const tx1 = await weaponContract.approve(MARKET_ADDRESS, id);
      await tx1.wait();

      setStatus("📢 Listing item...");
      const tx2 = await marketContract.listItem(id, price);
      await tx2.wait();

      setStatus("✅ Item Listed on Market!");
      loadMyArmory();
      loadMarketplace();
    } catch (err) {
      console.error(err);
      setStatus("❌ Sell Error: " + err.message);
    }
  };

  const buyWeapon = async (id, priceInWei) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const marketABI = MarketABI.abi ? MarketABI.abi : MarketABI;
      const tokenABI = TokenABI.abi ? TokenABI.abi : TokenABI;

      const marketContract = new ethers.Contract(
        MARKET_ADDRESS,
        marketABI,
        signer
      );
      const tokenContract = new ethers.Contract(
        TOKEN_ADDRESS,
        tokenABI,
        signer
      );

      setStatus("⏳ Approving Gold Payment...");
      const tx1 = await tokenContract.approve(MARKET_ADDRESS, priceInWei);
      await tx1.wait();

      setStatus("💰 Buying Weapon...");
      const tx2 = await marketContract.buyItem(id);
      await tx2.wait();

      setStatus("✅ Weapon Purchased!");
      fetchGoldBalance();
      loadMarketplace();
      loadMyArmory();
    } catch (err) {
      console.error(err);
      setStatus("❌ Buy Error: " + err.message);
    }
  };

  const loadMarketplace = async () => {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const marketABI = MarketABI.abi ? MarketABI.abi : MarketABI;
      const weaponABI = AIWeaponABI.abi ? AIWeaponABI.abi : AIWeaponABI;

      const marketContract = new ethers.Contract(
        MARKET_ADDRESS,
        marketABI,
        provider
      );
      const weaponContract = new ethers.Contract(
        WEAPON_ADDRESS,
        weaponABI,
        provider
      );

      const total = await weaponContract.tokenCounter();
      let items = [];

      for (let i = 0; i < Number(total); i++) {
        const listing = await marketContract.listings(i);
        if (listing[2] === true) {
          const tokenURI = await weaponContract.tokenURI(i);
          const base64Part = tokenURI.split(",")[1];
          const jsonString = atob(base64Part);
          const json = JSON.parse(jsonString);

          items.push({
            id: i,
            seller: listing[0],
            price: listing[1],
            ...json,
          });
        }
      }
      setMarketItems(items);
    } catch (e) {
      console.log("Error loading market:", e);
    }
  };

  // --- RENDER UI ---
  return (
    <div style={{ minHeight: "100vh", paddingBottom: "100px" }}>
      {/* 1. HEADER & HUD */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(0,0,0,0.8)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <h1
            style={{ margin: 0, fontSize: "24px", color: "var(--neon-green)" }}
          >
            ⚡ GEN-AI ARMORY
          </h1>
        </div>

        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <div
            style={{
              background: "rgba(255, 215, 0, 0.1)",
              border: "1px solid var(--neon-gold)",
              padding: "8px 16px",
              borderRadius: "20px",
              color: "var(--neon-gold)",
              fontWeight: "bold",
            }}
          >
            💰 {parseFloat(goldBalance).toFixed(1)} GOLD
          </div>

          {!account ? (
            <button className="btn btn-green" onClick={connectWallet}>
              🔌 CONNECT WALLET
            </button>
          ) : (
            <div
              style={{
                color: "#666",
                fontSize: "12px",
                fontFamily: "monospace",
              }}
            >
              🟢 {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          )}
        </div>
      </nav>

      <div
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}
      >
        {/* 2. THE FORGE (AI GENERATOR) */}
        <section
          className="cyber-card"
          style={{ textAlign: "center", marginBottom: "60px" }}
        >
          <h2 style={{ color: "var(--neon-blue)", marginBottom: "10px" }}>
            🧠 Neural Weapon Forge
          </h2>
          <p style={{ color: "#888", marginBottom: "30px" }}>
            Enter a prompt. Let AI dream up your weapon. Mint it to the
            blockchain.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            <input
              className="cyber-input"
              type="text"
              placeholder="e.g. 'A plasma sniper rifle made of obsidian'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              className="btn btn-green"
              onClick={handleGenerateAndMint}
              disabled={isGenerating || !account}
              style={{ whiteSpace: "nowrap" }}
            >
              {isGenerating ? "FORGING..." : "GENERATE & MINT"}
            </button>
          </div>

          {status && (
            <div style={{ marginTop: "20px", color: "var(--neon-green)" }}>
              {status}
            </div>
          )}

          {nftData && (
            <div style={{ marginTop: "40px", animation: "fadeIn 1s" }}>
              <div
                className="cyber-card"
                style={{
                  display: "inline-block",
                  border: "1px solid var(--neon-green)",
                }}
              >
                <h3 style={{ color: "var(--neon-green)" }}>{nftData.name}</h3>
                <div style={{ margin: "20px" }}>
                  <RenderSVG dataURI={nftData.image} />
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                  }}
                >
                  {nftData.attributes.map((attr, i) => (
                    <span
                      key={i}
                      style={{
                        background: "#111",
                        padding: "5px 10px",
                        border: "1px solid #333",
                        fontSize: "12px",
                      }}
                    >
                      {attr.trait_type}:{" "}
                      <span style={{ color: "white" }}>{attr.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 3. BATTLE ARENA */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
            marginBottom: "60px",
          }}
        >
          {/* LEFT: MONSTER */}
          <section
            className="cyber-card"
            style={{ borderColor: "var(--neon-red)", textAlign: "center" }}
          >
            <h2 style={{ color: "var(--neon-red)" }}>👺 Boss Arena</h2>

            <h2
              style={{
                color: monsterName.includes("DRAGON") ? "#ff00ff" : "white",
                textShadow: monsterName.includes("DRAGON")
                  ? "0 0 20px #ff00ff"
                  : "none",
              }}
            >
              ⚠️ {monsterName}
            </h2>

            {/* HP Bar */}
            <div
              style={{
                width: "100%",
                background: "#333",
                height: "30px",
                marginBottom: "20px",
                border: "1px solid #555",
              }}
            >
              <div
                style={{
                  width: `${(monsterHP / monsterMaxHP) * 100}%`,
                  background: monsterName.includes("DRAGON")
                    ? "linear-gradient(90deg, #ff00ff, #ff0000)"
                    : "#ff2a2a",
                  height: "100%",
                  transition: "width 0.3s ease",
                }}
              ></div>
            </div>

            <h1 style={{ fontSize: "40px", margin: "0", color: "#fff" }}>
              {monsterHP} / {monsterMaxHP} HP
            </h1>

            <p style={{ color: "#aaa" }}>💀 Kill Count: {killCount}</p>
            <p style={{ color: "#aaa" }}>
              💀 Global Kill Count: {globalKillCount}
            </p>

            <button
              className="btn btn-red"
              onClick={attackMonster}
              disabled={selectedWeaponId === null}
              style={{ width: "100%", fontSize: "18px", marginTop: "20px" }}
            >
              {selectedWeaponId === null
                ? "⚠️ EQUIP WEAPON FIRST"
                : "⚔️ ATTACK BOSS"}
            </button>

            {/* LOGS */}
            <div
              style={{
                marginTop: "20px",
                height: "150px",
                overflowY: "auto",
                background: "black",
                border: "1px solid #333",
                padding: "10px",
                textAlign: "left",
                fontSize: "12px",
                color: "#888",
              }}
            >
              {Array.isArray(battleLog) &&
                battleLog.map((log, index) => (
                  <div
                    key={index}
                    style={{
                      color: index === 0 ? "#fff" : "#888",
                      marginBottom: "5px",
                      borderBottom: "1px solid #222",
                    }}
                  >
                    <span style={{ color: "#666" }}>[{log.timestamp}]</span>{" "}
                    Player {log.player.slice(0, 6)}... hit for{" "}
                    <span style={{ color: "red" }}>{log.damage} DMG</span>
                  </div>
                ))}
            </div>
          </section>

          {/* RIGHT: MY ARMORY */}
          <section className="cyber-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0 }}>🎒 Inventory</h2>
              <button
                onClick={loadMyArmory}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#666",
                  cursor: "pointer",
                }}
              >
                🔄 Refresh
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "15px",
                maxHeight: "500px",
                overflowY: "auto",
              }}
            >
              {myWeapons.map((weapon) => {
                if (!weapon || !weapon.image) return null;
                // 🛠️ FIX 5: Updated logic to use 'selectedWeaponId'
                const isEquipped = selectedWeaponId === weapon.id;
                const canAffordUpgrade = parseFloat(goldBalance) >= 10;

                return (
                  <div
                    key={weapon.id}
                    style={{
                      background: isEquipped
                        ? "rgba(255, 215, 0, 0.1)"
                        : "rgba(255,255,255,0.05)",
                      border: isEquipped
                        ? "1px solid var(--neon-gold)"
                        : "1px solid #333",
                      padding: "10px",
                      borderRadius: "8px",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        transform: "scale(0.8)",
                        transformOrigin: "top center",
                        height: "180px",
                        marginBottom: "-40px",
                      }}
                    >
                      <RenderSVG dataURI={weapon.image} />
                    </div>

                    <h4
                      style={{
                        fontSize: "12px",
                        margin: "5px 0",
                        color: "white",
                      }}
                    >
                      {weapon.name}
                    </h4>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#aaa",
                        marginBottom: "10px",
                      }}
                    >
                      LVL {weapon.attributes[0].value}
                    </div>

                    {/* 🛠️ FIX 6: Equip button now updates the consolidated state */}
                    <button
                      onClick={() => setSelectedWeaponId(weapon.id)}
                      style={{
                        width: "100%",
                        padding: "5px",
                        border: "none",
                        cursor: "pointer",
                        marginBottom: "5px",
                        background: isEquipped ? "var(--neon-gold)" : "#333",
                        color: isEquipped ? "black" : "white",
                        fontWeight: "bold",
                      }}
                    >
                      {isEquipped ? "EQUIPPED" : "EQUIP"}
                    </button>

                    <button
                      onClick={() => upgradeWeapon(weapon.id)}
                      disabled={!canAffordUpgrade}
                      style={{
                        width: "100%",
                        padding: "5px",
                        border: "1px solid #444",
                        background: "transparent",
                        color: canAffordUpgrade ? "var(--neon-gold)" : "#555",
                        cursor: canAffordUpgrade ? "pointer" : "not-allowed",
                        fontSize: "10px",
                      }}
                    >
                      {canAffordUpgrade ? "UPGRADE (10G)" : "NEED 10G"}
                    </button>

                    <button
                      onClick={() => {
                        const p = window.prompt("Sale Price (GOLD):", "50");
                        if (p) sellWeapon(weapon.id, p);
                      }}
                      style={{
                        width: "100%",
                        padding: "5px",
                        marginTop: "5px",
                        border: "1px solid var(--neon-blue)",
                        background: "transparent",
                        color: "var(--neon-blue)",
                        cursor: "pointer",
                        fontSize: "10px",
                      }}
                    >
                      SELL
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* 4. MARKETPLACE */}
        <section
          className="cyber-card"
          style={{ borderColor: "var(--neon-blue)" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "30px",
            }}
          >
            <h2 style={{ color: "var(--neon-blue)", margin: 0 }}>
              🌍 Global Market
            </h2>
            <button
              onClick={loadMarketplace}
              className="btn"
              style={{
                border: "1px solid var(--neon-blue)",
                color: "var(--neon-blue)",
                background: "transparent",
              }}
            >
              🔄 Refresh Market
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "20px",
              justifyContent: "center",
            }}
          >
            {marketItems.length === 0 && (
              <div style={{ padding: "40px", color: "#555" }}>
                Market is empty. Be the first to list!
              </div>
            )}

            {marketItems.map((item) => (
              <div
                key={item.id}
                className="cyber-card"
                style={{
                  width: "220px",
                  padding: "15px",
                  border: "1px solid var(--neon-blue)",
                }}
              >
                <div
                  style={{
                    transform: "scale(0.8)",
                    transformOrigin: "top center",
                    height: "200px",
                    marginBottom: "-20px",
                  }}
                >
                  <RenderSVG dataURI={item.image} />
                </div>
                <h4 style={{ color: "var(--neon-blue)" }}>{item.name}</h4>
                <p
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "18px",
                  }}
                >
                  {ethers.formatEther(item.price)} G
                </p>
                <p style={{ fontSize: "10px", color: "#666" }}>
                  Seller: {item.seller.slice(0, 6)}...
                </p>

                {item.seller.toLowerCase() !== account.toLowerCase() ? (
                  <button
                    className="btn"
                    style={{
                      width: "100%",
                      background: "var(--neon-blue)",
                      color: "black",
                    }}
                    onClick={() => buyWeapon(item.id, item.price)}
                  >
                    BUY NOW
                  </button>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "10px",
                      background: "#111",
                      color: "#555",
                      fontSize: "12px",
                    }}
                  >
                    YOUR LISTING
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* --- SECTION: LEADERBOARD --- */}
      <div style={{ marginTop: "60px", paddingBottom: "60px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #333",
            marginBottom: "20px",
          }}
        >
          <h2>🏆 Hall of Fame</h2>
          <button
            className="cyber-btn"
            onClick={fetchLeaderboard}
            style={{ fontSize: "0.8rem", padding: "5px 15px" }}
          >
            🔄 Update
          </button>
        </div>

        <div
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid #333",
            padding: "20px",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          {leaderboard.length === 0 && (
            <p style={{ color: "#555", textAlign: "center" }}>
              No kills recorded yet.
            </p>
          )}

          {leaderboard.map((entry, index) => (
            <div
              key={entry.address}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px",
                borderBottom: "1px solid #222",
                color:
                  index === 0
                    ? "gold"
                    : index === 1
                    ? "silver"
                    : index === 2
                    ? "#cd7f32"
                    : "#00ff41",
                fontWeight: index < 3 ? "bold" : "normal",
                fontSize: index === 0 ? "1.2rem" : "1rem",
              }}
            >
              <span>
                #{index + 1} {entry.address === account ? "(YOU)" : ""}{" "}
                {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
              </span>
              <span>☠️ {entry.kills} Kills</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Simple styles object for cleanliness
const styles = {
  button: {
    padding: "15px 30px",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#0f0",
    color: "#000",
  },
  input: {
    padding: "15px",
    width: "400px",
    fontSize: "16px",
    borderRadius: "5px",
    border: "none",
    marginRight: "10px",
  },
  card: {
    marginTop: "30px",
    border: "2px solid #0f0",
    padding: "20px",
    display: "inline-block",
    backgroundColor: "#000",
    boxShadow: "0 0 15px rgba(0, 255, 0, 0.3)",
  },
};

export default App;
