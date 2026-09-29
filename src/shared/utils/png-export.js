(function () {
  const libraryUrl =
    "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
  const renderOptions = {
    scale: 2,
    backgroundColor: "#fff",
    logging: false,
    useCORS: true,
  };
  let libraryPromise;

  function loadHtml2Canvas() {
    if (typeof window.html2canvas === "function") {
      return Promise.resolve(window.html2canvas);
    }

    if (!libraryPromise) {
      libraryPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = libraryUrl;
        script.async = true;
        script.onload = () => {
          if (typeof window.html2canvas === "function") {
            resolve(window.html2canvas);
          } else {
            reject(new Error("html2canvas를 불러오지 못했습니다."));
          }
        };
        script.onerror = () =>
          reject(new Error("html2canvas 다운로드에 실패했습니다."));
        document.head.append(script);
      }).catch((error) => {
        libraryPromise = undefined;
        throw error;
      });
    }

    return libraryPromise;
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("PNG 변환에 실패했습니다.")),
        "image/png",
      );
    });
  }

  function downloadBlob(blob, fileName) {
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = fileName;
    link.href = downloadUrl;
    link.click();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  }

  async function savePages(button) {
    const pages = Array.from(
      document.querySelectorAll("[data-print-page][data-png-filename]"),
    );
    const originalText = button.textContent;
    button.disabled = true;

    try {
      if (pages.length === 0) {
        throw new Error("PNG로 저장할 페이지가 없습니다.");
      }

      const html2canvas = await loadHtml2Canvas();

      for (const [index, page] of pages.entries()) {
        button.textContent = `저장 중… (${index + 1}/${pages.length})`;
        const canvas = await html2canvas(page, {
          ...renderOptions,
          onclone: (clonedDocument) => {
            const clonedPage = clonedDocument.querySelectorAll(
              "[data-png-filename]",
            )[index];
            clonedPage.style.margin = "0";
            clonedPage.style.boxShadow = "none";
          },
        });
        const blob = await canvasToBlob(canvas);
        downloadBlob(blob, `${page.dataset.pngFilename}.png`);

        if (index < pages.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      }
    } catch (error) {
      console.error(error);
      alert(
        "PNG 저장에 실패했습니다. 인터넷 연결과 Chrome 또는 Edge를 확인해 주세요.",
      );
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  document.querySelectorAll("[data-png-export]").forEach((button) => {
    button.addEventListener("click", () => savePages(button));
  });
})();
