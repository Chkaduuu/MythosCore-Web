function isAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash('error', 'Please log in to access this page.');
  res.redirect('/');
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') return next();
  res.status(403).render('error', { title: 'Access Denied', message: 'You do not have permission to access this page.', user: req.user });
}

function isModerator(req, res, next) {
  if (req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'moderator')) return next();
  res.status(403).render('error', { title: 'Access Denied', message: 'Moderator access required.', user: req.user });
}

module.exports = { isAuth, isAdmin, isModerator };
