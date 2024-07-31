/**
 * Downloads a file from a given data blob.
 *
 * @param dataBlob - The data blob to download.
 * @param type - The type of the data blob.
 * @param filename - The name of the file to be downloaded.
 */
export const downloadFileBlob = (dataBlob: any, type: string, filename: string) => {
  const blob = new Blob([dataBlob], { type });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Gets the last section of a filepath (aka the filename). Shortens if desired.
 * @param filepath
 * @param maxLength
 */
export const getShortFilenameOnly = (filepath: string, maxLength: number | null = 25): string => {
  const filepathSections = filepath.split("/");
  const filename = filepathSections[filepathSections.length - 1];
  return maxLength && filename.length > maxLength ? `${filename.substring(0, maxLength - 3)}...` : filename;
};
