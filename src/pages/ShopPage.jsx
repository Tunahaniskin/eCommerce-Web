import React, { useState, useEffect, useMemo } from 'react';
import { Api } from '../services/api';
import ProductCard from '../components/ProductCard';

const PAGE_SIZE = 12;

export default function ShopPage() {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sort state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [appliedPriceRange, setAppliedPriceRange] = useState({ min: null, max: null });
  const [stockFilter, setStockFilter] = useState(''); // '' | 'in' | 'out'
  const [sortOption, setSortOption] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch products on mount
  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function fetchProducts() {
      try {
        setLoading(true);
        // Backend en fazla pageSize: 100 kabul ediyor
        const res = await Api.getProducts({ pageSize: 100 });
        if (isMounted) {
          setAllProducts(res.items || []);
        }
      } catch (err) {
        console.error('Ürünler alınırken hata oluştu:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute category map with counts
  const categories = useMemo(() => {
    const map = {};
    allProducts.forEach((p) => {
      if (p.categoryId && p.categoryName) {
        if (!map[p.categoryId]) {
          map[p.categoryId] = { id: p.categoryId, name: p.categoryName, count: 0 };
        }
        map[p.categoryId].count++;
      }
    });
    return Object.values(map);
  }, [allProducts]);

  // Apply filters
  const filteredProducts = useMemo(() => {
    let list = [...allProducts];

    // Category
    if (selectedCategory) {
      list = list.filter(
        (p) => String(p.categoryId) === String(selectedCategory)
      );
    }

    // Price
    if (appliedPriceRange.min !== null) {
      list = list.filter((p) => Number(p.price) >= appliedPriceRange.min);
    }
    if (appliedPriceRange.max !== null) {
      list = list.filter((p) => Number(p.price) <= appliedPriceRange.max);
    }

    // Stock
    if (stockFilter === 'in') {
      list = list.filter((p) => (p.stock || 0) > 0);
    } else if (stockFilter === 'out') {
      list = list.filter((p) => (p.stock || 0) <= 0);
    }

    // Sort
    if (sortOption === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'name-asc') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortOption === 'name-desc') {
      list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    }

    return list;
  }, [allProducts, selectedCategory, appliedPriceRange, stockFilter, sortOption]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const handleApplyPrice = (e) => {
    e.preventDefault();
    setAppliedPriceRange({
      min: priceMin !== '' ? Number(priceMin) : null,
      max: priceMax !== '' ? Number(priceMax) : null
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setPriceMin('');
    setPriceMax('');
    setAppliedPriceRange({ min: null, max: null });
    setStockFilter('');
    setSortOption('default');
    setCurrentPage(1);
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
  };

  const handleStockSelect = (stockVal) => {
    setStockFilter(stockVal);
    setCurrentPage(1);
  };

  return (
    <div>
      {/* PAGE HERO */}
      <section className="page-hero">
        <div className="container">
          <div className="section-label">
            <span className="label-dot" />
            MAĞAZA
          </div>
          <h1 className="section-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginTop: '0.5rem' }}>
            Tüm <em>Ürünler</em>
          </h1>
          <p style={{ color: 'var(--clr-text-muted)', marginTop: '0.75rem' }}>
            Kaliteli ürünleri keşfedin, sepetinize ekleyin ve ayrıcalıklı alışverişin tadını çıkarın.
          </p>
        </div>
      </section>

      {/* SHOP BODY */}
      <div className="container" style={{ marginTop: '2rem', marginBottom: '5rem' }}>
        <div className="shop-layout">
          {/* SIDEBAR */}
          <aside className="shop-sidebar">
            {/* Categories */}
            <div className="sidebar-section">
              <h3 className="sidebar-title">Kategoriler</h3>
              <div className="filter-list">
                <button
                  type="button"
                  className={`filter-btn ${selectedCategory === '' ? 'active' : ''}`}
                  onClick={() => handleCategorySelect('')}
                >
                  Tümü <span className="filter-count">{allProducts.length}</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`filter-btn ${String(selectedCategory) === String(cat.id) ? 'active' : ''}`}
                    onClick={() => handleCategorySelect(cat.id)}
                  >
                    {cat.name} <span className="filter-count">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="sidebar-section">
              <h3 className="sidebar-title">Fiyat Aralığı</h3>
              <form onSubmit={handleApplyPrice}>
                <div className="price-range-inputs">
                  <input
                    type="number"
                    className="price-input"
                    placeholder="Min"
                    min="0"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                  <span className="price-range-separator">—</span>
                  <input
                    type="number"
                    className="price-input"
                    placeholder="Max"
                    min="0"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-outline"
                  style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}
                >
                  Uygula
                </button>
              </form>
            </div>

            {/* Stock Filter */}
            <div className="sidebar-section">
              <h3 className="sidebar-title">Stok Durumu</h3>
              <div className="filter-list">
                <button
                  type="button"
                  className={`filter-btn ${stockFilter === '' ? 'active' : ''}`}
                  onClick={() => handleStockSelect('')}
                >
                  Tümü
                </button>
                <button
                  type="button"
                  className={`filter-btn ${stockFilter === 'in' ? 'active' : ''}`}
                  onClick={() => handleStockSelect('in')}
                >
                  Stokta Var
                </button>
                <button
                  type="button"
                  className={`filter-btn ${stockFilter === 'out' ? 'active' : ''}`}
                  onClick={() => handleStockSelect('out')}
                >
                  Stok Dışında
                </button>
              </div>
            </div>

            <button
              type="button"
              className="btn-outline"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleClearFilters}
            >
              Filtreleri Temizle
            </button>
          </aside>

          {/* MAIN CONTENT */}
          <main className="shop-main">
            <div className="shop-toolbar">
              <span className="shop-results-count">
                {loading
                  ? 'Yükleniyor...'
                  : `${filteredProducts.length} ürün listeleniyor`}
              </span>

              <select
                className="shop-sort"
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Sıralama"
              >
                <option value="default">Varsayılan Sıralama</option>
                <option value="price-asc">Fiyat: Düşükten Yükseğe</option>
                <option value="price-desc">Fiyat: Yüksekten Düşüğe</option>
                <option value="name-asc">İsim: A-Z</option>
                <option value="name-desc">İsim: Z-A</option>
              </select>
            </div>

            <div className="products-grid">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="product-skeleton" />
                ))
              ) : paginatedProducts.length > 0 ? (
                paginatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))
              ) : (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    background: '#fff',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--clr-border)'
                  }}
                >
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
                    Aramanıza uygun ürün bulunamadı.
                  </p>
                  <p style={{ color: 'var(--clr-text-muted)', marginBottom: '1.5rem' }}>
                    Filtre kriterlerinizi temizleyerek tekrar deneyebilirsiniz.
                  </p>
                  <button type="button" className="btn-primary" onClick={handleClearFilters}>
                    Filtreleri Sıfırla
                  </button>
                </div>
              )}
            </div>

            {/* PAGINATION */}
            {!loading && totalPages > 1 && (
              <div className="pagination" style={{ marginTop: '3rem' }}>
                <button
                  type="button"
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                >
                  &larr;
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      className={`page-btn ${currentPage === pNum ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentPage(pNum);
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  className="page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                >
                  &rarr;
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
