document.addEventListener('DOMContentLoaded', () => {
  console.log("Burger Maker initialized");

  // Функция сохранения картинки с обрезкой лишнего места
  const downloadPngBtn = document.getElementById('downloadPngBtn');
  if (downloadPngBtn) {
    downloadPngBtn.onclick = () => {
      // Имя элемента может отличаться в твоем проекте (например, burgerStack или текущая стопка)
      const targetElement = document.getElementById('burgerStack');
      
      if (!targetElement || targetElement.children.length === 0) {
        alert("Your burger stack is empty! Build a burger first.");
        return;
      }
      
      if (typeof playSound === 'function' && typeof SOUNDS !== 'undefined') {
        playSound(SOUNDS.buttons);
      }

      // Временно добавляем класс для обрезки по размеру бургера
      targetElement.classList.add('capturing-png');

      html2canvas(targetElement, {
        backgroundColor: null,
        scale: 2
      }).then(canvas => {
        targetElement.classList.remove('capturing-png'); // Возвращаем стили обратно

        const link = document.createElement('a');
        link.download = 'my-burger.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => {
        targetElement.classList.remove('capturing-png');
        console.error("Failed to save image:", err);
        alert("Could not save image.");
      });
    };
  }
});
