if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => { //espera a que cargue la página antes de registrar el Service Worker
    try {
      const registration = await navigator.serviceWorker.register("./service-worker.js");
      console.log("Service Worker registrado:", registration);
    } catch (error) {
      console.error("Error registrando Service Worker:", error);
    }
  });
}