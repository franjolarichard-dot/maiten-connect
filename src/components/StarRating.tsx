"use client";

import { useState } from "react";

interface StarRatingProps {
  onSubmit: (rating: number, comment: string) => Promise<void>;
}

export default function StarRating({ onSubmit }: StarRatingProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    await onSubmit(rating, comment);
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center animate-in fade-in">
        <p className="text-emerald-700 dark:text-emerald-300 font-bold">¡Gracias por tu calificación! ⭐</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50 space-y-3">
      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">¿Cómo fue el servicio?</p>
      
      <div className="flex gap-1 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-125 active:scale-95 cursor-pointer"
          >
            <svg
              className={`w-8 h-8 ${
                star <= (hover || rating)
                  ? "text-amber-400"
                  : "text-slate-300 dark:text-slate-600"
              } transition-colors`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Deja un comentario opcional..."
        className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
        rows={2}
      />

      <button
        onClick={handleSubmit}
        disabled={rating === 0 || loading}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? "Enviando..." : `Calificar con ${rating} estrella${rating !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}
