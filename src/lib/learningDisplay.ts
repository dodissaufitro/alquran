/** Judul ringkas di beranda / grid materi kajian */
export function shortLearningCategoryTitle(title: string): string {
  return title.replace(/^Materi Kajian\s+/i, '').trim() || title
}
