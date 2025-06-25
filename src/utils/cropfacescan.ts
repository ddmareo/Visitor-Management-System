export const cropImageToAspectRatio = (
    imageDataUrl: string,
    targetAspectRatio: number // e.g., 3/4
): Promise<string> => {
    return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
        return reject(new Error('Could not get canvas context for cropping'));
        }

        const sourceWidth = img.naturalWidth;
        const sourceHeight = img.naturalHeight;
        const sourceAspectRatio = sourceWidth / sourceHeight;

        let sx = 0, sy = 0, sWidth = sourceWidth, sHeight = sourceHeight;
        let canvasWidth: number, canvasHeight: number;

        // Determine cropping dimensions
        if (sourceAspectRatio > targetAspectRatio) {
        // Source image is wider than target: Crop the sides
        sWidth = sourceHeight * targetAspectRatio;
        sx = (sourceWidth - sWidth) / 2;
        canvasWidth = sWidth; // Use the cropped width
        canvasHeight = sourceHeight;
        } else if (sourceAspectRatio < targetAspectRatio) {
        // Source image is taller than target: Crop the top/bottom
        sHeight = sourceWidth / targetAspectRatio;
        sy = (sourceHeight - sHeight) / 2;
        canvasWidth = sourceWidth;
        canvasHeight = sHeight; // Use the cropped height
        } else {
             // Aspect ratios already match
             canvasWidth = sourceWidth;
             canvasHeight = sourceHeight;
        }

         // Ensure integer values for canvas dimensions and drawImage source rect
         canvasWidth = Math.round(canvasWidth);
         canvasHeight = Math.round(canvasHeight);
         sx = Math.round(sx);
         sy = Math.round(sy);
         sWidth = Math.round(sWidth);
         sHeight = Math.round(sHeight);


         // Don't draw a zero-dimension image
         if (sWidth <= 0 || sHeight <= 0 || canvasWidth <= 0 || canvasHeight <= 0) {
            console.error("Invalid crop dimensions calculated:", { sx, sy, sWidth, sHeight, canvasWidth, canvasHeight });
            // Fallback: return original image data? Or reject?
             // return resolve(imageDataUrl); // Option: fallback to original
             return reject(new Error('Invalid crop dimensions calculated'));
         }


        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Draw the cropped portion onto the new canvas
         console.log(`Cropping: Draw image [${img.naturalWidth}x${img.naturalHeight}] SourceRect (${sx},${sy} ${sWidth}x${sHeight}) onto Canvas (${canvasWidth}x${canvasHeight})`);
        ctx.drawImage(
             img,
             sx, sy, sWidth, sHeight, // Source rectangle (part of the original image)
             0, 0, canvasWidth, canvasHeight // Destination rectangle (whole new canvas)
         );

        // Get the cropped image data
        resolve(canvas.toDataURL('image/jpeg', 1)); // Adjust quality as needed
    };
    img.onerror = () => {
        reject(new Error('Failed to load image for cropping'));
    };
    img.src = imageDataUrl;
    });
};