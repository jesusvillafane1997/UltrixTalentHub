'use server';

import {
  addCandidateToOpening as addCandidateToOpeningInOpenings,
  removeCandidateFromOpening as removeCandidateFromOpeningInOpenings,
} from '@/actions/openings';

export async function addCandidateToOpening(
  personId: string,
  openingId: string,
  source?: string
) {
  return addCandidateToOpeningInOpenings(personId, openingId, source);
}

export async function removeCandidateFromOpening(applicationId: string) {
  return removeCandidateFromOpeningInOpenings(applicationId);
}
