// Original piece set drawn for this project (Staunton-style silhouettes, no cross shapes). Not copied from any other chess site.
const BASE = '<path d="M9.5 39.5c0-2.4 1.6-3.8 3.6-4.2h18.8c2 .4 3.6 1.8 3.6 4.2z"/><path class="ln" d="M12 37.4h21"/>';
const P = {
  P: '<circle cx="22.5" cy="11.5" r="5.2"/><path d="M17.6 17.5h9.8c-.4 1.6-1 2.6-1.8 3.2 3.6 2.6 6 7.4 6.4 14.5H12.9c.4-7.1 2.8-11.9 6.4-14.5-.8-.6-1.4-1.6-1.7-3.2z"/><path class="ln" d="M19.5 12.2a3.2 3.2 0 0 1 2-3"/>' + BASE,
  R: '<path d="M12 7h4.2v3h3.4V7h5.8v3h3.4V7H33v8.5l-3.4 2.6H15.4L12 15.5z"/><path d="M15.6 18.6h13.8l1.4 16.7H14.2z"/><path class="ln" d="M12.4 15.5h20.2M16.8 25h11.4"/>' + BASE,
  B: '<circle cx="22.5" cy="6.8" r="2.4"/><path d="M22.5 9.2c5 3.4 8.4 7.6 8.4 12.1 0 2.4-1.2 4.2-3 5.4 2.2 2.2 3.6 5.2 3.8 8.6H13.3c.2-3.4 1.6-6.4 3.8-8.6-1.8-1.2-3-3-3-5.4 0-4.5 3.4-8.7 8.4-12.1z"/><path class="ln" d="M20.3 15.6l5.4 5.4M16.6 27h11.8"/>' + BASE,
  N: '<path d="M12.6 35.3c.2-6.4 1.6-11 5-14.6 1.4-1.6 1.2-3.2-.4-3.8l-4.6 1.4c-1.4.4-2.8-.4-3.2-1.8-.2-.8 0-1.6.6-2.2l7.6-7.2L21 4.8l1.6 2.6c8 .6 13.8 7.6 13.8 16.2 0 4.4-.6 8.2-1.4 11.7z"/><path class="ln" d="M24.6 9.8c3.6 1 6.4 4 7.2 8M17.4 13.6l-3.6 3.2M20 24.2c-1.6 3.4-3 6.4-3.6 9.6"/><circle cx="21" cy="12.4" r="1.3" class="eye"/><circle cx="11.2" cy="15" r=".8" class="eye"/>' + BASE,
  Q: '<circle cx="8.2" cy="12" r="2.3"/><circle cx="15.3" cy="7.6" r="2.3"/><circle cx="22.5" cy="6.2" r="2.3"/><circle cx="29.7" cy="7.6" r="2.3"/><circle cx="36.8" cy="12" r="2.3"/><path d="M9.6 14.4l4.2 12.8 4-12.4 2.6 11.6 2.1-12.2 2.1 12.2 2.6-11.6 4 12.4 4.2-12.8c.8 5.6 1.4 12 2 19.4H7.6c.6-7.4 1.2-13.8 2-19.4z" transform="translate(0 0)"/><path class="ln" d="M10.4 29.2c8 1.8 16.2 1.8 24.2 0"/>' + BASE,
  K: '<circle cx="22.5" cy="4.9" r="2.4"/><path d="M13.6 18.4l-2-9.6 5.6 4 5.3-6.2 5.3 6.2 5.6-4-2 9.6z"/><path d="M14.4 20.4h16.2c3.4 3.4 5.2 8 5.6 14.9H8.8c.4-6.9 2.2-11.5 5.6-14.9z"/><path class="ln" d="M13.8 18.4h17.4M11.6 27h21.8"/>' + BASE,
};
export const svg = (p) => `<svg class="pc ${p === p.toUpperCase() ? "w" : "b"}" viewBox="0 0 45 45" aria-hidden="true">${P[p.toUpperCase()]}</svg>`;
