import { cnSource, enSource } from '@/lib/source';
import { llms } from 'fumadocs-core/source';

export const revalidate = false;

export function GET() {
  const index = [llms(enSource).index(), llms(cnSource).index()].join('\n\n');
  return new Response(index);
}
