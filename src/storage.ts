import { invoke, isTauri } from '@tauri-apps/api/core';
import { reviewSchema, snapshotSchema, type Review, type Snapshot } from './model';
import { z } from 'zod';

export const native = isTauri();
export function explain(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);
  return String(error);
}
export async function loadReviews(): Promise<Review[]> {
  const raw: unknown = native ? await invoke('load_records', { namespace:'reviews' }) : JSON.parse(localStorage.getItem('fiscalwatch-reviews') ?? '[]');
  return z.array(reviewSchema).parse(raw);
}
export async function saveReview(review: Review): Promise<void> {
  const parsed = reviewSchema.parse(review);
  if (native) return invoke('save_record', { namespace:'reviews', id:parsed.id, payload:parsed });
  const records = await loadReviews();
  localStorage.setItem('fiscalwatch-reviews',JSON.stringify([...records.filter(r=>r.id!==parsed.id),parsed]));
}
export async function loadSnapshots(): Promise<Snapshot[]> {
  if (!native) return [];
  return z.array(snapshotSchema).parse(await invoke('load_records',{namespace:'snapshots'}));
}
export async function storeSnapshot(snapshot: Snapshot): Promise<void> {
  snapshotSchema.parse(snapshot);
  if (native) await invoke('save_record',{namespace:'snapshots',id:snapshot.dataset,payload:snapshot});
}
export function download(name: string, content: string, type='application/json'): void {
  const blob = new Blob([content],{type}); const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download=name;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
