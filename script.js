//hamburger
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
const closeBtn = document.getElementById("closeBtn");

hamburger.addEventListener("click", () => {
  navLinks.classList.add("active");
});

closeBtn.addEventListener("click", () => {
  navLinks.classList.remove("active");
});

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("active");
  });
});

const cursor = document.getElementById('cursor');
    const ring = document.getElementById('cursorRing');
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx - 3 + 'px';
      cursor.style.top = my - 3 + 'px';
    });
    function animateRing() {
      rx += (mx - rx - 18) * 0.1;
      ry += (my - ry - 18) * 0.1;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(animateRing);
    }
    animateRing();
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => { cursor.style.transform = 'scale(3)'; cursor.style.opacity = '0.5'; ring.style.transform = 'scale(1.5)'; ring.style.opacity = '0.15'; });
      el.addEventListener('mouseleave', () => { cursor.style.transform = 'scale(1)'; cursor.style.opacity = '1'; ring.style.transform = 'scale(1)'; ring.style.opacity = '0.3'; });
    });

    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    reveals.forEach(r => observer.observe(r));