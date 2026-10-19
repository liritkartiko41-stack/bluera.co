// --- BACKGROUND PARTICLES & GEMINI BLUE GLOW ---
const bgCanvas = document.getElementById('bgCanvas');
const bgCtx = bgCanvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawGeminiBackground() {
    const centerX = bgCanvas.width / 2;
    const centerY = bgCanvas.height / 2;
    const radius = Math.max(bgCanvas.width, bgCanvas.height) * 0.5;

    // Gradasi melingkar dari biru Gemini di tengah ke putih di pinggir
    // Background polos warna Butter Yellow tanpa gradasi
    bgCtx.fillStyle = '#feefb8';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
}

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * bgCanvas.width;
        this.y = Math.random() * bgCanvas.height;
        this.size = Math.random() * 3.5 + 1.5;
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.speedY = (Math.random() - 0.5) * 0.8;
        this.alpha = Math.random();
        this.color = Math.random() > 0.5 ? '#3a0ca3' : '#7209b7';
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha += (Math.random() - 0.5) * 0.02;
        if (this.x < 0 || this.x > bgCanvas.width || this.y < 0 || this.y > bgCanvas.height) this.reset();
    }
    draw() {
        bgCtx.save();
        bgCtx.globalAlpha = Math.max(0.2, Math.min(0.8, this.alpha));
        bgCtx.fillStyle = this.color;
        bgCtx.beginPath();
        bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        bgCtx.fill();
        bgCtx.restore();
    }
}
for (let i = 0; i < 50; i++) particles.push(new Particle());
function animateParticles() {
    drawGeminiBackground(); // Tambahkan ini agar background biru Gemini tergambar
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateParticles);
}

animateParticles();

// --- LOGIKA PHOTOSTRIP MULTI-POSE CANVA FRAME ---
let selectedFrame = 'frame1.png.png';
let capturedPhotos = [];
let currentPhotoIndex = 0;

const frameCards = document.querySelectorAll('.template-card');
const startCameraBtn = document.getElementById('startCameraBtn');
const frameSelectionStep = document.getElementById('frameSelectionStep');
const cameraStep = document.getElementById('cameraStep');
const resultStep = document.getElementById('resultStep');

const webcam = document.getElementById('webcam');
const photoPreview = document.getElementById('photoPreview');
const photoInstruction = document.getElementById('photoInstruction');

const snapBtn = document.getElementById('snapBtn');
const retakeBtn = document.getElementById('retakeBtn');
const nextBtn = document.getElementById('nextBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetAllBtn = document.getElementById('resetAllBtn');

// 1. Pilih Template
frameCards.forEach(card => {
    card.addEventListener('click', () => {
        frameCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedFrame = card.getAttribute('data-frame');
    });
});
// 2. Fungsi Akses Kamera
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user" // Menggunakan kamera depan HP
            },
            audio: false
        });
        
        webcam.srcObject = stream;
    } catch (err) {
        console.error("Gagal mengakses kamera:", err);
        alert("Mohon izinkan akses kamera pada browser HP kamu!");
    }
}
// Panggil kamera saat tombol Mulai diklik
startCameraBtn.addEventListener('click', () => {
    frameSelectionStep.classList.add('hidden');
    cameraStep.classList.remove('hidden');
    startCamera();
});

// 2. Mulai Kamera
startCameraBtn.addEventListener('click', () => {
    frameSelectionStep.style.display = 'none';
    cameraStep.style.display = 'flex';
    capturedPhotos = [];
    currentPhotoIndex = 0;
    updatePhotoInstruction();

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
    .then(stream => { webcam.srcObject = stream; })
    .catch(err => { alert("Kamera tidak dapat diakses!"); console.error(err); });
});

function updatePhotoInstruction() {
    photoInstruction.textContent = `Foto ke-${currentPhotoIndex + 1} dari 3: Bersiaplah!`;
}

// 3. Ambil Foto
snapBtn.addEventListener('click', () => {
    const tempCanvas = document.getElementById('tempCanvas');
    const ctx = tempCanvas.getContext('2d');
    tempCanvas.width = webcam.videoWidth || 640;
    tempCanvas.height = webcam.videoHeight || 480;

    ctx.drawImage(webcam, 0, 0, tempCanvas.width, tempCanvas.height);
    const dataURL = tempCanvas.toDataURL('image/png');

    photoPreview.src = dataURL;
    photoPreview.style.display = 'block';

    snapBtn.style.display = 'none';
    retakeBtn.style.display = 'inline-block';
    nextBtn.style.display = 'inline-block';
});

// 4. Retake Foto Saat Ini
retakeBtn.addEventListener('click', () => {
    photoPreview.style.display = 'none';
    snapBtn.style.display = 'inline-block';
    retakeBtn.style.display = 'none';
    nextBtn.style.display = 'none';
});

// 5. Lanjut ke Foto Berikutnya / Selesai
nextBtn.addEventListener('click', () => {
    capturedPhotos.push(photoPreview.src);
    currentPhotoIndex++;

    photoPreview.style.display = 'none';
    snapBtn.style.display = 'inline-block';
    retakeBtn.style.display = 'none';
    nextBtn.style.display = 'none';

    if (currentPhotoIndex < 3) {
        updatePhotoInstruction();
    } else {
        cameraStep.style.display = 'none';
        resultStep.style.display = 'flex';
        generatePhotostrip();
    }
});

// Helper Function untuk Load Gambar dengan Keamanan Cross-Origin
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

// 6. Generate Photostrip Final (Foto + Frame Canva)
async function generatePhotostrip() {
    const stripCanvas = document.getElementById('photostripCanvas');
    const ctx = stripCanvas.getContext('2d');

    // Set Ukuran Canva 5x15 cm (600x1800 px)
    stripCanvas.width = 600;
    stripCanvas.height = 1800;

    // Background Dasar Putih
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);

   // Ukuran & Posisi 3 Foto Kamera (Rasio 3.8 x 3.2 cm)
        const targetWidth = 500;
        const targetHeight = 420;
        const startX = (stripCanvas.width - targetWidth) / 2;
        const startYPositions = [105, 576, 1046];
    try {
        // 1. Render 3 Foto Kamera
      for (let i = 0; i < capturedPhotos.length; i++) {
            const img = await loadImage(capturedPhotos[i]);
            if (img) {
                // Hitung potong tengah (Center Crop) agar rasio foto tidak terdistorsi
                const imgRatio = img.width / img.height;
                const targetRatio = targetWidth / targetHeight;

                let sw, sh, sx, sy;
                if (imgRatio > targetRatio) {
                    sh = img.height;
                    sw = img.height * targetRatio;
                    sx = (img.width - sw) / 2;
                    sy = 0;
                } else {
                    sw = img.width;
                    sh = img.width / targetRatio;
                    sx = 0;
                    sy = (img.height - sh) / 2;
                }

                ctx.drawImage(img, sx, sy, sw, sh, startX, startYPositions[i], targetWidth, targetHeight);
            }
        }

        // 2. Render Frame Canva
        const frameImg = await loadImage(selectedFrame);
        if (frameImg) {
            ctx.drawImage(frameImg, 0, 0, stripCanvas.width, stripCanvas.height);
        } else {
            alert(`File bingkai "${selectedFrame}" tidak ditemukan! Pastikan file gambar bingkai sudah dimasukkan ke folder proyek.`);
        }

    } catch (error) {
        console.error("Error generate photostrip:", error);
    }
}

// 7. Simpan Hasil
downloadBtn.addEventListener('click', () => {
    const stripCanvas = document.getElementById('photostripCanvas');
    const imageURL = stripCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'photostrip-teh-telang.png';
    link.href = imageURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// 8. Reset Dari Awal
resetAllBtn.addEventListener('click', () => {
    resultStep.style.display = 'none';
    frameSelectionStep.style.display = 'flex';
});

// ANIMASI SCROLL
const fadeElements = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            obs.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });
fadeElements.forEach(el => observer.observe(el));
// --- KODE UNTUK PHOTO SPIN INTERAKTIF ---

const spinContainer = document.getElementById('spinTeh').parentElement;
const spinImage = document.getElementById('spinTeh');

let isDragging = false;
let startX = 0;
let currentRotation = 0; // Sudut rotasi saat ini
let sensitivity = 0.5; // Sesuaikan sensitivitas (angka lebih kecil = lebih lambat)

// Fungsi untuk menghentikan animasi otomatis saat interaksi dimulai
function stopAutoSpin() {
    spinImage.style.animation = 'none';
}

// Fungsi untuk mendeteksi awal drag (mouse down / touch start)
function startDrag(e) {
    isDragging = true;
    // Ambil koordinat awal X
    startX = e.pageX || e.touches[0].pageX; 
    stopAutoSpin();
}

// Fungsi untuk mendeteksi akhir drag (mouse up / touch end)
function endDrag() {
    isDragging = false;
}

// Fungsi utama untuk menangani gerakan drag (mouse move / touch move)
function handleDrag(e) {
    if (!isDragging) return; // Keluar jika tidak sedang drag

    // Ambil koordinat X saat ini
    const currentX = e.pageX || e.touches[0].pageX;
    
    // Hitung perubahan jarak X
    const diffX = currentX - startX;
    
    // Update sudut rotasi berdasarkan perubahan jarak dan sensitivitas
    // Menggunakan rotateY untuk simulasi 3D spin
    currentRotation += diffX * sensitivity;
    
    // Terapkan rotasi ke gambar
    spinImage.style.transform = `rotateY(${currentRotation}deg)`;
    
    // Perbarui startX untuk perhitungan frame berikutnya
    startX = currentX;
}

// Tambahkan Event Listener (Mouse)
spinContainer.addEventListener('mousedown', startDrag);
window.addEventListener('mouseup', endDrag); // Gunakan window untuk mendeteksi mouseup di luar kontainer
window.addEventListener('mousemove', handleDrag);

// Tambahkan Event Listener (Touch / HP)
spinContainer.addEventListener('touchstart', startDrag);
window.addEventListener('touchend', endDrag); // Gunakan window untuk touchend
window.addEventListener('touchmove', handleDrag);
// =========================================================
// EFEK GIF SLIDESHOW 3 FOTO ASLI & DOWNLOAD SATUAN
// =========================================================

let gifInterval = null;

function startRawPhotosPreview() {
    const gifImg = document.getElementById("gifPreviewImg");
    if (!gifImg) return;

    // 1. Kumpulkan semua sumber foto yang mungkin ada di aplikasi
    let photos = [];

    if (typeof capturedPhotos !== "undefined" && capturedPhotos.length > 0) {
        photos = capturedPhotos;
    } else if (window.photos && window.photos.length > 0) {
        photos = window.photos;
    } else {
        // Ambil dari seluruh canvas yang ada di halaman (termasuk canvas photostrip)
        const allCanvases = document.querySelectorAll("canvas");
        allCanvases.forEach(c => {
            try {
                const data = c.toDataURL("image/png");
                if (data && data.length > 100) photos.push(data);
            } catch (e) {}
        });
    }

    // Jika foto tetap tidak ditemukan, hentikan proses agar tidak error
    if (photos.length === 0) return;

    let currentIndex = 0;
    gifImg.src = photos[0];

    // 2. Clear timer animasi lama jika ada
    if (gifInterval) clearInterval(gifInterval);

    // 3. Jalankan efek slideshow berganti gambar setiap 0.6 detik
    gifInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % photos.length;
        gifImg.src = photos[currentIndex];
    }, 600);

    // 4. Hubungkan fungsi download ke 3 tombol foto
    const btn1 = document.getElementById("downloadPhoto1");
    const btn2 = document.getElementById("downloadPhoto2");
    const btn3 = document.getElementById("downloadPhoto3");

    if (btn1) btn1.onclick = () => downloadSinglePhoto(photos[0] || photos[0], "strip1.png");
    if (btn2) btn2.onclick = () => downloadSinglePhoto(photos[1] || photos[0], "strip2.png");
    if (btn3) btn3.onclick = () => downloadSinglePhoto(photos[2] || photos[0], "strip3.png");
}
function downloadSinglePhoto(dataUrl, fileName) {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    link.click();
}
// Pengaturan kamera agar ringan di HP
const constraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "user"
  }
};