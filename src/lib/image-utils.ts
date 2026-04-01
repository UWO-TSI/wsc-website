/**
 * Validates that an image file's dimensions do not exceed the given maximum.
 * Creates a temporary object URL, loads it as an Image, reads dimensions,
 * then revokes the URL.
 */
export function validateImageDimensions(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width > maxWidth || img.height > maxHeight) {
        reject(
          new Error(
            `Image dimensions (${img.width}×${img.height}) exceed the maximum allowed ` +
              `(${maxWidth}×${maxHeight}). Please resize before uploading.`
          )
        );
      } else {
        resolve();
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image dimensions. Please try a different file.'));
    };

    img.src = url;
  });
}
