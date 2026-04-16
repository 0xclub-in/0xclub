// main.js – 0xClub 3D Website

// ─── Service Worker ───
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.error('SW failed:', err));
  });
}

// ─── Three.js 3D Particle Background ───
(function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  // ── Particles ──
  const PARTICLE_COUNT = 500;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 80;
    positions[i3 + 1] = (Math.random() - 0.5) * 80;
    positions[i3 + 2] = (Math.random() - 0.5) * 40;
    velocities[i3] = (Math.random() - 0.5) * 0.004;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.004;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.003;
    sizes[i] = Math.random() * 2.5 + 0.5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color('#FFDE21') },
      uColor2: { value: new THREE.Color('#a855f7') },
      uColor3: { value: new THREE.Color('#22d3ee') },
      uScroll: { value: 0 },
    },
    vertexShader: `
      attribute float size;
      uniform float uTime;
      uniform float uScroll;
      varying float vAlpha;
      varying vec3 vPos;
      void main() {
        vPos = position;
        vec3 pos = position;
        pos.x += sin(uTime * 0.2 + position.y * 0.08) * 0.6;
        pos.y += cos(uTime * 0.15 + position.x * 0.08) * 0.6;
        pos.y -= uScroll * 15.0;
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (22.0 / -mvPos.z);
        gl_Position = projectionMatrix * mvPos;
        vAlpha = 0.3 + 0.7 * sin(uTime * 0.5 + position.z * 0.3);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform float uTime;
      varying float vAlpha;
      varying vec3 vPos;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float glow = 1.0 - smoothstep(0.0, 0.5, d);
        glow = pow(glow, 2.5);
        float m1 = sin(vPos.x * 0.04 + uTime * 0.15) * 0.5 + 0.5;
        float m2 = cos(vPos.y * 0.04 + uTime * 0.1) * 0.5 + 0.5;
        vec3 color = mix(mix(uColor1, uColor2, m1), uColor3, m2 * 0.3);
        gl_FragColor = vec4(color, glow * vAlpha * 0.3);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // ── Wireframe Shapes ──
  const shapes = [];
  const shapeDefs = [
    new THREE.IcosahedronGeometry(2.5, 1),
    new THREE.OctahedronGeometry(2, 0),
    new THREE.TorusGeometry(2, 0.35, 8, 20),
    new THREE.TetrahedronGeometry(1.8, 0),
    new THREE.DodecahedronGeometry(1.5, 0),
  ];

  const colors = [0xFFDE21, 0xa855f7, 0x22d3ee, 0xFFDE21, 0xa855f7];

  for (let i = 0; i < 8; i++) {
    const geo = shapeDefs[i % shapeDefs.length];
    const mat = new THREE.MeshBasicMaterial({
      color: colors[i % colors.length],
      wireframe: true,
      transparent: true,
      opacity: 0.04 + Math.random() * 0.03,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 70,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 30 - 10
    );
    mesh.userData = {
      rotSpeed: { 
        x: (Math.random() - 0.5) * 0.004, 
        y: (Math.random() - 0.5) * 0.004 
      },
      floatSpeed: Math.random() * 0.25 + 0.1,
      floatAmp: Math.random() * 3 + 1,
      baseY: mesh.position.y,
    };
    scene.add(mesh);
    shapes.push(mesh);
  }

  // Mouse parallax
  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // Scroll tracking
  let scrollY = 0;
  window.addEventListener('scroll', () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollY = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  }, { passive: true });

  // Animation
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    material.uniforms.uTime.value = elapsed;
    material.uniforms.uScroll.value = scrollY;

    // Parallax
    camera.position.x += (mouseX * 2.5 - camera.position.x) * 0.015;
    camera.position.y += (-mouseY * 1.5 - camera.position.y) * 0.015;
    camera.lookAt(0, 0, 0);

    // Subtle rotation
    particles.rotation.y = Math.sin(elapsed * 0.05) * 0.15;

    // Animate particle drift
    const pos = geometry.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      pos[i] += velocities[i];
    }
    geometry.attributes.position.needsUpdate = true;

    // Animate shapes
    shapes.forEach(s => {
      s.rotation.x += s.userData.rotSpeed.x;
      s.rotation.y += s.userData.rotSpeed.y;
      s.position.y = s.userData.baseY + Math.sin(elapsed * s.userData.floatSpeed) * s.userData.floatAmp;
    });

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

// ─── Scroll Reveal ───
(function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
})();

// ─── Horizontal Drag Scroll for Projects ───
(function initDragScroll() {
  const track = document.getElementById('projectsTrack');
  if (!track) return;

  let isDown = false;
  let startX;
  let scrollLeft;

  track.addEventListener('mousedown', (e) => {
    isDown = true;
    track.style.cursor = 'grabbing';
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });

  track.addEventListener('mouseleave', () => {
    isDown = false;
    track.style.cursor = 'grab';
  });

  track.addEventListener('mouseup', () => {
    isDown = false;
    track.style.cursor = 'grab';
  });

  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.5;
    track.scrollLeft = scrollLeft - walk;
  });
})();

// ─── Card 3D Tilt on Hover ───
(function initCardTilt() {
  const cards = document.querySelectorAll('.project-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const tiltX = y * -10;
      const tiltY = x * 10;
      card.style.transform = `translateY(-10px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

// ─── Smooth scroll for Explore button ───
(function initSmoothScroll() {
  const exploreBtn = document.getElementById('heroExplore');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', () => {
      const target = document.getElementById('projects');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  }
})();

// ─── Event Banner Dismiss ───
(function initBanner() {
  const banner = document.getElementById('eventBanner');
  const closeBtn = document.getElementById('bannerClose');
  if (banner && closeBtn) {
    closeBtn.addEventListener('click', () => {
      banner.classList.add('hidden');
    });
  }
})();

// ─── View All Projects Card → scroll to Coming Soon ───
(function initViewAll() {
  const viewAllCard = document.getElementById('viewAllCard');
  if (viewAllCard) {
    viewAllCard.addEventListener('click', () => {
      const target = document.getElementById('comingSoon');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  }
})();
