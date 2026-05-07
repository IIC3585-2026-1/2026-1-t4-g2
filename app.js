//Registro del Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./service-worker.js");
      console.log("Service Worker registrado:", registration);
    } catch (error) {
      console.error("Error registrando Service Worker:", error);
    }
  });
}


//Estado online / offline
function setConnectionBadge(status) {
  const connectionStatus = document.getElementById("connectionStatus");

  if (!connectionStatus) {
    return;
  }

  if (status === "checking") {
    connectionStatus.textContent = "Revisando...";
    connectionStatus.className = "status-badge status-checking";
  }

  if (status === "online") {
    connectionStatus.textContent = "Online";
    connectionStatus.className = "status-badge status-online";
  }

  if (status === "offline") {
    connectionStatus.textContent = "Offline";
    connectionStatus.className = "status-badge status-offline";
  }
}

async function updateConnectionStatus() {
  setConnectionBadge("checking");

  if (!navigator.onLine) {
    setConnectionBadge("offline");
    return;
  }

  try {
    await fetch(`./manifest.json?connection-check=${Date.now()}`, {
      cache: "no-store"
    });

    setConnectionBadge("online");
  } catch (error) {
    setConnectionBadge("offline");
  }
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

updateConnectionStatus();