document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('clickBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const body = document.body;
      body.style.background = body.style.background === 'lightyellow' ? '' : 'lightyellow';
      console.log('Button clicked');
      alert('Hello from app.js — served by Live Server!');
    });
  }
});
