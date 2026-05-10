// Auth Modal
function openAuth(tab) {
  document.getElementById('authOverlay').classList.add('open');
  switchTab(tab || 'login');
}
function closeAuthModal() {
  document.getElementById('authOverlay').classList.remove('open');
}
function closeAuth(e) {
  if (e.target === document.getElementById('authOverlay')) closeAuthModal();
}
function switchTab(tab) {
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
}

// Auth form submission
async function submitAuth(e, type) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const msgEl = document.getElementById(type + 'Msg');
  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = type === 'login' ? 'Logging in…' : 'Creating account…';
  try {
    const res = await fetch('/auth/' + type, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    msgEl.textContent = result.message;
    msgEl.className = 'auth-msg show ' + (result.success ? 'success' : 'error');
    if (result.success) {
      setTimeout(() => location.reload(), 700);
    }
  } catch (err) {
    msgEl.textContent = 'Network error. Please try again.';
    msgEl.className = 'auth-msg show error';
  }
  btn.disabled = false;
  btn.textContent = type === 'login' ? 'Log In' : 'Create Account';
}

// Mobile menu
function toggleMobileMenu() {
  const m = document.getElementById('mobileMenu');
  m.classList.toggle('open');
}

// Fix body parsing for auth routes (JSON body)
document.addEventListener('DOMContentLoaded', () => {
  // Auto-dismiss flash messages after 5s
  document.querySelectorAll('.flash').forEach(el => {
    setTimeout(() => el.remove(), 5000);
  });

  // Open auth modal if URL has auth error
  const params = new URLSearchParams(location.search);
  if (params.has('auth_error')) {
    openAuth('login');
    const msgEl = document.getElementById('loginMsg');
    msgEl.textContent = 'Social login failed. Please try again or use email/password.';
    msgEl.className = 'auth-msg show error';
  }
});
