
import React, { useState } from 'react';
import { HighSchoolRating } from '../../types';
import { HIGH_SCHOOL_RATING_OPTIONS } from '../../constants';
import { StarIcon } from '../Icons';

export const HighSchoolRatingSelector: React.FC<{
  selectedValue: HighSchoolRating | null;
  onSelect: (value: HighSchoolRating) => void;
}> = ({ selectedValue, onSelect }) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue || selectedValue;
  const displayLabel = displayValue ? HIGH_SCHOOL_RATING_OPTIONS.find(o => o.value === displayValue)?.label : 'Selecciona una calificación';

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex justify-center items-center gap-4">
        {[...Array(4)].map((_, i) => {
          const ratingValue = i + 1;
          const isFilled = (hoverValue || selectedValue || 0) >= ratingValue;
          return (
            <button
              key={ratingValue}
              onClick={() => onSelect(ratingValue as HighSchoolRating)}
              onMouseEnter={() => setHoverValue(ratingValue)}
              onMouseLeave={() => setHoverValue(null)}
              className="transition-transform duration-200 hover:scale-110"
              aria-label={`Calificar ${ratingValue} de 4`}
            >
              <StarIcon
                filled={isFilled}
                className={`w-20 h-20 cursor-pointer ${isFilled ? 'text-yellow-400' : 'text-gray-300'}`}
              />
            </button>
          );
        })}
      </div>
      <p className="text-3xl font-extrabold text-gray-800 h-8">
        {displayLabel}
      </p>
    </div>
  );
};
