/* ===========================
   UTILITY / UX HELPERS
   =========================== */

/**
 * showToast(msg, type) - small temporary messages at top of form or page.
 * type: "info" | "success" | "error"
 */
function showToast(container, msg, type = 'info') {
  const t = document.createElement('div');
  t.className = toast ;toast-${type};
  t.setAttribute('role', 'status');
  t.textContent = msg;
  container.prepend(t);
  // auto remove after 4s
  setTimeout(() => t.classList.add('visible'), 10);
  setTimeout(() => t.classList.remove('visible'), 3600);
  setTimeout(() => t.remove(), 4200);
}


// Google Map: Updated to 2617 H2 Botshabelo Free State
function initMap() {

    // Create a new map centered on Botshabelo area
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 16,
        center: { lat: -29.233, lng: 26.706 }, // General Botshabelo center
    });

    // Use Google Places to find exact address
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode(
        { address: "2617 H2, Botshabelo, Free State, South Africa" },
        function (results, status) {
            if (status === "OK") {
                map.setCenter(results[0].geometry.location);

                // Add marker on exact location
                new google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location,
                    title: "CYM Botshabelo Offices"
                });

            } else {
                console.error("Geocode failed due to: " + status);
            }
        }
    );
}


/* ===========================
   GALLERY LIGHTBOX
   - Requirements satisfied: keyboard nav, prev/next, accessible labels,
     image filenames and alt text used, caption support, touch swipe (basic)
   =========================== */

(function initLightbox() {
  // Create and insert modal elements once
  const body = document.body;
  const lb = document.createElement('div');
  lb.id = 'lightbox-modal';
  lb.innerHTML = `
    <button id="lb-close" class="lb-btn" aria-label="Close (Esc)">&times;</button>
    <button id="lb-prev" class="lb-btn" aria-label="Previous (Left arrow)">&#10094;</button>
    <button id="lb-next" class="lb-btn" aria-label="Next (Right arrow)">&#10095;</button>
    <div class="lb-inner" role="dialog" aria-modal="true" aria-label="Image viewer">
      <img id="lb-image" alt="">
      <div id="lb-caption" class="lb-caption"></div>
    </div>
  `;
  body.appendChild(lb);

  const modal = document.getElementById('lightbox-modal');
  const imgEl = document.getElementById('lb-image');
  const captionEl = document.getElementById('lb-caption');

  let galleryImages = []; // array of {src, alt, filename, caption}
  let currentIndex = 0;

  // Find all images with data-lightbox="gallery" attribute
  function collectGallery() {
    const nodes = document.querySelectorAll('img[data-lightbox="gallery"]');
    galleryImages = Array.from(nodes).map((img) => ({
      src: img.src || img.dataset.src,
      alt: img.alt || '',
      filename: img.dataset.filename || '',
      caption: img.dataset.caption || ''
    }));
  }

  // Open modal at index
  function openAt(i) {
    if (i < 0) i = galleryImages.length - 1;
    if (i >= galleryImages.length) i = 0;
    currentIndex = i;
    const item = galleryImages[currentIndex];
    imgEl.src = item.src;
    imgEl.alt = item.alt || item.filename || 'Gallery image';
    captionEl.textContent = item.caption || item.filename || '';
    modal.classList.add('open');
    // focus trap: move focus to close button
    document.getElementById('lb-close').focus();
  }

  // Close modal
  function closeModal() {
    modal.classList.remove('open');
    imgEl.src = '';
    captionEl.textContent = '';
  }

  // Prev / Next handlers
  function prev() { openAt(currentIndex - 1); }
  function next() { openAt(currentIndex + 1); }

  // Keyboard handlers
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });

  // Button listeners
  document.addEventListener('click', (e) => {
    if (e.target.matches('img[data-lightbox="gallery"]')) {
      // Recollect in case images changed
      collectGallery();
      const clicked = Array.from(document.querySelectorAll('img[data-lightbox="gallery"]')).indexOf(e.target);
      openAt(clicked);
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(); // click backdrop closes
  });

  document.getElementById('lb-close').addEventListener('click', closeModal);
  document.getElementById('lb-prev').addEventListener('click', prev);
  document.getElementById('lb-next').addEventListener('click', next);

  // Simple touch swipe detection for mobile lightbox
  let startX = 0;
  let endX = 0;
  imgEl.addEventListener('touchstart', (e) => startX = e.touches[0].clientX);
  imgEl.addEventListener('touchmove', (e) => endX = e.touches[0].clientX);
  imgEl.addEventListener('touchend', () => {
    const delta = endX - startX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) prev(); else next();
    }
  });
})();

/* ===========================
   LIVE SEARCH (Resources)
   - client-side filtering of resource items (supports title, tags, description)
   - highlights matched text
   =========================== */

(function initLiveSearch() {
  const searchInput = document.getElementById('resource-search');
  if (!searchInput) return;

  const list = document.getElementById('resource-list'); // container for li items
  if (!list) return;

  const items = Array.from(list.querySelectorAll('.resource-item'));

  function highlight(text, node) {
    // basic highlight function; removes old highlights then wraps matches
    
    node.innerHTML = node.textContent.replace(re, '<mark>$1</mark>');
  }
  function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function filter(q) {
    const val = q.trim().toLowerCase();
    let visibleCount = 0;
    items.forEach(item => {
      // reset
      item.querySelectorAll('mark').forEach(m=> m.replaceWith(document.createTextNode(m.textContent)));
      const searchable = (item.dataset.title + ' ' + item.dataset.tags + ' ' + item.dataset.desc).toLowerCase();
      if (!val || searchable.includes(val)) {
        item.style.display = '';
        visibleCount++;
        if (val) {
          // highlight title and description
          const titleNode = item.querySelector('.resource-title');
          const descNode = item.querySelector('.resource-desc');
          if (titleNode) highlight(val, titleNode);
          if (descNode) highlight(val, descNode);
        }
      } else {
        item.style.display = 'none';
      }
    });
    const resultCount = document.getElementById('resource-count');
    if (resultCount) resultCount.textContent = visibleCount + ' result' + (visibleCount !== 1 ? 's' : '');
  }

  searchInput.addEventListener('input', (e) => filter(e.target.value));
})();

/* ===========================
   CONTACT FORM: Validation + Submission logic
   - Works with EmailJS (client-side) OR Formspree (server)
   - Accessible inline error messages, focus, and success handling
   =========================== */

(function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  // Create accessible aria-live region for messages
  let live = document.createElement('div');
  live.className = 'sr-live';
  live.setAttribute('aria-live', 'polite');
  form.prepend(live);

  // Utility: show validation summary
  function showErrors(errors) {
    // remove old list
    const existing = form.querySelector('.error-summary');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.className = 'error-summary';
    container.setAttribute('role', 'alert');
    container.innerHTML = `<strong>Please fix the following:</strong><ul>${errors.map(e => <li>${e.msg}</li>).join('')}</ul>`;
    form.prepend(container);
    // focus the first invalid input
    if (errors[0] && errors[0].el) errors[0].el.focus();
  }

  function clearErrors() {
    const ex = form.querySelector('.error-summary');
    if (ex) ex.remove();
    live.textContent = '';
  }

  // Basic validators
  const validators = {
    name: (v) => v.trim().length >= 2 || 'Name must be at least 2 characters.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Please enter a valid email address.',
    subject: (v) => v.trim().length >= 3 || 'Subject must be at least 3 characters.',
    message: (v) => v.trim().length >= 10 || 'Message must be at least 10 characters.'
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const errors = [];

    // gather fields
    const fm = new FormData(form);
    const values = {};
    for (const [k,v] of fm.entries()) values[k] = v;

    // validate
    for (const key of Object.keys(validators)) {
      const result = validators[key](values[key] || '');
      if (result !== true) errors.push({key, msg: result, el: form.querySelector([name="${key}"])});
    }

    if (errors.length) {
      showErrors(errors);
      return;
    }

    // show loading
    showToast(form, 'Sending message...', 'info');

    /* ---- CHOOSE ONE DELIVERY METHOD ----
       A) EmailJS (client-side) - recommended quick setup
       B) Formspree (POST) - simple serverless POST
       C) PHP backend - example below if you host PHP
    */

    // A) EmailJS example (client-side): requires you to include EmailJS SDK in HTML:
    // <script src="https://cdn.emailjs.com/sdk/3.2/email.min.js"></script>
    // emailjs.init("YOUR_EMAILJS_USER_ID");
    // serviceID and templateID below must be set by you.

    const useEmailJS = !!(window.emailjs && form.dataset.emailjsService);
    if (useEmailJS) {
      try {
        const templateParams = Object.fromEntries(new FormData(form).entries());
        const serviceID = form.dataset.emailjsService;
        const templateID = form.dataset.emailjsTemplate;
        const resp = await window.emailjs.send(serviceID, templateID, templateParams);
        showToast(form, 'Message sent via EmailJS — thank you!', 'success');
        form.reset();
        return;
      } catch(err) {
        console.error('EmailJS error', err);
        showToast(form, 'EmailJS sending failed — fallback to Formspree if configured', 'error');
      }
    }

    // B) Formspree/POST fallback (form.action should point to your Formspree endpoint)
    const action = form.action || '';
    if (action && action.includes('formspree.io')) {
      try {
        const response = await fetch(action, { method: 'POST', body: new FormData(form), headers: {'Accept': 'application/json'} });
        if (response.ok) {
          showToast(form, 'Message sent successfully. Thank you!', 'success');
          form.reset();
        } else {
          const data = await response.json().catch(()=>null);
          console.error('Formspree error', data);
          showToast(form, 'Sending failed. Try again later.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast(form, 'Network error while sending form.', 'error');
      }
      return;
    }

    // C) If no service provided, show instructions
    showToast(form, 'Form not connected to a delivery service. Set up EmailJS or Formspree.', 'error');
  });

})();
