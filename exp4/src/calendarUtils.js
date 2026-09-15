export const CATEGORY_STYLES = {
  Launch: { color: '#e85d3f', soft: '#fde5dd' },
  Community: { color: '#2d8a72', soft: '#dcefe7' },
  Insight: { color: '#6b62c5', soft: '#e8e6f7' },
  Product: { color: '#d28a31', soft: '#f9ecd4' },
};

export const INITIAL_POSTS = [
  { id: 'p-1', title: 'The quiet power of consistency', date: '2026-09-01', time: '09:30', category: 'Insight', status: 'Published', channel: 'LinkedIn' },
  { id: 'p-2', title: 'September product notes', date: '2026-09-03', time: '11:00', category: 'Product', status: 'Scheduled', channel: 'Blog' },
  { id: 'p-3', title: 'Meet the makers: Asha', date: '2026-09-05', time: '10:00', category: 'Community', status: 'Published', channel: 'Instagram' },
  { id: 'p-4', title: 'A better way to plan', date: '2026-09-08', time: '08:30', category: 'Launch', status: 'Scheduled', channel: 'LinkedIn' },
  { id: 'p-5', title: 'Behind the brief', date: '2026-09-10', time: '14:00', category: 'Community', status: 'Draft', channel: 'Instagram' },
  { id: 'p-6', title: 'What we learned shipping v2', date: '2026-09-15', time: '09:00', category: 'Insight', status: 'Scheduled', channel: 'Blog' },
  { id: 'p-7', title: 'Product story: less, better', date: '2026-09-18', time: '12:30', category: 'Product', status: 'Draft', channel: 'LinkedIn' },
  { id: 'p-8', title: 'Studio open hours', date: '2026-09-22', time: '16:00', category: 'Community', status: 'Scheduled', channel: 'Instagram' },
  { id: 'p-9', title: 'October editorial theme', date: '2026-09-29', time: '10:30', category: 'Insight', status: 'Draft', channel: 'Blog' },
];

export const formatMonth = (date) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCalendarDays = (monthDate) => {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const firstDay = (start.getDay() + 6) % 7;
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - firstDay);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
};

export const postsForDate = (posts, dateKey) => posts.filter((post) => post.date === dateKey).sort((a, b) => a.time.localeCompare(b.time));

export const movePost = (posts, postId, date) => posts.map((post) => (post.id === postId ? { ...post, date } : post));
