import { PrimaryRating } from './types';

export const PRIMARY_RATING_OPTIONS = [
  { value: PrimaryRating.Never, label: 'Ninguna vez' },
  { value: PrimaryRating.Sometimes, label: 'A veces' },
  { value: PrimaryRating.Always, label: 'Siempre' },
];

export const HIGH_SCHOOL_RATING_OPTIONS = [
    { value: 1, label: 'Ninguna de las veces' },
    { value: 2, label: 'Muy pocas veces' },
    { value: 3, label: 'Casi siempre' },
    { value: 4, label: 'Siempre' },
];
