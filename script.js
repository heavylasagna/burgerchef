
const ingredients = [
    { id: "bottom-bun", name: "Нижняя булочка", image: "images/bottom-bun.png", type: "bun" },
    { id: "beef-patty", name: "Котлета", image: "images/beef-patty.png", type: "patty" },
    { id: "cheese", name: "Сыр", image: "images/cheese.png", type: "normal" },
    { id: "lettuce", name: "Салат", image: "images/lettuce.png", type: "normal" },
    { id: "tomato", name: "Помидор", image: "images/tomato.png", type: "normal" },
    { id: "onion", name: "Лук", image: "images/onion.png", type: "normal" },
    { id: "pickle", name: "Огурец", image: "images/pickle.png", type: "normal" },
    { id: "bacon", name: "Бекон", image: "images/bacon.png", type: "normal" },
    { id: "top-bun", name: "Верхняя булочка", image: "images/top-bun.png", type: "bun" }
];

const sauces = {
    ketchup: { name: "Кетчуп", color: "#c52b25" },
    mayonnaise: { name: "Майонез", color: "#f5e8c8" },
    mustard: { name: "Горчица", color: "#e8bd32" },
    bbq: { name: "Барбекю", color: "#6b3021" },
    chili: { name: "Чили", color: "#ed542e" }
};

const ingredientsList = document.getElementById("ingredients-list");
const burgerStack = document.getElementById("burger-stack");
const catalog = document.getElementById("catalog");
const message = document.getElementById("message");

const saveButton = document.getElementById("save-button");
const eatButton = document.getElementById("eat-button");
const resetButton = document.getElementById("reset-button");

// Общие настройки перекрытия.
// Чем больше значение, тем сильнее слои заходят друг на друга.
const OVERLAP = 0.18;

// Минимальная альфа непрозрачности пикселя.
// Значение 20 позволяет игнорировать почти прозрачные края.
const ALPHA_THRESHOLD = 20;

// Информация о границах изображений.
const imageBounds = new Map();

let burgerLayers = [];
let selectedSauce = null;
let nextLayerId = 1;


// Анализ прозрачности PNG

function analyzeImage(src) {
    if (imageBounds.has(src)) {
        return Promise.resolve(imageBounds.get(src));
    }

    return new Promise(resolve => {
        const image = new Image();

        image.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d", {
                    willReadFrequently: true
                });

                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;

                context.drawImage(image, 0, 0);

                const pixels = context.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                ).data;

                let top = canvas.height;
                let bottom = -1;
                let left = canvas.width;
                let right = -1;

                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const alpha = pixels[(y * canvas.width + x) * 4 + 3];

                        if (alpha > ALPHA_THRESHOLD) {
                            if (y < top) top = y;
                            if (y > bottom) bottom = y;
                            if (x < left) left = x;
                            if (x > right) right = x;
                        }
                    }
                }

                const bounds = bottom === -1
                    ? {
                        top: 0,
                        bottom: canvas.height - 1,
                        left: 0,
                        right: canvas.width - 1,
                        width: canvas.width,
                        height: canvas.height
                    }
                    : {
                        top,
                        bottom,
                        left,
                        right,
                        width: right - left + 1,
                        height: bottom - top + 1
                    };

                imageBounds.set(src, bounds);
                resolve(bounds);
            } catch (error) {
                // Если браузер не разрешил анализ пикселей,
                // используем полные размеры изображения.
                const bounds = {
                    top: 0,
                    bottom: image.naturalHeight - 1,
                    left: 0,
                    right: image.naturalWidth - 1,
                    width: image.naturalWidth,
                    height: image.naturalHeight
                };

                imageBounds.set(src, bounds);
                resolve(bounds);
            }
        };

        image.onerror = () => {
            resolve(null);
        };

        image.src = src;
    });
}


// Подготовка изображений

async function prepareImages() {
    await Promise.all(
        ingredients.map(ingredient => analyzeImage(ingredient.image))
    );
}


// Каталог ингредиентов

function renderCatalog() {
    if (!catalog) return;

    catalog.innerHTML = "";

    ingredients.forEach(ingredient => {
        const button = document.createElement("button");
        button.className = "ingredient-card";
        button.type = "button";

        const image = document.createElement("img");
        image.src = ingredient.image;
        image.alt = ingredient.name;

        const name = document.createElement("span");
        name.textContent = ingredient.name;

        button.append(image, name);

        button.addEventListener("click", () => {
            addIngredient(ingredient);
        });

        catalog.appendChild(button);
    });
}


// Добавление ингредиента

function addIngredient(ingredient) {
    burgerLayers.push({
        ...ingredient,
        layerId: nextLayerId++
    });

    renderBurger();
    renderList();

    showMessage(`Добавлено: ${ingredient.name}`);
}


// Отрисовка бургера

function renderBurger() {
    if (!burgerStack) return;

    burgerStack.innerHTML = "";

    burgerLayers.forEach((ingredient, index) => {
        const image = document.createElement("img");

        image.src = ingredient.image;
        image.alt = ingredient.name;
        image.className = "burger-layer";
        image.dataset.layerId = ingredient.layerId;
        image.style.position = "absolute";
        image.style.width = "100%";
        image.style.height = "auto";
        image.style.left = "0";
        image.style.zIndex = index + 1;

        burgerStack.appendChild(image);
    });

    renderSauce();
    positionLayers();
}


// Автоматическое расположение по непрозрачным границам PNG

async function positionLayers() {
    if (!burgerStack) return;

    const elements = Array.from(
        burgerStack.querySelectorAll(".burger-layer")
    );

    if (elements.length === 0) return;

    const stackWidth = burgerStack.clientWidth;

    if (stackWidth === 0) return;

    const layerData = await Promise.all(
        elements.map(async (element, index) => {
            const ingredient = burgerLayers[index];
            const bounds = await analyzeImage(ingredient.image);

            if (!bounds) return null;

            const imageWidth = element.naturalWidth;
            const imageHeight = element.naturalHeight;

            if (!imageWidth || !imageHeight) return null;

            const scale = stackWidth / imageWidth;

            return {
                element,
                ingredient,
                bounds,
                scale,
                visibleTop: bounds.top * scale,
                visibleBottom: bounds.bottom * scale,
                visibleHeight: bounds.height * scale,
                fullHeight: imageHeight * scale
            };
        })
    );

    if (layerData.some(layer => !layer)) return;

    let nextVisibleBottom = 0;

    layerData.forEach((layer, index) => {
        const {
            element,
            visibleTop,
            visibleBottom,
            visibleHeight
        } = layer;

        // Первый слой располагается у основания бургера.
        if (index === 0) {
            element.style.bottom = `${-visibleBottom}px`;
            nextVisibleBottom = visibleHeight;
            return;
        }

        const previousLayer = layerData[index - 1];

        // Используем меньшую видимую высоту соседних ингредиентов,
        // чтобы перекрытие автоматически подстраивалось под их форму.
        const overlap = Math.min(
            previousLayer.visibleHeight,
            visibleHeight
        ) * OVERLAP;

        // Позиция задаётся относительно нижней видимой границы PNG,
        // а не нижнего края всего файла.
        const visibleBottomPosition = nextVisibleBottom - overlap;

        element.style.bottom =
            `${visibleBottomPosition - visibleBottom}px`;

        nextVisibleBottom =
            visibleBottomPosition + visibleHeight;
    });
}


// Список ингредиентов: верхний слой первым

function renderList() {
    if (!ingredientsList) return;

    ingredientsList.innerHTML = "";

    burgerLayers.slice().reverse().forEach(ingredient => {
        const item = document.createElement("div");
        item.className = "ingredient-list-item";

        const name = document.createElement("span");
        name.textContent = ingredient.name;

        const controls = document.createElement("div");
        controls.className = "ingredient-controls";

        const upButton = document.createElement("button");
        upButton.type = "button";
        upButton.textContent = "↑";
        upButton.title = "Поднять слой выше";

        upButton.addEventListener("click", () => {
            moveIngredient(ingredient.layerId, 1);
        });

        const downButton = document.createElement("button");
        downButton.type = "button";
        downButton.textContent = "↓";
        downButton.title = "Опустить слой ниже";

        downButton.addEventListener("click", () => {
            moveIngredient(ingredient.layerId, -1);
        });

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "×";
        removeButton.title = "Удалить ингредиент";

        removeButton.addEventListener("click", () => {
            removeIngredient(ingredient.layerId);
        });

        controls.append(upButton, downButton, removeButton);
        item.append(name, controls);
        ingredientsList.appendChild(item);
    });
}


// Перемещение слоя

function moveIngredient(layerId, direction) {
    const index = burgerLayers.findIndex(
        ingredient => ingredient.layerId === layerId
    );

    if (index === -1) return;

    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= burgerLayers.length) return;

    [
        burgerLayers[index],
        burgerLayers[newIndex]
    ] = [
        burgerLayers[newIndex],
        burgerLayers[index]
    ];

    renderBurger();
    renderList();
}


// Удаление ингредиента

function removeIngredient(layerId) {
    burgerLayers = burgerLayers.filter(
        ingredient => ingredient.layerId !== layerId
    );

    renderBurger();
    renderList();
}


// Соус

function renderSauce() {
    if (!burgerStack) return;

    const oldSauce = burgerStack.querySelector(".sauce-layer");

    if (oldSauce) oldSauce.remove();

    if (!selectedSauce) return;

    const sauce = document.createElement("div");

    sauce.className = "sauce-layer";
    sauce.style.position = "absolute";
    sauce.style.left = "10%";
    sauce.style.width = "80%";
    sauce.style.height = "8px";
    sauce.style.bottom = "50%";
    sauce.style.borderRadius = "50%";
    sauce.style.backgroundColor = sauces[selectedSauce].color;
    sauce.style.zIndex = burgerLayers.length + 1;

    burgerStack.appendChild(sauce);
}


// Выбор соуса

document.querySelectorAll("[data-sauce]").forEach(button => {
    button.addEventListener("click", () => {
        const sauceId = button.dataset.sauce;

        if (!sauces[sauceId]) return;

        selectedSauce = sauceId;

        renderSauce();

        showMessage(`Выбран соус: ${sauces[sauceId].name}`);
    });
});


// Сохранение бургера

if (saveButton) {
    saveButton.addEventListener("click", () => {
        const burgerData = {
            ingredients: burgerLayers.map(ingredient => ingredient.id),
            sauce: selectedSauce
        };

        localStorage.setItem("savedBurger", JSON.stringify(burgerData));

        showMessage("Бургер сохранён!");
    });
}


// Съесть бургер

if (eatButton) {
    eatButton.addEventListener("click", () => {
        if (burgerLayers.length === 0) {
            showMessage("Сначала собери бургер!");
            return;
        }

        burgerLayers = [];
        selectedSauce = null;

        renderBurger();
        renderList();

        showMessage("Бургер съеден!");
    });
}


// Сброс бургера

if (resetButton) {
    resetButton.addEventListener("click", () => {
        burgerLayers = [];
        selectedSauce = null;

        renderBurger();
        renderList();

        showMessage("Бургер очищен");
    });
}


// Сообщения

function showMessage(text) {
    if (message) {
        message.textContent = text;
    }
}


// Запуск

async function init() {
    await prepareImages();

    renderCatalog();
    renderBurger();
    renderList();
}

init();

window.addEventListener("resize", positionLayers);
