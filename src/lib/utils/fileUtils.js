export async function handleFileChange(event, addFiles) {
    const files = event.target.files;
    if (files.length > 0) {
      await addFiles(files);
    }
    event.target.value = '';
  }
  
  export async function handlePaste(event, addFiles) {
    const clipboardItems = event.clipboardData.items;
    for (const item of clipboardItems) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          await addFiles([file]);
        }
      }
    }
  }
  
  export async function addFiles(files, store, setErrorMessage, reportId = null) {
    const maxSizeInBytes = 500 * 1024; // 500 KB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const filePromises = [];
  
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
  
      // Validate file size
      if (file.size > maxSizeInBytes) {
        setErrorMessage(`Filen er for stor. Maksimal filstørrelse er 500 KB.`);
        continue;
      }
  
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage(`Kun JPG, PNG og GIF billeder er tilladt. Filen ${file.name} er ugyldig.`);
        continue;
      }
  
      const filePromise = new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
          const base64Data = e.target.result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = function () {
          reject(new Error(`Fejl ved læsning af fil: ${file.name}`));
        };
        reader.readAsDataURL(file);
      });
  
      filePromises.push(filePromise);
    }
  
    try {
      const newImages = await Promise.all(filePromises);
      store.update((currentImages) => {
        if (reportId !== null) {
          // For comments, update the images object with reportId as key
          return {
            ...currentImages,
            [reportId]: [
              ...(currentImages[reportId] || []),
              ...newImages,
            ],
          };
        } else {
          // For general images, update the images array
          return [...currentImages, ...newImages];
        }
      });
    } catch (error) {
      console.error(error);
      alert('Der opstod en fejl under upload af billeder.');
    }
  }
  
  export function removeImage(index, store, reportId = null) {
    store.update((currentImages) => {
      if (reportId !== null) {
        const imagesForReport = currentImages[reportId] || [];
        imagesForReport.splice(index, 1);
        return {
          ...currentImages,
          [reportId]: imagesForReport,
        };
      } else {
        currentImages.splice(index, 1);
        return [...currentImages];
      }
    });
  }
  