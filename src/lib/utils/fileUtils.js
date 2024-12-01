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
  
  export async function addFiles(files, images, setErrorMessage) {
    const maxSizeInBytes = 500 * 1024; // 500 KB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const filePromises = [];
  
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
  
      // Valider filstørrelse
      if (file.size > maxSizeInBytes) {
        setErrorMessage(`Filen er for stor. Maksimal filstørrelse er 500 KB.`);
        continue;
      }
  
      // Valider filtype
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
      images.update((currentImages) => [...currentImages, ...newImages]);
    } catch (error) {
      console.error(error);
      alert('Der opstod en fejl under upload af billeder.');
    }
  }
  
  export function removeImage(index, images) {
    images.update((currentImages) => {
      currentImages.splice(index, 1);
      return [...currentImages];
    });
  }
  