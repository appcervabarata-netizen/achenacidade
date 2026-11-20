import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Check, Sparkles } from 'lucide-react';
import { uploadImageToServer } from '../../utils/apiSync';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helpText?: string;
  presetSamples?: { label: string; url: string }[];
  aspectRatio?: 'square' | 'banner' | 'icon' | 'rectangle';
  required?: boolean;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  value,
  onChange,
  label = 'Imagem',
  helpText = 'Arraste um arquivo de imagem, selecione do seu computador ou escolha um modelo abaixo.',
  presetSamples = [],
  aspectRatio = 'square',
  required = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadMessage('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, GIF).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadMessage('O arquivo é muito grande. Escolha uma imagem de até 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        setIsUploading(true);
        setUploadMessage(`Enviando "${file.name}"...`);
        const serverUrl = await uploadImageToServer(dataUrl, file.name);
        setIsUploading(false);

        if (serverUrl) {
          onChange(serverUrl);
          setUploadMessage(`Imagem "${file.name}" salva no servidor!`);
        } else {
          onChange(dataUrl);
          setUploadMessage(`Imagem "${file.name}" carregada com sucesso!`);
        }
        setTimeout(() => setUploadMessage(null), 3000);
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      setUploadMessage('Erro ao ler a imagem.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileChange(file);
  };

  const aspectClass =
    aspectRatio === 'banner'
      ? 'aspect-[16/5] sm:aspect-[21/6]'
      : aspectRatio === 'icon'
      ? 'w-16 h-16 rounded-2xl'
      : aspectRatio === 'rectangle'
      ? 'aspect-[4/3]'
      : 'aspect-square max-w-44';

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            {showUrlInput ? 'Usar upload de arquivo' : 'Ou inserir por URL externa'}
          </button>
        </div>
      )}

      {showUrlInput ? (
        <div className="flex gap-2">
          <input
            type="url"
            value={customUrl || value}
            onChange={(e) => {
              setCustomUrl(e.target.value);
              onChange(e.target.value);
            }}
            placeholder="https://exemplo.com/sua-imagem.jpg"
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            Concluir
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Main Dropzone & Upload Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative p-4 rounded-2xl border-2 border-dashed transition flex flex-col sm:flex-row items-center gap-4 ${
              isDragging
                ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 hover:border-slate-400 dark:hover:border-slate-600'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              className="hidden"
            />

            {/* Current Image Preview */}
            {value ? (
              <div className="relative shrink-0 group">
                <img
                  src={value}
                  alt="Preview"
                  className={`${aspectClass} object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs bg-white`}
                />
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 transition cursor-pointer"
                  title="Remover imagem"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}

            {/* Upload Action Area */}
            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Enviando...' : value ? 'Trocar Imagem' : 'Selecionar Arquivo'}</span>
                </button>

                {value && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    Re-enviar
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight pt-1">
                {helpText}
              </p>

              {uploadMessage && (
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>{uploadMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Preset Samples (Quick Pick) */}
          {presetSamples.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Modelos / Exemplos Prontos:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {presetSamples.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onChange(sample.url)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-medium shrink-0 transition cursor-pointer ${
                      value === sample.url
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={sample.url}
                      alt={sample.label}
                      className="w-5 h-5 rounded-lg object-cover"
                    />
                    <span>{sample.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
