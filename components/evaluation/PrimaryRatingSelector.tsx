
import React from 'react';
import { PrimaryRating } from '../../types';
import { PRIMARY_RATING_OPTIONS } from '../../constants';
import { HappyFaceIcon, NeutralFaceIcon, SadFaceIcon } from '../Icons';

export const PrimaryRatingSelector: React.FC<{
  selectedValue: PrimaryRating | null;
  onSelect: (value: PrimaryRating) => void;
}> = ({ selectedValue, onSelect }) => {
  return (
    <div className="flex justify-center items-stretch gap-8 w-full">
      {PRIMARY_RATING_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onSelect(value)}
          className="flex-1 flex flex-col items-center justify-center p-2 transition-transform duration-200 hover:scale-105"
          aria-label={label}
        >
          {value === PrimaryRating.Never && <SadFaceIcon className="w-28 h-28" active={selectedValue === value} />}
          {value === PrimaryRating.Sometimes && <NeutralFaceIcon className="w-28 h-28" active={selectedValue === value} />}
          {value === PrimaryRating.Always && <HappyFaceIcon className="w-28 h-28" active={selectedValue === value} />}
          <span className={`mt-3 font-extrabold text-center text-3xl transition-colors duration-200 ${selectedValue === value ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
        </button>
      ))}
    </div>
  );
};
