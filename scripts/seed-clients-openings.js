const { createClient } = require('@supabase/supabase-js');
const url = 'https://tzlkljbvbabhsygsrckq.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bGtsamJ2YmFiaHN5Z3NyY2txIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjUwNjA5MywiZXhwIjoyMTA4MDgyMDkzfQ.C-J9R5swyxD-aR7BBSzZQRCudwo994T70nPEPoNtgKk';

const supabaseAdmin = createClient(url, serviceKey);

async function seed() {
  const clients = [
    { id: 'c1111111-0000-0000-0000-000000000001', name: 'Nexus Fintech Corp', contact_name: 'Sarah Jenkins', contact_email: 'sarah.j@nexusfintech.io', timezone: 'America/New_York (EST)', account_manager_id: '44444444-4444-4444-4444-444444444444', active: true, created_by: '11111111-1111-1111-1111-111111111111' },
    { id: 'c1111111-0000-0000-0000-000000000002', name: 'Aura Health Logistics', contact_name: 'Dr. Aris Thorne', contact_email: 'athorne@aurahealth.co', timezone: 'America/Los_Angeles (PST)', account_manager_id: '44444444-4444-4444-4444-444444444444', active: true, created_by: '11111111-1111-1111-1111-111111111111' },
    { id: 'c1111111-0000-0000-0000-000000000003', name: 'Starlight Media Inc', contact_name: "Claire O'Connor", contact_email: 'claire@starlightmedia.uk', timezone: 'Europe/London (GMT)', account_manager_id: '44444444-4444-4444-4444-444444444444', active: true, created_by: '11111111-1111-1111-1111-111111111111' }
  ];

  const { error: clientErr } = await supabaseAdmin.from('clients').upsert(clients);
  if (clientErr) console.error('Client error:', clientErr);

  const openings = [
    { id: 'b1000001-0000-0000-0000-000000000001', title: 'Senior Full-Stack React / Node Engineer', client_id: 'c1111111-0000-0000-0000-000000000001', seniority: 'Senior', stack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'], salary_min: 4500, salary_max: 5500, bill_rate_min: 8000, bill_rate_max: 9500, currency: 'USD', headcount: 2, status: 'Open', owner_id: '33333333-3333-3333-3333-333333333333', created_by: '11111111-1111-1111-1111-111111111111' },
    { id: 'b1000001-0000-0000-0000-000000000002', title: 'Staff AI / Python Data Engineer', client_id: 'c1111111-0000-0000-0000-000000000002', seniority: 'Lead', stack: ['Python', 'FastAPI', 'LangChain', 'PostgreSQL', 'Docker'], salary_min: 5500, salary_max: 7000, bill_rate_min: 10000, bill_rate_max: 12000, currency: 'USD', headcount: 1, status: 'Open', owner_id: '33333333-3333-3333-3333-333333333333', created_by: '11111111-1111-1111-1111-111111111111' },
    { id: 'b1000001-0000-0000-0000-000000000003', title: 'Senior Cloud DevOps Engineer', client_id: 'c1111111-0000-0000-0000-000000000003', seniority: 'Senior', stack: ['Kubernetes', 'Terraform', 'AWS', 'GitHub Actions'], salary_min: 5000, salary_max: 6200, bill_rate_min: 8500, bill_rate_max: 10500, currency: 'USD', headcount: 1, status: 'On hold', owner_id: '33333333-3333-3333-3333-333333333333', created_by: '11111111-1111-1111-1111-111111111111' }
  ];

  const { error: openErr } = await supabaseAdmin.from('openings').upsert(openings);
  if (openErr) console.error('Opening error:', openErr);

  const cCount = await supabaseAdmin.from('clients').select('id');
  const oCount = await supabaseAdmin.from('openings').select('id');
  console.log('Seeded successfully! Clients:', cCount.data?.length, 'Openings:', oCount.data?.length);
}

seed();
