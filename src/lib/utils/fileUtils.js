export async function handleFileChange(event, addFiles) {
  // Hent filerne fra eventet og kald addFiles for at tilføje dem til store-objektet
    const files = event.target.files;
    if (files.length > 0) {
      await addFiles(files); 
    }
    event.target.value = ''; // Nulstil input-feltet for at sikre, at samme fil kan tilføjes flere gange
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
          const base64Data = e.target.result.split(',')[1]; // fjerner meta data fra base64 string
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
      // Vent på, at alle filer er blevet læst som Base64
      const newImages = await Promise.all(filePromises);
      store.update((currentImages) => {
        if (reportId !== null) {
          // For comments, update the images object with reportId as key
          return {
            ...currentImages,
            [reportId]: [
              ...(currentImages[reportId] || []), // bevare eksisterende billeder for rapporten
              ...newImages,
            ],
          };
        } else {
          // For general images, update the images array bruger vi ikke til noget endnu, men kan være nyttig senere
          // fx hvis vi skal tilføje billeder til en brugerprofil fordi de ikke har en rapportId
          return [...currentImages, ...newImages];
        }
      });
    } catch (error) {
      console.error(error);
      setErrorMessage('Der skete en fejl ved tilføjelse af filer.');
    }
  }
  
  export function removeImage(index, store, reportId = null) {
    // opdatere store-objektet med den ændrede liste af billeder
    store.update((currentImages) => {
      if (reportId !== null) {
        const imagesForReport = currentImages[reportId] || []; // henter billeder fra den specifikke rapport
        imagesForReport.splice(index, 1); // fjerner billedet på det angivene index i arrayet
        return {
          ...currentImages, // bevar de øvrige billeder for andre rapporter
          [reportId]: imagesForReport, // opdater billederne for denne rapport
        };
      } else {
        // håndtering for generelle billeder
        currentImages.splice(index, 1); // fjerner billedet på det angivene index i arrayet
        return [...currentImages]; // returnerer en ny kopi af arrayet
      }
    });
  }
  