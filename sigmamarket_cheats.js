let extConfig = JSON.parse(localStorage.getItem('sigmaMarketExtConfig')) || {
    noDelay: false,
    autoAmount: false,
    autoAmountValue: 0
};
let sessionExtConfig = {
    firebaseApp: null,
    firestoreDB: null,
};

// let extConfig = {
//     noDelay: false,
// };
function saveExtConfig() {
    localStorage.setItem('sigmaMarketExtConfig', JSON.stringify(extConfig));
}

function initFirebase() {
    (async () => {
        const {
            initializeApp
        } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
        
        const {
            getFirestore, collection, doc, getDoc, setDoc, updateDoc, runTransaction, query, onSnapshot, serverTimestamp, deleteDoc, getDocs, increment
        } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

        const firebaseConfig = {
            apiKey: "AIzaSyC0Ojzt2HxZzTwmUZsX9ZEZ31NiyNqo6B8",
            authDomain: "sigma-market-app.firebaseapp.com",
            projectId: "sigma-market-app",
            storageBucket: "sigma-market-app.appspot.com",
            messagingSenderId: "1042846633134",
            appId: "1:1042846633134:web:ef61598314d0987ec6713f",
            measurementId: "G-WG84HP2QDH"
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        sessionExtConfig.firebaseApp = app;
        sessionExtConfig.firestoreDB = db;
        sessionExtConfig.firestoreFunctions = {
            collection,
            doc,
            getDoc,
            setDoc,
            updateDoc,
            runTransaction,
            query,
            onSnapshot,
            serverTimestamp,
            deleteDoc,
            getDocs,
            increment
        };
        console.log("Firebase initialized");
        console.log("app", app);
        console.log("db", db);
    })();
}

function getPlayerData() {
    return JSON.parse(localStorage.getItem('playerdata'));
}

function setAmount(amount) {
    document.querySelector("#spinCode").value = amount;
}

function autoSetAmountIfEnabled() {
    if (extConfig.autoAmount > 0) {
        setAmount((getPlayerData().balance * extConfig.autoAmountValue / 100).toFixed(0));
    }
}

async function setPlayerBalance(username, balance) {
    const playerRef = sessionExtConfig.firestoreFunctions.doc(sessionExtConfig.firestoreDB, "playerdata", username);
    const playerDocs = await sessionExtConfig.firestoreFunctions.getDocs(sessionExtConfig.firestoreFunctions.collection(sessionExtConfig.firestoreDB, "playerdata"));
    const playerInfos = playerDocs.docs.map(doc => ({id: doc.id, ...doc.data()}));
    console.log(playerInfos);
    await sessionExtConfig.firestoreFunctions.updateDoc(playerRef, {
        balance: balance,
    });
}

async function setGlobalBoost(boost) {
    const boostRef = sessionExtConfig.firestoreFunctions.doc(sessionExtConfig.firestoreDB, "server", "boost");
    await sessionExtConfig.firestoreFunctions.updateDoc(boostRef, {
        boost: boost,
        lastUpdated: Date.now()
    });
}

document.querySelector("#spin").addEventListener("click", function() {
    if (extConfig.noDelay) {
        this.disabled = false;
    }
    autoSetAmountIfEnabled();
});

function scanTimeout(handler, timeout, ...args) {
    if ((timeout == 2000 || timeout == 200) && extConfig.noDelay) {
        timeout = 0;
    };
    if (timeout == 5000) {
        timeout = 500;
    };
    if (timeout == 600) {
        timeout = 100;
    };
    autoSetAmountIfEnabled();

    return timeout;
};

function scanConfetti(data) {
    if (data.particleCount) {
        data.particleCount = 20;
    }
    return data
}

const originalSetTimeout = window.setTimeout;

window.setTimeout = (handler, timeout, ...args) => {
    if (!timeout) timeout = 0;
    timeout = scanTimeout(handler, timeout, ...args);

    const id = originalSetTimeout(
        handler,
        timeout,
        ...args
    );
    // log the timeout
    console.log(`Set timeout with id ${id}, timeout ${timeout}ms, handler ${handler.name || 'anonymous'}`);

    // return a promise that resolves after the timeout
    return id;
};

function createExtConfigUI() {
    const gameContainer = document.querySelector("#gameBox > div:nth-child(7)");
    const extConfigDiv = document.createElement("div");
    extConfigDiv.style = "display: flex; flex-direction: column;";
    
    const extConfigTitle = document.createElement("p");
    extConfigTitle.style = "font-size:28px; font-weight:200; display:block !important; width:280px;";
    extConfigTitle.textContent = "Extra Config";
    extConfigDiv.appendChild(extConfigTitle);

    // no delay toggle
    const noDelayToggle = document.createElement("button");
    noDelayToggle.style = "font-size:24px; border-radius: 8px;";
    noDelayToggle.textContent = `No Spin Delay: ${extConfig.noDelay ? "ON" : "OFF"}`;
    noDelayToggle.addEventListener("click", function() {
        extConfig.noDelay = !extConfig.noDelay;
        saveExtConfig();
        noDelayToggle.textContent = `No Spin Delay: ${extConfig.noDelay ? "ON" : "OFF"}`;
    });
    extConfigDiv.appendChild(noDelayToggle);

    // auto amount input and toggle
    const autoAmountContainer = document.createElement("div");
    autoAmountContainer.style = "display: flex; flex-direction: row; align-items: center;";
    extConfigDiv.appendChild(autoAmountContainer);

    const autoAmountInput = document.createElement("input");
    autoAmountInput.type = "number";
    autoAmountInput.style = "font-size:24px; border-radius: 8px; width: 100px; margin-left: 10px;";
    autoAmountInput.placeholder = "Enter percentage";
    autoAmountInput.value = extConfig.autoAmountValue || 0;
    autoAmountInput.addEventListener("change", function() {
        extConfig.autoAmountValue = parseInt(this.value, 10) || 0;
        this.parentElement.querySelector("button").textContent = `Auto Set Amount ${extConfig.autoAmount ? extConfig.autoAmountValue + "%" : "OFF"}`;
        autoSetAmountIfEnabled();
        saveExtConfig();
    });
    autoAmountContainer.appendChild(autoAmountInput);

    const autoAmountButton = document.createElement("button");
    autoAmountButton.style = "font-size:22px; font-weight:600; margin-bottom:0;";
    autoAmountButton.textContent = `Auto Set Amount ${extConfig.autoAmount ? extConfig.autoAmountValue + "%" : "OFF"}`;
    autoAmountButton.addEventListener("click", function() {
        // extConfig.autoAmount = parseInt(this.parentElement.querySelector("input").value, 10) || 0;
        extConfig.autoAmount = !extConfig.autoAmount;
        this.textContent = `Auto Set Amount ${extConfig.autoAmount ? extConfig.autoAmountValue + "%" : "OFF"}`;
        autoSetAmountIfEnabled();
        saveExtConfig();
    });
    autoAmountContainer.appendChild(autoAmountButton);

    // get jackpot button
    const getJackpotButton = document.createElement("button");
    getJackpotButton.style = "font-size:22px; font-weight:600; margin-top:10px;";
    getJackpotButton.textContent = `Get Jackpot`;
    getJackpotButton.addEventListener("click", async function() {
        setAmount(getPlayerData().balance);
        const originalRandom = Math.random;
        Math.random = () => 0.9999999;
        document.querySelector("#spin").click();
        await new Promise(resolve => setTimeout(resolve, 50));
        // document.querySelector("body > div").remove(); // remove popup
        Math.random = originalRandom;
    });
    extConfigDiv.appendChild(getJackpotButton);

    gameContainer.appendChild(extConfigDiv);

    // set player balance username input, input and button
    const setBalanceContainer = document.createElement("div");
    setBalanceContainer.style = "display: flex; flex-direction: row; align-items: center;";
    extConfigDiv.appendChild(setBalanceContainer);

    const setUsernameInput = document.createElement("input");
    setUsernameInput.type = "text";
    setUsernameInput.style = "font-size:24px; border-radius: 8px; width: 150px; margin-right: 10px;";
    setUsernameInput.placeholder = "Enter username";
    setUsernameInput.value = "";
    setBalanceContainer.appendChild(setUsernameInput);

    const setBalanceInput = document.createElement("input");
    setBalanceInput.type = "number";
    setBalanceInput.style = "font-size:24px; border-radius: 8px; width: 100px; margin-right: 10px;";
    setBalanceInput.placeholder = "Enter balance";
    setBalanceInput.value = 0;
    setBalanceContainer.appendChild(setBalanceInput);

    const setBalanceButton = document.createElement("button");
    setBalanceButton.style = "font-size:22px; font-weight:600;";
    setBalanceButton.textContent = `Set Balance`;
    setBalanceButton.addEventListener("click", async function() {
        await setPlayerBalance(this.parentElement.querySelector("input[type='text']").value, parseInt(this.parentElement.querySelector("input[type='number']").value, 10) || 0);
    });
    setBalanceContainer.appendChild(setBalanceButton);

    // set global boost input and button
    const setBoostContainer = document.createElement("div");
    setBoostContainer.style = "display: flex; flex-direction: row; align-items: center;";
    extConfigDiv.appendChild(setBoostContainer);

    const setBoostInput = document.createElement("input");
    setBoostInput.type = "number";
    setBoostInput.step = "0.001";
    setBoostInput.style = "font-size:24px; border-radius: 8px; width: 100px; margin-right: 10px;";
    setBoostInput.placeholder = "Enter boost";
    setBoostInput.value = 0;
    setBoostContainer.appendChild(setBoostInput);

    const setBoostButton = document.createElement("button");
    setBoostButton.style = "font-size:22px; font-weight:600;";
    setBoostButton.textContent = `Set Global Boost`;
    setBoostButton.addEventListener("click", async function() {
        await setGlobalBoost(parseFloat(this.parentElement.querySelector("input[type='number']").value));
    });
    setBoostContainer.appendChild(setBoostButton);

    const customStyleConfig = document.createElement("style");
    customStyleConfig.innerHTML = `body > div{display:none !important;}`;
    document.head.appendChild(customStyleConfig);

    setTimeout(function() {
        const originalConfetti = window.confetti;
        window.confetti = function(data) { return originalConfetti(scanConfetti(data)) };
    }, 100);
}

initFirebase();
createExtConfigUI();

autoSetAmountIfEnabled();
