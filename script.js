const downloadPngBtn = document.getElementById('downloadPngBtn');
  if (downloadPngBtn) {
    downloadPngBtn.onclick = () => {
      if (currentBurger.length === 0) {
        alert("Your burger stack is empty! Build a burger first.");
        return;
      }
      playSound(SOUNDS.buttons);
      
      const targetElement = document.getElementById('centerStage') || document.querySelector('.center-stage');
      if (!targetElement) return;

      html2canvas(targetElement, {
        backgroundColor: null,
        scale: 2
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'my-burger.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => {
        console.error("Failed to save image:", err);
        alert("Could not save image.");
      });
    };
  }
