const { createClient } = require('@supabase/supabase-js');
const url = 'https://tzlkljbvbabhsygsrckq.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bGtsamJ2YmFiaHN5Z3NyY2txIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjUwNjA5MywiZXhwIjoyMTA4MDgyMDkzfQ.C-J9R5swyxD-aR7BBSzZQRCudwo994T70nPEPoNtgKk';

const supabaseAdmin = createClient(url, serviceKey);

async function check() {
  const users = await supabaseAdmin.from('users').select('*');
  const clients = await supabaseAdmin.from('clients').select('*');
  const openings = await supabaseAdmin.from('openings').select('*');
  const people = await supabaseAdmin.from('people').select('*');
  const applications = await supabaseAdmin.from('applications').select('*');
  const stages = await supabaseAdmin.from('pipeline_stages').select('*');
  const documents = await supabaseAdmin.from('documents').select('*');

  console.log('users:', users.data?.length);
  console.log('clients:', clients.data?.length);
  console.log('openings:', openings.data?.length);
  console.log('people:', people.data?.length);
  console.log('applications:', applications.data?.length);
  console.log('stages:', stages.data?.length);
  console.log('documents:', documents.data?.length);
}

check();
