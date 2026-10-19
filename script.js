(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Image fallbacks keep the layout usable if the legacy site's image files are unavailable.
  function attachImageFallback(img) {
    if (!img || img.dataset.fallbackBound === 'true') return;
    img.dataset.fallbackBound = 'true';
    img.addEventListener('error', function () {
      const fallback = img.dataset.fallback;
      if (fallback && img.dataset.fallbackActive !== 'true' && !img.src.endsWith(fallback)) {
        img.dataset.fallbackActive = 'true';
        img.src = fallback;
      }
    });
    if (img.complete && img.naturalWidth === 0) {
      const fallback = img.dataset.fallback;
      if (fallback) {
        img.dataset.fallbackActive = 'true';
        img.src = fallback;
      }
    }
  }
  document.querySelectorAll('img[data-fallback]').forEach(attachImageFallback);

  // Mobile navigation.
  const menuToggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.main-navigation');
  const navDropdown = document.querySelector('.nav-dropdown');

  function closeMenu() {
    if (!menuToggle || !navigation) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Открыть меню');
    navigation.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    if (navDropdown) navDropdown.classList.remove('is-open');
  }

  if (menuToggle && navigation) {
    menuToggle.addEventListener('click', function () {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');
      navigation.classList.toggle('is-open', !isOpen);
      document.body.classList.toggle('menu-open', !isOpen);
    });

    navigation.querySelectorAll('a').forEach(function (link) {
      if (link.classList.contains('nav-dropdown__trigger')) return;
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });
  }

  if (navDropdown) {
    const trigger = navDropdown.querySelector('.nav-dropdown__trigger');
    trigger.addEventListener('click', function (event) {
      if (window.matchMedia('(max-width: 900px)').matches) {
        const isOpen = navDropdown.classList.contains('is-open');
        if (!isOpen) {
          event.preventDefault();
          navDropdown.classList.add('is-open');
        } else {
          closeMenu();
        }
      }
    });
  }

  // Hero carousel: arrows, dots and automatic advance.
  const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));
  const heroDots = Array.from(document.querySelectorAll('[data-go-to]'));
  const heroProgress = document.querySelector('.hero-bottom-line span');
  let heroIndex = 0;
  let heroTimer = null;
  const hero = document.querySelector('.hero');

  function showHeroSlide(index) {
    if (!heroSlides.length) return;
    heroIndex = (index + heroSlides.length) % heroSlides.length;
    heroSlides.forEach(function (slide, i) {
      const active = i === heroIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    heroDots.forEach(function (dot, i) {
      const active = i === heroIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-pressed', String(active));
    });
    if (heroProgress) heroProgress.style.width = ((heroIndex + 1) / heroSlides.length * 100) + '%';
  }

  function stopHeroTimer() {
    if (heroTimer) window.clearInterval(heroTimer);
    heroTimer = null;
  }
  function startHeroTimer() {
    stopHeroTimer();
    if (!reducedMotion && heroSlides.length > 1) {
      heroTimer = window.setInterval(function () { showHeroSlide(heroIndex + 1); }, 7200);
    }
  }

  document.querySelector('[data-slider-prev]')?.addEventListener('click', function () {
    showHeroSlide(heroIndex - 1);
    startHeroTimer();
  });
  document.querySelector('[data-slider-next]')?.addEventListener('click', function () {
    showHeroSlide(heroIndex + 1);
    startHeroTimer();
  });
  heroDots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      showHeroSlide(Number(dot.dataset.goTo));
      startHeroTimer();
    });
  });
  if (hero) {
    hero.addEventListener('mouseenter', stopHeroTimer);
    hero.addEventListener('mouseleave', startHeroTimer);
    hero.addEventListener('focusin', stopHeroTimer);
    hero.addEventListener('focusout', startHeroTimer);
  }
  showHeroSlide(0);
  startHeroTimer();

  // Accessible tabs used in the company and vessel sections.
  document.querySelectorAll('.tabset').forEach(function (tabset) {
    const buttons = Array.from(tabset.querySelectorAll('[data-tab]'));
    const panels = Array.from(tabset.querySelectorAll('[data-panel]'));
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        const requestedTab = button.dataset.tab;
        buttons.forEach(function (item) {
          const active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-selected', String(active));
        });
        panels.forEach(function (panel) {
          const active = panel.dataset.panel === requestedTab;
          panel.classList.toggle('is-active', active);
          panel.hidden = !active;
        });
      });
    });
  });

  // Vessel and service galleries. Original image paths are kept from the template;
  // local screenshot crops are used as fallbacks when those files cannot be reached.
  document.querySelectorAll('[data-gallery]').forEach(function (gallery) {
    let images = [];
    try {
      images = JSON.parse(gallery.dataset.gallery || '[]');
    } catch (error) {
      images = [];
    }
    const image = gallery.querySelector('.image-gallery__image');
    const counter = gallery.querySelector('.gallery-counter');
    const previous = gallery.querySelector('[data-gallery-prev]');
    const next = gallery.querySelector('[data-gallery-next]');
    let index = 0;
    if (!image || images.length === 0) return;

    image.dataset.fallback = gallery.dataset.fallback || image.dataset.fallback || '';
    attachImageFallback(image);

    function renderGalleryImage() {
      image.dataset.fallbackActive = 'false';
      image.alt = gallery.dataset.alt || image.alt;
      image.src = images[index];
      if (counter) counter.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(images.length).padStart(2, '0');
      if (images.length <= 1) {
        if (previous) previous.disabled = true;
        if (next) next.disabled = true;
      } else {
        if (previous) previous.disabled = false;
        if (next) next.disabled = false;
      }
    }

    previous?.addEventListener('click', function () {
      index = (index - 1 + images.length) % images.length;
      renderGalleryImage();
    });
    next?.addEventListener('click', function () {
      index = (index + 1) % images.length;
      renderGalleryImage();
    });
    renderGalleryImage();
  });

  // Leaflet / OpenStreetMap integration (not a static map screenshot).
  const mapElement = document.getElementById('leaflet-map');
  const mapStatus = document.getElementById('map-status');
  if (mapElement) {
    if (window.L) {
      const pier = [45.2681, 36.4359];
      const map = L.map(mapElement, {
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true
      }).setView(pier, 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
      }).addTo(map);

      const pierIcon = L.divIcon({
        className: 'kauri-map-marker',
        html: '<span></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
      L.marker(pier, { icon: pierIcon }).addTo(map)
        .bindPopup('<strong>ООО «Каури-Керчь»</strong><br>Причал № 233А<br>г. Керчь, ул. Аршинцевская коса, д. 4А')
        .openPopup();

      map.on('focus', function () { map.scrollWheelZoom.enable(); });
      map.on('blur', function () { map.scrollWheelZoom.disable(); });
      if (mapStatus) mapStatus.textContent = 'Положение причала отмечено на карте. Картографические данные предоставляются OpenStreetMap.';
      window.setTimeout(function () { map.invalidateSize(); }, 250);
    } else if (mapStatus) {
      mapStatus.textContent = 'Не удалось загрузить библиотеку карты. Проверьте подключение к интернету или откройте адрес через OpenStreetMap.';
    }
  }

  // Contact form: format the request as an email. This static landing page does not
  // transmit user information to a server or imply that an email was sent automatically.
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  if (contactForm && formStatus) {
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;

      const values = new FormData(contactForm);
      const name = String(values.get('name') || '').trim();
      const phone = String(values.get('phone') || '').trim();
      const email = String(values.get('email') || '').trim();
      const service = String(values.get('service') || 'Не указано').trim();
      const message = String(values.get('message') || '').trim();
      const subject = 'Заявка с сайта Каури-Керчь — ' + (service || 'запрос');
      const body = [
        'Имя / компания: ' + name,
        'Телефон: ' + phone,
        'E-mail: ' + (email || 'не указан'),
        'Интересующая услуга: ' + service,
        '',
        'Комментарий:',
        message || 'Не указан'
      ].join('\n');

      formStatus.classList.remove('is-error');
      formStatus.textContent = 'Заявка подготовлена. Открываем почтовую программу — подтвердите отправку письма.';
      const mailto = 'mailto:oookaurikerch15@mail.ru?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      window.location.href = mailto;
    });
  }

  // Back-to-top button and current year.
  const backToTop = document.querySelector('.back-to-top');
  function updateBackToTop() {
    if (backToTop) backToTop.classList.toggle('is-visible', window.scrollY > 650);
  }
  window.addEventListener('scroll', updateBackToTop, { passive: true });
  updateBackToTop();
  backToTop?.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });
  const year = document.getElementById('current-year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Internal links are smooth-scrolled natively; close the menu and leave keyboard focus predictable.
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      if (navigation && navigation.contains(link)) closeMenu();
    });
  });
})();
