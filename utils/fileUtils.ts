
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // The result includes the data URL prefix "data:audio/wav;base64,",
      // we need to remove it to get the raw base64 data.
      const base64String = result.split(',')[1];
      if (base64String) {
        resolve(base64String);
      } else {
        reject(new Error("Failed to parse base64 string from file."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};
