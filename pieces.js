// Original piece set drawn for this project (simple geometric silhouettes, no cross shapes).
const P = {
  P: '<circle cx="22.5" cy="13" r="5.5"/><path d="M14.5 34c0-8 3.5-12 8-12s8 4 8 12z"/><rect x="11" y="34" width="23" height="4" rx="1.5"/>',
  N: '<path d="M13 34c0-10 3-16 9-21l-3-5 7 2c8 3 12 10 12 24z"/><circle cx="25.5" cy="16" r="1.4" class="eye"/><rect x="11" y="34" width="23" height="4" rx="1.5"/>',
  B: '<path d="M22.5 6c3.5 3.5 6 6.5 6 10.5 0 3-2.5 5.5-6 5.5s-6-2.5-6-5.5c0-4 2.5-7 6-10.5z"/><path d="M14 34c0-7 3.5-10 8.5-11.5 5 1.5 8.5 4.5 8.5 11.5z"/><rect x="11" y="34" width="23" height="4" rx="1.5"/>',
  R: '<path d="M13 9h5v4h3V9h3v4h3V9h5v9l-3 3v11l3 2v3H13v-3l3-2V21l-3-3z"/><rect x="11" y="34" width="23" height="4" rx="1.5"/>',
  Q: '<path d="M10 16l5 17h15l5-17-7.5 8L22.5 12l-5 12z"/><circle cx="10" cy="14.5" r="2.4"/><circle cx="22.5" cy="9.5" r="2.4"/><circle cx="35" cy="14.5" r="2.4"/><rect x="11" y="33" width="23" height="5" rx="1.5"/>',
  K: '<path d="M22.5 4l4.2 5-4.2 5-4.2-5z"/><path d="M12.5 33c0-9 3.5-15 10-15s10 6 10 15z"/><rect x="10" y="33" width="25" height="5" rx="1.5"/>',
};
export const svg = (p) => `<svg class="pc ${p === p.toUpperCase() ? "w" : "b"}" viewBox="0 0 45 45" aria-hidden="true">${P[p.toUpperCase()]}</svg>`;
