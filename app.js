const openSongFormButton = document.querySelector("#open-song-form");
const favoriteSongForm = document.querySelector("#favorite-song-form");
const favoriteSongInput = document.querySelector("#favorite-song");
const songResponse = document.querySelector("#song-response");
const songCelebration = document.querySelector("#song-celebration");
const albumPollForm = document.querySelector("#album-poll-form");
const pollStatus = document.querySelector("#poll-status");
const pollTotal = document.querySelector("#poll-total");
const pollStorageKey = "olivia-rodrigo-album-poll-v1";
const albumNames = {
  sour: "SOUR",
  guts: "GUTS",
  "new-era": "You Seem Pretty Sad for a Girl So in Love"
};
const themeToggle = document.querySelector("#theme-toggle");
const themeStatus = document.querySelector("#theme-status");
const themeStorageKey = "olivia-rodrigo-theme";

let pollData = { votes: { sour: 0, guts: 0, "new-era": 0 }, selection: null };

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute("aria-label", `Ativar modo ${isDark ? "claro" : "escuro"}`);
  themeToggle.title = `Ativar modo ${isDark ? "claro" : "escuro"}`;
  themeToggle.querySelector(".theme-toggle-icon").textContent = isDark ? "☀" : "☾";
  themeToggle.querySelector(".theme-toggle-label").textContent = `Modo ${isDark ? "claro" : "escuro"}`;
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#1a121d" : "#170f1c";
}

try {
  const savedTheme = localStorage.getItem(themeStorageKey);
  applyTheme(savedTheme === "dark" ? "dark" : "light");
} catch (error) {
  applyTheme("light");
  themeStatus.textContent = `Não foi possível carregar a preferência de tema: ${error.message}`;
}

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);

  try {
    localStorage.setItem(themeStorageKey, nextTheme);
    themeStatus.textContent = `Modo ${nextTheme === "dark" ? "escuro" : "claro"} ativado.`;
  } catch (error) {
    themeStatus.textContent = `O modo mudou, mas não foi possível salvar a preferência: ${error.message}`;
  }
});

function openSongForm() {
  favoriteSongForm.hidden = false;
  openSongFormButton.setAttribute("aria-expanded", "true");
  favoriteSongInput.focus();
}

openSongFormButton.addEventListener("click", openSongForm);

favoriteSongInput.addEventListener("input", () => {
  favoriteSongInput.setCustomValidity("");
});

favoriteSongForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const song = favoriteSongInput.value.trim();
  if (!song) {
    favoriteSongInput.setCustomValidity("Escreva o nome de uma música antes de enviar.");
    favoriteSongInput.reportValidity();
    return;
  }

  songResponse.textContent = `Sua favorita é “${song}”! Obrigada por compartilhar com outros Livies.`;
  songResponse.hidden = false;
  favoriteSongForm.reset();

  ["🎙️", "💿", "🎤", "💿", "🎙️", "💿", "🎤", "💿"].forEach((emoji, index) => {
    const floatingEmoji = document.createElement("span");
    floatingEmoji.className = "celebration-emoji";
    floatingEmoji.setAttribute("aria-hidden", "true");
    floatingEmoji.style.setProperty("--emoji-left", `${12 + Math.random() * 76}%`);
    floatingEmoji.style.setProperty("--emoji-drift", `${Math.round((Math.random() - 0.5) * 150)}px`);
    floatingEmoji.style.setProperty("--emoji-rotation", `${Math.round((Math.random() - 0.5) * 70)}deg`);
    floatingEmoji.style.animationDelay = `${index * 100}ms`;
    floatingEmoji.textContent = emoji;
    songCelebration.append(floatingEmoji);
    floatingEmoji.addEventListener("animationend", () => floatingEmoji.remove(), { once: true });
  });
});

function isValidPollData(data) {
  return data
    && data.votes
    && Object.keys(albumNames).every((album) => Number.isSafeInteger(data.votes[album]) && data.votes[album] >= 0)
    && (data.selection === null || Object.hasOwn(albumNames, data.selection))
    && (data.selection === null || data.votes[data.selection] > 0);
}

function renderPoll() {
  const totalVotes = Object.values(pollData.votes).reduce((total, votes) => total + votes, 0);

  pollTotal.textContent = totalVotes === 0
    ? "Ainda não há votos. Seja a primeira Livie a votar!"
    : `${totalVotes} ${totalVotes === 1 ? "voto registrado" : "votos registrados"} neste navegador.`;

  document.querySelectorAll(".poll-result").forEach((result) => {
    const album = result.dataset.result;
    const votes = pollData.votes[album];
    const percentage = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
    const bar = result.querySelector(".poll-track");

    result.querySelector(".poll-count").textContent = `${votes} ${votes === 1 ? "voto" : "votos"} · ${percentage}%`;
    bar.setAttribute("aria-valuenow", String(percentage));
    bar.querySelector("span").style.width = `${percentage}%`;
  });

  const savedSelection = albumPollForm.querySelector(`input[name="album-vote"][value="${pollData.selection}"]`);
  if (savedSelection) {
    savedSelection.checked = true;
  }
}

try {
  const storedPoll = localStorage.getItem(pollStorageKey);
  if (storedPoll !== null) {
    const parsedPoll = JSON.parse(storedPoll);
    if (!isValidPollData(parsedPoll)) {
      throw new Error("Os dados salvos da votação estão inválidos.");
    }
    pollData = parsedPoll;
  }
  renderPoll();
} catch (error) {
  pollStatus.textContent = `Não foi possível carregar a votação: ${error.message}`;
  albumPollForm.querySelector("button[type='submit']").disabled = true;
}

albumPollForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const selectedAlbum = albumPollForm.querySelector('input[name="album-vote"]:checked')?.value;
  if (!selectedAlbum || !Object.hasOwn(albumNames, selectedAlbum)) {
    pollStatus.textContent = "Escolha um álbum antes de registrar seu voto.";
    return;
  }

  const nextPollData = {
    votes: { ...pollData.votes },
    selection: selectedAlbum
  };
  const previousSelection = pollData.selection;

  if (previousSelection !== selectedAlbum) {
    if (previousSelection) {
      nextPollData.votes[previousSelection] -= 1;
    }
    nextPollData.votes[selectedAlbum] += 1;
  }

  try {
    localStorage.setItem(pollStorageKey, JSON.stringify(nextPollData));
    pollData = nextPollData;
    renderPoll();
    pollStatus.textContent = previousSelection === selectedAlbum
      ? `Seu voto em ${albumNames[selectedAlbum]} continua registrado!`
      : previousSelection
        ? `Seu voto foi atualizado para ${albumNames[selectedAlbum]}!`
        : `Seu voto em ${albumNames[selectedAlbum]} foi registrado!`;
  } catch (error) {
    pollStatus.textContent = `Não foi possível salvar seu voto: ${error.message}`;
  }
});
