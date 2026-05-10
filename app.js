// Registro del service worker para habilitar la PWA
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

// Estado de conexión online / offline
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

// ===== Lógica principal de Split Fácil =====

// Referencias a elementos del DOM
const participantName = document.getElementById("participantName");
const addParticipantBtn = document.getElementById("addParticipantBtn");
const participantsList = document.getElementById("participantsList");
const expenseDescription = document.getElementById("expenseDescription");
const expenseAmount = document.getElementById("expenseAmount");
const expensePayer = document.getElementById("expensePayer");
const expenseParticipantsContainer = document.getElementById("expenseParticipantsContainer");
const addExpenseBtn = document.getElementById("addExpenseBtn");
const expensesList = document.getElementById("expensesList");
const balanceSummary = document.getElementById("balanceSummary");
const editModal = document.getElementById("editModal");
const editExpenseDescription = document.getElementById("editExpenseDescription");
const editExpenseAmount = document.getElementById("editExpenseAmount");
const editExpensePayer = document.getElementById("editExpensePayer");
const editExpenseParticipantsContainer = document.getElementById("editExpenseParticipantsContainer");
const saveExpenseBtn = document.getElementById("saveExpenseBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// Navegación entre vistas
const menuBtns = document.querySelectorAll(".menu-btn");

let appData = loadData();
let editingExpenseIndex = null;
let selectedParticipants = new Set(); // Participantes seleccionados en el formulario de nuevo gasto
let editSelectedParticipants = new Set(); // Participantes seleccionados en el modal de edición

// ===== NAVEGACIÓN =====
function switchView(viewName) {
  // Ocultar todas las vistas
  document.querySelectorAll(".view").forEach(view => {
    view.classList.remove("active");
  });

  // Mostrar la vista seleccionada
  const viewId = `view-${viewName}`;
  const view = document.getElementById(viewId);
  if (view) {
    view.classList.add("active");
  }

  // Actualizar el estado de los botones del menú
  menuBtns.forEach(btn => {
    btn.classList.remove("active");
    if (btn.dataset.view === viewName) {
      btn.classList.add("active");
    }
  });

  // Limpiar el formulario al cambiar a la vista de nuevo gasto
  if (viewName === "add-expense") {
    clearExpenseForm();
  }
}

menuBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const viewName = btn.dataset.view;
    switchView(viewName);
  });
});

// ===== PARTICIPANTES =====
function renderParticipants() {
  participantsList.innerHTML = "";
  expensePayer.innerHTML = "";
  editExpensePayer.innerHTML = "";

  if (appData.participants.length === 0) {
    const li = document.createElement("li");
    li.className = "participant-item";
    li.innerHTML = '<span class="participant-name">No hay participantes aún</span>';
    participantsList.appendChild(li);

    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Agregar participantes primero";
    option.disabled = true;
    expensePayer.appendChild(option);
    return;
  }

  appData.participants.forEach((name, index) => {
    const li = document.createElement("li");
    li.className = "participant-item";

    const nameSpan = document.createElement("span");
    nameSpan.className = "participant-name";
    nameSpan.textContent = name;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "participant-delete";
    deleteBtn.textContent = "Eliminar";
    deleteBtn.addEventListener("click", () => deleteParticipant(index));

    li.appendChild(nameSpan);
    li.appendChild(deleteBtn);
    participantsList.appendChild(li);

    // Add to payer select
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    expensePayer.appendChild(option);

    const editOption = document.createElement("option");
    editOption.value = name;
    editOption.textContent = name;
    editExpensePayer.appendChild(editOption);
  });

  // Actualizar botones de selección de participantes al cambiar la lista
  updateExpenseParticipantsSelector();
  updateEditExpenseParticipantsSelector();
}

function updateExpenseParticipantsSelector() {
  const payer = expensePayer.value;
  expenseParticipantsContainer.innerHTML = "";

  if (appData.participants.length === 0) {
    return;
  }

  appData.participants.forEach(name => {
    // Excluir al que pagó del listado de quienes deben pagar
    if (name === payer) {
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = `participant-btn ${selectedParticipants.has(name) ? "selected" : ""}`;
    button.textContent = name;
    button.dataset.participant = name;

    button.addEventListener("click", () => {
      if (selectedParticipants.has(name)) {
        selectedParticipants.delete(name);
        button.classList.remove("selected");
      } else {
        selectedParticipants.add(name);
        button.classList.add("selected");
      }
    });

    expenseParticipantsContainer.appendChild(button);
  });
}

function updateEditExpenseParticipantsSelector() {
  const payer = editExpensePayer.value;
  editExpenseParticipantsContainer.innerHTML = "";

  if (appData.participants.length === 0) {
    return;
  }

  appData.participants.forEach(name => {
    // Excluir al que pagó del listado de quienes deben pagar
    if (name === payer) {
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = `participant-btn ${editSelectedParticipants.has(name) ? "selected" : ""}`;
    button.textContent = name;
    button.dataset.participant = name;

    button.addEventListener("click", () => {
      if (editSelectedParticipants.has(name)) {
        editSelectedParticipants.delete(name);
        button.classList.remove("selected");
      } else {
        editSelectedParticipants.add(name);
        button.classList.add("selected");
      }
    });

    editExpenseParticipantsContainer.appendChild(button);
  });
}

function addParticipant() {
  const name = participantName.value.trim();

  if (!name) {
    alert("Ingresa un nombre de participante.");
    return;
  }

  if (appData.participants.includes(name)) {
    alert("Este participante ya existe.");
    return;
  }

  appData.participants.push(name);
  participantName.value = "";
  saveAndRender();
}

function deleteParticipant(index) {
  const participantName_val = appData.participants[index];
  if (confirm(`¿Eliminar participante "${participantName_val}"? Los gastos pagados por esta persona no se eliminarán.`)) {
    appData.participants.splice(index, 1);
    saveAndRender();
  }
}

// ===== GASTOS =====
function buildExpenseDetails(expense) {
  const participants = expense.participants || appData.participants;
  const totalParticipants = participants.length;
  const amount = expense.amount;
  const payer = expense.payer;
  const details = [];

  if (totalParticipants === 0) {
    return details;
  }

  const share = Math.floor(amount / totalParticipants);
  const remainder = amount - share * totalParticipants;

  participants.forEach(name => {
    if (name === payer) {
      const payerAmount = amount - share - remainder;
      if (payerAmount === 0) {
        details.push({ name, text: "No debe ni recibe" });
      } else {
        const formatted = payerAmount.toLocaleString("es-CL");
        details.push({ name, text: `Recibe $${formatted}` });
      }
      return;
    }

    const formatted = share.toLocaleString("es-CL");
    details.push({ name, text: `Debe $${formatted}` });
  });

  return details;
}

function renderExpenses() {
  expensesList.innerHTML = "";

  if (appData.expenses.length === 0) {
    const li = document.createElement("li");
    li.style.padding = "1rem";
    li.style.textAlign = "center";
    li.style.color = "var(--text-muted)";
    li.textContent = "No hay gastos registrados";
    expensesList.appendChild(li);
    return;
  }

  // Ordenar gastos: primero los activos, luego los saldados
  const sortedExpenses = appData.expenses.map((expense, originalIndex) => ({
    ...expense,
    originalIndex
  })).sort((a, b) => {
    const aPaid = a.paid || false;
    const bPaid = b.paid || false;

    // Si ambos gastos están en el mismo estado, conservar el orden de creación
    if (aPaid === bPaid) {
      return a.originalIndex - b.originalIndex;
    }

    // Los gastos activos van al inicio
    return aPaid ? 1 : -1;
  });

  sortedExpenses.forEach(({ originalIndex, ...expense }) => {
    const amountText = expense.amount.toLocaleString("es-CL");
    const isPaid = expense.paid || false;

    const li = document.createElement("li");
    li.className = `expense-item ${isPaid ? "paid" : ""}`;

    const header = document.createElement("div");
    header.className = "expense-card-header";

    const textContainer = document.createElement("div");
    textContainer.className = "expense-text";

    const descText = document.createElement("div");
    descText.className = "expense-title";
    descText.textContent = expense.description;

    const payerText = document.createElement("span");
    payerText.className = "expense-payer";
    payerText.textContent = `Pagó ${expense.payer}`;

    const amountText_el = document.createElement("span");
    amountText_el.className = "expense-amount";
    amountText_el.textContent = `$${amountText}`;

    const statusTag = document.createElement("span");
    statusTag.className = `expense-status ${isPaid ? "expense-status-paid" : "expense-status-active"}`;
    statusTag.textContent = isPaid ? "Saldado" : "Activo";

    textContainer.appendChild(descText);
    textContainer.appendChild(payerText);
    textContainer.appendChild(amountText_el);
    textContainer.appendChild(statusTag);

    header.appendChild(textContainer);

    const detailToggle = document.createElement("button");
    detailToggle.className = "expense-btn detail-toggle";
    detailToggle.textContent = "Ver detalle";
    detailToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      detailSection.classList.toggle("active");
      detailToggle.textContent = detailSection.classList.contains("active") ? "Ocultar detalle" : "Ver detalle";
    });

    header.appendChild(detailToggle);

    const detailSection = document.createElement("div");
    detailSection.className = "expense-detail";

    if (isPaid) {
      const paidText = document.createElement("div");
      paidText.textContent = "Este gasto está saldado y no afecta los balances.";
      paidText.className = "expense-detail-note";
      detailSection.appendChild(paidText);
    } else {
      const details = buildExpenseDetails(expense);
      details.forEach(item => {
        const detailItem = document.createElement("div");
        detailItem.className = "expense-detail-item";
        detailItem.textContent = `${item.name} ${item.text}`;
        detailSection.appendChild(detailItem);
      });
    }

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "expense-buttons";

    const editBtn = document.createElement("button");
    editBtn.className = "expense-btn edit";
    editBtn.textContent = "Editar";
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditModal(originalIndex);
    });

    const paidBtn = document.createElement("button");
    paidBtn.className = `expense-btn ${isPaid ? "paid" : ""}`;
    paidBtn.textContent = isPaid ? "✓ Saldado" : "Saldado";
    paidBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleExpensePaid(originalIndex);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "expense-btn delete";
    deleteBtn.textContent = "Eliminar";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteExpense(originalIndex);
    });

    buttonContainer.appendChild(editBtn);
    buttonContainer.appendChild(paidBtn);
    buttonContainer.appendChild(deleteBtn);

    li.appendChild(header);
    li.appendChild(detailSection);
    li.appendChild(buttonContainer);
    expensesList.appendChild(li);
  });

  renderBalances();
}

function addExpense() {
  const description = expenseDescription.value.trim();
  const amountValue = Number(expenseAmount.value);
  const payer = expensePayer.value;
  const selectedParticipantsArray = Array.from(selectedParticipants);

  if (!description) {
    alert("Ingresa una descripción del gasto.");
    return;
  }

  if (!Number.isInteger(amountValue) || amountValue <= 0) {
    alert("Ingresa un monto válido en pesos (número entero mayor a 0).");
    return;
  }

  if (!payer) {
    alert("Selecciona un participante que pagó el gasto.");
    return;
  }

  if (selectedParticipantsArray.length === 0) {
    alert("Selecciona al menos un participante que debe pagar el gasto.");
    return;
  }

  appData.expenses.push({
    description,
    amount: amountValue,
    payer,
    participants: selectedParticipantsArray,
    paid: false
  });

  clearExpenseForm();
  saveAndRender();
  alert("Gasto registrado correctamente");
  switchView("expenses");
}

function openEditModal(index) {
  editingExpenseIndex = index;
  const expense = appData.expenses[index];

  editExpenseDescription.value = expense.description;
  editExpenseAmount.value = expense.amount;
  editExpensePayer.value = expense.payer;

  // Load selected participants into edit set
  editSelectedParticipants.clear();
  if (expense.participants) {
    expense.participants.forEach(name => editSelectedParticipants.add(name));
  }

  // Actualizar el selector para mostrar los participantes ya seleccionados
  updateEditExpenseParticipantsSelector();

  editModal.style.display = "flex";
}

function closeEditModal() {
  editModal.style.display = "none";
  editingExpenseIndex = null;
}

function saveEditExpense() {
  const description = editExpenseDescription.value.trim();
  const amountValue = Number(editExpenseAmount.value);
  const payer = editExpensePayer.value;
  const selectedParticipantsArray = Array.from(editSelectedParticipants);

  if (!description) {
    alert("Ingresa una descripción del gasto.");
    return;
  }

  if (!Number.isInteger(amountValue) || amountValue <= 0) {
    alert("Ingresa un monto válido en pesos (número entero mayor a 0).");
    return;
  }

  if (!payer) {
    alert("Selecciona un participante que pagó el gasto.");
    return;
  }

  if (selectedParticipantsArray.length === 0) {
    alert("Selecciona al menos un participante que debe pagar el gasto.");
    return;
  }

  appData.expenses[editingExpenseIndex] = {
    ...appData.expenses[editingExpenseIndex],
    description,
    amount: amountValue,
    payer,
    participants: selectedParticipantsArray
  };

  closeEditModal();
  saveAndRender();
}

function deleteExpense(index) {
  if (confirm("¿Estás seguro de que quieres eliminar este gasto?")) {
    appData.expenses.splice(index, 1);
    saveAndRender();
  }
}

function toggleExpensePaid(index) {
  appData.expenses[index].paid = !appData.expenses[index].paid;
  saveAndRender();
}

// ===== BALANCES =====
function calculateBalances() {
  const balances = {};
  const participants = appData.participants;

  participants.forEach(name => {
    balances[name] = 0;
  });

  appData.expenses.forEach(expense => {
    // Omitir gastos ya saldados
    if (expense.paid) {
      return;
    }

    const amount = expense.amount;
    const payer = expense.payer;
    const expenseParticipants = expense.participants || participants;
    const totalExpenseParticipants = expenseParticipants.length;

    if (!balances.hasOwnProperty(payer) || totalExpenseParticipants === 0) {
      return;
    }

    const share = Math.floor(amount / totalExpenseParticipants);
    const remainder = amount - share * totalExpenseParticipants;

    expenseParticipants.forEach(name => {
      balances[name] -= share;
    });

    balances[payer] += amount;
    balances[payer] -= remainder;
  });

  return balances;
}

function renderBalances() {
  balanceSummary.innerHTML = "";
  const balances = calculateBalances();

  Object.entries(balances).forEach(([name, amount]) => {
    const card = document.createElement("div");
    card.className = "balance-card";

    const nameEl = document.createElement("span");
    nameEl.className = "balance-card-name";
    nameEl.textContent = name;

    const amountEl = document.createElement("span");
    amountEl.className = "balance-card-amount";
    const amountText = Math.abs(amount).toLocaleString("es-CL");

    if (amount === 0) {
      amountEl.textContent = "Equilibrado";
      amountEl.classList.add("balance-card-neutral");
    } else if (amount > 0) {
      amountEl.textContent = `Recibe $${amountText}`;
      amountEl.classList.add("balance-card-positive");
    } else {
      amountEl.textContent = `Debe $${amountText}`;
      amountEl.classList.add("balance-card-negative");
    }

    card.appendChild(nameEl);
    card.appendChild(amountEl);
    balanceSummary.appendChild(card);
  });
}

// ===== UTILS =====
function saveAndRender() {
  saveData(appData);
  renderParticipants();
  renderExpenses();
}

function clearExpenseForm() {
  expenseDescription.value = "";
  expenseAmount.value = "";
  expensePayer.value = "";
  selectedParticipants.clear();
  updateExpenseParticipantsSelector();
}

// ===== EVENT LISTENERS =====
addParticipantBtn.addEventListener("click", addParticipant);
addExpenseBtn.addEventListener("click", addExpense);
saveExpenseBtn.addEventListener("click", saveEditExpense);
cancelEditBtn.addEventListener("click", closeEditModal);

// Actualizar los botones de participantes cuando cambia el que pagó
expensePayer.addEventListener("change", () => {
  selectedParticipants.clear(); // Limpiar selecciones al cambiar quien pagó
  updateExpenseParticipantsSelector();
});

editExpensePayer.addEventListener("change", () => {
  editSelectedParticipants.clear(); // Limpiar selecciones al cambiar quien pagó en el modal
  updateEditExpenseParticipantsSelector();
});

// Cerrar modal al hacer clic fuera del contenido
editModal.addEventListener("click", (e) => {
  if (e.target === editModal) {
    closeEditModal();
  }
});

// Cerrar modal con la tecla Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && editModal.style.display === "flex") {
    closeEditModal();
  }
});

// ===== INITIALIZATION =====
renderParticipants();
renderExpenses();