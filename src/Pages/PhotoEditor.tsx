import { useState, useRef, type ChangeEvent } from 'react';
import { Download, Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageData {
  offer: string | null;
  footer1: string | null;
  footer2: string | null;
}

type ImageType = keyof ImageData;

export default function EmailImageCombiner() {
  const [images, setImages] = useState<ImageData>({
    offer: null,
    footer1: null,
    footer2: null,
  });

  const [combinedImage, setCombinedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleImageUpload = (type: ImageType, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const result = event.target?.result as string;
        setImages((prev) => ({ ...prev, [type]: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (type: ImageType) => {
    setImages((prev) => ({ ...prev, [type]: null }));
    if (type === 'offer' || type === 'footer1' || type === 'footer2') {
      setCombinedImage(null);
    }
  };

  const combineImages = async () => {
    if (!images.offer || !images.footer1 || !images.footer2) {
      alert('Please upload all three images first');
      return;
    }

    setIsProcessing(true);

    try {
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      const [offerImg, footer1Img, footer2Img] = await Promise.all([
        loadImage(images.offer),
        loadImage(images.footer1),
        loadImage(images.footer2),
      ]);

      const maxWidth = Math.max(offerImg.width, footer1Img.width, footer2Img.width);
      const totalHeight = offerImg.height + footer1Img.height + footer2Img.height;

      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      canvas.width = maxWidth;
      canvas.height = totalHeight;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, maxWidth, totalHeight);

      let currentY = 0;

      const drawCentered = (img: HTMLImageElement) => {
        const x = (maxWidth - img.width) / 2;
        ctx.drawImage(img, x, currentY, img.width, img.height);
        currentY += img.height;
      };

      drawCentered(offerImg);
      drawCentered(footer1Img);
      drawCentered(footer2Img);

      const combined = canvas.toDataURL('image/png');
      setCombinedImage(combined);
    } catch (error) {
      console.error('Error combining images:', error);
      alert('Failed to combine images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!combinedImage) return;
    const link = document.createElement('a');
    link.download = 'combined-email.png';
    link.href = combinedImage;
    link.click();
  };

  interface ImageUploadBoxProps {
    type: ImageType;
    label: string;
    image: string | null;
  }

  const ImageUploadBox = ({ type, label, image }: ImageUploadBoxProps) => (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleImageUpload(type, e)}
        className="hidden"
        id={`upload-${type}`}
      />
      {!image ? (
        <label htmlFor={`upload-${type}`} className="cursor-pointer block">
          <Upload className="mx-auto mb-2 text-gray-400" size={32} />
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-xs text-gray-500 mt-1">Click to upload</p>
        </label>
      ) : (
        <div className="relative">
          <img src={image} alt={label} className="max-h-40 mx-auto rounded" />
          <button
            onClick={() => removeImage(type)}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X size={16} />
          </button>
          <p className="text-xs text-green-600 mt-2 font-medium">✓ {label} uploaded</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <ImageIcon className="mx-auto mb-4 text-blue-600" size={48} />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Email Image Combiner</h1>
            <p className="text-gray-600">
              Combine your email offer with legal footers into one image
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <ImageUploadBox type="offer" label="Email Offer" image={images.offer} />
            <ImageUploadBox type="footer1" label="Footer 1" image={images.footer1} />
            <ImageUploadBox type="footer2" label="Footer 2" image={images.footer2} />
          </div>

          <div className="flex justify-center mb-8">
            <button
              onClick={combineImages}
              disabled={!images.offer || !images.footer1 || !images.footer2 || isProcessing}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isProcessing ? 'Processing...' : 'Combine Images'}
            </button>
          </div>

          {combinedImage && (
            <div className="border-t pt-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Combined Result</h2>
              <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
                <img src={combinedImage} alt="Combined" className="w-full rounded shadow-lg" />
                <button
                  onClick={downloadImage}
                  className="mt-4 w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download Combined Image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
