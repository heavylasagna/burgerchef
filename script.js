
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

const ALPHA_THRESHOLD = 20;

// Положение контактных точек относительно высоты изображения.
// Значения задаются в долях от 0 до 1, сверху вниз.
const CONTACT_POINTS = {
    "bottom-bun": 0.57,
    "beef-patty-bottom": 0.98,
    "beef-patty-top": 0.56,
    "top-bun": 0.96
};

// Насколько глубоко слои входят друг в друга
const CONTACT_OVERLAP = 3;

const imageBounds = new Map();

let burgerLayers = [];
let selectedSauce = null;
let nextLayerId = 1;
let layoutVersion = 0;


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
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;

                const context = canvas.getContext("2d", {
                    willReadFrequently: true
                });

                context.drawImage(image, 0, 0);

                const pixels = context.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                ).data;

                let top = canvas.height;
                let bottom = -1;

                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const alpha =
                            pixels[(y * canvas.width + x) * 4 + 3];

                        if (alpha > ALPHA_THRESHOLD) {
                            if (y < top) top = y;
                            if (y > bottom) bottom = y;
                        }
                    }
                }

                const bounds = bottom === -1
                    ? {
                        top: 0,
                        bottom: canvas.height - 1,
                        width: canvas.width,
                        height: canvas.height
                    }
                    : {
                        top,
                        bottom,
                        width: canvas.width,
                        height: bottom - top + 1
                    };

                imageBounds.set(src, bounds);
                resolve(bounds);
            } catch (error) {
                const bounds = {
                    top: 0,
                    bottom: image.naturalHeight - 1,
                    width: image.naturalWidth,
                    height: image.naturalHeight
                };

                imageBounds.set(src, bounds);
                resolve(bounds);
            }
        };

        image.onerror = () => resolve(null);
        image.src = src;
    });
}


// Подготовка картинок

async function prepareImages() {
    await Promise.all(
        ingredients.map(ingredient => analyzeImage(ingredient.image))
    );
}


// Каталог

function renderCatalog() {
    if (!catalog) return;

    catalog.innerHTML = "";

    ingredients.forEach(ingredient => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ingredient-card";

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

    layoutVersion++;
    burgerStack.innerHTML = "";

    burgerLayers.forEach((ingredient, index) => {
        const image = document.createElement("img");

        image.src = ingredient.image;
        image.alt = ingredient.name;
        image.className = "burger-layer";
        image.dataset.layerId = ingredient.layerId;
        image.style.zIndex = index + 1;

        burgerStack.appendChild(image);
    });

    renderSauce();
    positionLayers();
}


// Расчёт положения трёх основных слоёв

async function positionLayers() {
    if (!burgerStack) return;

    const currentVersion = layoutVersion;

    const elements = Array.from(
        burgerStack.querySelectorAll(".burger-layer")
    );

    if (elements.length === 0) return;

    const stackWidth = burgerStack.clientWidth;

    if (stackWidth === 0) return;

    const layers = await Promise.all(
        elements.map(async (element, index) => {
            const ingredient = burgerLayers[index];
            if (!ingredient) return null;

            const bounds = await analyzeImage(ingredient.image);
            if (!bounds) return null;

            const imageWidth = element.naturalWidth;
            const imageHeight = element.naturalHeight;

            if (!imageWidth || !imageHeight) return null;

            const scale = stackWidth / imageWidth;

            return {
                element,
                ingredient,
                imageHeight: imageHeight * scale,
                scale,
                top: bounds.top * scale,
                bottom: bounds.bottom * scale,
                visibleHeight: bounds.height * scale,
                transparentBottom:
                    (imageHeight - 1 - bounds.bottom) * scale
            };
        })
    );

    if (currentVersion !== layoutVersion) return;
    if (layers.some(layer => !layer)) return;

    let visibleBottom = 0;

    layers.forEach((layer, index) => {
        const { element, ingredient } = layer;

        // Нижняя булочка стоит основанием на дне контейнера
        if (index === 0) {
            element.style.bottom =
                `${-layer.bottom}px`;

            visibleBottom = layer.visibleHeight;
            return;
        }

        const previous = layers[index - 1];

        // Специальное положение котлеты на нижней булочке
        if (
            previous.ingredient.id === "bottom-bun" &&
            ingredient.id === "beef-patty"
        ) {
            const bunContactY =
                previous.imageHeight * CONTACT_POINTS["bottom-bun"];

            const pattyBottomY =
                layer.imageHeight *
                CONTACT_POINTS["beef-patty-bottom"];

            // Координаты точек соприкосновения от нижнего края PNG
            const bunContactFromBottom =
                previous.imageHeight - bunContactY;

            const pattyContactFromBottom =
                layer.imageHeight - pattyBottomY;

            const pattyBottom =
                bunContactFromBottom -
                pattyContactFromBottom +
                CONTACT_OVERLAP;

            element.style.bottom =
                `${pattyBottom - layer.transparentBottom}px`;

            visibleBottom = pattyBottom + layer.visibleHeight;
            return;
        }

        // Специальное положение верхней булочки над котлетой
        if (
            previous.ingredient.id === "beef-patty" &&
            ingredient.id === "top-bun"
        ) {
            const pattyTopContactY =
                previous.imageHeight *
                CONTACT_POINTS["beef-patty-top"];

            const pattyContactFromBottom =
                previous.imageHeight - pattyTopContactY;

            const topBunContactFromBottom =
                layer.imageHeight * (1 - CONTACT_POINTS["top-bun"]);

            const topBunBottom =
                visibleBottom +
                pattyContactFromBottom -
                topBunContactFromBottom;

            element.style.bottom =
                `${topBunBottom - layer.transparentBottom}px`;

            visibleBottom = topBunBottom + layer.visibleHeight;
            return;
        }

        // Для остальных слоёв пока используется простое перекрытие
        const overlap = Math.min(
            previous.visibleHeight,
            layer.visibleHeight
        ) * 0.18;

        const nextBottom = visibleBottom - overlap;

        element.style.bottom =
            `${nextBottom - layer.transparentBottom}px`;

        visibleBottom = nextBottom + layer.visibleHeight;
    });
}


// Список ингредиентов

function renderList() {
    if (!ingredientsList) return;

    ingredientsList.innerHTML = "";

    burgerLayers.slice().reverse().forEach(ingredient => {
        const item = document.createElement("div");
        item.className = "ingredient-list-item";

        const thumbnail = document.createElement("img");
        thumbnail.src = ingredient.image;
        thumbnail.alt = "";
        thumbnail.className = "ingredient-thumbnail";

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
        item.append(thumbnail, name, controls);
        ingredientsList.appendChild(item);
    });
}


// Изменение порядка слоёв

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


// Отображение соуса

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


// Сохранение

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


// Сброс

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
