
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
        id: "cheese",
        name: "Сыр",
        image: "images/cheese.png",
        type: "ingredient"
    },
    {
        id: "lettuce",
        name: "Салат",
        image: "images/lettuce.png",
        type: "ingredient"
    },
    {
        id: "tomato",
        name: "Помидор",
        image: "images/tomato.png",
        type: "ingredient"
    },
    {
        id: "onion",
        name: "Лук",
        image: "images/onion.png",
        type: "ingredient"
    },
    {
        id: "pickle",
        name: "Огурец",
        image: "images/pickle.png",
        type: "ingredient"
    },
    {
        id: "bacon",
        name: "Бекон",
        image: "images/bacon.png",
        type: "ingredient"
    },
    {
        id: "top-bun",
        name: "Верхняя булочка",
        image: "images/top-bun.png",
        type: "bun"
    }
];

const sauces = {
    ketchup: {
        name: "Кетчуп",
        color: "#c83e32"
    },
    mayonnaise: {
        name: "Майонез",
        color: "#f4e9ca"
    },
    mustard: {
        name: "Горчица",
        color: "#e7b82d"
    },
    bbq: {
        name: "Барбекю",
        color: "#713a24"
    },
    chili: {
        name: "Чили",
        color: "#ed6536"
    }
};

// Слои хранятся снизу вверх
let burgerLayers = [];

const list = document.getElementById("ingredients-list");
const catalog = document.getElementById("catalog");
const stack = document.getElementById("burger-stack");
const message = document.getElementById("message");

function showMessage(text) {
    message.textContent = text;
}

function makeLayer(item) {
    return {
        ...item,
        uid: Date.now() + "-" + Math.random().toString(16).slice(2)
    };
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

        img.addEventListener("error", () => {
            item.title = ingredient.name + " — изображение не найдено";
        });

        item.appendChild(img);

        item.addEventListener("click", () => {
            burgerLayers.push(makeLayer(ingredient));
            renderBurger();
            showMessage(ingredient.name + " добавлен");
        });

        catalog.appendChild(item);
    });
}

function renderList() {
    list.innerHTML = "";

    // Показываем от верхнего слоя к нижнему
    burgerLayers.slice().reverse().forEach(layer => {
        const index = burgerLayers.findIndex(
            item => item.uid === layer.uid
        );

        const row = document.createElement("div");
        row.className = "ingredient-row";

        if (layer.image) {
            const img = document.createElement("img");
            img.src = layer.image;
            img.alt = layer.name;
            row.appendChild(img);
        } else {
            const preview = document.createElement("div");
            preview.className = "ingredient-preview";
            preview.style.background = layer.color;
            row.appendChild(preview);
        }

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
            showMessage(layer.name + " удалён");
        });

        controls.append(up, down, remove);
        row.appendChild(controls);
        list.appendChild(row);
    });
}

function renderBurger() {
    stack.innerHTML = "";

    burgerLayers.forEach((layer, index) => {
        let element;

        if (layer.type === "sauce") {
            element = document.createElement("div");
            element.className = "sauce-layer";
            element.style.background = layer.color;
            element.style.width = "100%";
            element.style.height = "7px";
        } else {
            element = document.createElement("img");
            element.className = "burger-layer";
            element.src = layer.image;
            element.alt = layer.name;

            element.addEventListener("load", positionLayers);
            element.addEventListener("error", () => {
                showMessage("Не найден файл: " + layer.image);
            });
        }

        element.dataset.uid = layer.uid;
        element.style.zIndex = index + 1;

        stack.appendChild(element);
    });

    renderList();
    positionLayers();
}

function positionLayers() {
    const elements = Array.from(stack.children);

    let currentBottom = 0;

    elements.forEach((element, index) => {
        let height;

        if (element.classList.contains("sauce-layer")) {
            height = 7;
        } else {
            if (!element.naturalWidth || !element.naturalHeight) {
                return;
            }

            height = stack.clientWidth *
                element.naturalHeight / element.naturalWidth;
        }

        element.style.bottom = currentBottom + "px";

        // Соседние слои немного перекрываются
        const overlap = index === 0 ? 0 : height * 0.42;
        currentBottom += height - overlap;
    });
}

document.querySelectorAll("[data-sauce]").forEach(button => {
    button.addEventListener("click", () => {
        const sauce = sauces[button.dataset.sauce];

        burgerLayers.push(makeLayer({
            id: button.dataset.sauce,
            name: sauce.name,
            type: "sauce",
            color: sauce.color
        }));

        renderBurger();
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
    const savedBurger = burgerLayers.map(layer => ({
        id: layer.id,
        name: layer.name,
        image: layer.image || null,
        type: layer.type,
        color: layer.color || null
    }));

    try {
        localStorage.setItem("savedBurger", JSON.stringify(savedBurger));
        showMessage("Состав бургера сохранён");
    } catch (error) {
        showMessage("Не удалось сохранить бургер");
    }
});

window.addEventListener("resize", positionLayers);

createCatalog();
renderBurger();
