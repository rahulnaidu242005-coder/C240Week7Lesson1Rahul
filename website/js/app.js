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

  // Form handling: show submitted messages in the #output placeholder
  const form = document.getElementById('messageForm');
  const input = document.getElementById('messageInput');
  const output = document.getElementById('output');

  if (form && input && output) {
    form.addEventListener('submit', (evt) => {
      evt.preventDefault();
      const val = input.value.trim();
      if (!val) return;

      // Remove the 'No messages yet.' muted placeholder on first message
      const muted = output.querySelector('.muted');
      if (muted) muted.remove();

      const p = document.createElement('p');
      p.className = 'msg';
      const time = new Date().toLocaleTimeString();
      p.textContent = `${time} — ${val}`;
      output.appendChild(p);

      // Reset input and keep focus
      input.value = '';
      input.focus();
    });
  }
});
