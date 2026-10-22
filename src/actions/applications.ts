'use server';

import { addCandidateToOpening as addCandidateToOpeningInOpenings } from '@/actions/openings';

export async function addCandidateToOpening(
  personId: string,
  openingId: string,
  source?: string
) {
  return addCandidateToOpeningInOpenings(personId, openingId, source);
}
