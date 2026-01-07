import { useState, useEffect } from "react";
import { ethers } from "ethers";
import AIWeaponABI from "./abi.json";
import MonsterABI from "./monster_abi.json";
import TokenABI from "./token_abi.json";
import MarketABI from "./market_abi.json";

// ⚠️ REPLACE THIS WITH YOUR NEW DEPLOYED ADDRESS FROM GANACHE
const WEAPON_ADDRESS = "0x513b7D18ba1463F932665caBeBA8d90651f49a50";
const MONSTER_ADDRESS = "0x08789d202f78851F31f33E4A22DE32A7cc7C0033";
const TOKEN_ADDRESS = "0x1b196c8634c629823435A6e84a426124D69970e0";
const MARKET_ADDRESS = "0x628A24276C2A4cf69DBfBE4Cb2e97BD87c396a86";

function App() {
  // --- STATE VARIABLES ---
  const [account, setAccount] = useState(null);
  const [goldBalance, setGoldBalance] = useState("0");
  // Add this near the top with your other states
  const [myWeapons, setMyWeapons] = useState([]);
  // AI / Minting State
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const [nftData, setNftData] = useState(null);
  const [userWeaponId, setUserWeaponId] = useState(null); // Track which ID we own

  // Battle State
  const [monsterHP, setMonsterHP] = useState(100);
  const [killCount, setKillCount] = useState(0);
  const [battleLog, setBattleLog] = useState([]);
  // C. LOAD MARKET LISTINGS
  const [marketItems, setMarketItems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [monsterName, setMonsterName] = useState("Unknown Entity");
  const [monsterMaxHP, setMonsterMaxHP] = useState(100); // Default
  const [selectedWeaponId, setSelectedWeaponId] = useState(0);

  // --- INITIALIZATION ---
  useEffect(() => {
    fetchMonsterStats();
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
    }
  }, [account]); // Re-run when account changes

  // Add this to your existing useEffect so it loads on startup
  useEffect(() => {
    if (account) {
      fetchGoldBalance();
      loadMarketplace();
      // ... other fetch calls
    }
  }, [account]);

  // --- 9. LEADERBOARD SYSTEM ---

  const fetchLeaderboard = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      // We need a contract instance with the Provider (Read-only is fine)
      const monsterABI = MonsterABI.abi ? MonsterABI.abi : MonsterABI;
      const contract = new ethers.Contract(
        MONSTER_ADDRESS,
        monsterABI,
        provider
      );

      // 1. Fetch ALL "RewardLog" events from the beginning of time
      // (This is like reading the blockchain's diary)
      const filter = contract.filters.RewardLog();
      const events = await contract.queryFilter(filter);

      // 2. Aggregate Scores (Count kills per player)
      const stats = {};

      events.forEach((event) => {
        const player = event.args[0]; // The first arg in RewardLog is the player address
        if (stats[player]) {
          stats[player] += 1;
        } else {
          stats[player] = 1;
        }
      });

      // 3. Convert to Array & Sort (Highest kills first)
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

  // Add fetchLeaderboard() to your main useEffect so it loads on startup!
  const fetchGoldBalance = async () => {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      // 🛠️ FIX: Handle both ABI formats automatically
      // Make sure TokenABI is imported at the top!
      const tokenABI = TokenABI.abi ? TokenABI.abi : TokenABI;

      const contract = new ethers.Contract(TOKEN_ADDRESS, tokenABI, provider);

      const bal = await contract.balanceOf(account);
      setGoldBalance(ethers.formatEther(bal));
    } catch (e) {
      console.log("Error loading gold balance:", e.message);
    }
  };

  // Call this inside your useEffect and after attacking

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

      // 1. Get total weapons minted ever
      const totalCount = await contract.tokenCounter();
      const count = Number(totalCount);

      let ownedWeapons = [];

      // 2. Loop through every ID (Simple & brute force)
      for (let i = 0; i < count; i++) {
        try {
          const owner = await contract.ownerOf(i);

          // If YOU are the owner, fetch the details
          // (We use .toLowerCase() to avoid case-sensitivity issues)
          if (owner.toLowerCase() === account.toLowerCase()) {
            const tokenURI = await contract.tokenURI(i);
            const base64String = tokenURI.split(",")[1];
            const json = JSON.parse(atob(base64String));

            // Add the ID to the object so we can use it for battling later
            ownedWeapons.push({ id: i, ...json });
          }
        } catch (err) {
          console.log(`Skipping ID ${i} (Burned or Error)`);
        }
      }

      setMyWeapons(ownedWeapons);
      setStatus(`✅ Loaded ${ownedWeapons.length} weapons.`);
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
      // A. Call Python Backend
      const response = await fetch("http://127.0.0.1:8000/generate_weapon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt }),
      });

      if (!response.ok) throw new Error("Failed to talk to AI Backend");

      const aiData = await response.json();
      console.log("🤖 AI Generated:", aiData);

      setStatus(`✨ AI created: ${aiData.name}. Minting to Blockchain...`);

      // B. Call Smart Contract
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Robust ABI handling
      const contractABI = AIWeaponABI.abi ? AIWeaponABI.abi : AIWeaponABI;
      const contract = new ethers.Contract(WEAPON_ADDRESS, contractABI, signer);

      // ... inside handleGenerateAndMint ...

      console.log("🎨 AI Art:", aiData.svg); // Debug log

      const tx = await contract.mintAIWeapon(
        aiData.name,
        aiData.description,
        aiData.level,
        aiData.svg // <--- NEW: Pass the SVG code
      );

      console.log("Tx Hash:", tx.hash);
      await tx.wait();

      setStatus("✅ Minted! Retrieving NFT...");
      setTimeout(() => {
        loadMyArmory();
      }, 2000); // Small 2s delay ensures the blockchain node has indexed it

      // Optional: Clear input
      setPrompt("");

      // C. Get Token ID
      // (Simplified: assuming next ID is count - 1)
      const count = await contract.tokenCounter();
      const newTokenId = Number(count) - 1;
      setUserWeaponId(newTokenId); // Save this ID for battling!

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

      // Fetch all data in parallel
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
    const provider = new ethers.BrowserProvider(window.ethereum);
    const monsterABI = MonsterABI.abi ? MonsterABI.abi : MonsterABI;
    // ✅ CORRECT: Passing 'signer' allows you to write (Attack/Mint/Transfer)
    const signer = await provider.getSigner(); // Ensure you get the signer first!

    const monsterContract = new ethers.Contract(
      MONSTER_ADDRESS,
      monsterABI,
      signer
    );
    try {
      if (!monsterContract) return;

      console.log("Fetching Battle Logs...");

      // 1. Safety Check: Does the ABI support this event?
      // If this is undefined, it proves your JSON file is still old.
      if (!monsterContract.filters.Attack) {
        console.error(
          "CRITICAL: 'AttackLog' event not found in ABI. Please update Monster.json in src."
        );
        return;
      }

      // 2. Fetch Events
      // In Ethers v6, we can sometimes just pass the string name
      const events = await monsterContract.queryFilter("Attack");
      console.log(`Found ${events.length} logs.`);

      // 3. Format
      const formattedLogs = events.map((event) => {
        return {
          player: event.args[0],
          damage: event.args[1].toString(),
          timestamp: new Date(
            Number(event.args[3]) * 1000
          ).toLocaleTimeString(),
        };
      });

      setBattleLog(formattedLogs.reverse());
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const attackMonster = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const monsterABI = MonsterABI.abi ? MonsterABI.abi : MonsterABI;
    // ✅ CORRECT: Passing 'signer' allows you to write (Attack/Mint/Transfer)
    const signer = await provider.getSigner(); // Ensure you get the signer first!

    const monsterContract = new ethers.Contract(
      MONSTER_ADDRESS,
      monsterABI,
      signer
    );
    if (!monsterContract) return;

    try {
      console.log("⚔️ Starting Attack...");
      // setIsAttacking(true); // Start Animation

      // 1. Send Transaction
      // Make sure selectedWeaponId is a number or string, not an object
      const tx = await monsterContract.attackMonster(selectedWeaponId);
      console.log("Tx sent:", tx.hash);

      // 2. Wait for Receipt
      console.log("⏳ Waiting for confirmation...");
      const receipt = await tx.wait();
      console.log("✅ Attack Confirmed! Block:", receipt.blockNumber);

      // 3. Force UI Updates
      await fetchMonsterStats(); // Update HP
      await fetchBattleLogs(); // Update Hall of Fame
      await fetchGoldBalance(); // Update Gold
    } catch (error) {
      console.error("❌ Attack Failed:", error);

      // Specific check for the common "Weapon Ownership" bug
      if (error.message.includes("Not your weapon")) {
        alert("Error: You don't own this weapon!");
      } else {
        alert("Attack failed! Check console for details.");
      }
    } finally {
      // setIsAttacking(false); // Stop Animation (Always runs)
    }
  };
  // Helper to render SVG even if AI forgot the namespace
  // Helper Component (Put this above your App function)
  // Helper to render SVG safely
  const RenderSVG = ({ dataURI }) => {
    if (!dataURI) return null;

    // Decode Base64
    const base64 = dataURI.split(",")[1];
    const rawSvg = atob(base64);

    // Fix namespace if missing
    const fixedSvg = rawSvg.includes("xmlns")
      ? rawSvg
      : rawSvg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg" ');

    return (
      <div
        style={{
          width: "100%", // 🛠️ FIX: Fit parent width
          height: "auto", // 🛠️ FIX: Adjust height automatically
          aspectRatio: "1/1", // Keep it square
          background: "#111",
          borderRadius: "8px", // Nice rounded corners
          overflow: "hidden", // Cut off anything sticking out
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        // Inject the SVG HTML
        dangerouslySetInnerHTML={{
          __html: fixedSvg
            .replace(/width="\d+"/, 'width="100%"')
            .replace(/height="\d+"/, 'height="100%"'),
        }}
      />
    );
  };

  // --- 7. UPGRADE SYSTEM ---
  // --- 7. UPGRADE SYSTEM (FIXED) ---
  const upgradeWeapon = async (weaponId) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 🛠️ FIX 1: Handle Token ABI safely
      const tokenABI = TokenABI.abi ? TokenABI.abi : TokenABI;
      const tokenContract = new ethers.Contract(
        TOKEN_ADDRESS,
        tokenABI,
        signer
      );

      // 🛠️ FIX 2: Handle Weapon ABI safely
      const weaponABI = AIWeaponABI.abi ? AIWeaponABI.abi : AIWeaponABI;
      const weaponContract = new ethers.Contract(
        WEAPON_ADDRESS,
        weaponABI,
        signer
      );

      const cost = ethers.parseEther("10");

      setStatus("⏳ Step 1/2: Approving Gold...");
      // 1. Approve (This might trigger a MetaMask popup)
      const tx1 = await tokenContract.approve(WEAPON_ADDRESS, cost);
      await tx1.wait();

      setStatus("🔨 Step 2/2: Upgrading Weapon...");
      // 2. Upgrade (This triggers the second popup)
      const tx2 = await weaponContract.upgradeWeapon(weaponId);
      await tx2.wait();

      setStatus("✅ Upgrade Complete! Level +1");

      // Refresh UI
      loadMyArmory();
      fetchGoldBalance();
    } catch (err) {
      console.error(err);
      setStatus("❌ Upgrade Failed: " + err.message);
    }
  };

  // --- 8. MARKETPLACE ACTIONS ---

  // A. SELL (List Item)
  const sellWeapon = async (id, priceInGold) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 🛠️ FIX: Handle ABI format safely
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
      // 1. Approve Market
      const tx1 = await weaponContract.approve(MARKET_ADDRESS, id);
      await tx1.wait();

      setStatus("📢 Listing item...");
      // 2. List Item
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

      // 🛠️ FIX: Handle ABI format safely
      const marketABI = MarketABI.abi ? MarketABI.abi : MarketABI;
      const tokenABI = TokenABI.abi ? TokenABI.abi : TokenABI; // Ensure TokenABI is imported!

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
      // 1. Approve Gold
      const tx1 = await tokenContract.approve(MARKET_ADDRESS, priceInWei);
      await tx1.wait();

      setStatus("💰 Buying Weapon...");
      // 2. Buy
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

      // 🛠️ FIX: Handle ABI format safely for BOTH contracts
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

      // Get total weapons to scan
      // (Note: In a real production app, we would use a Graph indexer for this,
      // but looping is fine for a prototype)
      const total = await weaponContract.tokenCounter();
      let items = [];

      for (let i = 0; i < Number(total); i++) {
        const listing = await marketContract.listings(i);

        // listing returns struct: [seller, price, active]
        // listing[2] is the boolean 'active'
        if (listing[2] === true) {
          // Fetch NFT Data (Name, Image, etc.)
          const tokenURI = await weaponContract.tokenURI(i);

          // Decode the Base64 JSON
          const base64Part = tokenURI.split(",")[1];
          const jsonString = atob(base64Part);
          const json = JSON.parse(jsonString);

          items.push({
            id: i,
            seller: listing[0],
            price: listing[1], // Price is in Wei
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
  // ... (Keep all your existing functions above this line) ...

  // --- NEW RENDER UI ---
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
          {/* GOLD BADGE */}
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

          {/* Status Message */}
          {status && (
            <div style={{ marginTop: "20px", color: "var(--neon-green)" }}>
              {status}
            </div>
          )}

          {/* NEW MINT SHOWCASE */}
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

            {/* Monster Name Header */}
            <h2
              style={{
                color: monsterName.includes("DRAGON") ? "#ff00ff" : "white", // Purple for Boss
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
            <div
              style={{
                height: "10px",
                background: "#333",
                borderRadius: "5px",
                overflow: "hidden",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: `${monsterHP}%`,
                  height: "100%",
                  background: "var(--neon-red)",
                  transition: "width 0.3s",
                }}
              ></div>
            </div>

            <p style={{ color: "#aaa" }}>💀 Kill Count: {killCount}</p>

            <button
              className="btn btn-red"
              onClick={attackMonster}
              disabled={userWeaponId === null}
              style={{ width: "100%", fontSize: "18px", marginTop: "20px" }}
            >
              {userWeaponId === null
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
                    style={{ color: index === 0 ? "#fff" : "#888" }}
                  >
                    {log}
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
                const isEquipped = userWeaponId === weapon.id;
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
                    {/* Render SVG (Scaled Down) */}
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

                    <button
                      onClick={() => setUserWeaponId(weapon.id)}
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

                    {/* UPGRADE BUTTON */}
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

                    {/* SELL BUTTON */}
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
                    : "#00ff41", // Gold/Silver/Bronze colors
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
