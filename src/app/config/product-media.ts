// Per-product cover imagery, shared by the product cards and featured cards.
// Self-hosted under public/media rather than hotlinked: these ship inside dist,
// so a deploy can never leave a card pointing at an image that is not there.
export const productImagery: Record<string, string> = {
  stack62: "/media/office-meeting.jpg",
  hms7: "/media/doctor-tablet.jpg",
  henholib: "/media/mother-child.jpg",
  fms13: "/media/tower-lagos.jpg",
  edm73: "/media/school-students.jpg",
};
