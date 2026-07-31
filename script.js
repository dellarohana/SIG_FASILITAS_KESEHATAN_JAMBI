/* =========================================================
   PERSEBARAN FASILITAS KESEHATAN KOTA JAMBI — SCRIPT.JS
   Data source: window FACILITIES (facilities.js)

   CATATAN PERBAIKAN:
   Setiap bagian (peta, chart, tabel, galeri, fakta) sekarang
   dibungkus try/catch dan dijalankan lewat runSection().
   Tujuannya: kalau satu bagian gagal (mis. Leaflet/Chart.js
   gagal dimuat dari CDN karena koneksi bermasalah), bagian
   LAIN tetap tampil normal — tidak ikut kosong semua.
   GALERI sengaja dirender paling awal supaya selalu tampil
   walau peta/chart bermasalah.
   ========================================================= */

(function () {
  "use strict";

  function runSection(name, fn) {
    try {
      fn();
    } catch (err) {
      console.error(`[SIG Jambi] Bagian "${name}" gagal dijalankan:`, err);
    }
  }

  /* ---------------------------------------------------------
     0. HELPERS
  --------------------------------------------------------- */
  const JENIS_KEY = {
    "Rumah Sakit": "rs",
    "Puskesmas": "pkm",
    "Klinik": "klinik",
    "Apotek": "apotek"
  };
  const JENIS_ICON = {
    "Rumah Sakit": "fa-solid fa-hospital",
    "Puskesmas": "fa-solid fa-house-medical",
    "Klinik": "fa-solid fa-stethoscope",
    "Apotek": "fa-solid fa-prescription-bottle-medical"
  };

  const DATA = window.FACILITIES || [];

  // Dipakai lewat onerror pada <img> galeri & popup, supaya kalau file gambar
  // di folder images/ hilang/salah nama, kartu tidak menampilkan ikon gambar rusak/kosong.
  const FALLBACK_PHOTO = {
    "Rumah Sakit": "https://images.unsplash.com/photo-1587351021355-a479a299d2f9?auto=format&fit=crop&w=600&q=80",
    "Puskesmas": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
    "Klinik": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80",
    "Apotek": "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=600&q=80",
    "default": "https://images.unsplash.com/photo-1587351021355-a479a299d2f9?auto=format&fit=crop&w=600&q=80"
  };

  /* ---------------------------------------------------------
     1. LOADER
  --------------------------------------------------------- */
  runSection("Loader", () => {
    window.addEventListener("load", () => {
      const loader = document.getElementById("loader");
      if (loader) setTimeout(() => loader.classList.add("hidden"), 500);
    });
  });

  /* ---------------------------------------------------------
     2. GALERI  (dipindah ke awal & dibuat independen —
        selalu dirender walau bagian lain di bawah gagal)
  --------------------------------------------------------- */
  runSection("Galeri", () => {
    const galleryGrid = document.getElementById("galleryGrid");
    if (!galleryGrid) return;
    const galleryPicks = DATA;
    galleryGrid.innerHTML = galleryPicks.map((f) => `
      <div class="gallery-item">
        <img src="${f.foto}" alt="${f.nama}" loading="lazy"
             onerror="this.onerror=null;this.src='${FALLBACK_PHOTO[f.jenis] || FALLBACK_PHOTO.default}';">
        <div class="gallery-caption">
          <span>${f.jenis}</span>
          <h4>${f.nama}</h4>
        </div>
      </div>
    `).join("");
  });

  /* ---------------------------------------------------------
     3. NAVBAR — scroll state, mobile toggle, active link
  --------------------------------------------------------- */
  runSection("Navbar", () => {
    const navbar = document.getElementById("navbar");
    const navToggle = document.getElementById("navToggle");
    const navLinks = document.getElementById("navLinks");
    if (!navbar || !navToggle || !navLinks) return;

    function handleNavbarScroll() {
      if (window.scrollY > 40) navbar.classList.add("scrolled");
      else navbar.classList.remove("scrolled");
    }
    window.addEventListener("scroll", handleNavbarScroll);
    handleNavbarScroll();

    navToggle.addEventListener("click", () => {
      navToggle.classList.toggle("open");
      navLinks.classList.toggle("open");
    });
    navLinks.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        navToggle.classList.remove("open");
        navLinks.classList.remove("open");
      });
    });

    const sections = document.querySelectorAll("section[id]");
    const navLinkEls = document.querySelectorAll(".nav-link");
    if (window.IntersectionObserver) {
      const sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.getAttribute("id");
              navLinkEls.forEach((l) => {
                l.classList.toggle("active", l.getAttribute("href") === "#" + id);
              });
            }
          });
        },
        { rootMargin: "-45% 0px -50% 0px" }
      );
      sections.forEach((s) => sectionObserver.observe(s));
    }
  });

  /* ---------------------------------------------------------
     4. SCROLL REVEAL ANIMATION
  --------------------------------------------------------- */
  let aosObserver = null;
  runSection("Scroll Reveal", () => {
    if (!window.IntersectionObserver) return;
    const aosEls = document.querySelectorAll("[data-aos]");
    aosObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = entry.target.getAttribute("data-aos-delay") || 0;
            setTimeout(() => entry.target.classList.add("aos-in"), Number(delay));
            aosObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    aosEls.forEach((el) => aosObserver.observe(el));
  });

  /* ---------------------------------------------------------
     5. BACK TO TOP
  --------------------------------------------------------- */
  runSection("Back to Top", () => {
    const backToTop = document.getElementById("backToTop");
    if (!backToTop) return;
    window.addEventListener("scroll", () => {
      backToTop.classList.toggle("show", window.scrollY > 500);
    });
  });

  /* ---------------------------------------------------------
     6. COUNTER ANIMATION (stat cards)
  --------------------------------------------------------- */
  runSection("Counter Animation", () => {
    const counters = document.querySelectorAll(".stat-value[data-count]");
    if (!counters.length || !window.IntersectionObserver) return;

    function animateCounter(el) {
      const target = Number(el.getAttribute("data-count"));
      const duration = 1200;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      }
      requestAnimationFrame(tick);
    }

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => counterObserver.observe(c));
  });

  /* ---------------------------------------------------------
     7. LEAFLET MAP  (butuh library L dari CDN — dibungkus
        try/catch supaya kalau CDN gagal, bagian lain tetap jalan)
  --------------------------------------------------------- */
  runSection("Peta Leaflet", () => {
    if (typeof L === "undefined") {
      console.warn("[SIG Jambi] Leaflet (L) tidak tersedia — peta dilewati.");
      return;
    }

    const KOTA_JAMBI_CENTER = [-1.6101, 103.6131];
    const map = L.map("map", {
      center: KOTA_JAMBI_CENTER,
      zoom: 12,
      zoomControl: true,
      fullscreenControl: true,
      fullscreenControlOptions: { position: "topright" }
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    function buildPin(jenis) {
      const key = JENIS_KEY[jenis];
      const icon = JENIS_ICON[jenis];
      return L.divIcon({
        className: "",
        html: `<div class="marker-pin ${key}"><i class="${icon}"></i></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 32],
        popupAnchor: [0, -30]
      });
    }

    function buildPopup(f) {
      const key = JENIS_KEY[f.jenis];
      return `
        <div class="popup-card">
          <img class="popup-photo" src="${f.foto}" alt="${f.nama}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_PHOTO[f.jenis] || FALLBACK_PHOTO.default}';">
          <div class="popup-body">
            <span class="popup-type ${key}">${f.jenis}</span>
            <div class="popup-title">${f.nama}</div>
            <div class="popup-row"><i class="fa-solid fa-location-dot"></i><span>${f.alamat}</span></div>
            <div class="popup-row"><i class="fa-solid fa-map-pin"></i><span>Kecamatan ${f.kecamatan}</span></div>
            <div class="popup-row"><i class="fa-regular fa-clock"></i><span>${f.jam}</span></div>
            <div class="popup-row"><i class="fa-solid fa-phone"></i><span>${f.telp || "-"}</span></div>
            <div class="popup-actions">
              <a href="${f.gmaps}" target="_blank" rel="noopener"><i class="fa-solid fa-diamond-turn-right"></i> Buka di Google Maps</a>
            </div>
          </div>
        </div>`;
    }

    const markerLayer = L.layerGroup().addTo(map);
    const markers = [];

    DATA.forEach((f) => {
      const marker = L.marker([f.lat, f.lng], { icon: buildPin(f.jenis) });
      marker.bindPopup(buildPopup(f), { maxWidth: 300 });
      marker.facilityData = f;
      markers.push(marker);
      markerLayer.addLayer(marker);
    });

    // ---- Search control (custom, built into toolbar) ----
    const mapSearchInput = document.getElementById("mapSearch");
    let activeFilter = "all";

    function renderMarkers() {
      markerLayer.clearLayers();
      const query = (mapSearchInput ? mapSearchInput.value : "").trim().toLowerCase();
      markers.forEach((m) => {
        const f = m.facilityData;
        const matchesFilter = activeFilter === "all" || f.jenis === activeFilter;
        const matchesQuery =
          !query ||
          f.nama.toLowerCase().includes(query) ||
          f.alamat.toLowerCase().includes(query) ||
          f.kecamatan.toLowerCase().includes(query);
        if (matchesFilter && matchesQuery) markerLayer.addLayer(m);
      });
    }

    if (mapSearchInput) mapSearchInput.addEventListener("input", renderMarkers);

    // ---- Filter chips ----
    const filterChips = document.querySelectorAll(".filter-chip");
    filterChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        filterChips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        activeFilter = chip.getAttribute("data-filter");
        renderMarkers();
      });
    });

    // ---- Locate user ----
    const locateBtn = document.getElementById("locateBtn");
    let userMarker = null;
    if (locateBtn) {
      locateBtn.addEventListener("click", () => {
        if (!navigator.geolocation) {
          alert("Geolocation tidak didukung oleh browser Anda.");
          return;
        }
        locateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mencari...';
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            if (userMarker) map.removeLayer(userMarker);
            userMarker = L.marker([latitude, longitude], {
              icon: L.divIcon({ className: "", html: '<div class="user-location-dot"></div>', iconSize: [18, 18] })
            }).addTo(map);
            userMarker.bindPopup("Lokasi Anda saat ini").openPopup();
            map.setView([latitude, longitude], 15);
            locateBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Lokasi Saya';
          },
          () => {
            alert("Tidak dapat menemukan lokasi Anda. Pastikan izin lokasi telah diaktifkan.");
            locateBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Lokasi Saya';
          }
        );
      });
    }
  });

  /* ---------------------------------------------------------
     8. DATA AGREGAT (dipakai Chart & Fakta Menarik) —
        dipisah dari Chart.js supaya tetap tersedia walau
        Chart.js gagal dimuat.
  --------------------------------------------------------- */
  let jenisCounts = {}, jenisLabels = [], jenisValues = [], jenisColors = [];
  let kecCounts = {}, kecLabels = [], kecValues = [];
  const CHART_COLORS = {
    "Rumah Sakit": "#2563EB",
    "Puskesmas": "#16a34a",
    "Klinik": "#f59e0b",
    "Apotek": "#db2777"
  };
  runSection("Agregasi Data", () => {
    DATA.forEach((f) => { jenisCounts[f.jenis] = (jenisCounts[f.jenis] || 0) + 1; });
    jenisLabels = Object.keys(jenisCounts);
    jenisValues = Object.values(jenisCounts);
    jenisColors = jenisLabels.map((j) => CHART_COLORS[j]);

    DATA.forEach((f) => { kecCounts[f.kecamatan] = (kecCounts[f.kecamatan] || 0) + 1; });
    kecLabels = Object.keys(kecCounts).sort((a, b) => kecCounts[b] - kecCounts[a]);
    kecValues = kecLabels.map((k) => kecCounts[k]);
  });

  /* ---------------------------------------------------------
     9. CHARTS (Chart.js)
  --------------------------------------------------------- */
  runSection("Chart.js", () => {
    if (typeof Chart === "undefined") {
      console.warn("[SIG Jambi] Chart.js tidak tersedia — grafik dilewati.");
      return;
    }

    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = "#5b6478";

    const elKec = document.getElementById("chartKecamatan");
    if (elKec) {
      new Chart(elKec, {
        type: "bar",
        data: {
          labels: kecLabels,
          datasets: [{
            label: "Jumlah Fasilitas",
            data: kecValues,
            backgroundColor: "#2563EB",
            borderRadius: 8,
            maxBarThickness: 34
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { stepSize: 2 }, grid: { color: "#eef1f6" } }
          }
        }
      });
    }

    const elPie = document.getElementById("chartJenisPie");
    if (elPie) {
      new Chart(elPie, {
        type: "pie",
        data: {
          labels: jenisLabels,
          datasets: [{ data: jenisValues, backgroundColor: jenisColors, borderWidth: 3, borderColor: "#fff" }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 16 } } }
        }
      });
    }

    const elBar = document.getElementById("chartJenisBar");
    if (elBar) {
      new Chart(elBar, {
        type: "bar",
        data: {
          labels: jenisLabels,
          datasets: [{
            label: "Jumlah",
            data: jenisValues,
            backgroundColor: jenisColors,
            borderRadius: 8,
            maxBarThickness: 40
          }]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: "#eef1f6" } },
            y: { grid: { display: false } }
          }
        }
      });
    }
  });

  /* ---------------------------------------------------------
     10. TABLE — search, filter, pagination
  --------------------------------------------------------- */
  runSection("Tabel", () => {
    const tableBody = document.getElementById("tableBody");
    const tableSearch = document.getElementById("tableSearch");
    const tableFilterJenis = document.getElementById("tableFilterJenis");
    const tableCount = document.getElementById("tableCount");
    const pagination = document.getElementById("pagination");
    if (!tableBody || !tableSearch || !tableFilterJenis || !tableCount || !pagination) return;

    const PAGE_SIZE = 10;
    let currentPage = 1;

    function getFilteredData() {
      const query = tableSearch.value.trim().toLowerCase();
      const jenis = tableFilterJenis.value;
      return DATA.filter((f) => {
        const matchesJenis = jenis === "all" || f.jenis === jenis;
        const matchesQuery =
          !query ||
          f.nama.toLowerCase().includes(query) ||
          f.jenis.toLowerCase().includes(query) ||
          f.kecamatan.toLowerCase().includes(query) ||
          f.alamat.toLowerCase().includes(query);
        return matchesJenis && matchesQuery;
      });
    }

    function renderTable() {
      const filtered = getFilteredData();
      const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      currentPage = Math.min(currentPage, totalPages);
      const startIdx = (currentPage - 1) * PAGE_SIZE;
      const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

      tableBody.innerHTML = pageItems.map((f) => {
        const key = JENIS_KEY[f.jenis];
        return `
          <tr>
            <td>${f.nama}</td>
            <td><span class="badge-jenis ${key}"><i class="${JENIS_ICON[f.jenis]}"></i> ${f.jenis}</span></td>
            <td>${f.kecamatan}</td>
            <td>${f.alamat}</td>
            <td><span class="badge-status">${f.status}</span></td>
          </tr>`;
      }).join("");

      if (pageItems.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px; color:#94a1b8;">Tidak ada fasilitas yang cocok dengan pencarian.</td></tr>`;
      }

      tableCount.textContent = `Menampilkan ${pageItems.length} dari ${filtered.length} fasilitas`;
      renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
      pagination.innerHTML = "";
      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        if (i === currentPage) btn.classList.add("active");
        btn.addEventListener("click", () => { currentPage = i; renderTable(); });
        pagination.appendChild(btn);
      }
    }

    tableSearch.addEventListener("input", () => { currentPage = 1; renderTable(); });
    tableFilterJenis.addEventListener("change", () => { currentPage = 1; renderTable(); });

    renderTable();
  });
const galleryGrid = document.getElementById("galleryGrid");

const galleryData = [
    {
        nama: "RSUD Raden Mattaher",
        jenis: "Rumah Sakit",
        foto: "images/rsud_radenmataher.jpeg"
    },
    {
        nama: "RSUD H. Abdul Manap",
        jenis: "Rumah Sakit",
        foto: "images/rsud_abdulmanap.jpeg"
    },
    {
        nama: "RS Rimbo Medika",
        jenis: "Rumah Sakit",
        foto: "images/rsud_rimbomedika.jpeg"
    },
    {
        nama: "RS MMC (Mitra Medika Cendikia)",
        jenis: "Rumah Sakit",
        foto: "images/rs_mitra.jpeg"
    },
    {
        nama: "RS Islam Arafah",
        jenis: "Rumah Sakit",
        foto: "images/rs_arafah.jpg"
    },
    {
        nama: "RS Baiturrahim",
        jenis: "Rumah Sakit",
        foto: "images/rs_baiturahim.png"
    },
    {
        nama: "Rumkit Bhayangkara Jambi",
        jenis: "Rumah Sakit",
        foto: "images/rs_bhayangkara.png"
    },
    {
        nama: "RS Santa Theresia",
        jenis: "Rumah Sakit",
        foto: "images/rs_santa.jpeg"
    }
];

galleryGrid.innerHTML = galleryData.map(item => `
<div class="gallery-item">
    <img src="${item.foto}" alt="${item.nama}">
    <div class="gallery-caption">
        <span>${item.jenis}</span>
        <h4>${item.nama}</h4>
    </div>
</div>
`).join('');
  /* ---------------------------------------------------------
     11. FAKTA MENARIK
  --------------------------------------------------------- */
  runSection("Fakta Menarik", () => {
    const factGrid = document.getElementById("factGrid");
    if (!factGrid) return;

    const topKec = kecLabels[0] || "-";
    const topKecCount = kecCounts[topKec] || 0;
    const totalFasilitas = DATA.length;
    const rsPercent = totalFasilitas ? ((jenisCounts["Rumah Sakit"] / totalFasilitas) * 100).toFixed(1) : "0.0";
    const kecCountTotal = Object.keys(kecCounts).length;

    const facts = [
      {
        icon: "fa-solid fa-map-pin",
        color: 0,
        title: "Kecamatan Terpadat Fasilitas",
        value: topKec,
        desc: `${topKec} memiliki jumlah fasilitas kesehatan terbanyak, yaitu ${topKecCount} fasilitas dari total ${kecCountTotal} kecamatan di Kota Jambi.`
      },
      {
        icon: "fa-solid fa-hospital",
        color: 1,
        title: "Proporsi Rumah Sakit",
        value: rsPercent + "%",
        desc: `Rumah sakit menyumbang ${rsPercent}% dari keseluruhan ${totalFasilitas} fasilitas kesehatan yang tercatat di Kota Jambi.`
      },
      {
        icon: "fa-solid fa-diagram-project",
        color: 2,
        title: "Persebaran Merata",
        value: kecCountTotal + " Kecamatan",
        desc: `Fasilitas kesehatan tersebar di seluruh ${kecCountTotal} kecamatan Kota Jambi, memastikan akses layanan kesehatan menjangkau setiap wilayah.`
      },
      {
        icon: "fa-solid fa-layer-group",
        color: 3,
        title: "Ringkasan Jenis Fasilitas",
        value: totalFasilitas + " Fasilitas",
        desc: `Terdiri dari ${jenisCounts["Rumah Sakit"] || 0} rumah sakit, ${jenisCounts["Puskesmas"] || 0} puskesmas, ${jenisCounts["Klinik"] || 0} klinik, dan ${jenisCounts["Apotek"] || 0} apotek.`
      }
    ];

    factGrid.innerHTML = facts.map((f) => `
      <div class="fact-card" data-aos>
        <div class="fact-icon"><i class="${f.icon}"></i></div>
        <h4>${f.title}</h4>
        <span class="fact-highlight">${f.value}</span>
        <p>${f.desc}</p>
      </div>
    `).join("");

    // re-observe newly injected fact cards for scroll reveal
    if (aosObserver) {
      factGrid.querySelectorAll("[data-aos]").forEach((el) => aosObserver.observe(el));
    }
  });

})();
