/* ===========================
   SHARED VALIDATION + TEMPLATE
=========================== */

function validateLeadInput(value, validationType) {
  const cleanValue = value.trim();

  if (validationType === "name") {
    if (cleanValue.length < 2) return "Please enter your full name with at least 2 characters.";
    if (!/^[a-zA-ZÀ-ÿ' -]+$/.test(cleanValue)) return "Please enter a valid name using letters only.";
  }

  if (validationType === "email") {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailPattern.test(cleanValue)) return "Please enter a valid email address, for example name@example.com.";
  }

  if (validationType === "phone") {
    const normalizedPhone = cleanValue.replace(/\s+/g, "");
    const phonePattern = /^(\+27|27|0)[6-8][0-9]{8}$/;
    if (!phonePattern.test(normalizedPhone)) {
      return "Please enter a valid South African mobile number, for example 0615426276 or +27615426276.";
    }
  }

  if (validationType === "required") {
    if (cleanValue.length < 3) return "Please provide a little more detail so I can capture the enquiry properly.";
  }

  return "";
}

function renderTemplate(text, dataSource = {}) {
  return text.replace(/\{\{(.*?)\}\}/g, (_, key) => dataSource[key.trim()] || "");
}

/* ===========================
   EMAILJS CONFIGURATION
=========================== */

const EMAILJS_SERVICE_ID = "service_jifgpoj";
const EMAILJS_TEMPLATE_ID = "template_7gk3d49";
const EMAILJS_PUBLIC_KEY = "37o18MU5-ou0Vy2FD";

if (typeof emailjs !== "undefined") {
  emailjs.init({
    publicKey: EMAILJS_PUBLIC_KEY
  });
}

let maendeleoEnquirySending = false;
let maendeleoEnquirySent = false;

async function sendMaendeleoEnquiry() {
  if (maendeleoEnquirySending || maendeleoEnquirySent) {
    return false;
  }

  if (typeof emailjs === "undefined") {
    throw new Error("EmailJS library did not load.");
  }

  maendeleoEnquirySending = true;

  const templateParams = {
    from_name: maendeleoLeadData.name || "",
    from_email: maendeleoLeadData.email || "",
    phone: maendeleoLeadData.phone || "",
    project_type: maendeleoLeadData.projectType || "",
    message: maendeleoLeadData.message || "",
    submitted_at:
      maendeleoLeadData.submittedAt ||
      new Date().toLocaleString("en-ZA"),
    source:
      maendeleoLeadData.source ||
      "Maendeleo Solutions Website Assistant"
  };

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    maendeleoEnquirySent = true;
    return true;
  } finally {
    maendeleoEnquirySending = false;
  }
}

/* ===========================
   MAENDELEO ASSIST BOT
=========================== */

const maendeleoBotLauncher = document.getElementById("maendeleoBotLauncher");
const maendeleoBotPanel = document.getElementById("maendeleoBotPanel");
const maendeleoBotClose = document.getElementById("maendeleoBotClose");
const maendeleoBotWindow = document.getElementById("maendeleoBotWindow");
const maendeleoBotForm = document.getElementById("maendeleoBotForm");
const maendeleoBotInput = document.getElementById("maendeleoBotInput");
const maendeleoBotReset = document.getElementById("maendeleoBotReset");

const maendeleoLeadFlow = [
  {
    type: "message",
    text: "Hi, I’m Maendeleo Assist. I can help capture your website, automation, chatbot, or digital project enquiry."
  },
  {
    type: "input",
    prompt: "Please share your full name.",
    variable: "name",
    validate: "name"
  },
  {
    type: "input",
    prompt: "Thanks {{name}}. Please share your email address.",
    variable: "email",
    validate: "email"
  },
  {
    type: "input",
    prompt: "Please share your phone number. South African format is accepted, e.g. 0615426276 or +27615426276.",
    variable: "phone",
    validate: "phone"
  },
  {
    type: "input",
    prompt: "What type of project are you interested in? Example: website, chatbot, automation, solution architecture, lead capture, or cloud deployment.",
    variable: "projectType",
    validate: "required"
  },
  {
    type: "input",
    prompt: "Please give me a short summary of what you would like Maendeleo Solutions to help with.",
    variable: "message",
    validate: "required"
  },
  {
    type: "submit"
  },
  {
    type: "end",
    text: "Thank you for contacting Maendeleo Solutions."
  }
];

let maendeleoFlowIndex = 0;
let maendeleoLeadData = {};

function addMaendeleoMessage(text, sender = "bot") {
  if (!maendeleoBotWindow) return;

  const message = document.createElement("div");
  message.className = `bot-message ${sender}`;
  message.textContent = text;

  maendeleoBotWindow.appendChild(message);
  maendeleoBotWindow.scrollTop = maendeleoBotWindow.scrollHeight;
}

function setMaendeleoInputState(enabled, placeholder = "Type your response...") {
  if (!maendeleoBotInput) return;

  maendeleoBotInput.disabled = !enabled;
  maendeleoBotInput.placeholder = placeholder;

  if (enabled) maendeleoBotInput.focus();
}

async function processMaendeleoStep() {
  const step = maendeleoLeadFlow[maendeleoFlowIndex];

  if (!step) return;

  if (step.type === "message") {
    addMaendeleoMessage(
      renderTemplate(step.text, maendeleoLeadData)
    );

    maendeleoFlowIndex++;

    setTimeout(processMaendeleoStep, 650);
    return;
  }

  if (step.type === "input") {
    addMaendeleoMessage(
      renderTemplate(step.prompt, maendeleoLeadData)
    );

    setMaendeleoInputState(true);
    return;
  }

  if (step.type === "submit") {
    setMaendeleoInputState(
      false,
      "Sending your enquiry..."
    );

    addMaendeleoMessage(
      "Sending your enquiry..."
    );

    try {
      await sendMaendeleoEnquiry();

      addMaendeleoMessage(
        `Your enquiry has been sent successfully, ${maendeleoLeadData.name}. Maendeleo Solutions will contact you using ${maendeleoLeadData.email} or ${maendeleoLeadData.phone}.`
      );
    } catch (error) {
      console.error(
        "Maendeleo Assist EmailJS error:",
        error
      );

      addMaendeleoMessage(
        "We could not send your enquiry right now. Please email hello@maendeleosolutions.co.za directly."
      );
    }

    maendeleoFlowIndex++;

    setTimeout(processMaendeleoStep, 650);
    return;
  }

  if (step.type === "end") {
    addMaendeleoMessage(step.text);

    setMaendeleoInputState(
      false,
      "Conversation complete. Restart to send a new enquiry."
    );
  }
}

function startMaendeleoBot() {
  if (!maendeleoBotWindow || !maendeleoBotInput) return;

  maendeleoBotWindow.innerHTML = "";

  maendeleoEnquirySending = false;
  maendeleoEnquirySent = false;

  maendeleoLeadData = {
    source: "Maendeleo Solutions Website Assistant",
    submittedAt: new Date().toLocaleString("en-ZA")
  };
  maendeleoFlowIndex = 0;

  maendeleoBotInput.value = "";
  setMaendeleoInputState(false, "Starting assistant...");

  setTimeout(processMaendeleoStep, 350);
}

maendeleoBotLauncher?.addEventListener("click", () => {
  if (!maendeleoBotPanel) return;

  const isOpen = maendeleoBotPanel.classList.contains("open");

  if (isOpen) {
    maendeleoBotPanel.classList.remove("open");
    return;
  }

  maendeleoBotPanel.classList.add("open");

  if (maendeleoBotWindow && maendeleoBotWindow.children.length === 0) {
    startMaendeleoBot();
  }
});

maendeleoBotClose?.addEventListener("click", () => {
  maendeleoBotPanel?.classList.remove("open");
});

maendeleoBotReset?.addEventListener("click", startMaendeleoBot);

maendeleoBotForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const step = maendeleoLeadFlow[maendeleoFlowIndex];
  const value = maendeleoBotInput?.value.trim();

  if (!step || step.type !== "input" || !value) return;

  const validationError = validateLeadInput(value, step.validate);

  if (validationError) {
    addMaendeleoMessage(validationError, "bot");
    maendeleoBotInput.value = "";
    maendeleoBotInput.focus();
    return;
  }

  addMaendeleoMessage(value, "user");

  maendeleoLeadData[step.variable] =
    step.variable === "phone" ? value.replace(/\s+/g, "") : value;

  maendeleoBotInput.value = "";
  setMaendeleoInputState(false);

  maendeleoFlowIndex++;
  setTimeout(processMaendeleoStep, 650);
});

/* ===========================
   PROJECTS PAGE DEMO BOT
=========================== */

const demoBotBody = document.getElementById("demoBotBody");
const demoButtons = document.querySelectorAll(".demo-bot-options button");

function generateLocalReply(input) {
  const text = input.toLowerCase();

  if (text.includes("website")) {
    return "Website projects usually include page structure, content planning, responsive design, domain setup, Cloudflare hosting, contact forms, and deployment.";
  }

  if (text.includes("automation")) {
    return "Automation projects help remove repetitive manual work through lead capture, email routing, workflow handling, reporting flows, and process improvements.";
  }

  if (text.includes("chatbot")) {
    return "Chatbot projects include conversation design, guided flows, FAQs, lead qualification, escalation logic, and assistant responses.";
  }

  if (text.includes("architecture")) {
    return "Architecture diagrams show how the solution works behind the scenes, including user entry points, website layers, hosting, integrations, DNS, and deployment.";
  }

  return "Maendeleo Solutions supports websites, automation, chatbot projects, architecture diagrams, lead capture, cloud deployment, and digital transformation.";
}

function addDemoMessage(text, sender) {
  if (!demoBotBody) return;

  const message = document.createElement("div");
  message.classList.add("bot-message", sender);
  message.textContent = text;

  demoBotBody.appendChild(message);
  demoBotBody.scrollTop = demoBotBody.scrollHeight;
}

demoButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const userText = button.dataset.demo;

    demoBotBody.innerHTML = "";
    addDemoMessage(userText, "user");

    setTimeout(() => {
      addDemoMessage(generateLocalReply(userText), "bot");
    }, 500);
  });
});

/* ===========================
   NAV ACTIVE STATE
=========================== */

const header = document.querySelector(".site-header");
const navLinks = document.querySelectorAll(".nav-links a");
const sections = document.querySelectorAll("section[id]");

window.addEventListener("scroll", () => {
  if (header) {
    header.classList.toggle("scrolled", window.scrollY > 30);
  }

  let currentSection = "";

  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 140;

    if (window.scrollY >= sectionTop) {
      currentSection = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");

    if (href && href.includes("#")) {
      const targetId = href.split("#")[1];
      link.classList.toggle("active", targetId === currentSection);
    }
  });
});



/* ===========================
   MOBILE NAVIGATION
=========================== */

const mobileNavToggle = document.getElementById("mobileNavToggle");
const primaryNav = document.getElementById("primaryNav");

mobileNavToggle?.addEventListener("click", () => {
  const isOpen = primaryNav?.classList.toggle("open");
  mobileNavToggle.classList.toggle("open", Boolean(isOpen));
  mobileNavToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
});

primaryNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    primaryNav.classList.remove("open");
    mobileNavToggle?.classList.remove("open");
    mobileNavToggle?.setAttribute("aria-expanded", "false");
  });
});

/* ===========================
   INFINITE CAROUSELS
=========================== */

function setupInfiniteCarousel({ carouselId, prevId, nextId, cardSelector, interval = 3600 }) {
  const carousel = document.getElementById(carouselId);
  const prevButton = document.getElementById(prevId);
  const nextButton = document.getElementById(nextId);

  if (!carousel || carousel.querySelectorAll(cardSelector).length < 2) return;

  let timer = null;
  let isAnimating = false;
  let isVisible = false;

  function getGap() {
    const styles = window.getComputedStyle(carousel);
    return parseInt(styles.columnGap || styles.gap || "28", 10) || 28;
  }

  function getStepAmount() {
    const firstCard = carousel.querySelector(cardSelector);
    return firstCard ? firstCard.offsetWidth + getGap() : 370;
  }

  function moveNext() {
    if (isAnimating) return;
    isAnimating = true;

    const amount = getStepAmount();

    carousel.scrollBy({
      left: amount,
      behavior: "smooth"
    });

    window.setTimeout(() => {
      const firstCard = carousel.querySelector(cardSelector);

      if (firstCard) {
        carousel.appendChild(firstCard);
        carousel.scrollLeft = Math.max(0, carousel.scrollLeft - amount);
      }

      isAnimating = false;
    }, 650);
  }

  function movePrev() {
    if (isAnimating) return;
    isAnimating = true;

    const cards = carousel.querySelectorAll(cardSelector);
    const lastCard = cards[cards.length - 1];
    const amount = getStepAmount();

    if (lastCard) {
      carousel.insertBefore(lastCard, carousel.firstElementChild);
      carousel.scrollLeft += amount;
    }

    carousel.scrollBy({
      left: -amount,
      behavior: "smooth"
    });

    window.setTimeout(() => {
      isAnimating = false;
    }, 650);
  }

  function startAutoRotate() {
    if (timer || !isVisible) return;
    timer = window.setInterval(moveNext, interval);
  }

  function stopAutoRotate() {
    if (!timer) return;
    window.clearInterval(timer);
    timer = null;
  }

  function resetAutoRotate() {
    stopAutoRotate();
    startAutoRotate();
  }

  nextButton?.addEventListener("click", () => {
    moveNext();
    resetAutoRotate();
  });

  prevButton?.addEventListener("click", () => {
    movePrev();
    resetAutoRotate();
  });

  carousel.addEventListener("mouseenter", stopAutoRotate);
  carousel.addEventListener("mouseleave", startAutoRotate);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;

        if (isVisible) {
          startAutoRotate();
        } else {
          stopAutoRotate();
        }
      });
    }, { threshold: 0.25 });

    observer.observe(carousel);
  } else {
    isVisible = true;
    startAutoRotate();
  }
}

setupInfiniteCarousel({
  carouselId: "servicesCarousel",
  prevId: "servicesPrev",
  nextId: "servicesNext",
  cardSelector: ".service-card",
  interval: 3500
});

setupInfiniteCarousel({
  carouselId: "architectureCarousel",
  prevId: "architecturePrev",
  nextId: "architectureNext",
  cardSelector: ".architecture-slide",
  interval: 4200
});

/* ===========================
   LEAD CAPTURE DEMO BOT
=========================== */

const botChatWindow = document.getElementById("botChatWindow");
const botForm = document.getElementById("botForm");
const botInput = document.getElementById("botInput");
const botReset = document.getElementById("botReset");
const flowSteps = document.querySelectorAll(".flow-step");

const leadFlow = [
  {
    type: "message",
    text: "Hi, thanks for your interest in Maendeleo Solutions. I’ll capture a few details so we can assist you.",
    stepIndex: 0
  },
  {
    type: "input",
    prompt: "May I have your full name?",
    variable: "name",
    validate: "name",
    stepIndex: 1
  },
  {
    type: "input",
    prompt: "Thanks {{name}}. Please share your email address.",
    variable: "email",
    validate: "email",
    stepIndex: 2
  },
  {
    type: "input",
    prompt: "Please share your phone number. South African format is accepted, e.g. 0615426276 or +27615426276.",
    variable: "phone",
    validate: "phone",
    stepIndex: 3
  },
  {
    type: "input",
    prompt: "What product or service are you interested in? Example: website, chatbot, automation, lead capture, or architecture.",
    variable: "query",
    validate: "required",
    stepIndex: 4
  },
  {
    type: "message",
    text: "Thanks {{name}}. We have captured your request: {{query}}. Maendeleo Solutions can contact you on {{email}} or {{phone}}.",
    stepIndex: 5
  },
  {
    type: "end",
    text: "Thank you. This lead capture conversation has ended."
  }
];

let currentFlowIndex = 0;
let leadData = {};

function updateFlowStep(index) {
  flowSteps.forEach((step, stepIndex) => {
    step.classList.toggle("active", stepIndex === index);
  });
}

function addBotMessage(text, sender = "bot") {
  if (!botChatWindow) return;

  const message = document.createElement("div");
  message.className = `bot-message ${sender}`;
  message.textContent = text;

  botChatWindow.appendChild(message);
  botChatWindow.scrollTop = botChatWindow.scrollHeight;
}

function processBotStep() {
  const step = leadFlow[currentFlowIndex];
  if (!step || !botInput) return;

  if (typeof step.stepIndex === "number") {
    updateFlowStep(step.stepIndex);
  }

  if (step.type === "message") {
    addBotMessage(renderTemplate(step.text, leadData));
    currentFlowIndex++;
    setTimeout(processBotStep, 700);
    return;
  }

  if (step.type === "input") {
    addBotMessage(renderTemplate(step.prompt, leadData));
    botInput.disabled = false;
    return;
  }

  if (step.type === "end") {
    addBotMessage(step.text);
    botInput.disabled = true;
    botInput.placeholder = "Demo complete. Restart to try again.";
  }
}

function startBotDemo() {
  if (!botChatWindow || !botInput) return;

  botChatWindow.innerHTML = "";
  leadData = {};
  currentFlowIndex = 0;

  botInput.value = "";
  botInput.disabled = false;
  botInput.placeholder = "Type your response...";

  updateFlowStep(0);
  processBotStep();
}

botForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const step = leadFlow[currentFlowIndex];
  const value = botInput.value.trim();

  if (!step || step.type !== "input" || !value) return;

  const validationError = validateLeadInput(value, step.validate);

  if (validationError) {
    addBotMessage(validationError, "bot");
    botInput.value = "";
    return;
  }

  addBotMessage(value, "user");

  leadData[step.variable] =
    step.variable === "phone" ? value.replace(/\s+/g, "") : value;

  botInput.value = "";
  botInput.disabled = true;

  currentFlowIndex++;
  setTimeout(processBotStep, 700);
});

botReset?.addEventListener("click", startBotDemo);

if (botChatWindow && botForm && botInput) {
  startBotDemo();
}