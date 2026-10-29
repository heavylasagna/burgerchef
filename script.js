
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

let burgerLayers = [];
let selectedSauce = null;
let nextLayerId = 1;


// Создание каталога ингредиентов

function renderCatalog() {
    if (!catalog) return;

    catalog.innerHTML = "";

    ingredients.forEach(ingredient => {
        const button = document.createElement("button");

        button.className = "ingredient-card";
        button.type = "button";
        button.innerHTML = `
            <img src="${ingredient.image}" alt="${ingredient.name}">
            <span>${ingredient.name}</span>
        `;

        button.addEventListener("click", () => {
            addIngredient(ingredient);
        });

        catalog.appendChild(button);
    });
}


// Добавление ингредиента в бургер

function addIngredient(ingredient) {
    burgerLayers.push({
        ...ingredient,
        layerId: nextLayerId++
    });

    renderBurger();
    renderList();
    showMessage(`Добавлено: ${ingredient.name}`);
}


// Отображение бургера

function renderBurger() {
    if (!burgerStack) return;

    burgerStack.innerHTML = "";

    burgerLayers.forEach((ingredient, index) => {
        const image = document.createElement("img");

        image.src = ingredient.image;
        image.alt = ingredient.name;
        image.className = "burger-layer";
        image.dataset.layerId = ingredient.layerId;
        image.style.zIndex = index + 1;

        image.addEventListener("load", positionLayers);

        burgerStack.appendChild(image);
    });

    renderSauce();
    positionLayers();
}


// Расположение слоёв без изменения размера изображений

function positionLayers() {
    if (!burgerStack) return;

    const elements = Array.from(
        burgerStack.querySelectorAll(".burger-layer")
    );

    let currentBottom = 0;
    let previousHeight = 0;
    let previousIngredient = null;

    elements.forEach((element, index) => {
        const ingredient = burgerLayers[index];

        element.style.position = "absolute";
        element.style.width = "100%";
        element.style.height = "auto";
        element.style.left = "0";
        element.style.bottom = `${currentBottom}px`;

        const height = element.getBoundingClientRect().height;

        if (index === 0) {
            currentBottom = 0;
        } else {
            const previousIsPatty = previousIngredient.type === "patty";
            const currentIsPatty = ingredient.type === "patty";

            // Обычные ингредиенты перекрывают друг друга на 42%.
            // У котлеты перекрытие с соседними слоями — 70%.
            const overlapRatio =
                previousIsPatty || currentIsPatty ? 0.70 : 0.42;

            const overlap =
                Math.min(previousHeight, height) * overlapRatio;

            currentBottom += previousHeight - overlap;
        }

        element.style.bottom = `${currentBottom}px`;

        previousHeight = height;
        previousIngredient = ingredient;
    });
}


// Список добавленных ингредиентов
// Верхний слой отображается первым

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


// Соус

function renderSauce() {
    if (!burgerStack) return;

    const oldSauce = burgerStack.querySelector(".sauce-layer");

    if (oldSauce) {
        oldSauce.remove();
    }

    if (!selectedSauce) return;

    const sauce = document.createElement("div");
    sauce.className = "sauce-layer";
    sauce.style.backgroundColor = sauces[selectedSauce].color;
    sauce.style.position = "absolute";
    sauce.style.left = "10%";
    sauce.style.width = "80%";
    sauce.style.height = "8px";
    sauce.style.bottom = "50%";
    sauce.style.borderRadius = "50%";
    sauce.style.zIndex = burgerLayers.length + 1;

    burgerStack.appendChild(sauce);
}


// Обработка кнопок выбора соуса

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


// Начать сборку заново

if (resetButton) {
    resetButton.addEventListener("click", () => {
        burgerLayers = [];
        selectedSauce = null;

        renderBurger();
        renderList();

        showMessage("Бургер очищен");
    });
}


// Вывод сообщения

function showMessage(text) {
    if (message) {
        message.textContent = text;
    }
}


// Начальная загрузка

renderCatalog();
renderBurger();
renderList();

window.addEventListener("resize", positionLayers);
