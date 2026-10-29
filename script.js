
const ingredients = [
    {
        id: "bottom-bun",
        name: "Нижняя булочка",
        image: "images/bottom-bun.png",
        type: "bun"
    },
    {
        id: "beef-patty",
        name: "Котлета",
        image: "images/beef-patty.png",
        type: "patty"
    },
    {
        id: "top-bun",
        name: "Верхняя булочка",
        image: "images/top-bun.png",
        type: "bun"
    }
];

// Массив всегда хранится снизу вверх
let burgerLayers = [];

const list = document.getElementById("ingredients-list");
const catalog = document.getElementById("catalog");
const stack = document.getElementById("burger-stack");
const message = document.getElementById("message");

const sauces = {
    ketchup: {
        name: "Кетчуп",
        color: "#c83e32"
    },
    mustard: {
        name: "Горчица",
        color: "#e7b82d"
    },
    mayonnaise: {
        name: "Майонез",
        color: "#f4e9ca"
    }
};

function showMessage(text) {
    message.textContent = text;
}

function createCatalog() {
    catalog.innerHTML = "";

    ingredients.forEach(ingredient => {
        const item = document.createElement("div");
        item.className = "catalog-item";
        item.title = ingredient.name;

        const img = document.createElement("img");
        img.src = ingredient.image;
        img.alt = ingredient.name;

        item.appendChild(img);

        item.addEventListener("click", () => {
            burgerLayers.push({
                ...ingredient,
                uid: crypto.randomUUID()
            });

            renderBurger();
            showMessage("Ингредиент добавлен");
        });

        catalog.appendChild(item);
    });
}

function renderList() {
    list.innerHTML = "";

    // Не используем reverse(): порядок уже снизу вверх
    burgerLayers.forEach((layer, index) => {
        const row = document.createElement("div");
        row.className = "ingredient-row";

        const img = document.createElement("img");
        img.src = layer.image;
        img.alt = layer.name;

        const controls = document.createElement("div");
        controls.className = "ingredient-controls";

        const up = document.createElement("button");
        up.textContent = "↑";
        up.title = "Поднять слой";

        up.addEventListener("click", () => {
            if (index < burgerLayers.length - 1) {
                [burgerLayers[index], burgerLayers[index + 1]] =
                    [burgerLayers[index + 1], burgerLayers[index]];

                renderBurger();
            }
        });

        const down = document.createElement("button");
        down.textContent = "↓";
        down.title = "Опустить слой";

        down.addEventListener("click", () => {
            if (index > 0) {
                [burgerLayers[index], burgerLayers[index - 1]] =
                    [burgerLayers[index - 1], burgerLayers[index]];

                renderBurger();
            }
        });

        const remove = document.createElement("button");
        remove.textContent = "×";
        remove.title = "Удалить слой";

        remove.addEventListener("click", () => {
            burgerLayers.splice(index, 1);
            renderBurger();
        });

        controls.append(up, down, remove);
        row.append(img, controls);
        list.appendChild(row);
    });
}

function renderBurger() {
    stack.innerHTML = "";

    let currentHeight = 0;

    burgerLayers.forEach((layer, index) => {
        const img = document.createElement("img");
        img.className = "burger-layer";
        img.src = layer.image;
        img.alt = layer.name;

        // Более поздние слои находятся выше предыдущих
        img.style.zIndex = index + 1;

        stack.appendChild(img);

        img.addEventListener("load", () => {
            positionLayers();
        });

        img.addEventListener("error", () => {
            showMessage("Не удалось загрузить: " + layer.image);
        });
    });

    positionLayers();
    renderList();
}

function positionLayers() {
    const layers = Array.from(stack.querySelectorAll(".burger-layer"));

    let currentHeight = 0;

    layers.forEach((img, index) => {
        if (!img.naturalWidth || !img.naturalHeight) {
            return;
        }

        const width = stack.clientWidth;
        const height = width * img.naturalHeight / img.naturalWidth;

        // Каждый новый слой перекрывает предыдущий примерно на 42%
        const overlap = index === 0
            ? 0
            : height * 0.42;

        currentHeight -= overlap;

        img.style.bottom = currentHeight + "px";

        currentHeight += height;
    });
}

document.querySelectorAll("[data-sauce]").forEach(button => {
    button.addEventListener("click", () => {
        const sauceId = button.dataset.sauce;
        const sauce = sauces[sauceId];

        burgerLayers.push({
            id: sauceId,
            name: sauce.name,
            type: "sauce",
            color: sauce.color,
            uid: crypto.randomUUID()
        });

        renderBurger();

        // Пока соус отображается цветным слоем без отдельной картинки
        const img = stack.lastElementChild;

        if (img) {
            img.remove();
        }

        const sauceLayer = document.createElement("div");
        sauceLayer.className = "burger-layer";
        sauceLayer.style.height = "18px";
        sauceLayer.style.width = "85%";
        sauceLayer.style.borderRadius = "50%";
        sauceLayer.style.background = sauce.color;
        sauceLayer.style.zIndex = burgerLayers.length;
        sauceLayer.style.bottom = "0";
        sauceLayer.style.transform = "translateX(-50%)";

        stack.appendChild(sauceLayer);
        positionLayers();

        showMessage(sauce.name + " добавлен");
    });
});

document.getElementById("reset-button").addEventListener("click", () => {
    burgerLayers = [];
    renderBurger();
    showMessage("Бургер сброшен");
});

document.getElementById("eat-button").addEventListener("click", () => {
    if (burgerLayers.length === 0) {
        showMessage("Сначала собери бургер");
        return;
    }

    burgerLayers = [];
    renderBurger();
    showMessage("Приятного аппетита!");
});

document.getElementById("save-button").addEventListener("click", () => {
    const savedLayers = burgerLayers.map(layer => ({
        id: layer.id,
        name: layer.name,
        type: layer.type
    }));

    localStorage.setItem("savedBurger", JSON.stringify(savedLayers));
    showMessage("Состав бургера сохранён");
});

window.addEventListener("resize", positionLayers);

createCatalog();
renderBurger();

