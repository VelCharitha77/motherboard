import { SponsorshipBenefitOption, SponsorshipTierId } from './types';

export interface SponsorshipTierDefinition {
  id: SponsorshipTierId;
  name: string;
  nameEs: string;
  amount: number;
  seatsIncluded: number;
  summary: string;
}

export const SPONSORSHIP_TIERS: SponsorshipTierDefinition[] = [
  { id: 'lunch', name: 'Sponsor a Lunch', nameEs: 'Patrocinar un almuerzo', amount: 500, seatsIncluded: 0, summary: 'Covers catering for an in-person Saturday cohort session.' },
  { id: 'half_tuition', name: 'Half Tuition', nameEs: 'Media matrícula', amount: 1500, seatsIncluded: 1, summary: 'Funds half of a 2.0 track seat or one Foundational seat.' },
  { id: 'full_tuition', name: 'Full Tuition', nameEs: 'Matrícula completa', amount: 3000, seatsIncluded: 1, summary: 'Fully funds one Tech-Moms 2.0 cohort seat.' },
  { id: 'cohort_childcare', name: 'Cohort Childcare', nameEs: 'Cuidado infantil de cohorte', amount: 4500, seatsIncluded: 0, summary: 'Provides Saturday childcare stipends across an entire cohort.' },
  { id: 'bronze', name: 'Bronze Partner', nameEs: 'Socio Bronce', amount: 5000, seatsIncluded: 2, summary: 'Funds 2 scholarships plus community recognition.' },
  { id: 'silver', name: 'Silver Partner', nameEs: 'Socio Plata', amount: 10000, seatsIncluded: 4, summary: 'Funds 4 scholarships, hiring showcase access, and event recognition.' },
  { id: 'gold', name: 'Gold Partner', nameEs: 'Socio Oro', amount: 20000, seatsIncluded: 8, summary: 'Funds 8 scholarships, guest speaker spotlight, and annual gala tickets.' },
  { id: 'premium', name: 'Premium (Full Cohort)', nameEs: 'Premium (Cohorte completa)', amount: 50000, seatsIncluded: 20, summary: 'Underwrites an entire regional or online Tech-Moms cohort.' },
];

export const SPONSORSHIP_BENEFIT_CATALOG: SponsorshipBenefitOption[] = [
  {
    id: 'logo_placement',
    label: 'Logo placement on impact page & cohort signage (IRS incidental recognition — $0 FMV)',
    fairMarketValue: 0,
    description: 'Public name and logo recognition without commercial advertising.',
  },
  {
    id: 'speaking_slot',
    label: 'Guest career speaker session with cohort ($0 FMV)',
    fairMarketValue: 0,
    description: 'Educational career-exploration talk for students.',
  },
  {
    id: 'event_tickets',
    label: 'Annual Celebration & Graduation Dinner Ticket Bundle (4 seats)',
    fairMarketValue: 400,
    description: 'Four catered dinner & reception tickets ($100 good-faith FMV each).',
  },
  {
    id: 'recruiting_table',
    label: 'Dedicated VIP Recruiting & Hospitality Table Package',
    fairMarketValue: 250,
    description: 'Catered hospitality package at quarterly career showcase.',
  },
];

export const STAFF_COST_CATALOG = {
  foundationalTuition: 1500,
  track20Tuition: 3000,
  childcareStipend: 750,
  certExamVoucher: 350,
  laptopBundle: 650,
};
