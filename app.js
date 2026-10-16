/* ========================================================
   VAIDIK VASTRAM - 3D Visualizer, Connected Cart & Search
   ======================================================== */

// ==========================================
// 1. THREE.JS 3D ROYAL ATTIRE 360° VIEWER
// ==========================================

class RoyalAttire3DViewer {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.canvas = document.getElementById('canvas-3d');
    if (!this.canvas || !this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.modelGroup = null;
    this.floatingSparks = null;
    this.materials = {};
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.autoRotate = true;
    this.rotationSpeed = 0.008; // Smooth 360 degree continuous rotation

    // Color swatches (White & Brown luxury pairing)
    this.colorPalettes = {
      brown: {
        body: 0x3d2317, // Rich royal chocolate brown
        accent: 0xd4a340, // Gold zari
        stole: 0x6a3e27,
        gem: 0x10b981
      },
      ivory: {
        body: 0xf5eedf, // Imperial ivory silk
        accent: 0xb8860b,
        stole: 0x7a1e28,
        gem: 0x059669
      },
      saffron: {
        body: 0xbf4817, // Saffron orange
        accent: 0xfde047,
        stole: 0x852408,
        gem: 0xef4444
      },
      emerald: {
        body: 0x134e3d, // Royal deep emerald
        accent: 0xd4a340,
        stole: 0x0a2f24,
        gem: 0xf59e0b
      }
    };

    this.currentColor = 'brown';
    this.init();
  }

  init() {
    this.scene = new THREE.Scene();

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);
    this.camera.position.set(0, 0.25, 5.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.setupLighting();
    this.brocadeTexture = this.generateZariTexture();
    this.buildMannequinModel();
    this.createFloatingSparks();
    this.setupInteractions();
    this.animate();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupLighting() {
    // Studio ambient light
    const ambientLight = new THREE.AmbientLight(0xfffbf5, 1.3);
    this.scene.add(ambientLight);

    // Warm Key Light (Upper front-right)
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.4);
    keyLight.position.set(4, 6, 4.5);
    this.scene.add(keyLight);

    // Subtle Warm Fill Light (Left)
    const fillLight = new THREE.DirectionalLight(0xf2e2d0, 1.2);
    fillLight.position.set(-4, 2, 2);
    this.scene.add(fillLight);

    // Golden Rim Light (Back highlight for 3D depth)
    const rimLight = new THREE.DirectionalLight(0xd4a340, 2.5);
    rimLight.position.set(0, 4, -4);
    this.scene.add(rimLight);
  }

  generateZariTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;

    for (let x = 0; x < 512; x += 32) {
      for (let y = 0; y < 512; y += 32) {
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 11, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, y + 16);
        ctx.lineTo(x + 32, y + 16);
        ctx.moveTo(x + 16, y);
        ctx.lineTo(x + 16, y + 32);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 14, y + 14, 4, 4);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
  }

  buildMannequinModel() {
    this.modelGroup = new THREE.Group();
    const curPal = this.colorPalettes[this.currentColor];

    // Sherwani Fabric
    this.materials.body = new THREE.MeshPhysicalMaterial({
      color: curPal.body,
      bumpMap: this.brocadeTexture,
      bumpScale: 0.045,
      roughness: 0.32,
      metalness: 0.18,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2
    });

    // Metallic Zari Gold
    this.materials.gold = new THREE.MeshPhysicalMaterial({
      color: curPal.accent,
      metalness: 0.95,
      roughness: 0.2,
      clearcoat: 1.0,
      reflectivity: 1.0
    });

    // Royal Stole / Dupatta
    this.materials.stole = new THREE.MeshStandardMaterial({
      color: curPal.stole,
      roughness: 0.55,
      metalness: 0.12
    });

    // Gemstone for Brooch
    this.materials.gem = new THREE.MeshPhysicalMaterial({
      color: curPal.gem,
      transmission: 0.85,
      opacity: 1,
      transparent: true,
      roughness: 0.05
    });

    // 1. Torso
    const torsoGeo = new THREE.CylinderGeometry(0.72, 0.85, 2.2, 32, 16);
    torsoGeo.scale(1.2, 1, 0.75);
    const torso = new THREE.Mesh(torsoGeo, this.materials.body);
    this.modelGroup.add(torso);

    // 2. Mandarin Collar
    const collarGeo = new THREE.CylinderGeometry(0.44, 0.46, 0.28, 32);
    const collar = new THREE.Mesh(collarGeo, this.materials.body);
    collar.position.y = 1.2;
    this.modelGroup.add(collar);

    // Golden Collar Ring
    const collarTrimGeo = new THREE.TorusGeometry(0.47, 0.025, 16, 48);
    collarTrimGeo.rotation.x = Math.PI / 2;
    const collarTrim = new THREE.Mesh(collarTrimGeo, this.materials.gold);
    collarTrim.position.y = 1.32;
    this.modelGroup.add(collarTrim);

    // 3. Front Placket with 7 Golden Buttons
    const placketGeo = new THREE.BoxGeometry(0.1, 2.1, 0.04);
    const placket = new THREE.Mesh(placketGeo, this.materials.gold);
    placket.position.set(0, 0, 0.58);
    this.modelGroup.add(placket);

    for (let i = 0; i < 7; i++) {
      const buttonGeo = new THREE.SphereGeometry(0.04, 16, 16);
      buttonGeo.scale(1, 1, 0.4);
      const button = new THREE.Mesh(buttonGeo, this.materials.gold);
      button.position.set(0, 0.9 - i * 0.28, 0.61);
      this.modelGroup.add(button);
    }

    // 4. Shoulders
    const shoulderLGeo = new THREE.SphereGeometry(0.4, 24, 16);
    shoulderLGeo.scale(1, 0.7, 0.9);
    const shoulderL = new THREE.Mesh(shoulderLGeo, this.materials.body);
    shoulderL.position.set(-0.9, 0.9, 0);
    this.modelGroup.add(shoulderL);

    const shoulderR = new THREE.Mesh(shoulderLGeo.clone(), this.materials.body);
    shoulderR.position.set(0.9, 0.9, 0);
    this.modelGroup.add(shoulderR);

    // 5. Draped Velvet Stole
    const stoleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.95, 1.15, 0.1),
      new THREE.Vector3(-0.85, 0.7, 0.45),
      new THREE.Vector3(-0.6, 0.0, 0.62),
      new THREE.Vector3(-0.4, -0.7, 0.65),
      new THREE.Vector3(-0.4, -1.5, 0.6)
    ]);
    const stoleGeo = new THREE.TubeGeometry(stoleCurve, 32, 0.16, 12, false);
    stoleGeo.scale(1.4, 1, 0.5);
    const stole = new THREE.Mesh(stoleGeo, this.materials.stole);
    this.modelGroup.add(stole);

    // 6. Royal Brooch / Kalgi
    const broochGroup = new THREE.Group();
    const broochBaseGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 16);
    broochBaseGeo.rotation.x = Math.PI / 2;
    const broochBase = new THREE.Mesh(broochBaseGeo, this.materials.gold);
    broochGroup.add(broochBase);

    const gemGeo = new THREE.OctahedronGeometry(0.07, 1);
    const gem = new THREE.Mesh(gemGeo, this.materials.gem);
    gem.position.z = 0.03;
    broochGroup.add(gem);

    broochGroup.position.set(0.48, 0.65, 0.52);
    this.modelGroup.add(broochGroup);

    // 7. Golden Stand & Base Pedestal
    const standPoleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 16);
    const standPole = new THREE.Mesh(standPoleGeo, this.materials.gold);
    standPole.position.y = -1.6;
    this.modelGroup.add(standPole);

    const standBaseGeo = new THREE.CylinderGeometry(0.9, 0.95, 0.12, 36);
    const standBase = new THREE.Mesh(standBaseGeo, this.materials.gold);
    standBase.position.y = -2.2;
    this.modelGroup.add(standBase);

    // Floor Shadow Disc (Grounded look)
    const shadowGeo = new THREE.CircleGeometry(1.2, 32);
    shadowGeo.rotation.x = -Math.PI / 2;
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x3d2317,
      transparent: true,
      opacity: 0.15
    });
    const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
    shadowDisc.position.y = -2.26;
    this.modelGroup.add(shadowDisc);

    this.modelGroup.position.y = 0.2;
    this.scene.add(this.modelGroup);
  }

  createFloatingSparks() {
    const count = 140;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 1.3 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4.2;
      positions[i * 3 + 2] = Math.sin(theta) * r;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pMaterial = new THREE.PointsMaterial({
      color: 0xd4a340,
      size: 0.065,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.floatingSparks = new THREE.Points(geometry, pMaterial);
    this.scene.add(this.floatingSparks);
  }

  setupInteractions() {
    const onPointerDown = (e) => {
      this.isDragging = true;
      this.autoRotate = false;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerMove = (e) => {
      if (!this.isDragging || !this.modelGroup) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - this.previousMousePosition.x;
      const deltaY = clientY - this.previousMousePosition.y;

      this.modelGroup.rotation.y += deltaX * 0.009;
      this.modelGroup.rotation.x = Math.max(-0.25, Math.min(0.25, this.modelGroup.rotation.x + deltaY * 0.004));

      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      this.isDragging = false;
      setTimeout(() => {
        if (!this.isDragging) this.autoRotate = true;
      }, 2000);
    };

    this.canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    this.canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp, { passive: true });

    // Swatches
    const swatchBtns = document.querySelectorAll('.swatch-btn');
    swatchBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const color = btn.getAttribute('data-color');
        if (color && this.colorPalettes[color]) {
          this.switchColor(color);
          swatchBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });
  }

  switchColor(colorKey) {
    this.currentColor = colorKey;
    const pal = this.colorPalettes[colorKey];
    if (!pal) return;

    if (this.materials.body) this.materials.body.color.setHex(pal.body);
    if (this.materials.gold) this.materials.gold.color.setHex(pal.accent);
    if (this.materials.stole) this.materials.stole.color.setHex(pal.stole);
    if (this.materials.gem) this.materials.gem.color.setHex(pal.gem);

    gsap.fromTo(
      this.modelGroup.scale,
      { x: 0.96, y: 0.96, z: 0.96 },
      { x: 1, y: 1, z: 1, duration: 0.35, ease: 'back.out(1.4)' }
    );
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Continuous 360-degree rotation effect
    if (this.autoRotate && this.modelGroup) {
      this.modelGroup.rotation.y += this.rotationSpeed;
    }

    if (this.floatingSparks) {
      this.floatingSparks.rotation.y += 0.001;
      const positions = this.floatingSparks.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.003;
        if (positions[i] > 2.2) positions[i] = -2.2;
      }
      this.floatingSparks.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// ==========================================
// 2. CONNECTED "MY BAG" & SELLING ENGINE
// ==========================================

class ConnectedStoreManager {
  constructor() {
    window.storeApp = this;
    this.cart = [];
    this.selectedSizes = {};

    this.init();
  }

  init() {
    this.bindCartDrawer();
    this.bindProductActions();
    this.bindSearchAndFilters();
    this.bindBookTrialButtons();
    this.updateCartBadge();
  }

  openCart() {
    const overlay = document.getElementById('cart-drawer-overlay');
    if (overlay) {
      overlay.classList.add('active');
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'auto';
      const panel = overlay.querySelector('.cart-sliding-panel');
      if (panel) {
        panel.style.transform = 'translateX(0)';
      }
    }
    this.renderCart();
  }

  closeCart() {
    const overlay = document.getElementById('cart-drawer-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.style.opacity = '';
      overlay.style.pointerEvents = '';
      const panel = overlay.querySelector('.cart-sliding-panel');
      if (panel) {
        panel.style.transform = '';
      }
    }
  }

  bindCartDrawer() {
    const toggleBtn = document.getElementById('cart-toggle-btn');
    const overlay = document.getElementById('cart-drawer-overlay');
    const closeBtn = document.getElementById('close-cart-btn');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openCart();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeCart();
      });
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeCart();
        }
      });
    }

    const checkoutBtn = document.getElementById('cart-whatsapp-checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => this.checkoutWhatsApp());
    }
  }

  handleAddToCart(btn) {
    if (!btn) return;
    const card = btn.closest('.product-white-card') || btn.closest('[data-id]');
    if (!card) return;

    const id = card.getAttribute('data-id') || 'item_' + Date.now();
    const title = card.getAttribute('data-title') || card.querySelector('.product-card-title')?.textContent?.trim() || 'Royal Outfit';
    const price = parseInt(card.getAttribute('data-price') || '0', 10);
    const img = card.getAttribute('data-img') || card.querySelector('img')?.src || '';
    const size = this.selectedSizes[id] || 'L';

    this.addToCart({ id, title, price, img, size });
    this.openCart();
  }

  bindProductActions() {
    // Size selection pills
    document.addEventListener('click', (e) => {
      const pill = e.target.closest('.size-pill-item');
      if (pill) {
        const card = pill.closest('.product-white-card');
        const id = card ? card.getAttribute('data-id') : null;
        if (card && id) {
          card.querySelectorAll('.size-pill-item').forEach((p) => p.classList.remove('active'));
          pill.classList.add('active');
          this.selectedSizes[id] = pill.getAttribute('data-size') || pill.textContent.trim();
        }
      }
    });

    // Add to Cart -> Automatically open My Bag section
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-add-to-cart]');
      if (addBtn) {
        e.preventDefault();
        this.handleAddToCart(addBtn);
      }
    });

    // Direct Buy Now via WhatsApp
    document.addEventListener('click', (e) => {
      const buyBtn = e.target.closest('[data-buy-now]');
      if (buyBtn) {
        e.preventDefault();
        const card = buyBtn.closest('.product-white-card');
        if (!card) return;

        const id = card.getAttribute('data-id');
        const title = card.getAttribute('data-title');
        const price = parseInt(card.getAttribute('data-price'), 10);
        const size = this.selectedSizes[id] || 'L';

        const msg = `*Namaste Vaidik Vastram (Morbi)* 🙏%0A%0AI want to order this outfit directly from your website:%0A%0A🛍️ *Item:* ${title}%0A📏 *Size:* ${size}%0A💰 *Price:* ₹${price.toLocaleString('en-IN')}%0A📍 *Pickup/Fitting:* 205 Siddhivinayak Circle, Ravapar Rd, Morbi%0A%0A_Please confirm availability and booking!_`;

        window.open(`https://wa.me/919925278018?text=${msg}`, '_blank');
      }
    });
  }

  addToCart(item) {
    const existingIndex = this.cart.findIndex((c) => c.id === item.id && c.size === item.size);
    if (existingIndex > -1) {
      this.cart[existingIndex].qty += 1;
    } else {
      this.cart.push({ ...item, qty: 1 });
    }
    this.updateCartBadge();
  }

  updateCartBadge() {
    const badge = document.getElementById('cart-item-count');
    const totalCount = this.cart.reduce((sum, item) => sum + item.qty, 0);
    if (badge) {
      badge.textContent = totalCount;
      try {
        if (typeof gsap !== 'undefined' && gsap.fromTo) {
          gsap.fromTo(badge, { scale: 1.35 }, { scale: 1, duration: 0.25 });
        }
      } catch (e) {}
    }
  }

  renderCart() {
    const container = document.getElementById('cart-items-container');
    const grandTotalEl = document.getElementById('cart-grand-total');

    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding: 60px 20px; color: var(--text-muted);">
          <div style="font-size: 3.2rem; margin-bottom: 12px; opacity:0.6;">🛍️</div>
          <h4 style="color:var(--brown-deep); margin-bottom: 6px; font-weight:700;">Your Bag is Empty</h4>
          <p style="font-size: 0.86rem;">Select an outfit from our collection to add to your bag!</p>
        </div>
      `;
      if (grandTotalEl) grandTotalEl.textContent = '₹0';
      return;
    }

    let subtotal = 0;
    container.innerHTML = this.cart
      .map((item, index) => {
        const lineTotal = item.price * item.qty;
        subtotal += lineTotal;
        return `
          <div class="cart-single-item">
            <img src="${item.img}" alt="${item.title}" class="cart-item-thumbnail">
            <div class="cart-item-body">
              <div class="cart-item-name">${item.title}</div>
              <div class="cart-item-meta">Size: <strong>${item.size}</strong> • ₹${item.price.toLocaleString('en-IN')}</div>
              <div class="cart-item-controls">
                <div class="qty-pill-group">
                  <button class="qty-step-btn" onclick="window.storeApp.changeQty(${index}, -1)">−</button>
                  <span style="font-size:0.86rem; font-weight:700;">${item.qty}</span>
                  <button class="qty-step-btn" onclick="window.storeApp.changeQty(${index}, 1)">+</button>
                </div>
                <button style="background:none; border:none; color:#dc2626; font-size:0.8rem; font-weight:700; cursor:pointer;" onclick="window.storeApp.removeItem(${index})">
                  Remove
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    if (grandTotalEl) grandTotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  }

  changeQty(index, delta) {
    if (!this.cart[index]) return;
    this.cart[index].qty += delta;
    if (this.cart[index].qty <= 0) {
      this.cart.splice(index, 1);
    }
    this.updateCartBadge();
    this.renderCart();
  }

  removeItem(index) {
    if (this.cart[index]) {
      this.cart.splice(index, 1);
      this.updateCartBadge();
      this.renderCart();
    }
  }

  showToastNotification(text) {
    let toast = document.getElementById('cart-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cart-toast';
      toast.className = 'cart-toast';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <span>✓ ${text}</span>
      <button class="cart-toast-btn" onclick="document.getElementById('cart-drawer-overlay').classList.add('active'); window.storeApp.renderCart();">View Bag</button>
    `;

    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, 3200);
  }

  checkoutWhatsApp() {
    if (this.cart.length === 0) {
      alert('Your bag is empty. Please add items to checkout!');
      return;
    }

    let itemsText = '';
    let total = 0;

    this.cart.forEach((item, i) => {
      const line = item.price * item.qty;
      total += line;
      itemsText += `%0A${i + 1}. *${item.title}* (Size: ${item.size}) x ${item.qty} = ₹${line.toLocaleString('en-IN')}`;
    });

    const msg = `*New Order - Vaidik Vastram Website* 🛍️%0A----------------------------------${itemsText}%0A----------------------------------%0A💰 *Grand Total:* ₹${total.toLocaleString('en-IN')}%0A📍 *Showroom:* 205 Siddhivinayak Circle, Ravapar Rd, Morbi%0A%0A_Please confirm my order and share trial / payment details!_`;

    window.open(`https://wa.me/919925278018?text=${msg}`, '_blank');
  }

  // ==========================================
  // 3. WORKING SEARCH BAR & CATEGORY FILTERS
  // ==========================================

  bindSearchAndFilters() {
    const searchInput = document.getElementById('product-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    const chips = document.querySelectorAll('.chip-filter-btn');
    const cards = document.querySelectorAll('.product-white-card');
    const statusBar = document.getElementById('search-status-bar');

    const filterProducts = () => {
      const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
      const activeChip = document.querySelector('.chip-filter-btn.active');
      const selectedCategory = activeChip ? activeChip.getAttribute('data-cat') : 'all';

      // Toggle clear button
      if (clearBtn) {
        clearBtn.style.display = query.length > 0 ? 'block' : 'none';
      }

      let visibleCount = 0;

      cards.forEach((card) => {
        const title = (card.getAttribute('data-title') || '').toLowerCase();
        const cat = card.getAttribute('data-category') || '';
        const desc = (card.querySelector('.product-card-desc')?.textContent || '').toLowerCase();

        const matchesQuery = !query || title.includes(query) || cat.includes(query) || desc.includes(query);
        const matchesCategory = selectedCategory === 'all' || cat === selectedCategory;

        if (matchesQuery && matchesCategory) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      // Update status message
      if (statusBar) {
        if (query) {
          statusBar.textContent = visibleCount > 0 
            ? `Showing ${visibleCount} outfit${visibleCount > 1 ? 's' : ''} matching "${query}"` 
            : `No outfits found matching "${query}". Try searching "sherwani", "kurta", or "bandhgala".`;
        } else if (selectedCategory !== 'all') {
          statusBar.textContent = `Showing ${visibleCount} outfit${visibleCount > 1 ? 's' : ''} in ${activeChip.textContent}`;
        } else {
          statusBar.textContent = `Showing all ${visibleCount} handpicked outfits`;
        }
      }
    };

    if (searchInput) {
      searchInput.addEventListener('input', filterProducts);
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        filterProducts();
      });
    }

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        filterProducts();
      });
    });

    // Initial run
    filterProducts();
  }

  // ==========================================
  // 4. BOOK TRIAL & CONNECT TO ABOUT US
  // ==========================================

  bindBookTrialButtons() {
    const modal = document.getElementById('booking-modal');
    const openModalBtns = document.querySelectorAll('[data-open-modal]');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const form = document.getElementById('trial-booking-form');

    // Smooth open modal or scroll to trial section
    openModalBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        // If button has data-scroll-to, smoothly scroll to it
        const scrollTarget = btn.getAttribute('data-scroll-to');
        if (scrollTarget) {
          const el = document.querySelector(scrollTarget);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
        }

        // Otherwise open modal
        if (modal) modal.classList.add('active');
      });
    });

    if (closeModalBtn && modal) {
      closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('client-name').value;
        const phone = document.getElementById('client-phone').value;
        const outfit = document.getElementById('outfit-type').value;

        const message = `*Vaidik Vastram Trial Room Appointment* 🤵%0A%0A👤 *Client Name:* ${name}%0A📱 *Phone:* ${phone}%0A👔 *Outfit Interest:* ${outfit}%0A📍 *Location:* 205 Siddhivinayak Circle, Ravapar Rd, Morbi%0A%0A_Please schedule my private trial fitting session!_`;

        window.open(`https://wa.me/919925278018?text=${message}`, '_blank');
        modal.classList.remove('active');
      });
    }
  }
}

// Global safe initialization
function startApp() {
  try {
    if (!window.storeApp) {
      window.storeApp = new ConnectedStoreManager();
    }
  } catch (e) {
    console.error("Store error:", e);
  }

  try {
    if (typeof THREE !== 'undefined' && document.getElementById('canvas-3d')) {
      window.viewer3D = new RoyalAttire3DViewer();
    }
  } catch (e) {
    console.error("3D error:", e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
