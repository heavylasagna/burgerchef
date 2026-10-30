document.addEventListener('DOMContentLoaded', () => {
  // Инициализация игры
  console.log("Burger Maker initialized");
  
  const downloadPngBtn = document.getElementById('downloadPngBtn');
  if (downloadPngBtn) {
    downloadPngBtn.onclick = () => {
      // Пример проверки наличия слоев (если массив называется иначе, адаптируй под свой код)
      const burgerStack = document.getElementById('burgerStack');
      if (!burgerStack || burgerStack.children.length === 0) {
        alert("Your burger stack is empty! Build a burger first.");
        return;
      }
      
      // Временно добавляем класс для компактной обрезки по размеру бургера
      burgerStack.classList.add('capturing-png');

      html2canvas(burgerStack, {
        backgroundColor: null,
        scale: 2
      }).then(canvas => {
        burgerStack.classList.remove('capturing-png'); // Возвращаем стили обратно

        const link = document.createElement('a');
        link.download = 'my-burger.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => {
        burgerStack.classList.remove('capturing-png');
        console.error("Failed to save image:", err);
        alert("Could not save image.");
      });
    };
  }
});
