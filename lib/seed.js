// Starting data, carried over from the CAP Task Board Google Sheet (9 Nov 2026).
// Only used the first time the app connects to an empty database.
export const SEED = {
  team: [
    { name: 'Amit Pramanik', role: 'Creative Director', team: 'Creative', capacity: 6 },
    { name: 'Ragib Shahriar', role: 'Copy Supervisor', team: 'Creative', capacity: 6 },
    { name: 'Rakib Islam', role: 'Sr. Visualizer', team: 'Creative', capacity: 6 },
    { name: 'Rajib Akash', role: 'Sr. Visualizer', team: 'Creative', capacity: 6 },
    { name: 'Laxmi', role: 'Jr. Visualizer', team: 'Creative', capacity: 6 },
    { name: 'Hasin Bijoy', role: 'Video Editor', team: 'Creative', capacity: 6 },
    { name: 'Muntasir Mannan', role: 'Key Account Manager', team: 'Servicing', capacity: 6 },
    { name: 'Tahmina Taj', role: 'Client Servicing Executive', team: 'Servicing', capacity: 6 },
    { name: 'Rajat Tanmay', role: 'MD and Servicing Lead', team: 'Servicing', capacity: 6 },
    { name: 'Syeda Neelima Dola', role: 'CEO', team: 'C-Suite', capacity: 6 },
    { name: 'Manjurul Mahmud', role: 'Chief of Strategy', team: 'C-Suite', capacity: 6 },
    { name: 'Meem Arafat Manab', role: 'Chief of Finance', team: 'C-Suite', capacity: 6 },
    { name: 'Sindid Arafat', role: 'Data Analyst', team: 'Strategy and Data', capacity: 6 },
    { name: 'Rashed', role: 'Admin', team: 'Admin', capacity: 6 },
  ],
  clients: [
    { name: 'ACI Godrej', type: 'Client', status: 'Active' },
    { name: 'FIF', type: 'Client', status: 'Active' },
    { name: 'UNESCO', type: 'Pitch', status: 'Pitching' },
    { name: 'CAP Internal', type: 'Internal', status: 'Active' },
  ],
  tasks: [
    { date_added: '2026-11-09', client: 'ACI Godrej', task: 'Launching static post - 4 content', owner: 'Rajib Akash', priority: 'High', internal_deadline: '2026-11-10', client_deadline: '2026-11-10', status: 'In progress' },
    { date_added: '2026-11-09', client: 'ACI Godrej', task: 'Dynamic - 2 content', owner: 'Ragib Shahriar', priority: 'High', internal_deadline: '2026-11-10', client_deadline: '2026-11-10', status: 'Not started', blocked_by: 'Client approval', blocked_since: '2026-11-09' },
    { date_added: '2026-11-09', client: 'ACI Godrej', task: 'Calendar', priority: 'Medium', status: 'In progress', notes: 'Submit calendar design quotation' },
    { date_added: '2026-11-09', client: 'FIF', task: 'Reels video thumbnail', owner: 'Amit Pramanik', priority: 'High', status: 'Not started' },
    { date_added: '2026-11-09', client: 'FIF', task: 'Problem area - 2 post', owner: 'Rakib Islam', priority: 'High', status: 'Not started' },
    { date_added: '2026-11-09', client: 'FIF', task: 'Problem spotting dynamic', priority: 'High', status: 'Not started' },
    { date_added: '2026-11-09', client: 'UNESCO', task: 'Calendar Design', brief: 'Calendar Design & Print', owner: 'Syeda Neelima Dola', reviewer: 'Amit Pramanik', priority: 'Medium', start_date: '2026-11-10', internal_deadline: '2026-11-11', client_deadline: '2026-11-15', status: 'In progress' },
  ],
};
