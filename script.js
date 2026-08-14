"use strict";

const steps = ["Старт", "Загрузка", "Проверка", "Готово"];

const taskCopy = {
  fill: {
    cardTitle: "Заполнить шаблон",
    title: "Заполнение шаблона",
    description: "Загрузите Excel-файл с товарами. Content AI определит категорию по содержимому файла и заполнит недостающие характеристики карточек товаров.",
  },
  check: {
    cardTitle: "Проверка ошибок",
    title: "Проверка шаблона на наличие ошибок",
    description: "Загрузите Excel-шаблон с товарами. Content AI определит категорию по содержимому файла, проверит значения и скорректирует обнаруженные ошибки.",
  },
  figma: {
    cardTitle: "Шаблон для Figma",
    title: "Составление шаблона для Figma",
    description: "Загрузите Excel-файл с товарами. Content AI определит категорию и выделит характеристики, необходимые для шаблона инфографики.",
  },
};

const characteristics = [
  "Модель",
  "Диагональ экрана",
  "Объём памяти",
  "Разрешение камеры",
  "Ёмкость аккумулятора",
  "Цвет",
];

const mainDownload = {
  label: "Скачать обработанный Excel повторно",
  href: "demo/content_ai_result.xlsx",
  fileName: "content_ai_result.xlsx",
};

const figmaDownload = {
  label: "Скачать шаблон для Figma повторно",
  href: "demo/content_ai_figma_template.xlsx",
  fileName: "content_ai_figma_template.xlsx",
};

const state = {
  screen: 0,
  maxVisited: 0,
  task: null,
  fileName: "",
  fileSize: 0,
  fileError: "",
  figmaCreated: false,
  returnToFigma: false,
  figmaDataComplete: false,
  downloads: [],
};

const progressNode = document.getElementById("progress");
const cardNode = document.getElementById("app-card");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

function goTo(index) {
  state.screen = index;
  state.maxVisited = Math.max(state.maxVisited, index);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function reset() {
  Object.assign(state, {
    screen: 0,
    maxVisited: 0,
    task: null,
    fileName: "",
    fileSize: 0,
    fileError: "",
    figmaCreated: false,
    returnToFigma: false,
    figmaDataComplete: false,
    downloads: [],
  });
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function selectTask(task) {
  if (state.task !== task) {
    state.fileName = "";
    state.fileSize = 0;
    state.fileError = "";
  }
  state.task = task;
  state.figmaCreated = false;
  state.returnToFigma = false;
  state.figmaDataComplete = false;
  state.downloads = [];
  if (state.maxVisited > 1) state.maxVisited = 1;
  render();
}

function validateFile(name, size) {
  const extension = name.split(".").pop().toLowerCase();
  if (!["xlsx", "xls"].includes(extension)) return "Выберите файл в формате .xlsx или .xls.";
  if (size > 20 * 1024 * 1024) return "Размер файла не должен превышать 20 МБ.";
  return "";
}

function acceptFile(name, size) {
  const error = validateFile(name, size);
  state.fileError = error;
  if (error) {
    state.fileName = "";
    state.fileSize = 0;
  } else {
    state.fileName = name;
    state.fileSize = size;
    state.figmaCreated = false;
    state.figmaDataComplete = false;
    if (state.maxVisited > 1) state.maxVisited = 1;
  }
  render();
}

function useDemoFile() {
  acceptFile("smartphones_demo.xlsx", 186400);
}

function startDownload(items) {
  state.downloads = items;
  items.forEach((item, index) => {
    window.setTimeout(() => {
      const anchor = document.createElement("a");
      anchor.href = item.href;
      anchor.download = item.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }, index * 180);
  });
  goTo(3);
}

function moveToFill() {
  state.task = "fill";
  state.returnToFigma = true;
  state.figmaCreated = false;
  state.maxVisited = 1;
  goTo(1);
}

function returnToFigmaReview() {
  state.task = "figma";
  state.returnToFigma = false;
  state.figmaDataComplete = true;
  state.figmaCreated = false;
  render();
}

function screenHeader(eyebrow, title, description) {
  return `<header class="screen-header"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p></header>`;
}

function taskCard(task, number, title, description) {
  const selected = state.task === task;
  return `<button type="button" role="radio" aria-checked="${selected}" class="task-card${selected ? " is-selected" : ""}" data-task="${task}">
    <span class="task-number">${number}</span>
    <span class="task-check" aria-hidden="true">${selected ? "✓" : ""}</span>
    <strong>${title}</strong>
    <small>${description}</small>
  </button>`;
}

function processingInfo() {
  if (state.task === "figma") {
    return `<section class="processing-info"><h2>Как будет обработан файл</h2><p>Content AI определит категорию товаров и выделит характеристики, необходимые для подготовки шаблона инфографики. Если в файле будут обнаружены ошибки или недостающие данные, система сообщит об этом и предложит варианты заполнения.</p></section>`;
  }
  return `<section class="processing-info">
    <h2>Как будет обработан файл</h2>
    <div class="processing-grid">
      <article><span>01</span><h3>Автоматическое определение товара</h3><p>Content AI сам определит товар по артикулу, модели, наименованию и загруженному баркоду и заполнит шаблон в соответствии с категорией товара.</p></article>
      <article><span>02</span><h3>Сохранение технических данных</h3><p>Артикул, ЕАН, цена и НДС останутся в том же порядке, в котором были загружены. Корректировки производятся только в характеристиках товара, которые увидит покупатель на сайте.</p></article>
      <article><span>03</span><h3>Проверка достоверности</h3><p>Если Content AI не сможет подтвердить информацию, значение будет отмечено в файле и журнале ошибок для последующей перепроверки. Неправильная информация не попадёт на сайт.</p></article>
    </div>
  </section>`;
}

function tags() {
  return `<div class="tag-list" aria-label="Выделенные характеристики">${characteristics.map((item) => `<span>${item}</span>`).join("")}</div>`;
}

function resultCard(tone, value, title, description) {
  return `<article class="result-card ${tone}"><span class="result-value">${value}</span><h2>${title}</h2><p>${description}</p></article>`;
}

function figmaOffer() {
  if (!state.figmaCreated) {
    return `<section class="figma-offer"><div><p class="eyebrow">Дополнительный результат</p><h2>Подготовить данные для Figma</h2><p>Content AI может выделить характеристики товаров и подготовить отдельный шаблон для создания инфографики.</p></div><button class="button secondary" id="create-figma" type="button">Создать шаблон для Figma</button></section>`;
  }
  return `<section class="figma-offer is-created"><div class="created-heading"><span>✓</span><div><p class="eyebrow">Готово</p><h2>Шаблон для Figma создан</h2><p>Категория определена, характеристики для инфографики подготовлены.</p></div></div><div class="figma-details"><div><span>Категория</span><strong>Смартфоны</strong></div><div><span>Обработано товаров</span><strong>28</strong></div></div>${tags()}</section>`;
}

function renderStart() {
  return `<section>
    <p class="eyebrow">Новая обработка</p>
    <h1>Начало работы</h1>
    <p class="lead">Укажите задачу, загрузите Excel-файл с товарами и получите готовый результат.</p>

    <div class="task-grid" role="radiogroup" aria-label="Выбор задачи">
      ${taskCard("fill", "01", "Заполнить шаблон", "Полностью заполнит карточки товаров недостающими характеристиками.")}
      ${taskCard("check", "02", "Проверка ошибок", "Проверит шаблон на наличие ошибок и скорректирует значения.")}
      ${taskCard("figma", "03", "Шаблон для Figma", "Проверит структуру файла и составит файл для создания инфографики.")}
    </div>

    <div class="privacy-note"><span class="note-icon">i</span><p>Ваши данные остаются конфиденциальными. Загруженные файлы не публикуются и не передаются в открытый доступ.</p></div>
    <div class="actions actions-end"><button class="button primary" id="continue" ${state.task ? "" : "disabled"}>Продолжить <span aria-hidden="true">→</span></button></div>
  </section>`;
}

function renderUpload() {
  const copy = taskCopy[state.task];
  const fileName = escapeHtml(state.fileName);
  const context = state.returnToFigma
    ? `<div class="context-banner"><span class="context-icon">↳</span><div><strong>Сначала дополним исходный файл</strong><p>После заполнения вы сможете вернуться к созданию шаблона для Figma без повторной загрузки.</p></div></div>`
    : "";
  const fileStatus = state.fileName
    ? `<div class="file-ready" role="status"><span>✓</span><div><strong>Файл загружен</strong><p>Категория товаров будет определена автоматически по содержимому файла.</p></div></div>`
    : `<p class="demo-shortcut">Нет подходящего файла? <button type="button" id="demo-file">Использовать учебный пример</button></p>`;
  const error = state.fileError ? `<p class="field-error" role="alert">${state.fileError}</p>` : "";

  return `<section>
    ${screenHeader("Шаг 2 из 4", copy.title, copy.description)}
    ${context}
    <fieldset class="section-block">
      <legend>Excel-файл <span class="required">*</span></legend>
      <button class="upload-zone${state.fileName ? " has-file" : ""}" id="upload-zone" type="button">
        <span class="upload-symbol">↑</span>
        <span class="upload-copy"><strong>${state.fileName ? fileName : "Перетащите файл сюда или выберите на компьютере"}</strong><small>${state.fileName ? `${formatSize(state.fileSize)} · файл готов к обработке` : "Поддерживаются .xlsx и .xls до 20 МБ"}</small></span>
        <span class="upload-action">${state.fileName ? "Заменить" : "Выбрать"}</span>
      </button>
      <input class="visually-hidden" id="catalog-file" type="file" accept=".xlsx,.xls">
      ${error}
      ${fileStatus}
    </fieldset>
    ${processingInfo()}
    <div class="actions split"><button class="button secondary" id="back-start">← Назад</button><button class="button primary" id="process-file" ${state.fileName && !state.fileError ? "" : "disabled"}>Обработать файл →</button></div>
  </section>`;
}

function renderStandardReview() {
  const counts = state.task === "check" ? { filled: 142, corrected: 12, review: 4 } : { filled: 124, corrected: 18, review: 6 };
  const returnBanner = state.returnToFigma
    ? `<div class="status-banner success"><span class="status-icon">✓</span><div><h2>Недостающие характеристики заполнены</h2><p>Теперь можно вернуться к подготовке шаблона инфографики.</p><button class="inline-action" id="return-figma" type="button">Вернуться к шаблону для Figma →</button></div></div>`
    : "";
  const lowerActions = state.returnToFigma
    ? ""
    : `<div class="actions split"><button class="button secondary" id="back-upload">← Назад</button><button class="button primary" id="download-result">${state.figmaCreated ? "Скачать оба файла" : "Скачать результат"}</button></div>`;
  return `<div class="result-grid" aria-label="Результаты обработки">
      ${resultCard("green", counts.filled, "Заполнено", "Характеристики заполнены и подтверждены по надёжным источникам.")}
      ${resultCard("yellow", counts.corrected, "Скорректировано", "Изменённые значения отражены в журнале ошибок.")}
      ${resultCard("red", counts.review, "Требует проверки", "Для этих значений не найдено однозначного подтверждения.")}
    </div>
    ${returnBanner}
    ${state.returnToFigma ? "" : figmaOffer()}
    ${lowerActions}`;
}

function renderFigmaReview() {
  let status;
  if (!state.figmaDataComplete) {
    status = `<div class="status-banner warning"><span class="status-icon">!</span><div><h2>Не все характеристики заполнены</h2><p>Для четырёх значений не найдено достаточно данных. Сначала дополните исходный файл, а затем вернитесь к созданию шаблона для Figma.</p><button class="inline-action" id="move-fill" type="button">Перейти к заполнению шаблона →</button></div></div>`;
  } else if (!state.figmaCreated) {
    status = `<div class="status-banner success"><span class="status-icon">✓</span><div><h2>Данных достаточно для создания шаблона</h2><p>Недостающие характеристики заполнены. Можно подготовить итоговый файл для Figma.</p><button class="inline-action" id="create-figma" type="button">Создать шаблон для Figma →</button></div></div>`;
  } else {
    status = `<div class="status-banner success"><span class="status-icon">✓</span><div><h2>Шаблон для Figma создан</h2><p>Категория и характеристики подготовлены для создания инфографики.</p></div></div>`;
  }
  return `<section class="figma-review-card"><div class="review-card-title"><div><p class="eyebrow">Файл обработан</p><h2>Характеристики для шаблона инфографики</h2></div><span class="pill neutral-pill">28 товаров</span></div><div class="figma-details"><div><span>Определённая категория</span><strong>Смартфоны</strong></div><div><span>Выделено характеристик</span><strong>${characteristics.length}</strong></div></div>${tags()}</section>${status}<div class="actions split"><button class="button secondary" id="back-upload">← Назад</button>${state.figmaCreated ? '<button class="button primary" id="download-figma">Скачать шаблон для Figma</button>' : ""}</div>`;
}

function renderReview() {
  return `<section>
    ${screenHeader("Шаг 3 из 4", "Проверка", "Файл обработан. Проверьте результаты и скачайте готовый файл.")}
    <div class="file-summary"><div><span>Категория</span><strong>Смартфоны</strong></div><div><span>Файл</span><strong>${escapeHtml(state.fileName)}</strong></div></div>
    ${state.task === "figma" ? renderFigmaReview() : renderStandardReview()}
  </section>`;
}

function renderDone() {
  const multiple = state.downloads.length > 1;
  const links = state.downloads.map((item) => `<a href="${item.href}" download="${item.fileName}">${item.label} ↓</a>`).join("");
  return `<section class="success-screen">
    <div class="success-mark">↓</div>
    <p class="eyebrow">Обработка завершена</p>
    <h1>Скачивание началось</h1>
    <p class="lead">${multiple ? "Готовые файлы должны скачаться автоматически." : "Готовый файл должен скачаться автоматически."}</p>
    <div class="download-panel"><h2>Если скачивание не началось</h2><p>Воспользуйтесь ${multiple ? "ссылками" : "ссылкой"} ниже.</p><div class="download-links">${links}</div></div>
    <div class="new-file-panel"><h2>Обработать другой файл</h2><p>Вернитесь к началу, чтобы выбрать новую задачу и загрузить другой Excel-файл.</p><button class="button secondary" id="new-file">Загрузить новый файл</button></div>
  </section>`;
}

function renderProgress() {
  progressNode.innerHTML = steps.map((label, index) => {
    const isCurrent = index === state.screen;
    const isDone = index < state.screen || index < state.maxVisited;
    const disabled = index > state.maxVisited || isCurrent;
    return `<div class="progress-item"><button type="button" class="progress-step${isCurrent ? " is-current" : ""}${isDone ? " is-done" : ""}" data-step="${index}" ${disabled ? "disabled" : ""} ${isCurrent ? 'aria-current="step"' : ""} aria-label="${label}${index < state.screen ? ", вернуться к этапу" : ""}"><span class="step-dot">${index < state.screen ? "✓" : index + 1}</span><span class="step-label">${label}</span></button>${index < steps.length - 1 ? `<span class="progress-line${index < state.screen ? " is-done" : ""}" aria-hidden="true"></span>` : ""}</div>`;
  }).join("");
}

function bindEvents() {
  document.querySelectorAll("[data-step]").forEach((button) => {
    button.addEventListener("click", () => goTo(Number(button.dataset.step)));
  });
  document.querySelectorAll("[data-task]").forEach((button) => {
    button.addEventListener("click", () => selectTask(button.dataset.task));
  });

  document.getElementById("continue")?.addEventListener("click", () => goTo(1));
  document.getElementById("back-start")?.addEventListener("click", () => goTo(0));
  document.getElementById("back-upload")?.addEventListener("click", () => goTo(1));
  document.getElementById("process-file")?.addEventListener("click", () => goTo(2));
  document.getElementById("demo-file")?.addEventListener("click", useDemoFile);
  document.getElementById("new-file")?.addEventListener("click", reset);

  const fileInput = document.getElementById("catalog-file");
  const uploadZone = document.getElementById("upload-zone");
  uploadZone?.addEventListener("click", () => fileInput.click());
  uploadZone?.addEventListener("dragover", (event) => event.preventDefault());
  uploadZone?.addEventListener("drop", (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) acceptFile(file.name, file.size);
  });
  fileInput?.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) acceptFile(file.name, file.size);
  });

  document.getElementById("create-figma")?.addEventListener("click", () => {
    state.figmaCreated = true;
    render();
  });
  document.getElementById("download-result")?.addEventListener("click", () => {
    startDownload(state.figmaCreated ? [mainDownload, figmaDownload] : [mainDownload]);
  });
  document.getElementById("download-figma")?.addEventListener("click", () => startDownload([figmaDownload]));
  document.getElementById("move-fill")?.addEventListener("click", moveToFill);
  document.getElementById("return-figma")?.addEventListener("click", returnToFigmaReview);
}

function render() {
  renderProgress();
  if (state.screen === 0) cardNode.innerHTML = renderStart();
  if (state.screen === 1) cardNode.innerHTML = renderUpload();
  if (state.screen === 2) cardNode.innerHTML = renderReview();
  if (state.screen === 3) cardNode.innerHTML = renderDone();
  bindEvents();
}

render();
