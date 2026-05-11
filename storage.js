const STORAGE_KEY = "split-facil-data";

function saveData(data) { //guarda los datos
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() { //intenta leer datos guardados
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return {
      participants: [],
      expenses: []
    };
  }

  return JSON.parse(savedData);
}