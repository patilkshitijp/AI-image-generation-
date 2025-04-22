const themeToggle = document.querySelector(".theme-toggle");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const promptBtn = document.querySelector(".prompt-button");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallery-grid");

// Replace this with your actual API key
const API_KEY = "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";

const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "A steampunk airship floating through golden clouds at sunset",
  "A Mars colony with glass domes and gardens against red mountains",
  "A dragon sleeping on gold coins in a crystal cave",
  "An underwater kingdom with merpeople and glowing coral buildings",
];

(() => {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
  document.body.classList.toggle("dark-theme", isDarkTheme);
  themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [width, height] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);
  let calculatedWidth = Math.round(width * scaleFactor);
  let calculatedHeight = Math.round(height * scaleFactor);
  calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
  calculatedHeight = Math.floor(calculatedHeight / 16) * 16;
  return { width: calculatedWidth, height: calculatedHeight };
};

const updateImageCard = (imgIndex, imgUrl) => {
    const imgCard = document.getElementById(`img-card-${imgIndex}`);
    if (!imgCard) return;
  
    imgCard.classList.remove("loading");
    imgCard.innerHTML = `
      <img src="${imgUrl}" class="result-img" />
      <div class="img-overlay">
        <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
          <i class="fa-solid fa-download"></i>
        </a>
      </div>
    `;
  };

const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
  console.log("generateImages called");
  const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;
  const { width, height } = getImageDimensions(aspectRatio);
  console.log("Using model:", selectedModel);
  console.log("Prompt:", promptText);
  console.log("Dimensions:", width, "x", height);

  const imagePromises = [];

  for (let i = 0; i < imageCount; i++) {
    imagePromises.push(
      (async () => {
        try {
          const response = await fetch(MODEL_URL, {
            headers: {
              Authorization: `Bearer ${API_KEY}`,
              "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
              inputs: promptText,
              parameters: { width, height },
              options: { wait_for_model: true, user_cache: false },
            }),
          });

          console.log(`Response ${i}:`, response);

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Request failed");
          }

          const blob = await response.blob();
          const imageURL = URL.createObjectURL(blob);
          const imgCard = document.getElementById(`img-card-${i}`);
          const imgEl = imgCard.querySelector("img");
          imgEl.src = imageURL;
          imgCard.classList.remove("loading");
        } catch (error) {
          console.error(`Error generating image ${i}:`, error);
          const imgCard = document.getElementById(`img-card-${i}`);
          imgCard.querySelector(".status-text").textContent = "Failed to generate";
        }
      })()
    );
  }

  await Promise.all(imagePromises);
  console.log("All image requests finished.");
};

const toggleTheme = () => {
  const isDarkTheme = document.body.classList.toggle("dark-theme");
  themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
  localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
};

const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
  gridGallery.innerHTML = "";
  for (let i = 0; i < imageCount; i++) {
    gridGallery.innerHTML += `
      <div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio}">
        <div class="status-container">
          <div class="spinner"></div>
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p class="status-text">Generating...</p>
        </div>
        <img src="doggy.jpg" alt="result-img" class="result-img" />
      </div>`;
  }

  generateImages(selectedModel, imageCount, aspectRatio, promptText);
};

const handleFormSubmit = (e) => {
  e.preventDefault();
  const selectedModel = modelSelect.value;
  const imageCount = parseInt(countSelect.value) || 1;
  const aspectRatio = ratioSelect.value || "1/1";
  const promptText = promptInput.value.trim();

  if (!promptText) {
    alert("Please enter a prompt.");
    return;
  }

  createImageCards(selectedModel, imageCount, aspectRatio, promptText);
};

promptBtn.addEventListener("click", () => {
  const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
  promptInput.value = prompt;
  promptInput.focus();
});

promptForm.addEventListener("submit", handleFormSubmit);
themeToggle.addEventListener("click", toggleTheme);
