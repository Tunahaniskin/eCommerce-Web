# Nexara eCommerce Web

Nexara e-ticaret platformunun React ile yazılmış müşteri arayüzü. Ürün listeleme, ürün detayı, sepet, sipariş ve cüzdan (bakiye yükleme) işlemlerini ayrı bir REST API üzerinden yürütür.

## Özellikler

- Ürün listeleme: sayfalama, kategori filtresi ve arama
- Ürün detay sayfası
- Sepet yönetimi (tarayıcıda `localStorage` ile saklanır)
- Kayıt ve giriş (JWT tabanlı oturum)
- Sipariş oluşturma ve geçmiş siparişleri görüntüleme
- Cüzdan bakiyesi görüntüleme ve bakiye yükleme talebi
- İstemci tarafı hataların API'ye loglanması
- Giriş gerektiren sayfalarda, girişten sonra kullanıcının kaldığı sayfaya yönlendirilmesi

## Teknolojiler

| Alan | Kullanılan |
|------|------------|
| Arayüz | React 19 |
| Yönlendirme | React Router 7 |
| Derleme / geliştirme sunucusu | Vite 8 |
| İkonlar | lucide-react |
| Lint | oxlint |

## Gereksinimler

- Node.js 20 veya üzeri
- Çalışan bir backend API (varsayılan adres: `http://localhost:5166`)

## Kurulum

```bash
git clone <repo-url>
cd "eCommerce Web"
npm install
```

Ortam değişkenleri dosyasını oluşturun:

```bash
cp .env.example .env
```

## Ortam Değişkenleri

| Değişken | Açıklama | Örnek |
|----------|----------|-------|
| `VITE_API_URL` | Backend API'nin temel adresi | `http://localhost:5166` |

`VITE_API_URL` boş bırakılırsa istekler göreli yollarla (`/api/...`) gönderilir. Geliştirme ortamında Vite, `/api` ve `/uploads` isteklerini `http://localhost:5166` adresine yönlendirir (bkz. `vite.config.js`).

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusunu başlatır: `http://localhost:5173` |
| `npm run build` | Üretim derlemesini `dist/` klasörüne alır |
| `npm run preview` | Üretim derlemesini yerelde önizler |
| `npm run lint` | Kodu oxlint ile kontrol eder |

## Sayfalar

| Yol | Sayfa | Giriş gerekli |
|-----|-------|---------------|
| `/` | Ana sayfa | Hayır |
| `/shop` | Ürün listesi | Hayır |
| `/product/:id` | Ürün detayı | Hayır |
| `/cart` | Sepet | Sipariş vermek için evet |
| `/auth` | Giriş / Kayıt | Hayır |
| `/orders` | Siparişlerim | Evet |

Tanımsız yollar ana sayfaya yönlendirilir.

## Kullanılan API Uç Noktaları

| Metot | Uç nokta | Amaç |
|-------|----------|------|
| POST | `/api/auth/login` | Giriş |
| POST | `/api/auth/register` | Kayıt |
| GET | `/api/products` | Ürün listesi (`page`, `pageSize`, `categoryId`, `search`) |
| GET | `/api/products/{id}` | Ürün detayı |
| GET | `/api/orders` | Kullanıcının siparişleri |
| GET | `/api/orders/{id}` | Sipariş detayı |
| POST | `/api/orders` | Sipariş oluşturma |
| GET | `/api/admin/profile` | Profil bilgisi |
| GET | `/api/admin/users/{id}/customer-360` | Bakiye ve cüzdan hareketleri |
| POST | `/api/finance/deposit-requests` | Bakiye yükleme talebi |
| POST | `/api/logs/client` | İstemci hata kaydı |

Korumalı uç noktalara `Authorization: Bearer <token>` başlığıyla istek atılır.

## Proje Yapısı

```
src/
├── assets/          Görseller
├── components/      Navbar, Footer, ProductCard, SearchModal, DepositModal, ToastContainer
├── context/         AuthContext, CartContext, ToastContext
├── pages/           HomePage, ShopPage, ProductDetailPage, CartPage, AuthPage, OrdersPage
├── services/api.js  API istekleri ve fiyat/tarih biçimlendirme yardımcıları
├── App.jsx          Yönlendirme ve sağlayıcılar
├── main.jsx         Giriş noktası
└── index.css        Genel stiller
```
